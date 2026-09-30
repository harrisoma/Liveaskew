/** Buckets that keep files under "<userId>/…". Deleting the auth user does not remove them. */
export const USER_BUCKETS = [
  "selfies",
  "try-ons",
  "buzz-media",
  "wardrobe-photos",
  "look-images",
  "style-illustrations",
] as const;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function removeFolder(bucket: string, userId: string): Promise<void> {
  const db = await admin();
  // Walk the folder (one level of subfolders is enough for how the app stores files).
  const paths: string[] = [];
  const { data: top } = await db.storage.from(bucket).list(userId, { limit: 1000 });
  for (const entry of top ?? []) {
    if (entry.id) paths.push(`${userId}/${entry.name}`);
    else {
      const { data: inner } = await db.storage
        .from(bucket)
        .list(`${userId}/${entry.name}`, { limit: 1000 });
      for (const f of inner ?? []) paths.push(`${userId}/${entry.name}/${f.name}`);
    }
  }
  for (let i = 0; i < paths.length; i += 100) {
    await db.storage.from(bucket).remove(paths.slice(i, i + 100));
  }
}

/** Cancel any live Stripe subscription so a deleted account is never billed again. */
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
    try {
      const stripe = createStripeClient(sub.environment === "live" ? "live" : "sandbox");
      await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    } catch (err) {
      console.error("[account] subscription cancel failed", sub.stripe_subscription_id, err);
      throw new Error("subscription_cancel_failed");
    }
  }
}

/**
 * Delete everything: files, the Stripe subscription, then the auth user — which cascades
 * to every table keyed on auth.users (profile, looks, Honey, Hive, Buzz tokens, push).
 */
export async function deleteAccount(userId: string): Promise<void> {
  await cancelSubscriptions(userId);
  for (const bucket of USER_BUCKETS) {
    try {
      await removeFolder(bucket, userId);
    } catch (err) {
      console.error("[account] storage cleanup failed", bucket, err);
    }
  }
  const db = await admin();
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}
