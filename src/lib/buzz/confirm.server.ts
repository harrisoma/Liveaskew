import { createHash, randomBytes } from "node:crypto";
import { openToken, sealToken } from "./crypto.server";
import type { ConnectedAccount } from "./providers.server";
import { saveAccounts } from "./store.server";

const PENDING_MS = 15 * 60_000;

export function finishHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/**
 * Park freshly connected accounts until the member's own signed-in app confirms them.
 * Returns the one-time token to hand back to the browser that completed sign-in.
 */
export async function parkAccounts(
  userId: string,
  network: string,
  accounts: ConnectedAccount[],
): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  const db = await admin();
  await db
    .from("social_oauth_pending")
    .delete()
    .lt("created_at", new Date(Date.now() - PENDING_MS).toISOString());
  const { error } = await db.from("social_oauth_pending").insert({
    finish_hash: finishHash(token),
    user_id: userId,
    network,
    accounts_enc: sealToken(JSON.stringify(accounts)),
  });
  if (error) throw new Error("Could not hold the connection. Try again.");
  return token;
}

export type ConfirmResult =
  | { ok: true; networks: string[] }
  | { ok: false; error: "expired" | "wrong_account" };

/**
 * Attach parked accounts only when the confirming app is signed in as the member who
 * started the connect. Single use: the pending row is removed whatever the outcome, so a
 * sign-in link sent to someone else can never land on the sender's account.
 */
export async function confirmAccounts(token: string, callerId: string): Promise<ConfirmResult> {
  const db = await admin();
  const { data } = await db
    .from("social_oauth_pending")
    .delete()
    .eq("finish_hash", finishHash(token))
    .select("user_id, accounts_enc, created_at")
    .maybeSingle();
  if (!data || Date.parse(data.created_at) < Date.now() - PENDING_MS) {
    return { ok: false, error: "expired" };
  }
  if (data.user_id !== callerId) return { ok: false, error: "wrong_account" };
  const accounts = JSON.parse(openToken(data.accounts_enc)) as ConnectedAccount[];
  await saveAccounts(callerId, accounts);
  return { ok: true, networks: accounts.map((a) => a.network) };
}
