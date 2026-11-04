import { describe, expect, it } from "vitest";
import { addInterviewOption, INTERVIEW_OPTIONS } from "./interview-options";
import { INTERVIEW } from "./interview";
describe("optional interview answers", () => {
  it("offers starting points for every conversational question", () => {
    for (const question of INTERVIEW.filter((q) => q.id !== "shopping"))
      expect(INTERVIEW_OPTIONS[question.id].length).toBeGreaterThan(1);
    expect(INTERVIEW_OPTIONS.shopping).toBeUndefined();
  });
  it("combines an option with a personal answer without replacing it", () => {
    expect(addInterviewOption("I need clothes for school pickup", "Comfortable")).toBe(
      "I need clothes for school pickup, Comfortable",
    );
    expect(addInterviewOption("", "Confident")).toBe("Confident");
    expect(addInterviewOption("Comfortable", "Confident")).toBe("Comfortable, Confident");
  });
  it("does not duplicate selected ideas and preserves the draft", () => {
    expect(addInterviewOption("calm, Comfortable", "Comfortable")).toBe("calm, Comfortable");
    expect(addInterviewOption("comfortable", "Comfortable")).toBe("comfortable");
  });
});
