import { describe, expect, it } from "vitest";
import { PLANS, getPlan, hasEntitlement, membershipAmount } from "./plans";

describe("affordable plan catalog", () => {
  it("keeps published prices at the new rates", () => {
    expect(getPlan("silver")?.priceMonthly).toBe(9);
    expect(getPlan("gold")?.priceMonthly).toBe(19);
    expect(getPlan("platinum")?.priceMonthly).toBe(39);
    expect(getPlan("platinum_plus")?.priceMonthly).toBe(59);
    expect(getPlan("platinum_plus_family")?.priceMonthly).toBe(89);
    const gold = getPlan("gold");
    expect(gold && membershipAmount(gold, "month")).toBe(19);
    expect(gold && membershipAmount(gold, "year")).toBe(182);
  });

  it("treats atelier as the negotiated Live Bee seat", () => {
    const live = getPlan("live_bee");
    const legacy = getPlan("atelier");
    expect(live?.name).toBe("1-on-1 Live Bee");
    expect(live?.inquiry).toBe(true);
    expect(legacy?.slug).toBe("live_bee");
    expect(hasEntitlement("live_bee", "liveHumanBee")).toBe(true);
    expect(hasEntitlement("atelier", "liveHumanBee")).toBe(true);
    expect(PLANS.some((p) => p.slug === "atelier")).toBe(false);
  });
});
