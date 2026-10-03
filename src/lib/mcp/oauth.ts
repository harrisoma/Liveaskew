/**
 * Pure OAuth 2.1 helpers for the LiveAskew MCP connector: redirect rules, PKCE, token
 * shapes, and the metadata documents assistants discover us by. No I/O here, so it is
 * shared by the server routes, the approval page, and the tests.
 */

export const MCP_SCOPE = "liveaskew";
export const ACCESS_TTL_S = 60 * 60; // 1 hour
export const REFRESH_TTL_S = 30 * 24 * 60 * 60; // 30 days
export const CODE_TTL_S = 5 * 60; // 5 minutes

const BLOCKED_SCHEMES = new Set(["javascript", "data", "file", "vbscript", "blob", "about"]);

/**
 * Where an assistant may send the member back after she approves. https anywhere,
 * http only to the member's own machine (desktop clients), or an app's own scheme
 * (cursor://, vscode://). Never script or file URLs, never fragments.
 */
export function isAllowedRedirect(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.hash) return false;
  const scheme = url.protocol.replace(/:$/, "").toLowerCase();
  if (BLOCKED_SCHEMES.has(scheme)) return false;
  if (scheme === "https") return Boolean(url.hostname);
  if (scheme === "http") {
    return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]";
  }
  return /^[a-z][a-z0-9+.-]*$/.test(scheme);
}

/** base64url of raw bytes, no padding (RFC 7636). */
export function base64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** A verifier must be 43–128 unreserved characters (RFC 7636 §4.1). */
export function isValidVerifier(verifier: string): boolean {
  return /^[A-Za-z0-9\-._~]{43,128}$/.test(verifier);
}

/** A S256 challenge is the base64url of a 32-byte hash: exactly 43 characters. */
export function isValidChallenge(challenge: string): boolean {
  return /^[A-Za-z0-9\-_]{43}$/.test(challenge);
}

/**
 * The origin assistants reached us at. OAuth clients check that the issuer matches the host
 * they discovered it on, so an https request keeps its own host (www.liveaskew.com or
 * liveaskew.vercel.app alike); only a plain-http internal URL falls back to PUBLIC_APP_URL.
 */
export function publicOrigin(requestUrl: string, configured = process.env.PUBLIC_APP_URL): string {
  const own = new URL(requestUrl);
  const local = own.hostname === "localhost" || own.hostname === "127.0.0.1";
  if (own.protocol === "https:" || local || !configured) return own.origin;
  return configured.replace(/\/$/, "");
}

export function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    scopes_supported: [MCP_SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "LiveAskew",
    resource_documentation: `${origin}/`,
  };
}

export function authorizationServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    revocation_endpoint: `${origin}/api/oauth/revoke`,
    scopes_supported: [MCP_SCOPE],
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  };
}

export type AuthorizeRequest = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  state: string | null;
  scope: string;
  responseType: string;
};

/** Read an /oauth/authorize query string. */
export function parseAuthorizeRequest(search: string): AuthorizeRequest {
  const q = new URLSearchParams(search);
  return {
    clientId: q.get("client_id") ?? "",
    redirectUri: q.get("redirect_uri") ?? "",
    codeChallenge: q.get("code_challenge") ?? "",
    codeChallengeMethod: q.get("code_challenge_method") ?? "",
    state: q.get("state"),
    scope: q.get("scope") || MCP_SCOPE,
    responseType: q.get("response_type") ?? "",
  };
}

/** The member's answer, carried back to the assistant on its redirect URI. */
export function redirectWith(
  redirectUri: string,
  params: Record<string, string | null | undefined>,
): string {
  const url = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) if (v) url.searchParams.set(k, v);
  return url.toString();
}

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Expose-Headers": "WWW-Authenticate, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};
