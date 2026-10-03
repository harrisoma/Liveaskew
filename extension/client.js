/**
 * LiveAskew for the extension: an MCP client of the member's own account. It signs in with
 * the same OAuth flow Claude and ChatGPT use (registration, PKCE, chrome.identity), then
 * calls the connector's tools. Tokens stay in chrome.storage.local on this browser only.
 */

export const SERVERS = {
  "https://www.liveaskew.com": "liveaskew.com",
  "https://liveaskew.vercel.app": "liveaskew.vercel.app",
};
// The house domain once its DNS points at Vercel; until then the Vercel address always works.
const DEFAULT_SERVER = "https://liveaskew.vercel.app";

export async function getServer() {
  const { server } = await chrome.storage.local.get("server");
  return server in SERVERS ? server : DEFAULT_SERVER;
}

export async function setServer(server) {
  if (!(server in SERVERS)) return;
  await signOut();
  await chrome.storage.local.set({ server });
}

function base64Url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pkce() {
  const verifier = base64Url(crypto.getRandomValues(new Uint8Array(48)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
}

const redirectUri = () => chrome.identity.getRedirectURL("oauth");

/** This browser registers once per server as its own OAuth client. */
async function clientId(server) {
  const key = `client:${server}`;
  const stored = (await chrome.storage.local.get(key))[key];
  if (stored?.redirect === redirectUri()) return stored.id;
  const res = await fetch(`${server}/api/oauth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: "LiveAskew for Chrome",
      redirect_uris: [redirectUri()],
      token_endpoint_auth_method: "none",
    }),
  });
  if (!res.ok) throw new Error("register_failed");
  const { client_id } = await res.json();
  await chrome.storage.local.set({ [key]: { id: client_id, redirect: redirectUri() } });
  return client_id;
}

async function saveTokens(server, out) {
  await chrome.storage.local.set({
    tokens: {
      server,
      access: out.access_token,
      refresh: out.refresh_token,
      expiresAt: Date.now() + (out.expires_in - 60) * 1000,
    },
  });
}

async function token(server, body) {
  const res = await fetch(`${server}/api/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function signIn() {
  const server = await getServer();
  const id = await clientId(server);
  const { verifier, challenge } = await pkce();
  const state = base64Url(crypto.getRandomValues(new Uint8Array(16)));
  const url = new URL(`${server}/oauth/authorize`);
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: id,
    redirect_uri: redirectUri(),
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
    scope: "liveaskew",
  }).toString();
  const back = await chrome.identity.launchWebAuthFlow({ url: url.toString(), interactive: true });
  const answer = new URL(back).searchParams;
  if (answer.get("state") !== state) throw new Error("state_mismatch");
  if (answer.get("error")) throw new Error(answer.get("error"));
  const out = await token(server, {
    grant_type: "authorization_code",
    code: answer.get("code") ?? "",
    redirect_uri: redirectUri(),
    client_id: id,
    code_verifier: verifier,
  });
  if (!out) throw new Error("token_failed");
  await saveTokens(server, out);
}

export async function signOut() {
  const { tokens } = await chrome.storage.local.get("tokens");
  await chrome.storage.local.remove("tokens");
  if (tokens?.refresh) {
    fetch(`${tokens.server}/api/oauth/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: tokens.refresh }),
    }).catch(() => {});
  }
}

export async function signedIn() {
  const { tokens } = await chrome.storage.local.get("tokens");
  return Boolean(tokens?.refresh) && tokens.server === (await getServer());
}

let refreshing = null;

/**
 * A live access token, refreshing when it has expired. One refresh at a time: concurrent
 * callers share it, and a panel that loses a race to another window keeps the winner's pair.
 */
async function accessToken(forceRefresh = false) {
  const { tokens } = await chrome.storage.local.get("tokens");
  if (!tokens) return null;
  if (!forceRefresh && tokens.expiresAt > Date.now()) return tokens.access;
  refreshing ??= refresh(tokens).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function refresh(tokens) {
  const id = await clientId(tokens.server);
  const out = await token(tokens.server, {
    grant_type: "refresh_token",
    refresh_token: tokens.refresh,
    client_id: id,
  });
  if (out) {
    await saveTokens(tokens.server, out);
    return out.access_token;
  }
  const { tokens: now } = await chrome.storage.local.get("tokens");
  if (now && now.refresh !== tokens.refresh) return now.access; // another window refreshed
  await chrome.storage.local.remove("tokens");
  return null;
}

export class SignedOut extends Error {}

/** Call one connector tool. Returns { text, data } or throws SignedOut / Error. */
export async function callTool(name, args = {}) {
  const server = await getServer();
  for (const retry of [false, true]) {
    const access = await accessToken(retry);
    if (!access) throw new SignedOut();
    const res = await fetch(`${server}/api/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${access}`,
        "Mcp-Protocol-Version": "2025-06-18",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name, arguments: args },
      }),
    });
    if (res.status === 401) continue;
    const msg = await res.json().catch(() => null);
    if (!msg || msg.error)
      throw new Error(msg?.error?.message ?? "Bee is not available right now.");
    const text = (msg.result.content ?? []).map((c) => c.text).join("\n");
    if (msg.result.isError) throw new Error(text);
    return { text, data: msg.result.structuredContent ?? null };
  }
  await chrome.storage.local.remove("tokens");
  throw new SignedOut();
}
