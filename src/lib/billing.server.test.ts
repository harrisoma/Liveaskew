import { describe, expect, it } from "vitest";
import { activeMembership, stripeTrialEnd, tierFromPriceId, tierLookupKey } from "./billing.server";

describe("billing tiers", () => {
  it("round-trips lookup keys", () => {
    expect(tierLookupKey("gold")).toBe("gold_monthly");
    expect(tierFromPriceId("platinum_plus_monthly")).toBe("platinum_plus");
    expect(tierFromPriceId("price_123")).toBeNull();
  });

  it("only counts active or trialing, unexpired subscriptions", () => {
    const now = Date.parse("2026-09-29T00:00:00Z");
    expect(
      activeMembership(
        [
          { status: "canceled", price_id: "gold_monthly", current_period_end: null },
          { status: "active", price_id: "gold_monthly", current_period_end: "2026-09-01T00:00:00Z" },
        ],
        now,
      ),
    ).toBeNull();
    expect(
      activeMembership(
        [{ status: "trialing", price_id: "silver_monthly", current_period_end: "2026-10-10T00:00:00Z" }],
        now,
      ),
    ).toEqual({ tier: "silver", status: "trialing" });
  });

  it("carries the remaining in-app trial into Stripe", () => {
    const now = Date.parse("2026-09-29T00:00:00Z");
    expect(stripeTrialEnd("2026-09-25T00:00:00Z", now)).toBe(Date.parse("2026-10-09T00:00:00Z") / 1000);
    expect(stripeTrialEnd("2026-09-14T12:00:00Z", now)).toBeNull();
    expect(stripeTrialEnd(null, now)).toBeNull();
  });
});
