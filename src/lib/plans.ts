// Canonical PLAN CONFIG — the ONE source of truth for tiers & entitlements.
// Do not duplicate tier lists, feature bullets, or price literals elsewhere.

import { supabase } from "@/integrations/supabase/client";

export type PlanSlug =
  | "silver"
  | "gold"
  | "platinum"
  | "platinum_plus"
  | "platinum_plus_family"
  | "atelier";

export type Plan = {
  slug: PlanSlug;
  name: string;
  tagline: string;
  priceMonthly: number; // USD, 0 for inquiry-only
  priceAnnual: number;  // USD/year — priceMonthly * 12 * 0.8 (rounded)
  cadence: string;      // display cadence for monthly view
  description: string;
  flagship: boolean;
  inquiry: boolean;
  features: string[];
};

const annual = (m: number) => Math.round(m * 12 * 0.8);

export const PLANS: Plan[] = [
  {
    slug: "silver",
    name: "Silver",
    tagline: "The starting ritual.",
    priceMonthly: 20,
    priceAnnual: annual(20),
    cadence: "/ month",
    description:
      "Bee in writing, your wardrobe in the cloud, and a calendar that dresses you for what's actually on it.",
    flagship: false,
    inquiry: false,
    features: [
      "Bee in writing",
      "Full wardrobe vault",
      "Editorial dressing calendar",
      "Personal style profile",
      "Static lookbook (no Selfie AI)",
      "Monthly digest",
    ],
  },
  {
    slug: "gold",
    name: "Gold",
    tagline: "Step inside your own lookbook.",
    priceMonthly: 45,
    priceAnnual: annual(45),
    cadence: "/ month",
    description:
      "Bee's voice, your private monthly Magazine, and the Selfie-AI engine that models every look on your own likeness.",
    flagship: true,
    inquiry: false,
    features: [
      "Everything in Silver",
      "Bee's full voice",
      "Selfie AI — see yourself in every look",
      "Monthly Magazine (8 spreads)",
      "Thumbs feedback — Bee learns your taste",
      "Give a month, get a month referral",
    ],
  },
  {
    slug: "platinum",
    name: "Platinum",
    tagline: "Shop the way Bee sees you.",
    priceMonthly: 90,
    priceAnnual: annual(90),
    cadence: "/ month",
    description:
      "Everything in Gold, plus shoppable manifests, priority generation, and full curated shopping access.",
    flagship: false,
    inquiry: false,
    features: [
      "Everything in Gold",
      "Shoppable look manifests",
      "Priority look generation",
      "Full curated shopping access",
    ],
  },
  {
    slug: "platinum_plus",
    name: "Platinum Plus",
    tagline: "Style, two-fold.",
    priceMonthly: 165,
    priceAnnual: annual(165),
    cadence: "/ month",
    description:
      "Everything in Platinum, plus a dedicated partner seat with their own Bee, face, and wardrobe — and a quarterly hour with Bianca.",
    flagship: false,
    inquiry: false,
    features: [
      "Everything in Platinum",
      "Add a partner seat — their own Bee, face & wardrobe",
      "Household context switcher",
      "Quarterly 1-on-1 with Bianca",
    ],
  },
  {
    slug: "platinum_plus_family",
    name: "Platinum Plus Family",
    tagline: "One Bee, the whole household.",
    priceMonthly: 249,
    priceAnnual: annual(249),
    cadence: "/ month",
    description:
      "The full household experience — up to three family seats, kids & couples dressing mode, shared wardrobe rooms, and Bianca on your calendar.",
    flagship: false,
    inquiry: false,
    features: [
      "Everything in Platinum Plus",
      "Up to 3 family seats (partner + children)",
      "Kids & couples dressing mode",
      "Shared wardrobe rooms",
      "Quarterly 1-on-1 with Bianca",
    ],
  },
  {
    slug: "atelier",
    name: "The Private Atelier",
    tagline: "Bianca on retainer.",
    priceMonthly: 0,
    priceAnnual: 0,
    cadence: "",
    description:
      "A small number of clients each month work directly with Bianca on bespoke styling — wardrobe builds, photoshoot direction, special events, and brand.",
    flagship: false,
    inquiry: true,
    features: [
      "Bianca on retainer",
      "Bespoke wardrobe build",
      "Photoshoot & event direction",
      "Atelier shopping access",
      "Direct line to your stylist",
    ],
  },
];

export function getPlan(slug: string | null | undefined): Plan | null {
  if (!slug) return null;
  return PLANS.find((p) => p.slug === slug) ?? null;
}

