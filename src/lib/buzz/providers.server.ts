import { createHash, randomBytes } from "node:crypto";
import type { NetworkId } from "./index";

/**
 * One adapter per network: build the login URL, trade the code for tokens, refresh, publish.
 * Credentials come from env; a network without them reports itself as not configured.
 * Every call takes `fetchImpl` so tests can stand in for the network.
 */

type FetchImpl = typeof fetch;

export type ConnectedAccount = {
  network: NetworkId;
  accountId: string;
  accountName: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
};

export type LiveConnection = ConnectedAccount;

export type PublishInput = { text: string; imageUrl: string | null };
export type PublishOutcome = { ok: true; url: string | null } | { ok: false; error: string };

const GRAPH = () => `https://graph.facebook.com/${process.env.META_GRAPH_VERSION ?? "v23.0"}`;
const THREADS = "https://graph.threads.net";
const LINKEDIN_VERSION = () => process.env.LINKEDIN_API_VERSION ?? "202601";

export function pkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function networkConfigured(network: NetworkId): boolean {
  const env = process.env;
  switch (network) {
    case "instagram":
    case "facebook":
      return Boolean(env.META_APP_ID && env.META_APP_SECRET);
    case "threads":
      return Boolean(env.THREADS_APP_ID && env.THREADS_APP_SECRET);
    case "linkedin":
      return Boolean(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET);
    case "x":
      return Boolean(env.X_CLIENT_ID && env.X_CLIENT_SECRET);
  }
}

/** Where the person signs in to the network. `challenge` is used by X (PKCE). */
export function authorizeUrl(
  network: NetworkId,
  opts: { state: string; redirectUri: string; challenge: string },
): string {
  const env = process.env;
  const q = (params: Record<string, string>) => new URLSearchParams(params).toString();
  switch (network) {
    case "instagram":
    case "facebook":
      return `https://www.facebook.com/${env.META_GRAPH_VERSION ?? "v23.0"}/dialog/oauth?${q({
        client_id: env.META_APP_ID ?? "",
        redirect_uri: opts.redirectUri,
        state: opts.state,
        response_type: "code",
        scope: [
          "pages_show_list",
          "pages_read_engagement",
          "pages_manage_posts",
          "business_management",
          "instagram_basic",
          "instagram_content_publish",
        ].join(","),
      })}`;
    case "threads":
      return `https://threads.net/oauth/authorize?${q({
        client_id: env.THREADS_APP_ID ?? "",
        redirect_uri: opts.redirectUri,
        state: opts.state,
        response_type: "code",
        scope: "threads_basic,threads_content_publish",
      })}`;
    case "linkedin":
      return `https://www.linkedin.com/oauth/v2/authorization?${q({
        response_type: "code",
        client_id: env.LINKEDIN_CLIENT_ID ?? "",
        redirect_uri: opts.redirectUri,
        state: opts.state,
        scope: "openid profile w_member_social",
      })}`;
    case "x":
      return `https://x.com/i/oauth2/authorize?${q({
        response_type: "code",
        client_id: env.X_CLIENT_ID ?? "",
        redirect_uri: opts.redirectUri,
        state: opts.state,
        scope: "tweet.read tweet.write users.read media.write offline.access",
        code_challenge: opts.challenge,
        code_challenge_method: "S256",
      })}`;
  }
}

async function json<T>(res: Response, what: string): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* not JSON */
  }
  if (!res.ok) {
    const err = body as {
      error?: { message?: string } | string;
      error_description?: string;
      detail?: string;
      message?: string;
    } | null;
    const msg =
      (typeof err?.error === "object" ? err.error.message : undefined) ??
      err?.error_description ??
      err?.detail ??
      err?.message ??
      (typeof err?.error === "string" ? err.error : undefined) ??
      text.slice(0, 200);
    throw new Error(`${what}: ${msg || res.status}`);
  }
  return body as T;
}

const inSeconds = (s: number | undefined) =>
  typeof s === "number" && s > 0 ? new Date(Date.now() + s * 1000).toISOString() : null;

