import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** AES-256-GCM for social tokens at rest. BUZZ_TOKEN_KEY = 32 random bytes, base64. */
function key(): Buffer {
  const raw = process.env.BUZZ_TOKEN_KEY ?? "";
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("BUZZ_TOKEN_KEY must be 32 bytes, base64-encoded");
  return buf;
}

export function tokenKeyConfigured(): boolean {
  try {
    key();
    return true;
  } catch {
    return false;
  }
}

export function sealToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    body.toString("base64"),
  ].join(":");
}

export function openToken(sealed: string): string {
  const [version, iv, tag, body] = sealed.split(":");
  if (version !== "v1" || !iv || !tag || !body) throw new Error("Unrecognised token format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64")), decipher.final()]).toString(
    "utf8",
  );
}
