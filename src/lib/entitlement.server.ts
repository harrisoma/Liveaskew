import { activeMembership, billingEnvironment } from "./billing.server";

export type AiFeature = "chat" | "looks" | "tryon" | "wardrobe";

/** Calls per person per hour. Generous for real use, a ceiling for abuse and runaway bills. */
export const HOURLY_LIMIT: Record<AiFeature, number> = {
  chat: 120,
  looks: 30,
  tryon: 20,
  wardrobe: 60,
};

const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;

export function trialActive(trialStartedAt: string | null | undefined, now = Date.now()): boolean {
  if (!trialStartedAt) return true; // not started yet — the first AI use starts it
  const started = Date.parse(trialStartedAt);
  return Number.isNaN(started) ? false : now - started < TRIAL_MS;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/**
 * The server's copy of the paywall: trial (14 days from first use) or a paid tier, plus an
 * hourly cap. Returns a Response to send back when the call is not allowed, else null.
 */
export async function guardAi(
  userId: string,
  feature: AiFeature,
  now = Date.now(),
): Promise<Response | null> {
  if (userId === "preview") return null;
  const db = await admin();

  const [{ data: profile }, { data: subs }] = await Promise.all([
    db.from("profiles").select("trial_started_at").eq("id", userId).maybeSingle(),
    db
      .from("subscriptions")
      .select("status, price_id, current_period_end")
      .eq("user_id", userId)
      .eq("environment", billingEnvironment()),
  ]);
  const paid = Boolean(activeMembership(subs ?? [], now));
  if (!paid) {
    if (!trialActive(profile?.trial_started_at, now)) {
      return Response.json({ error: "membership_required" }, { status: 402 });
    }
    if (profile && !profile.trial_started_at) {
      await db
        .from("profiles")
        .update({ trial_started_at: new Date(now).toISOString() })
        .eq("id", userId)
        .is("trial_started_at", null);
    }
  }

  const since = new Date(now - 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from("ai_calls")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("feature", feature)
    .gte("created_at", since);
  if ((count ?? 0) >= HOURLY_LIMIT[feature]) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }
  await db.from("ai_calls").insert({ user_id: userId, feature });
  return null;
}
