import { describe, expect, it } from "vitest";
import { STYLE_GUIDE_STANDARD } from "./style-guide-standard";
import {
  VISUAL_REVIEW_CRITERIA,
  visualBrief,
  visualReviewPassed,
  type OutfitVisualReview,
} from "./style-guide-visual-review";
const look = { formula: ["Shirt", "Jeans", "Sneakers"], fit: "Easy", fabric: "Cotton" };
const review: OutfitVisualReview = {
  status: "passed",
  standardVersion: STYLE_GUIDE_STANDARD.version,
  brief: visualBrief(look),
  imageHash: "a".repeat(64),
  referenceHash: "b".repeat(64),
  checkedAt: "2026-11-24T00:00:00Z",
  checks: Object.fromEntries(VISUAL_REVIEW_CRITERIA.map((k) => [k, "pass"])),
  issues: [],
  model: "vision",
  requestId: "id",
  costUsd: null,
};
describe("visual approval evidence", () => {
  it("requires the complete rubric and current unchanged brief", () => {
    expect(visualReviewPassed(review, look)).toBe(true);
    expect(
      visualReviewPassed(review, { ...look, formula: ["Different dress", "Boots", "Bag"] }),
    ).toBe(false);
    expect(visualReviewPassed({ ...review, standardVersion: "old" }, look)).toBe(false);
    expect(visualReviewPassed({ ...review, checks: {} }, look)).toBe(false);
    expect(visualReviewPassed({ ...review, imageHash: "" }, look)).toBe(false);
    expect(visualReviewPassed({ ...review, status: "unavailable" }, look)).toBe(false);
  });
});
