/** Buckets that keep files under "<userId>/…". Deleting the auth user does not remove them. */
export const USER_BUCKETS = [
  "selfies",
  "try-ons",
  "buzz-media",
  "wardrobe-photos",
  "look-images",
  "style-illustrations",
] as const;

const PAGE = 1000;
const MAX_DEPTH = 6;

type Entry = { name: string; id: string | null };
type Lister = (prefix: string, offset: number) => Promise<Entry[]>;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Every file path under a prefix: all pages, all subfolders (entries without an id). */
export async function listAllFiles(list: Lister, prefix: string, depth = 0): Promise<string[]> {
  if (depth > MAX_DEPTH) throw new Error(`folder too deep: ${prefix}`);
  const files: string[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await list(prefix, offset);
    for (const entry of page) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id) files.push(path);
      else files.push(...(await listAllFiles(list, path, depth + 1)));
    }
    if (page.length < PAGE) break;
  }
  return files;
}

/** Remove everything under "<userId>/" in one bucket. Throws if anything is left behind. */
async function removeFolder(bucket: string, userId: string): Promise<void> {
  const db = await admin();
  const store = db.storage.from(bucket);
  const list: Lister = async (prefix, offset) => {
    const { data, error } = await store.list(prefix, { limit: PAGE, offset });
    if (error) {
      // A bucket that does not exist in this project holds nothing to delete.
      if (/not found/i.test(error.message)) return [];
      throw new Error(`${bucket}: ${error.message}`);
    }
    return (data ?? []).map((e) => ({ name: e.name, id: e.id ?? null }));
  };
  const paths = await listAllFiles(list, userId);
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await store.remove(paths.slice(i, i + 100));
    if (error) throw new Error(`${bucket}: ${error.message}`);
  }
}

/** Cancel any live Stripe subscription. Safe to repeat: already-cancelled ones are skipped. */
async function cancelSubscriptions(userId: string): Promise<void> {
  const db = await admin();
  const { data } = await db
    .from("subscriptions")
    .select("stripe_subscription_id, environment, status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"]);
  if (!data?.length) return;
  const { createStripeClient } = await import("@/lib/stripe.server");
  for (const sub of data) {
    const stripe = createStripeClient(sub.environment === "live" ? "live" : "sandbox");
    try {
      const current = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
      if (current.status !== "canceled" && current.status !== "incomplete_expired") {
        await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      }
      await db
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", sub.stripe_subscription_id);
    } catch (err) {
      console.error("[account] subscription cancel failed", sub.stripe_subscription_id, err);
      throw new Error("subscription_cancel_failed");
    }
  }
}

/**
 * Delete everything: the Stripe subscription, every stored file, then the auth user —
 * which cascades to every table keyed on it. Each step must succeed before the next, so a
 * failed attempt leaves the account in place and a retry finishes the job.
 */
export async function deleteAccount(userId: string): Promise<void> {
  await cancelSubscriptions(userId);
  for (const bucket of USER_BUCKETS) {
    try {
      await removeFolder(bucket, userId);
    } catch (err) {
      console.error("[account] storage cleanup failed", bucket, err);
      throw new Error("storage_cleanup_failed");
    }
  }
  const db = await admin();
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}
