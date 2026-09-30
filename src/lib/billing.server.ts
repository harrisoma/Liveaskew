import type { StripeEnv } from "@/lib/stripe.server";

export const PAID_TIERS = [
  "silver",
  "gold",
  "platinum",
  "platinum_plus",
  "platinum_plus_family",
] as const;
export type PaidTier = (typeof PAID_TIERS)[number];

/** Stripe price lookup key for a tier. Create one recurring monthly price per key. */
export function tierLookupKey(tier: PaidTier): string {
  return `${tier}_monthly`;
}

export function tierFromPriceId(priceId: string | null | undefined): PaidTier | null {
  if (!priceId) return null;
  const hit = PAID_TIERS.find((t) => priceId === tierLookupKey(t));
  return hit ?? null;
}

export function isPaidTier(value: unknown): value is PaidTier {
  return typeof value === "string" && (PAID_TIERS as readonly string[]).includes(value);
}

export function billingEnvironment(): StripeEnv {
  if (process.env.VERCEL_ENV === "production") return "live";
  return "sandbox";
}

export function billingConfigured(env: StripeEnv = billingEnvironment()): boolean {
  return Boolean(
    env === "live" ? process.env.STRIPE_LIVE_API_KEY : process.env.STRIPE_SANDBOX_API_KEY,
  );
}

const ACTIVE = new Set(["active", "trialing"]);
const TRIAL_MS = 14 * 24 * 60 * 60 * 1000;

export type MembershipRow = {
  status: string;
  price_id: string;
  current_period_end: string | null;
};

export function activeMembership(
  rows: MembershipRow[],
  now = Date.now(),
): { tier: PaidTier; status: string } | null {
  for (const row of rows) {
    if (!ACTIVE.has(row.status)) continue;
    if (row.current_period_end && Date.parse(row.current_period_end) < now) continue;
    const tier = tierFromPriceId(row.price_id);
    if (tier) return { tier, status: row.status };
  }
  return null;
}

/**
 * The in-app 14-day trial is already running when someone subscribes. Carry the days
 * they have left into Stripe so they are not charged early or given a second trial.
 * Stripe needs trial_end at least 48h out, otherwise billing starts now.
 */
export function stripeTrialEnd(
  trialStartedAt: string | null | undefined,
  now = Date.now(),
): number | null {
  if (!trialStartedAt) return null;
  // Never longer than a fresh 14-day trial, whatever the start date says.
  const end = Math.min(Date.parse(trialStartedAt) + TRIAL_MS, now + TRIAL_MS);
  if (Number.isNaN(end) || end - now < 48 * 60 * 60 * 1000) return null;
  return Math.floor(end / 1000);
}
