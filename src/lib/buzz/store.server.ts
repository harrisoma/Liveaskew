import { usesSignalPublisher, publishWithSignal, signalPostStatus } from "./signal.server";
import { networkById, networkByLabel, type ConnectionSummary, type NetworkId } from "./index";
import { openToken, sealToken } from "./crypto.server";
import { isOwnBuzzMedia } from "./media.server";
import { refreshIfNeeded, type ConnectedAccount, type LiveConnection } from "./providers.server";

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
export async function publishClaimed(
  post: DuePost,
): Promise<{ ok: boolean; pending?: boolean; error?: string }> {
  const db = await admin();
  const finish = async (fields: {
    post_status: "posted" | "failed" | "publishing";
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

  if (!usesSignalPublisher()) {
    const error =
      "Publishing is unavailable until your account connection is verified. Your post has not been sent.";
    await finish({ post_status: "failed", post_error: error });
    return { ok: false, error };
  }

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

  {
    try {
      const receipt = await publishWithSignal(post, conn);
      if (receipt.state === "posted" && receipt.post_url) {
        await finish({ post_status: "posted", post_url: receipt.post_url, post_error: null });
        return { ok: true };
      }
      if (receipt.state === "failed") {
        await finish({
          post_status: "failed",
          post_error:
            "The network rejected this post. Check the content and account before retrying.",
        });
        return { ok: false };
      }
      await finish({
        post_status: "publishing",
        post_error:
          receipt.state === "uncertain"
            ? "Delivery is uncertain. Check the network before creating another post."
            : null,
      });
      return { ok: false, pending: true };
    } catch {
      // A transport failure is not proof the provider rejected the post.
      await finish({
        post_status: "publishing",
        post_error: "Delivery is being checked. Do not create a duplicate post.",
      });
      return { ok: false, pending: true };
    }
  }
}

/** Move scheduled → publishing for a bounded set, so two runs never post the same thing twice. */
export async function claimPost(filter: {
  id?: string;
  userId?: string;
  dueBefore?: string;
  limit?: number;
}): Promise<DuePost[]> {
  if (!usesSignalPublisher()) return [];
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

/** Read existing receipts only: reconciliation never submits a new social post. */
export async function reconcileSignalPosts(): Promise<number> {
  if (!usesSignalPublisher()) return 0;
  const db = await admin();
  const { data, error } = await db
    .from("calendar_events")
    .select("id,user_id")
    .eq("kind", "post")
    .eq("post_status", "publishing")
    .limit(25);
  if (error) throw Error("receipt_lookup_failed");
  let updated = 0;
  for (const row of data ?? []) {
    try {
      const receipt = await signalPostStatus(row.user_id, row.id);
      if (receipt.state !== "posted" && receipt.state !== "failed") continue;
      if (receipt.state === "posted" && !receipt.post_url) continue;
      const { error: saveError } = await db
        .from("calendar_events")
        .update({
          post_status: receipt.state,
          post_url: receipt.post_url ?? null,
          post_error:
            receipt.state === "failed"
              ? "The network rejected this post. Review it before retrying."
              : null,
          posted_at: receipt.state === "posted" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .eq("user_id", row.user_id)
        .eq("post_status", "publishing");
      if (!saveError) updated++;
    } catch {
      /* Keep uncertain delivery pending; never automatically publish a second copy. */
    }
  }
  return updated;
}
