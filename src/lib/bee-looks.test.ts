import { describe, expect, it } from "vitest";
import { completeWeeklyGuide, parseLooks } from "./bee-looks";

const look = {
  title: "Monday column",
  occasion: "Work",
  formula: ["Ivory silk shirt", "Charcoal wool trouser", "Leather loafer"],
  fit: "Structured through the shoulder.",
  feel: "Decided.",
  fabric: "Silk that breathes.",
  palette: ["#111111", "#f4efe6"],
};

describe("parseLooks", () => {
  it("reads a fenced JSON array and drops invalid looks", () => {
    const text = "```json\n" + JSON.stringify([look, { title: "x" }]) + "\n```";
    expect(parseLooks(text, 3)).toEqual([look]);
  });

  it("accepts an object with a looks key and caps the count", () => {
    expect(parseLooks(JSON.stringify({ looks: [look, look, look] }), 2)).toHaveLength(2);
  });

  it("returns nothing for prose", () => {
    expect(parseLooks("I could not do that.", 3)).toEqual([]);
  });
});

describe("completeWeeklyGuide", () => {
  const week = Array.from({ length: 8 }, (_, i) => ({
    ...look,
    title: `Day ${i + 1}`,
    formula: [
      `Day ${i + 1} blouse`,
      i % 2 ? "Navy skirt" : "Charcoal wool trouser",
      "Leather loafer",
      i % 2 ? "Gold hoops" : "Tan tote",
    ],
  }));
  it("requires all eight different looks", () => {
    expect(completeWeeklyGuide(week)).toBe(true);
    expect(completeWeeklyGuide(week.slice(0, 7))).toBe(false);
    expect(completeWeeklyGuide([...week.slice(0, 7), week[0]])).toBe(false);
  });
  it("rejects reordered duplicate outfit formulas and duplicate titles", () => {
    expect(
      completeWeeklyGuide([
        ...week.slice(0, 7),
        { ...week[7], formula: [...week[0].formula].reverse() },
      ]),
    ).toBe(false);
    expect(completeWeeklyGuide([...week.slice(0, 7), { ...week[7], title: week[0].title }])).toBe(
      false,
    );
  });
  it("requires a reusable 12–15-piece wardrobe across the week", () => {
    expect(
      completeWeeklyGuide(
        week.map((look, i) => ({
          ...look,
          formula: [`Top ${i}`, `Bottom ${i}`, `Shoe ${i}`, `Bag ${i}`],
        })),
      ),
    ).toBe(false);
    expect(
      completeWeeklyGuide(
        week.map((look, i) => ({ ...look, formula: [`Top ${i}`, "One skirt", "One shoe"] })),
      ),
    ).toBe(false);
  });
});
