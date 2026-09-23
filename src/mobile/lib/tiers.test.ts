import { describe, expect, it } from "vitest";
import { TIERS, formatTierPrice, normalizePlanSlug } from "./tiers";

describe("affordable tiers", () => {
  it("prices metal memberships under the old rate card", () => {
    const bySlug = Object.fromEntries(TIERS.map((t) => [t.slug, t]));
    expect(bySlug.silver.priceMonthly).toBe(9);
    expect(bySlug.gold.priceMonthly).toBe(19);
    expect(bySlug.platinum.priceMonthly).toBe(39);
    expect(bySlug.platinum_plus.priceMonthly).toBe(59);
    expect(bySlug.platinum_plus_family.priceMonthly).toBe(89);
  });

  it("offers a negotiated 1-on-1 Live Bee", () => {
    const live = TIERS.find((t) => t.slug === "live_bee");
    expect(live?.name).toMatch(/1-on-1 Live Bee/);
    expect(live?.inquiry).toBe(true);
    expect(formatTierPrice(live!)).toBe("Negotiated");
  });

  it("maps the old atelier slug to Live Bee", () => {
    expect(normalizePlanSlug("atelier")).toBe("live_bee");
    expect(normalizePlanSlug("gold")).toBe("gold");
  });
});
