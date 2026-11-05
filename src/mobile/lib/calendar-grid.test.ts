import { describe, it, expect } from "vitest";
import { calendarDays, shiftCalendar } from "./calendar-grid";
describe("Honey calendar dates", () => {
  it("shows complete Sunday-first weeks across year boundaries", () => {
    const days = calendarDays("2027-01-01", "month");
    expect(days).toHaveLength(42);
    expect(days[0]).toBe("2026-12-27");
    expect(new Set(days).size).toBe(42);
  });
  it("includes leap day and clamps month navigation", () => {
    expect(calendarDays("2028-02-20", "month")).toContain("2028-02-29");
    expect(shiftCalendar("2028-01-31", 1, "month")).toBe("2028-02-29");
    expect(shiftCalendar("2027-01-31", 1, "month")).toBe("2027-02-28");
  });
  it("moves by calendar weeks across daylight-saving changes", () => {
    expect(shiftCalendar("2026-03-06", 1, "week")).toBe("2026-03-13");
    expect(calendarDays("2026-03-08", "week")).toEqual([
      "2026-03-08",
      "2026-03-09",
      "2026-03-10",
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
      "2026-03-14",
    ]);
  });
});
