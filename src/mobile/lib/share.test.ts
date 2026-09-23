import { describe, expect, it } from "vitest";
import { facebookShareUrl, lookShareText, shareOutcomeLabel } from "./share";

const look = {
  title: "The Monday column",
  occasion: "Work week",
  formula: ["Ivory silk shirt", "Charcoal trouser"],
  fit: "Structured shoulder.",
  feel: "Quiet authority.",
  fabric: "Silk that breathes.",
};

describe("lookShareText", () => {
  it("names the look and the three pillars", () => {
    const text = lookShareText(look);
    expect(text).toContain("The Monday column — Work week");
    expect(text).toContain("Ivory silk shirt · Charcoal trouser");
    expect(text).toContain("Fit. Structured shoulder.");
    expect(text).toContain("Feel. Quiet authority.");
    expect(text).toContain("Fabric. Silk that breathes.");
    expect(text).toContain("Bee · LiveAskew");
  });
});

describe("facebookShareUrl", () => {
  it("builds a sharer URL with the look quote", () => {
    const url = new URL(facebookShareUrl("https://liveaskew.vercel.app/", lookShareText(look)));
    expect(url.hostname).toBe("www.facebook.com");
    expect(url.pathname).toBe("/sharer/sharer.php");
    expect(url.searchParams.get("u")).toBe("https://liveaskew.vercel.app/");
    expect(url.searchParams.get("quote")).toContain("The Monday column");
  });
});

describe("shareOutcomeLabel", () => {
  it("tells Instagram clients to paste the caption", () => {
    expect(shareOutcomeLabel("instagram", "copied")).toMatch(/Instagram/);
    expect(shareOutcomeLabel("facebook", "opened")).toMatch(/Facebook/);
  });
});
