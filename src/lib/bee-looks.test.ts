import { describe, expect, it } from "vitest";
import { parseLooks } from "./bee-looks";

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