/** Trade the login code for accounts. Meta can return a Facebook Page and its Instagram account. */
export async function exchangeCode(
  network: NetworkId,
  opts: { code: string; redirectUri: string; verifier: string | null },
  fetchImpl: FetchImpl = fetch,
): Promise<ConnectedAccount[]> {
  const env = process.env;
  switch (network) {
    case "instagram":
    case "facebook": {
      const short = await json<{ access_token: string }>(
        await fetchImpl(
          `${GRAPH()}/oauth/access_token?${new URLSearchParams({
            client_id: env.META_APP_ID ?? "",
            client_secret: env.META_APP_SECRET ?? "",
            redirect_uri: opts.redirectUri,
            code: opts.code,
          })}`,
        ),
        "Meta sign-in",
      );
      const long = await json<{ access_token: string }>(
        await fetchImpl(
          `${GRAPH()}/oauth/access_token?${new URLSearchParams({
            grant_type: "fb_exchange_token",
            client_id: env.META_APP_ID ?? "",
            client_secret: env.META_APP_SECRET ?? "",
            fb_exchange_token: short.access_token,
          })}`,
        ),
        "Meta long-lived token",
      );
      // Page tokens issued from a long-lived user token do not expire.
      const pages = await json<{
        data: {
          id: string;
          name: string;
          access_token: string;
          instagram_business_account?: { id: string; username?: string };
        }[];
      }>(
        await fetchImpl(
          `${GRAPH()}/me/accounts?${new URLSearchParams({
            fields: "id,name,access_token,instagram_business_account{id,username}",
            access_token: long.access_token,
          })}`,
        ),
        "Facebook Pages",
      );
      const list = pages.data ?? [];
      if (list.length === 0) {
        throw new Error("Meta sign-in: no Facebook Page was shared. Pick a Page you manage.");
      }
      const accounts: ConnectedAccount[] = [];
      const page = list[0];
      accounts.push({
        network: "facebook",
        accountId: page.id,
        accountName: page.name,
        accessToken: page.access_token,
        refreshToken: null,
        expiresAt: null,
      });
      const igPage = list.find((p) => p.instagram_business_account) ?? null;
      if (igPage?.instagram_business_account) {
        accounts.push({
          network: "instagram",
          accountId: igPage.instagram_business_account.id,
          accountName: igPage.instagram_business_account.username ?? igPage.name,
          accessToken: igPage.access_token,
          refreshToken: null,
          expiresAt: null,
        });
      } else if (network === "instagram") {
        throw new Error(
          "Instagram: no professional Instagram account is linked to that Facebook Page.",
        );
      }
      return accounts;
    }
    case "threads": {
      const short = await json<{ access_token: string; user_id: string | number }>(
        await fetchImpl(`${THREADS}/oauth/access_token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: env.THREADS_APP_ID ?? "",
            client_secret: env.THREADS_APP_SECRET ?? "",
            grant_type: "authorization_code",
            redirect_uri: opts.redirectUri,
            code: opts.code,
          }),
        }),
        "Threads sign-in",
      );
      const long = await json<{ access_token: string; expires_in?: number }>(
        await fetchImpl(
          `${THREADS}/access_token?${new URLSearchParams({
            grant_type: "th_exchange_token",
            client_secret: env.THREADS_APP_SECRET ?? "",
            access_token: short.access_token,
          })}`,
        ),
        "Threads long-lived token",
      );
      const me = await json<{ id: string; username?: string }>(
        await fetchImpl(
          `${THREADS}/v1.0/me?${new URLSearchParams({ fields: "id,username", access_token: long.access_token })}`,
        ),
        "Threads profile",
      );
      return [
        {
          network: "threads",
          accountId: String(me.id ?? short.user_id),
          accountName: me.username ?? "",
          accessToken: long.access_token,
          refreshToken: null,
          expiresAt: inSeconds(long.expires_in),
        },
      ];
    }
    case "linkedin": {
      const token = await json<{
        access_token: string;
        expires_in?: number;
        refresh_token?: string;
      }>(
        await fetchImpl("https://www.linkedin.com/oauth/v2/accessToken", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: opts.code,
            redirect_uri: opts.redirectUri,
            client_id: env.LINKEDIN_CLIENT_ID ?? "",
            client_secret: env.LINKEDIN_CLIENT_SECRET ?? "",
          }),
        }),
        "LinkedIn sign-in",
      );
      const me = await json<{ sub: string; name?: string }>(
        await fetchImpl("https://api.linkedin.com/v2/userinfo", {
          headers: { Authorization: `Bearer ${token.access_token}` },
        }),
        "LinkedIn profile",
      );
      return [
        {
          network: "linkedin",
          accountId: `urn:li:person:${me.sub}`,
          accountName: me.name ?? "",
          accessToken: token.access_token,
          refreshToken: token.refresh_token ?? null,
          expiresAt: inSeconds(token.expires_in),
        },
      ];
    }
    case "x": {
      const token = await json<{
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
      }>(
        await fetchImpl("https://api.x.com/2/oauth2/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: opts.code,
            redirect_uri: opts.redirectUri,
            code_verifier: opts.verifier ?? "",
            client_id: env.X_CLIENT_ID ?? "",
          }),
        }),
        "X sign-in",
      );
      const me = await json<{ data: { id: string; username: string } }>(
        await fetchImpl("https://api.x.com/2/users/me", {
          headers: { Authorization: `Bearer ${token.access_token}` },
        }),
        "X profile",
      );
      return [
        {
          network: "x",
          accountId: me.data.id,
          accountName: me.data.username,
          accessToken: token.access_token,
          refreshToken: token.refresh_token ?? null,
          expiresAt: inSeconds(token.expires_in),
        },
      ];
    }
  }
}

/** Refresh tokens that expire soon. Returns null when nothing changed. */
export async function refreshIfNeeded(
  conn: LiveConnection,
  fetchImpl: FetchImpl = fetch,
  now = Date.now(),
): Promise<LiveConnection | null> {
  if (!conn.expiresAt) return null;
  const left = Date.parse(conn.expiresAt) - now;
  const env = process.env;
  if (conn.network === "x") {
    if (left > 5 * 60_000) return null;
    if (!conn.refreshToken) throw new Error("X: sign-in expired. Reconnect X in Buzz.");
    const token = await json<{ access_token: string; refresh_token?: string; expires_in?: number }>(
      await fetchImpl("https://api.x.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${env.X_CLIENT_ID}:${env.X_CLIENT_SECRET}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: conn.refreshToken,
          client_id: env.X_CLIENT_ID ?? "",
        }),
      }),
      "X refresh",
    );
    return {
      ...conn,
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? conn.refreshToken,
      expiresAt: inSeconds(token.expires_in),
    };
  }
  if (conn.network === "threads") {
    if (left > 7 * 86_400_000) return null;
    if (left <= 0) throw new Error("Threads: sign-in expired. Reconnect Threads in Buzz.");
    const token = await json<{ access_token: string; expires_in?: number }>(
      await fetchImpl(
        `${THREADS}/refresh_access_token?${new URLSearchParams({
          grant_type: "th_refresh_token",
          access_token: conn.accessToken,
        })}`,
      ),
      "Threads refresh",
    );
    return { ...conn, accessToken: token.access_token, expiresAt: inSeconds(token.expires_in) };
  }
  if (left <= 0) {
    throw new Error(
      `${conn.network === "linkedin" ? "LinkedIn" : "This network"}: sign-in expired. Reconnect it in Buzz.`,
    );
  }
  return null;
}

async function waitForContainer(
  url: string,
  fetchImpl: FetchImpl,
  what: string,
  tries = 5,
): Promise<void> {
  for (let i = 0; i < tries; i++) {
    const res = await json<{ status_code?: string; status?: string }>(await fetchImpl(url), what);
    const status = res.status_code ?? res.status;
    if (!status || status === "FINISHED" || status === "PUBLISHED") return;
    if (status === "ERROR" || status === "EXPIRED")
      throw new Error(`${what}: the network rejected the media.`);
    await new Promise((r) => setTimeout(r, 1500));
  }
}

export async function publishPost(
  conn: LiveConnection,
  post: PublishInput,
  fetchImpl: FetchImpl = fetch,
): Promise<PublishOutcome> {
  try {
    switch (conn.network) {
      case "instagram": {
        if (!post.imageUrl) return { ok: false, error: "Instagram needs a photo with the post." };
        const base = `${GRAPH()}/${conn.accountId}`;
        const created = await json<{ id: string }>(
          await fetchImpl(`${base}/media`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url: post.imageUrl,
              caption: post.text,
              access_token: conn.accessToken,
            }),
          }),
          "Instagram",
        );
        await waitForContainer(
          `${GRAPH()}/${created.id}?fields=status_code&access_token=${encodeURIComponent(conn.accessToken)}`,
          fetchImpl,
          "Instagram",
        );
        const published = await json<{ id: string }>(
          await fetchImpl(`${base}/media_publish`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ creation_id: created.id, access_token: conn.accessToken }),
          }),
          "Instagram",
        );
        const link = await json<{ permalink?: string }>(
          await fetchImpl(
            `${GRAPH()}/${published.id}?fields=permalink&access_token=${encodeURIComponent(conn.accessToken)}`,
          ),
          "Instagram",
        ).catch(() => ({ permalink: undefined }));
        return { ok: true, url: link.permalink ?? null };
      }
      case "facebook": {
        const endpoint = post.imageUrl ? "photos" : "feed";
        const body: Record<string, string> = { message: post.text, access_token: conn.accessToken };
        if (post.imageUrl) body.url = post.imageUrl;
        const res = await json<{ id: string; post_id?: string }>(
          await fetchImpl(`${GRAPH()}/${conn.accountId}/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
          "Facebook",
        );
        return { ok: true, url: `https://www.facebook.com/${res.post_id ?? res.id}` };
      }
      case "threads": {
        const base = `${THREADS}/v1.0/${conn.accountId}`;
        const params = new URLSearchParams({
          media_type: post.imageUrl ? "IMAGE" : "TEXT",
          text: post.text,
          access_token: conn.accessToken,
        });
        if (post.imageUrl) params.set("image_url", post.imageUrl);
        const created = await json<{ id: string }>(
          await fetchImpl(`${base}/threads`, { method: "POST", body: params }),
          "Threads",
        );
        if (post.imageUrl) {
          await waitForContainer(
            `${THREADS}/v1.0/${created.id}?fields=status&access_token=${encodeURIComponent(conn.accessToken)}`,
            fetchImpl,
            "Threads",
          );
        }
        const published = await json<{ id: string }>(
          await fetchImpl(`${base}/threads_publish`, {
            method: "POST",
            body: new URLSearchParams({ creation_id: created.id, access_token: conn.accessToken }),
          }),
          "Threads",
        );
        const link = await json<{ permalink?: string }>(
          await fetchImpl(
            `${THREADS}/v1.0/${published.id}?fields=permalink&access_token=${encodeURIComponent(conn.accessToken)}`,
          ),
          "Threads",
        ).catch(() => ({ permalink: undefined }));
        return { ok: true, url: link.permalink ?? null };
      }
      case "linkedin": {
        const headers = {
          Authorization: `Bearer ${conn.accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
          "LinkedIn-Version": LINKEDIN_VERSION(),
        };
        let content: { media: { id: string } } | undefined;
        if (post.imageUrl) {
          const init = await json<{ value: { uploadUrl: string; image: string } }>(
            await fetchImpl("https://api.linkedin.com/rest/images?action=initializeUpload", {
              method: "POST",
              headers,
              body: JSON.stringify({ initializeUploadRequest: { owner: conn.accountId } }),
            }),
            "LinkedIn image",
          );
          const image = await fetchImpl(post.imageUrl);
          if (!image.ok) return { ok: false, error: "LinkedIn: the post photo could not be read." };
          const put = await fetchImpl(init.value.uploadUrl, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${conn.accessToken}`,
              "Content-Type": image.headers.get("content-type") ?? "image/jpeg",
            },
            body: await image.arrayBuffer(),
          });
          if (!put.ok) return { ok: false, error: `LinkedIn image upload: ${put.status}` };
          content = { media: { id: init.value.image } };
        }
        const res = await fetchImpl("https://api.linkedin.com/rest/posts", {
          method: "POST",
          headers,
          body: JSON.stringify({
            author: conn.accountId,
            commentary: post.text,
            visibility: "PUBLIC",
            distribution: {
              feedDistribution: "MAIN_FEED",
              targetEntities: [],
              thirdPartyDistributionChannels: [],
            },
            ...(content ? { content } : {}),
            lifecycleState: "PUBLISHED",
            isReshareDisabledByAuthor: false,
          }),
        });
        if (!res.ok) await json(res, "LinkedIn");
        const urn = res.headers.get("x-restli-id");
        return { ok: true, url: urn ? `https://www.linkedin.com/feed/update/${urn}` : null };
      }
      case "x": {
        const auth = { Authorization: `Bearer ${conn.accessToken}` };
        let mediaIds: string[] | undefined;
        if (post.imageUrl) {
          const image = await fetchImpl(post.imageUrl);
          if (!image.ok) return { ok: false, error: "X: the post photo could not be read." };
          const form = new FormData();
          form.append(
            "media",
            new Blob([await image.arrayBuffer()], {
              type: image.headers.get("content-type") ?? "image/jpeg",
            }),
            "look.jpg",
          );
          form.append("media_category", "tweet_image");
          const uploaded = await json<{
            data?: { id: string };
            id?: string;
            media_id_string?: string;
          }>(
            await fetchImpl("https://api.x.com/2/media/upload", {
              method: "POST",
              headers: auth,
              body: form,
            }),
            "X media",
          );
          const id = uploaded.data?.id ?? uploaded.id ?? uploaded.media_id_string;
          if (!id) return { ok: false, error: "X: the photo upload returned no id." };
          mediaIds = [id];
        }
        const res = await json<{ data: { id: string } }>(
          await fetchImpl("https://api.x.com/2/tweets", {
            method: "POST",
            headers: { ...auth, "Content-Type": "application/json" },
            body: JSON.stringify({
              text: post.text,
              ...(mediaIds ? { media: { media_ids: mediaIds } } : {}),
            }),
          }),
          "X",
        );
        return { ok: true, url: `https://x.com/${conn.accountName || "i"}/status/${res.data.id}` };
      }
    }
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message.slice(0, 300) : "The network did not accept the post.",
    };
  }
}
