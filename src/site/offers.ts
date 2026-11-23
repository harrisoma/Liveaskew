import { TIERS } from "@/mobile/lib/tiers";

/** The four ways in to LiveAskew. Shared by the Get Started funnel and the Pricing page. */
export type OfferId = "app" | "styling" | "consulting" | "design-studio";

export type Offer = {
  id: OfferId;
  name: string;
  forWho: string;
  summary: string;
  price: string;
  priceNote: string;
  cta: string;
  /** Where the primary action goes. Design Studio starts Stripe checkout instead. */
  href: string;
  includes: string[];
};

const appTiers = TIERS.filter((t) => !t.inquiry && t.priceMonthly > 0);
const appFrom = Math.min(...appTiers.map((t) => t.priceMonthly));

export const OFFERS: Offer[] = [
  {
    id: "app",
    name: "The Bee App",
    forWho: "For you, every day",
    summary:
      "An AI stylist that builds outfits from the clothes you own, for the plans on your calendar.",
    price: `From $${appFrom}`,
    priceNote: "per month · 14 days free, no card",
    cta: "Start your free trial",
    href: "/app",
    includes: [
      "Bee, your AI stylist, any time",
      "Wardrobe vault and Wardrobe Reset",
      "Honey: a look for every plan on your calendar",
      "The Hive community",
    ],
  },
  {
    id: "styling",
    name: "1-on-1 Professional Styling",
    forWho: "For you, with a stylist",
    summary: "Work directly with a LiveAskew stylist on your wardrobe, your image and your events.",
    price: "By consultation",
    priceNote: "priced to your goals after a first conversation",
    cta: "Book a styling consultation",
    href: "/book?service=styling",
    includes: [
      "A consultation to understand your goals",
      "Personal styling built on Fit · Feel · Fabric",
      "Wardrobe edits, shopping and event looks",
      "Your looks carried into the Bee app",
    ],
  },
  {
    id: "consulting",
    name: "Business Consulting",
    forWho: "For companies and brands",
    summary: "Brand identity, marketing, retail and product strategy from a professional stylist.",
    price: "By consultation",
    priceNote: "scoped to your business after a first call",
    cta: "Book a consulting call",
    href: "/book?service=consulting",
    includes: [
      "Brand identity creation",
      "Marketing and campaign styling",
      "Retail strategy and merchandising",
      "Product design direction",
    ],
  },
  {
    id: "design-studio",
    name: "Design Studio",
    forWho: "For brands that make things",
    summary: "An ongoing design partner for apparel, merch and brand visuals, billed monthly.",
    price: "$199",
    priceNote: "per month",
    cta: "Start the Design Studio",
    href: "/book?service=design-studio",
    // Draft for Bianca to review before launch.
    includes: [
      "Ongoing design requests: apparel, prints, merch and brand visuals",
      "Revisions built into every request",
      "Production-ready files and tech packs",
      "Projects, files and approvals in Onixus Workspace",
    ],
  },
];

export const APP_TIERS = TIERS;
