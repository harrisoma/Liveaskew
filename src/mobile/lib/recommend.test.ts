import { describe, expect, it } from "vitest";
import { beeOpensWith, localBeeReply, recommendLook } from "./recommend";

describe("recommendLook", () => {
  it("returns a Fit/Feel/Fabric look from onboarding answers", () => {
    const look = recommendLook({ goal: "work", fit: "structured", budget: "mid" });
    expect(look.title).toBe("The Monday column");
    expect(look.formula.length).toBeGreaterThan(2);
    expect(look.fit.toLowerCase()).toContain("waist");
    expect(look.palette).toHaveLength(3);
  });

  it("falls back safely when answers are skipped", () => {
    const look = recommendLook({ goal: null, fit: null, budget: null });
    expect(look.title).toBeTruthy();
    expect(look.formula.length).toBeGreaterThan(0);
  });
});

describe("bee voice", () => {
  it("opens with the look and the three pillars", () => {
    const look = recommendLook({ goal: "everyday", fit: "soft", budget: "value" });
    const open = beeOpensWith(look, { goal: "everyday", fit: "soft", budget: "value" });
    expect(open).toMatch(/Fit, Feel, and Fabric/i);
    expect(open).toContain(look.title);
    expect(open).not.toMatch(/must-have|elevate your|flattering/i);
  });

  it("answers modest/heritage dressing without talking around it", () => {
    const reply = localBeeReply("I wear hijab", {
      goal: "everyday",
      fit: "defined",
      budget: "mid",
    });
    expect(reply.toLowerCase()).toMatch(/heritage|covering/);
  });
});
