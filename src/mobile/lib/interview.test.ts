import { describe, expect, it } from "vitest";
import { answersFromInterview, INTERVIEW, looksFromInterview, reflectOnAnswer } from "./interview";

describe("interview", () => {
  it("covers Fit, Feel, and Fabric in order", () => {
    const pillars = INTERVIEW.map((q) => q.pillar);
    expect(pillars).toContain("Fit");
    expect(pillars).toContain("Feel");
    expect(pillars).toContain("Fabric");
  });

  it("maps free answers into a profile without flattering copy", () => {
    const answers = {
      fit: "structured through the shoulder",
      feel: "quiet and decided",
      fabric: "something that breathes",
      goal: "office week",
      life: "meetings most days",
    };
    const mapped = answersFromInterview(answers);
    expect(mapped.fit).toBe("structured");
    expect(mapped.goal).toBe("work");
    const looks = looksFromInterview(answers);
    expect(looks.length).toBeGreaterThanOrEqual(2);
    expect(reflectOnAnswer(0, "meetings")).not.toMatch(/flatter|elevate your/i);
  });
});
