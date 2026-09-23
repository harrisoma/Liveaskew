/** Metal tiers for the mobile membership screen — no Supabase import. */
export type PlanSlug =
  | "silver"
  | "gold"
  | "platinum"
  | "platinum_plus"
  | "platinum_plus_family"
  | "live_bee"
  | "atelier";

export type TierCard = {
  slug: PlanSlug;
  name: string;
  tagline: string;
  priceMonthly: number;
  inquiry: boolean;
};

export const TIERS: TierCard[] = [
  {
    slug: "silver",
    name: "Silver",
    tagline: "The starting ritual.",
    priceMonthly: 9,
    inquiry: false,
  },
  {
    slug: "gold",
    name: "Gold",
    tagline: "Step inside your own lookbook.",
    priceMonthly: 19,
    inquiry: false,
  },
  {
    slug: "platinum",
    name: "Platinum",
    tagline: "Shop the way Bee sees you.",
    priceMonthly: 39,
    inquiry: false,
  },
  {
    slug: "platinum_plus",
    name: "Platinum Plus",
    tagline: "Style, two-fold.",
    priceMonthly: 59,
    inquiry: false,
  },
  {
    slug: "platinum_plus_family",
    name: "Platinum Plus Family",
    tagline: "One Bee, the whole household.",
    priceMonthly: 89,
    inquiry: false,
  },
  {
    slug: "live_bee",
    name: "1-on-1 Live Bee",
    tagline: "A live human Bee. Price is negotiated.",
    priceMonthly: 0,
    inquiry: true,
  },
];

export const TIER_ORDER: PlanSlug[] = TIERS.map((t) => t.slug);

export function formatTierPrice(plan: Pick<TierCard, "inquiry" | "priceMonthly">): string {
  return plan.inquiry ? "Negotiated" : `$${plan.priceMonthly}/mo`;
}

export function normalizePlanSlug(slug: string | null | undefined): PlanSlug | null {
  if (!slug) return null;
  if (slug === "atelier") return "live_bee";
  return TIER_ORDER.includes(slug as PlanSlug) ? (slug as PlanSlug) : null;
}
