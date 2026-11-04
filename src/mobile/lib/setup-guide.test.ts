import { describe, expect, it } from "vitest";
import { savedSetupWeek } from "./setup-guide";
import type { GuideLook } from "./storage";
const week = Array.from(
  { length: 7 },
  (_, i) => ({ id: `look-${i}`, guideDay: i + 1 }) as GuideLook,
);
describe("saved setup week", () => {
  it("resumes the same seven looks after a preview failure, preserving day order", () => {
    expect(savedSetupWeek([...week].reverse())).toEqual(week);
  });
  it("ignores unrelated everyday looks", () => {
    expect(savedSetupWeek([...week, { id: "extra" } as GuideLook])).toEqual(week);
  });
  it("rejects incomplete weeks and duplicate days or IDs", () => {
    expect(savedSetupWeek(week.slice(1))).toBeNull();
    expect(savedSetupWeek([...week.slice(1), week[1]])).toBeNull();
    expect(savedSetupWeek(week.map((look) => ({ ...look, id: "same" })))).toBeNull();
    expect(savedSetupWeek(week.map((look) => ({ ...look, guideDay: 0 })))).toBeNull();
  });
});
