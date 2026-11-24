import { describe, expect, it } from "vitest";
import { captionPrompt, captionStyleContext } from "./buzz-caption-context";
import type { AppSnapshot, GuideLook } from "./storage";
const look = { title: "Linen layers", formula: ["Linen shirt", "Tailored trousers"] } as GuideLook;
const snapshot = {
  interview: {
    answers: {
      aesthetic: "minimalist; email me at private@example.com",
      feel: "confident, insecure about my waist",
      fit: "relaxed, waist 38 inches",
      fabric: "linen",
      life: "My phone is 555-123-4567",
      budget: "$200",
    },
  },
  looks: [look],
} as unknown as AppSnapshot;
describe("Public caption context", () => {
  it("uses interview and guide style preferences without raw personal answers", () => {
    const context = captionStyleContext(snapshot);
    expect(context.preferences).toContain("minimalist");
    expect(context.preferences).toContain("linen");
    expect(context.guideVocabulary).toContain("tailored");
    const text = JSON.stringify(context);
    for (const secret of ["private@example.com", "555-123-4567", "38", "insecure", "$200"])
      expect(text).not.toContain(secret);
  });
  it("keeps the selected outfit and platform-specific instruction", () => {
    const prompt = captionPrompt(snapshot, look, "X");
    expect(prompt).toContain("Linen shirt");
    expect(prompt).toContain("under 260 characters");
    expect(prompt).not.toContain("private@example.com");
  });
  it("handles missing answers and an empty guide", () => {
    expect(
      captionStyleContext({ interview: { answers: {}, step: 0, completed: false }, looks: [] }),
    ).toEqual({ preferences: [], guideVocabulary: [] });
  });
});
