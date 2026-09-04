import { describe, expect, it } from "vitest";
import { wardrobeVerdict } from "./wardrobe-reset";

describe("wardrobeVerdict", () => {
  it("ties Keep/Toss/Maybe to Fit/Feel/Fabric, not trends", () => {
    const keep = wardrobeVerdict("navy wool trouser", {
      goal: "work",
      fit: "structured",
      budget: "mid",
    });
    expect(keep.verdict).toBe("keep");
    expect(keep.reason.toLowerCase()).toMatch(/cloth|fit|feel/);

    const toss = wardrobeVerdict("tight skinny jean", {
      goal: "everyday",
      fit: "relaxed",
      budget: "mid",
    });
    expect(toss.verdict).toBe("toss");

    const maybe = wardrobeVerdict("oversized hoodie", {
      goal: "weekend",
      fit: "structured",
      budget: "mid",
    });
    expect(maybe.verdict).toBe("maybe");
  });
});
