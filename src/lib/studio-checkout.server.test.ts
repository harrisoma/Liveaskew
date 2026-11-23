import { describe, expect, it } from "vitest";
import { tierFromPriceId } from "./billing.server";
import {
  STUDIO_LOOKUP_KEY,
  STUDIO_PRICE_MONTHLY,
  isStudioSubscription,
  studioReturnUrls,
} from "./studio-checkout.server";

describe("Design Studio checkout", () => {
  it("is $199 a month on its own lookup key, never an app tier", () => {
    expect(STUDIO_PRICE_MONTHLY).toBe(199);
    expect(tierFromPriceId(STUDIO_LOOKUP_KEY)).toBeNull();
  });

  it("returns to the site after checkout", () => {
    expect(studioReturnUrls("https://www.liveaskew.com")).toEqual({
      success_url: "https://www.liveaskew.com/design-studio?checkout=success",
      cancel_url: "https://www.liveaskew.com/pricing?checkout=cancelled#design-studio",
    });
  });

  it("tells studio subscriptions apart from app memberships", () => {
    expect(isStudioSubscription({ product: "design_studio" })).toBe(true);
    expect(isStudioSubscription({ userId: "u1", tier: "gold" })).toBe(false);
    expect(isStudioSubscription(undefined)).toBe(false);
  });
});
