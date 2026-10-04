import { TIERS } from "@/mobile/lib/tiers";
import { FAQ } from "./faq";

/**
 * Search and sharing: the canonical address, the words people search for, and the structured
 * data that tells Google and AI assistants who LiveAskew is, what the app does and what it costs.
 */
export const SITE_URL = "https://www.liveaskew.com";
export const OG_IMAGE = `${SITE_URL}/og.png`;
export const LOGO = `${SITE_URL}/logo.png`;

export const SITE_TITLE = "LiveAskew: AI Personal Stylist & Outfit Planner App | Bee";
export const SITE_DESCRIPTION =
  "Meet Bee, your AI personal stylist. Get outfit ideas for the day you've actually got, styled on the real you from the closet you own. Outfit calendar, wardrobe organizer, social post scheduler and a community for moms and working women. Free for 14 days.";

/** What people type into search, app stores and AI assistants. Also used in the store listings. */
export const KEYWORDS = [
  "AI stylist",
  "AI personal stylist",
  "personal stylist app",
  "virtual stylist",
  "styling app",
  "fashion app for women",
  "what to wear",
  "what to wear today",
  "outfit ideas",
  "outfit planner",
  "outfit calendar",
  "outfit generator",
  "daily outfit app",
  "wardrobe organizer",
  "closet organizer app",
  "digital closet",
  "capsule wardrobe",
  "virtual try-on",
  "work outfits for women",
  "mom style",
  "outfits for busy moms",
  "working mom app",
  "maternity outfits",
  "size-inclusive styling",
  "modest fashion",
  "body positive fashion",
  "colour palette",
  "personal style quiz",
  "Instagram post scheduler",
  "social media planner",
  "community for moms",
  "Bee by LiveAskew",
  "LiveAskew",
].join(", ");

export function jsonLd(data: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}

const paid = TIERS.filter((t) => !t.inquiry && t.priceMonthly > 0);

export const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "LiveAskew",
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: LOGO, width: 512, height: 512 },
  image: OG_IMAGE,
  description:
    "LiveAskew is a styling house for busy women: Bee (an AI personal stylist), Honey (an outfit calendar), Buzz (social posting) and The Hive (a community).",
};

export const WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "LiveAskew",
  alternateName: "Bee by LiveAskew",
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export const APP = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Bee by LiveAskew",
  url: `${SITE_URL}/app`,
  image: `${SITE_URL}/icons/icon-512.png`,
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web browser",
  browserRequirements: "Requires a modern web browser",
  description: SITE_DESCRIPTION,
  featureList: [
    "AI personal stylist chat",
    "Outfits for every event on your calendar",
    "Wardrobe Reset: keep, toss or maybe",
    "Virtual try-on on your own photo, never retouched",
    "Social post scheduling for Instagram, Facebook, LinkedIn, X and Threads",
    "Real Talk conversations on motherhood, style, relationships and work",
    "The Hive community",
  ],
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: Math.min(...paid.map((t) => t.priceMonthly)),
    highPrice: Math.max(...paid.map((t) => t.priceMonthly)),
    offerCount: paid.length,
    description: "Monthly memberships, each starting with 14 days free.",
  },
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export const FAQ_PAGE = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

/** Title, description, canonical and sharing tags for one page. */
export function pageMeta(opts: { title: string; description: string; path: string }) {
  const url = `${SITE_URL}${opts.path}`;
  return {
    meta: [
      { title: opts.title },
      { name: "description", content: opts.description },
      { property: "og:title", content: opts.title },
      { property: "og:description", content: opts.description },
      { property: "og:url", content: url },
      { name: "twitter:title", content: opts.title },
      { name: "twitter:description", content: opts.description },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