// ---------------- Entitlements ----------------

export type Entitlement =
  | "beeChat"
  | "wardrobe"
  | "calendar"
  | "styleProfile"
  | "monthlyDigest"
  | "beeVoice"
  | "selfieAI"
  | "monthlyMagazine"
  | "thumbsFeedback"
  | "shoppableManifests"
  | "priorityGeneration"
  | "householdPartnerSeat"
  | "householdFamilySeats"
  | "quarterlyStylistSession"
  | "stylistRetainer"
  | "curatedShopping"
  | "referralPerk";

export type EntitlementValue = boolean | number | "none" | "basic" | "full";

type EntitlementMap = Record<Entitlement, EntitlementValue>;

const SILVER: EntitlementMap = {
  beeChat: true,
  wardrobe: true,
  calendar: true,
  styleProfile: true,
  monthlyDigest: true,
  beeVoice: false,
  selfieAI: false,
  monthlyMagazine: false,
  thumbsFeedback: false,
  shoppableManifests: false,
  priorityGeneration: false,
  householdPartnerSeat: false,
  householdFamilySeats: 0,
  quarterlyStylistSession: false,
  stylistRetainer: false,
  curatedShopping: "none",
  referralPerk: false,
};

const GOLD: EntitlementMap = {
  ...SILVER,
  beeVoice: true,
  selfieAI: true,
  monthlyMagazine: true,
  thumbsFeedback: true,
  curatedShopping: "basic",
  referralPerk: true,
};

const PLATINUM: EntitlementMap = {
  ...GOLD,
  shoppableManifests: true,
  priorityGeneration: true,
  curatedShopping: "full",
};

const PLATINUM_PLUS: EntitlementMap = {
  ...PLATINUM,
  householdPartnerSeat: true,
  householdFamilySeats: 1,
  quarterlyStylistSession: true,
};

const PLATINUM_PLUS_FAMILY: EntitlementMap = {
  ...PLATINUM_PLUS,
  householdFamilySeats: 3,
};

const ATELIER: EntitlementMap = {
  ...PLATINUM_PLUS_FAMILY,
  stylistRetainer: true,
};

const ENTITLEMENTS: Record<PlanSlug, EntitlementMap> = {
  silver: SILVER,
  gold: GOLD,
  platinum: PLATINUM,
  platinum_plus: PLATINUM_PLUS,
  platinum_plus_family: PLATINUM_PLUS_FAMILY,
  atelier: ATELIER,
};

export const THE_GATE_LINE: PlanSlug = "gold";

// Trial is treated as Gold-level access. Callers may pass 'trial' explicitly,
// or use `resolveTier` to map trialing subscriptions to 'gold'.
function mapTier(tier: string | null | undefined): PlanSlug | null {
  if (!tier) return null;
  if (tier === "trial" || tier === "trialing") return "gold";
  if (tier in ENTITLEMENTS) return tier as PlanSlug;
  return null;
}

export function hasEntitlement(
  tier: string | null | undefined,
  key: Entitlement,
): boolean {
  const slug = mapTier(tier);
  if (!slug) return false;
  const value = ENTITLEMENTS[slug][key];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return value !== "none";
}

export function entitlementValue<T extends EntitlementValue = EntitlementValue>(
  tier: string | null | undefined,
  key: Entitlement,
): T | null {
  const slug = mapTier(tier);
  if (!slug) return null;
  return ENTITLEMENTS[slug][key] as T;
}

/**
 * Resolve the effective tier from a raw profile.tier + optional subscription.
 * An active trialing subscription resolves to 'trial' (== Gold-level).
 */
export function resolveTier(
  profileTier: string | null | undefined,
  subscription?: { status?: string | null; current_period_end?: string | null } | null,
): string | null {
  if (subscription?.status === "trialing") {
    const end = subscription.current_period_end;
    if (!end || new Date(end) > new Date()) return "trial";
  }
  return profileTier ?? null;
}

/**
 * Client-side helper: fetch the authenticated user's resolved tier in one shot.
 * Returns null if no session or no profile row.
 */
export async function loadResolvedTier(): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const [profileRes, subRes, adminRes] = await Promise.all([
    supabase.from("profiles").select("tier").eq("id", u.user.id).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", u.user.id)
      .eq("environment", "live")
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .eq("role", "admin")
      .maybeSingle(),
  ]);
  // Dev/admin override: admins get every entitlement across the app.
  if (adminRes.data) return "atelier";
  return resolveTier(
    (profileRes.data?.tier as string | null) ?? null,
    subRes.data ?? null,
  );
}
