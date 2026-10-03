import { createHash, randomBytes } from "node:crypto";
import {
  ACCESS_TTL_S,
  CODE_TTL_S,
  MCP_SCOPE,
  REFRESH_TTL_S,
  base64Url,
  isAllowedRedirect,
  isValidChallenge,
  isValidVerifier,
} from "./oauth";

/** Codes and tokens are stored only as SHA-256 hex hashes. */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** PKCE S256: base64url(sha256(verifier)) must equal the challenge sent at /authorize. */
export function pkceMatches(verifier: string, challenge: string): boolean {
  if (!isValidVerifier(verifier) || !isValidChallenge(challenge)) return false;
  const hashed = base64Url(new Uint8Array(createHash("sha256").update(verifier).digest()));
  return hashed === challenge;
}

function secret(prefix: string): string {
  return `${prefix}_${base64Url(new Uint8Array(randomBytes(32)))}`;
}

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type ClientRecord = { id: string; name: string; redirect_uris: string[] };

export async function registerClient(input: {
  name: string;
  redirectUris: string[];
}): Promise<ClientRecord | { error: string }> {
  const uris = [...new Set(input.redirectUris)];
  if (uris.length === 0 || uris.length > 10) return { error: "invalid_redirect_uri" };
  if (!uris.every((u) => u.length <= 2000 && isAllowedRedirect(u))) {
    return { error: "invalid_redirect_uri" };
  }
  const record: ClientRecord = {
    id: `lac_${base64Url(new Uint8Array(randomBytes(18)))}`,
    name: input.name.trim().slice(0, 120),
    redirect_uris: uris,
  };
  const { error } = await (await db()).from("mcp_clients").insert(record);
  if (error) {
    console.error("[mcp] client register failed", error.message);
    return { error: "server_error" };
  }
  return record;
}

export async function findClient(clientId: string): Promise<ClientRecord | null> {
  if (!/^lac_[A-Za-z0-9\-_]{10,64}$/.test(clientId)) return null;
  const { data } = await (await db())
    .from("mcp_clients")
    .select("id, name, redirect_uris")
    .eq("id", clientId)
    .maybeSingle();
  return data ?? null;
}

/** A one-time code for the approved request, valid for five minutes. */
export async function issueCode(input: {
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
}): Promise<string | null> {
  const code = secret("lacode");
  const { error } = await (await db()).from("mcp_codes").insert({
    code_hash: sha256Hex(code),
    client_id: input.clientId,
    user_id: input.userId,
    redirect_uri: input.redirectUri,
    code_challenge: input.codeChallenge,
    scope: MCP_SCOPE,
    expires_at: new Date(Date.now() + CODE_TTL_S * 1000).toISOString(),
  });
  if (error) {
    console.error("[mcp] code issue failed", error.message);
    return null;
  }
  return code;
}

export type TokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
};

async function issueTokens(clientId: string, userId: string): Promise<TokenResponse | null> {
  const access = secret("lak");
  const refresh = secret("lar");
  const now = Date.now();
  const { error } = await (await db()).from("mcp_tokens").insert([
    {
      token_hash: sha256Hex(access),
      kind: "access",
      client_id: clientId,
      user_id: userId,
      scope: MCP_SCOPE,
      expires_at: new Date(now + ACCESS_TTL_S * 1000).toISOString(),
    },
    {
      token_hash: sha256Hex(refresh),
      kind: "refresh",
      client_id: clientId,
      user_id: userId,
      scope: MCP_SCOPE,
      expires_at: new Date(now + REFRESH_TTL_S * 1000).toISOString(),
    },
  ]);
  if (error) {
    console.error("[mcp] token issue failed", error.message);
    return null;
  }
  return {
    access_token: access,
    token_type: "Bearer",
    expires_in: ACCESS_TTL_S,
    refresh_token: refresh,
    scope: MCP_SCOPE,
  };
}

type OAuthError = { error: string; error_description?: string };

/** authorization_code grant: one use, same client and redirect, PKCE verified. */
export async function exchangeCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<TokenResponse | OAuthError> {
  const supabase = await db();
  // Delete-and-return makes the code single-use even under concurrent requests.
  const { data: rows } = await supabase
    .from("mcp_codes")
    .delete()
    .eq("code_hash", sha256Hex(input.code))
    .select("client_id, user_id, redirect_uri, code_challenge, expires_at");
  const row = rows?.[0];
  if (!row) return { error: "invalid_grant", error_description: "Unknown or used code." };
  if (Date.parse(row.expires_at) < Date.now()) {
    return { error: "invalid_grant", error_description: "Code expired." };
  }
  if (row.client_id !== input.clientId || row.redirect_uri !== input.redirectUri) {
    return { error: "invalid_grant", error_description: "Client or redirect mismatch." };
  }
  if (!pkceMatches(input.codeVerifier, row.code_challenge)) {
    return { error: "invalid_grant", error_description: "PKCE verification failed." };
  }
  return (await issueTokens(row.client_id, row.user_id)) ?? { error: "server_error" };
}

/**
 * refresh_token grant, rotating: the old refresh token stops working once a new pair is
 * issued. A wrong client, an expired token, or a failed issue never burns it.
 */
export async function refreshTokens(input: {
  refreshToken: string;
  clientId: string;
}): Promise<TokenResponse | OAuthError> {
  const supabase = await db();
  const invalid: OAuthError = {
    error: "invalid_grant",
    error_description: "Refresh token is not valid.",
  };
  const hash = sha256Hex(input.refreshToken);
  const { data: row } = await supabase
    .from("mcp_tokens")
    .select("client_id, user_id, expires_at")
    .eq("token_hash", hash)
    .eq("kind", "refresh")
    .is("revoked_at", null)
    .maybeSingle();
  if (!row || row.client_id !== input.clientId || Date.parse(row.expires_at) < Date.now()) {
    return invalid;
  }
  // Claim it: only one of two concurrent refreshes can flip revoked_at from null.
  const { data: claimed } = await supabase
    .from("mcp_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", hash)
    .is("revoked_at", null)
    .select("token_hash");
  if (!claimed?.length) return invalid;
  const issued = await issueTokens(row.client_id, row.user_id);
  if (!issued) {
    await supabase.from("mcp_tokens").update({ revoked_at: null }).eq("token_hash", hash);
    return { error: "server_error" };
  }
  return issued;
}

/** RFC 7009: revoking either token of a pair is enough to end that connection's access. */
export async function revokeToken(token: string): Promise<void> {
  await (await db())
    .from("mcp_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", sha256Hex(token))
    .is("revoked_at", null);
}

/** The member behind a bearer token, or null when it is unknown, expired, or revoked. */
export async function userForAccessToken(token: string): Promise<string | null> {
  if (!token.startsWith("lak_") || token.length > 200) return null;
  const { data } = await (await db())
    .from("mcp_tokens")
    .select("user_id, expires_at, revoked_at")
    .eq("token_hash", sha256Hex(token))
    .eq("kind", "access")
    .maybeSingle();
  if (!data || data.revoked_at || Date.parse(data.expires_at) < Date.now()) return null;
  return data.user_id;
}
