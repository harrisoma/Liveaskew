import { TIERS, type PlanSlug } from "@/mobile/lib/tiers";

/**
 * What each membership says on the website. Names and prices come from the app's tier list
 * (the same list the app shows and Stripe bills), so the site can never quote a different price.
 */
type PlanCopy = { tab: string; description: string; features: string[] };

const COPY: Record<PlanSlug, PlanCopy> = {
  silver: {
    tab: "Silver",
    description:
      "Bee in writing, your wardrobe in one place, and a calendar that dresses you for what's actually on it.",
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
      "Bee's voice, your private monthly Magazine, and the Selfie-AI engine that models every look on your own likeness.",
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
      "Everything in Gold, plus shoppable manifests, priority generation, and full curated shopping access.",
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
      "Everything in Platinum, plus a dedicated partner seat with their own Bee, face, and wardrobe — and a quarterly hour with Bianca.",
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
      "The full household experience — up to three family seats, kids & couples dressing mode, shared wardrobe rooms, and Bianca on your calendar.",
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
      "Work 1-on-1 with a live human stylist — not the chat. Price is set with you after a conversation, not published as a rate card.",
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
