export const SSO_COOKIE = "liveaskew_session";

export type SessionClaims = {
  userId: string;
  email: string | null;
  name: string | null;
  providers: string[];
};

function bytesToB64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function b64ToBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function keyFor(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function sealSession(claims: SessionClaims, secret: string) {
  const payload = bytesToB64(new TextEncoder().encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await keyFor(secret),
    new TextEncoder().encode(payload),
  );
  return `${payload}.${bytesToB64(new Uint8Array(signature))}`;
}

export async function openSession(token: string, secret: string): Promise<SessionClaims | null> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const ok = await crypto.subtle.verify(
    "HMAC",
    await keyFor(secret),
    b64ToBytes(signature),
    new TextEncoder().encode(payload),
  );
  if (!ok) return null;
  try {
    return JSON.parse(new TextDecoder().decode(b64ToBytes(payload))) as SessionClaims;
  } catch {
    return null;
  }
}
