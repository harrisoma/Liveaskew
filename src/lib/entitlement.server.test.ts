import { describe, expect, it } from "vitest";
import { HOURLY_LIMIT, trialActive } from "./entitlement.server";

describe("trialActive", () => {
  const now = Date.parse("2026-09-30T12:00:00Z");
  it("is open before the trial starts and for 14 days after", () => {
    expect(trialActive(null, now)).toBe(true);
    expect(trialActive("2026-09-17T12:00:01Z", now)).toBe(true);
    expect(trialActive("2026-09-16T12:00:00Z", now)).toBe(false);
    expect(trialActive("garbage", now)).toBe(false);
    // A start far in the future is invalid, never a trial that cannot end.
    expect(trialActive("2030-01-01T00:00:00Z", now)).toBe(false);
    expect(trialActive("2026-09-30T12:05:00Z", now)).toBe(true); // small clock skew
  });

  it("caps the expensive features hardest", () => {
    expect(HOURLY_LIMIT.tryon).toBeLessThan(HOURLY_LIMIT.chat);
  });
});
