import { describe, expect, it } from "vitest";
import {
  parseGarmentSight,
  sightHaystack,
  wardrobeVerdict,
  type GarmentSight,
} from "./wardrobe-reset";

describe("wardrobeVerdict", () => {
  it("ties Keep/Toss/Maybe to Fit/Feel/Fabric against what the photo showed", () => {
    const keep = wardrobeVerdict(
      {
        label: "navy wool trouser",
        type: "trouser",
        fabric: "wool",
        fit: "tailored",
        notes: "",
      },
      {
        goal: "work",
        fit: "structured",
        budget: "mid",
      },
    );
    expect(keep.verdict).toBe("keep");
    expect(keep.reason.toLowerCase()).toMatch(/cloth|fit|feel/);

    const toss = wardrobeVerdict(
      {
        label: "skinny jean",
        type: "jean",
        fabric: "denim",
        fit: "tight skinny",
        notes: "",
      },
      {
        goal: "everyday",
        fit: "relaxed",
        budget: "mid",
      },
    );
    expect(toss.verdict).toBe("toss");

    const maybe = wardrobeVerdict(
      {
        label: "oversized hoodie",
        type: "hoodie",
        fabric: "fleece",
        fit: "oversized",
        notes: "slouch through the shoulder",
      },
      {
        goal: "weekend",
        fit: "structured",
        budget: "mid",
      },
    );
    expect(maybe.verdict).toBe("maybe");
  });

  it("reads fabric and fit signals from the sight, not a canned label list", () => {
    const sight: GarmentSight = {
      label: "unnamed piece",
      type: "blouse",
      fabric: "polyester shine",
      fit: "stiff",
      notes: "",
    };
    expect(sightHaystack(sight)).toContain("polyester shine");
    expect(wardrobeVerdict(sight, { goal: "work", fit: "soft", budget: "mid" }).verdict).toBe(
      "toss",
    );
  });
});

describe("parseGarmentSight", () => {
  it("accepts nested or flat vision JSON and rejects empty labels", () => {
    expect(
      parseGarmentSight({
        sight: { label: "Ivory silk shirt", fabric: "silk", type: "shirt", fit: "easy" },
      }),
    ).toEqual({
      label: "Ivory silk shirt",
      type: "shirt",
      fabric: "silk",
      fit: "easy",
      notes: "",
    });
    expect(parseGarmentSight({ name: "Linen wrap", category: "dress" })).toMatchObject({
      label: "Linen wrap",
      type: "dress",
    });
    expect(parseGarmentSight({ fabric: "wool" })).toBeNull();
  });
});
