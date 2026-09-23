import { describe, expect, it } from "vitest";
import { canGenerateLook, trialActive, trialDaysLeft, trialLabel, TRIAL_DAYS } from "./trial";

describe("trial", () => {
  const day = 24 * 60 * 60 * 1000;

  it("counts remaining days including today", () => {
    const started = new Date("2026-09-01T12:00:00Z").toISOString();
    const now = Date.parse("2026-09-05T12:00:00Z");
    expect(trialDaysLeft(started, now)).toBe(TRIAL_DAYS - 4);
    expect(trialLabel(started, now)).toBe("10 days left in your free trial");
  });

  it("ends after 14 days", () => {
    const started = new Date("2026-09-01T00:00:00Z").toISOString();
    const now = Date.parse("2026-09-15T00:00:01Z");
    expect(trialActive(started, now)).toBe(false);
    expect(trialDaysLeft(started, now)).toBe(0);
  });

  it("gates new looks after trial unless a metal tier is active", () => {
    const started = new Date("2026-08-01T00:00:00Z").toISOString();
    expect(canGenerateLook({ trialStartedAt: started, membershipActive: false })).toBe(false);
    expect(canGenerateLook({ trialStartedAt: started, membershipActive: true })).toBe(true);
    expect(
      canGenerateLook({ trialStartedAt: new Date().toISOString(), membershipActive: false }),
    ).toBe(true);
  });
});
