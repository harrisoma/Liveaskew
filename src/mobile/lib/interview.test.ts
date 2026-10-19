import { describe, expect, it } from "vitest";
import { answersFromInterview, INTERVIEW, looksFromInterview, reflectOnAnswer } from "./interview";

describe("interview", () => {
  it("collects style, colors and shopping during the first interview, then points directly to generation", () => {
    expect(INTERVIEW.map((q) => q.id)).toEqual([
      "life",
      "fit",
      "feel",
      "fabric",
      "goal",
      "aesthetic",
      "colors",
      "shopping",
    ]);
    const final = reflectOnAnswer(INTERVIEW.length - 1, '{"shoeSize":"8","clothingMax":100}');
    expect(final).toContain("Generate my Style Guide");
    expect(final).not.toContain("shoeSize");
  });
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
