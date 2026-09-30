import { describe, expect, it } from "vitest";
import { TIERS } from "@/mobile/lib/tiers";
import { isComingSoon, SITE_PLANS } from "./plans";

describe("site plans", () => {
  it("quotes exactly the app's prices", () => {
    expect(SITE_PLANS.map((p) => [p.slug, p.priceMonthly])).toEqual(
      TIERS.map((t) => [t.slug, t.priceMonthly]),
    );
  });

  it("only labels features that appear in a plan", () => {
    const listed = new Set(SITE_PLANS.flatMap((p) => p.features));
    const labelled = SITE_PLANS.flatMap((p) => p.features).filter(isComingSoon);
    expect(labelled.length).toBeGreaterThan(0);
    for (const f of labelled) expect(listed.has(f)).toBe(true);
  });

  it("keeps what is live unlabelled", () => {
    expect(isComingSoon("Selfie AI — see yourself in every look")).toBe(false);
    expect(isComingSoon("Buzz posts the look")).toBe(false);
    expect(isComingSoon("The Hive, inside Bee")).toBe(false);
  });
});
