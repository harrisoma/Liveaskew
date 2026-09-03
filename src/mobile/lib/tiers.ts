/** Metal tiers for the mobile membership screen — no Supabase import. */
export type PlanSlug =
  | "silver"
  | "gold"
  | "platinum"
  | "platinum_plus"
  | "platinum_plus_family"
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
    priceMonthly: 20,
    inquiry: false,
  },
  {
    slug: "gold",
    name: "Gold",
    tagline: "Step inside your own lookbook.",
    priceMonthly: 45,
    inquiry: false,
  },
  {
    slug: "platinum",
    name: "Platinum",
    tagline: "Shop the way Bee sees you.",
    priceMonthly: 90,
    inquiry: false,
  },
  {
    slug: "platinum_plus",
    name: "Platinum Plus",
    tagline: "Style, two-fold.",
    priceMonthly: 165,
    inquiry: false,
  },
  {
    slug: "platinum_plus_family",
    name: "Platinum Plus Family",
    tagline: "One Bee, the whole household.",
    priceMonthly: 249,
    inquiry: false,
  },
  {
    slug: "atelier",
    name: "The Private Atelier",
    tagline: "Bianca on retainer.",
    priceMonthly: 0,
    inquiry: true,
  },
];

export const TIER_ORDER: PlanSlug[] = TIERS.map((t) => t.slug);
