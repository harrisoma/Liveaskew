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
  // A start more than a day ahead is not a real date (clock skew aside): no free access.
  if (Number.isNaN(started) || started > now + 86_400_000) return false;
  return now - Math.min(started, now) < TRIAL_MS;
}

/** When this member's trial began, or null if it has not started. Never starts it. */
export async function existingTrialStart(userId: string): Promise<string | null> {
  const db = await admin();
  const { data } = await db
    .from("member_trials")
    .select("started_at")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.started_at ?? null;
}

/**
 * When this member's trial began, from the server-only member_trials table. The first
 * call starts it; the row cannot be edited or deleted by the member.
 */
export async function trialStart(userId: string, now = Date.now()): Promise<string> {
  const db = await admin();
  const { data } = await db
    .from("member_trials")
    .select("started_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (data?.started_at) return data.started_at;
  const startedAt = new Date(now).toISOString();
  await db
    .from("member_trials")
    .upsert(
      { user_id: userId, started_at: startedAt },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
  const { data: again } = await db
    .from("member_trials")
    .select("started_at")
    .eq("user_id", userId)
    .maybeSingle();
  return again?.started_at ?? startedAt;
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

  const { data: subs, error: subscriptionError } = await db
    .from("subscriptions")
    .select("status, price_id, current_period_end")
    .eq("user_id", userId)
    .eq("environment", billingEnvironment());
  if (subscriptionError) return Response.json({ error: "status_unavailable" }, { status: 503 });
  const paid = Boolean(activeMembership(subs ?? [], now));
  if (!paid) {
    const startedAt = await existingTrialStart(userId);
    // Existing card-free trials keep their original access. New trials require checkout.
    if (subs?.length || !startedAt || !trialActive(startedAt, now)) {
      return Response.json({ error: "membership_required" }, { status: 402 });
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
