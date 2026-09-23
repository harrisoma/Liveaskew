import { describe, expect, it } from "vitest";
import { trialReminderDay, utcDayKey } from "./push.server";
import { trialDaysLeft } from "@/mobile/lib/trial";

describe("trialReminderDay", () => {
  it("fires only on the planned 7 / 3 / 1 day marks", () => {
    expect(trialReminderDay(14)).toBeNull();
    expect(trialReminderDay(7)).toBe(7);
    expect(trialReminderDay(3)).toBe(3);
    expect(trialReminderDay(1)).toBe(1);
    expect(trialReminderDay(0)).toBeNull();
    expect(trialReminderDay(null)).toBeNull();
  });

  it("uses trialDaysLeft without changing trial math", () => {
    const start = new Date("2026-09-01T00:00:00.000Z").toISOString();
    const sevenDaysIn = Date.parse("2026-09-08T00:00:00.000Z");
    expect(trialReminderDay(trialDaysLeft(start, sevenDaysIn))).toBe(7);
  });
});

describe("utcDayKey", () => {
  it("is a YYYY-MM-DD stamp for recommendation debounce", () => {
    expect(utcDayKey(new Date("2026-09-04T15:00:00.000Z"))).toBe("2026-09-04");
  });
});
