import { TIERS, type PlanSlug } from "@/mobile/lib/tiers";

/**
 * What each membership says on the website. Names and prices come from the app's tier list
 * (the same list the app shows and Stripe bills), so the site can never quote a different price.
 */
type PlanCopy = { tab: string; description: string; features: string[] };

/**
 * Promised in the price book but not in the app yet. They show a "Coming soon" label until
 * they ship — delete a line here the day it does.
 */
const COMING_SOON = new Set([
  "Monthly digest",
  "Bee's full voice",
  "Monthly Magazine (8 spreads)",
  "Thumbs feedback — Bee learns your taste",
  "Give a month, get a month referral",
  "Shoppable look manifests",
  "Priority look generation",
  "Full curated shopping access",
  "Add a partner seat — their own Bee, face & wardrobe",
  "Household context switcher",
  "Quarterly 1-on-1 with Bianca",
  "Honey dresses the occasion from weather, place, time, and energy",
  "Up to 3 family seats (partner + children)",
  "Kids & couples dressing mode",
  "Shared wardrobe rooms",
  "Honey for each seat in the household",
]);

export function isComingSoon(feature: string): boolean {
  return COMING_SOON.has(feature);
}

const COPY: Record<PlanSlug, PlanCopy> = {
  silver: {
    tab: "Silver",
    description:
      "Chat with Bee any time, keep your whole wardrobe in one place, and get a calendar that knows what you're wearing to everything on it.",
    features: [
      "Bee in writing",
      "Full wardrobe vault",
      "Honey: a calendar of what is coming up",
      "Personal style profile",
      "Static lookbook (no Selfie AI)",
      "Monthly digest",
    ],
  },
  gold: {
    tab: "Gold",
    description:
      "Everything in Silver, plus every look on your own photo. Bee's voice and your own monthly Magazine are on the way.",
    features: [
      "Everything in Silver",
      "Bee's full voice",
      "Selfie AI — see yourself in every look",
      "Monthly Magazine (8 spreads)",
      "Thumbs feedback — Bee learns your taste",
      "Give a month, get a month referral",
    ],
  },
  platinum: {
    tab: "Platinum",
    description:
      "Everything in Gold, plus The Hive right inside Bee. Shopping lists for every look and express looks are on the way.",
    features: [
      "Everything in Gold",
      "Shoppable look manifests",
      "Priority look generation",
      "Full curated shopping access",
      "The Hive, inside Bee",
    ],
  },
  platinum_plus: {
    tab: "Plus",
    description:
      "Everything in Platinum, plus Buzz to post your looks. A seat for your partner and an hour with Bianca every quarter are on the way.",
    features: [
      "Everything in Platinum",
      "Add a partner seat — their own Bee, face & wardrobe",
      "Household context switcher",
      "Quarterly 1-on-1 with Bianca",
      "Buzz posts the look",
      "Honey dresses the occasion from weather, place, time, and energy",
    ],
  },
  platinum_plus_family: {
    tab: "Family",
    description:
      "The whole household, sorted. Family seats, outfits for the kids and for the two of you, and shared wardrobes are on the way.",
    features: [
      "Everything in Platinum Plus",
      "Up to 3 family seats (partner + children)",
      "Kids & couples dressing mode",
      "Shared wardrobe rooms",
      "Quarterly 1-on-1 with Bianca",
      "Honey for each seat in the household",
    ],
  },
  atelier: {
    tab: "Atelier",
    description:
      "A real human stylist, just for you. We have a proper chat first, then agree a price that fits what you need.",
    features: [
      "Live 1-on-1 with a human stylist",
      "Price negotiated to your brief",
      "Bespoke wardrobe build",
      "Photoshoot & event direction",
      "Direct line to your stylist",
      "Honey on the same calendar",
    ],
  },
};

export type SitePlan = (typeof TIERS)[number] & PlanCopy;

export const SITE_PLANS: SitePlan[] = TIERS.map((tier) => ({ ...tier, ...COPY[tier.slug] }));
