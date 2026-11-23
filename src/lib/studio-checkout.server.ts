/**
 * Design Studio membership ($199/month). Sold to companies and brands from the public site,
 * separate from Bee app memberships: no Bee account, and the payments webhook ignores it
 * (subscriptions carry product=design_studio and no userId).
 *
 * In Stripe (sandbox and live) create one recurring monthly price of $199 with the lookup key
 * below. Until it exists, checkout answers price_missing and the site falls back to /book.
 */
export const STUDIO_LOOKUP_KEY = "design_studio_monthly";
export const STUDIO_PRODUCT = "design_studio";
export const STUDIO_PRICE_MONTHLY = 199;

export function studioReturnUrls(origin: string) {
  return {
    success_url: `${origin}/design-studio?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled#design-studio`,
  };
}

/** True for subscriptions that belong to the Design Studio, not the Bee app. */
export function isStudioSubscription(metadata: Record<string, string> | null | undefined) {
  return metadata?.product === STUDIO_PRODUCT;
}
