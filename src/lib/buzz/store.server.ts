import { networkById, networkByLabel, type ConnectionSummary, type NetworkId } from "./index";
import { openToken, sealToken } from "./crypto.server";
import { isOwnBuzzMedia } from "./media.server";
import {
  publishPost,
  refreshIfNeeded,
  type ConnectedAccount,
  type LiveConnection,
} from "./providers.server";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function saveAccounts(userId: string, accounts: ConnectedAccount[]): Promise<void> {
  const db = await admin();
  const now = new Date().toISOString();
  const { error } = await db.from("social_connections").upsert(
    accounts.map((a) => ({
      user_id: userId,
      network: a.network,
      account_id: a.accountId,
      account_name: a.accountName,
      access_token_enc: sealToken(a.accessToken),
      refresh_token_enc: a.refreshToken ? sealToken(a.refreshToken) : null,
      expires_at: a.expiresAt,
      updated_at: now,
    })),
    { onConflict: "user_id,network" },
  );
  if (error) throw new Error(`Could not save the connection: ${error.message}`);
}

export async function listConnections(userId: string): Promise<ConnectionSummary[]> {
  const db = await admin();
  const { data } = await db
    .from("social_connections")
    .select("network, account_name, expires_at")
    .eq("user_id", userId);
  return (data ?? [])
    .filter((r) => networkById(r.network))
    .map((r) => ({
      network: r.network as NetworkId,
      accountName: r.account_name,
      expiresAt: r.expires_at,
    }));
}

export async function removeConnection(userId: string, network: NetworkId): Promise<void> {
  const db = await admin();
  await db.from("social_connections").delete().eq("user_id", userId).eq("network", network);
}

async function loadConnection(userId: string, network: NetworkId): Promise<LiveConnection | null> {
  const db = await admin();
  const { data } = await db
    .from("social_connections")
    .select("network, account_id, account_name, access_token_enc, refresh_token_enc, expires_at")
    .eq("user_id", userId)
    .eq("network", network)
    .maybeSingle();
  if (!data) return null;
  return {
    network,
    accountId: data.account_id,
    accountName: data.account_name,
    accessToken: openToken(data.access_token_enc),
    refreshToken: data.refresh_token_enc ? openToken(data.refresh_token_enc) : null,
    expiresAt: data.expires_at,
  };
}

export type DuePost = {
  id: string;
  user_id: string;
  network: string | null;
  caption: string | null;
  media_url: string | null;
};

/**
 * Publish one post that this caller has already claimed (post_status = 'publishing'),
 * then record posted / failed on the Honey row.
 */
export async function publishClaimed(post: DuePost): Promise<{ ok: boolean; error?: string }> {
  const db = await admin();
  const finish = async (fields: {
    post_status: "posted" | "failed";
    post_error?: string | null;
    post_url?: string | null;
  }) => {
    await db
      .from("calendar_events")
      .update({
        ...fields,
        posted_at: fields.post_status === "posted" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post.id);
  };

  const spec = networkByLabel(post.network);
  if (!spec) {
    await finish({ post_status: "failed", post_error: "Pick a network for this post." });
    return { ok: false };
  }
  let conn: LiveConnection | null;
  try {
    conn = await loadConnection(post.user_id, spec.id);
  } catch {
    conn = null;
  }
  if (!conn) {
    const error = `Connect ${spec.label} in Buzz, then tap Retry.`;
    await finish({ post_status: "failed", post_error: error });
    return { ok: false, error };
  }
  try {
    const refreshed = await refreshIfNeeded(conn);
    if (refreshed) {
      conn = refreshed;
      await saveAccounts(post.user_id, [refreshed]);
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : "Sign-in expired. Reconnect in Buzz.";
    await finish({ post_status: "failed", post_error: error });
    return { ok: false, error };
  }

  if (post.media_url && !isOwnBuzzMedia(post.media_url, post.user_id)) {
    const error = "That photo can't be posted. Add it again from Buzz.";
    await finish({ post_status: "failed", post_error: error });
    return { ok: false, error };
  }

  const result = await publishPost(conn, {
    text: post.caption ?? "",
    imageUrl: post.media_url,
  });
  if (result.ok) {
    await finish({ post_status: "posted", post_error: null, post_url: result.url });
    return { ok: true };
  }
  await finish({ post_status: "failed", post_error: result.error });
  return { ok: false, error: result.error };
}

/** Move scheduled → publishing for a bounded set, so two runs never post the same thing twice. */
export async function claimPost(filter: {
  id?: string;
  userId?: string;
  dueBefore?: string;
  limit?: number;
}): Promise<DuePost[]> {
  const db = await admin();
  let pick = db
    .from("calendar_events")
    .select("id")
    .eq("kind", "post")
    .eq("post_status", "scheduled")
    .order("scheduled_at", { ascending: true })
    .limit(filter.limit ?? 25);
  if (filter.id) pick = pick.eq("id", filter.id);
  if (filter.userId) pick = pick.eq("user_id", filter.userId);
  if (filter.dueBefore) pick = pick.lte("scheduled_at", filter.dueBefore);
  const { data: candidates, error: pickError } = await pick;
  if (pickError) throw new Error(pickError.message);
  const ids = (candidates ?? []).map((r) => r.id);
  if (ids.length === 0) return [];

  // The status check in the UPDATE is the lock: only one caller wins each row.
  const { data, error } = await db
    .from("calendar_events")
    .update({ post_status: "publishing", post_error: null, updated_at: new Date().toISOString() })
    .in("id", ids)
    .eq("post_status", "scheduled")
    .select("id, user_id, network, caption, media_url");
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * A run that died mid-publish leaves rows in 'publishing'. We cannot know whether the
 * network accepted it, so mark it failed with a clear note instead of posting twice.
 */
export async function releaseStuckPosts(olderThanMinutes = 15): Promise<number> {
  const db = await admin();
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000).toISOString();
  const { data } = await db
    .from("calendar_events")
    .update({
      post_status: "failed",
      post_error: "This post may not have gone out. Check the network, then tap Retry if needed.",
      updated_at: new Date().toISOString(),
    })
    .eq("kind", "post")
    .eq("post_status", "publishing")
    .lt("updated_at", cutoff)
    .select("id");
  return data?.length ?? 0;
}
