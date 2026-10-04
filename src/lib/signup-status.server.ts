import { activeMembership, billingEnvironment } from "./billing.server";
import { trialActive } from "./entitlement.server";

/** All eligibility decisions use server records; browser state never grants access. */
export async function signupStatus(userId: string) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const [
    { data: user, error: userError },
    { data: subs, error: subsError },
    { data: trial, error: trialError },
  ] = await Promise.all([
    db.auth.admin.getUserById(userId),
    db
      .from("subscriptions")
      .select("status, price_id, current_period_end")
      .eq("user_id", userId)
      .eq("environment", billingEnvironment()),
    db.from("member_trials").select("started_at").eq("user_id", userId).maybeSingle(),
  ]);
  if (userError || subsError || trialError || !user.user?.email)
    throw new Error("status_unavailable");
  const email = user.user.email;
  const [{ data: byUser, error: historyError }, { data: byEmail, error: emailError }] =
    await Promise.all([
      db
        .from("trial_history")
        .select("user_id")
        .eq("user_id", userId)
        .eq("environment", billingEnvironment())
        .limit(1),
      db
        .from("trial_history")
        .select("user_id")
        .ilike("email", email.replace(/[\\%_]/g, "\\$&"))
        .eq("environment", billingEnvironment())
        .limit(1),
    ]);
  if (historyError || emailError) throw new Error("status_unavailable");
  const membership = activeMembership(subs ?? []);
  const trialStartedAt = trial?.started_at ?? null;
  const usedTrial = Boolean(trialStartedAt || byUser?.length || byEmail?.length || subs?.length);
  return {
    membership,
    trialStartedAt,
    email,
    trialEligible: !usedTrial,
    legacyTrialActive: !subs?.length && Boolean(trialStartedAt) && trialActive(trialStartedAt),
  };
}
