import { STYLE_GUIDE_STANDARD } from "./style-guide-standard";

export const VISUAL_REVIEW_CRITERIA = [
  "reference_preserved",
  "outfit_matches",
  "head_to_toe",
  "natural_anatomy",
  "fabric_detail",
  "no_baked_text",
  "single_photo",
] as const;
export type ReviewCriterion = (typeof VISUAL_REVIEW_CRITERIA)[number];
export type VisualBrief = { formula: string[]; fit: string; fabric: string };
export type OutfitVisualReview = {
  status: "passed" | "failed" | "unavailable";
  standardVersion: string;
  brief: string;
  imageHash: string;
  referenceHash: string;
  checkedAt: string;
  checks: Partial<Record<ReviewCriterion, "pass" | "fail" | "uncertain">>;
  issues: string[];
  model: string | null;
  requestId: string | null;
  costUsd: number | null;
};
export function visualBrief(look: VisualBrief): string {
  return JSON.stringify({ formula: look.formula, fit: look.fit, fabric: look.fabric });
}
export function visualReviewPassed(
  review: OutfitVisualReview | null | undefined,
  look: VisualBrief,
): boolean {
  return visualReviewPassedForBrief(review, visualBrief(look));
}
export function visualReviewPassedForBrief(
  review: OutfitVisualReview | null | undefined,
  brief: string,
): boolean {
  return (
    !!review &&
    review.status === "passed" &&
    review.standardVersion === STYLE_GUIDE_STANDARD.version &&
    review.brief === brief &&
    /^[a-f0-9]{64}$/.test(review.imageHash) &&
    /^[a-f0-9]{64}$/.test(review.referenceHash) &&
    VISUAL_REVIEW_CRITERIA.every((key) => review.checks?.[key] === "pass")
  );
}

/** Deterministic collection checks complement, but do not replace, image-aware review. */
export function consistentReviewImages(
  reviews: (OutfitVisualReview | null | undefined)[],
): boolean {
  return (
    reviews.length > 0 &&
    reviews.every(
      (review) =>
        review &&
        /^[a-f0-9]{64}$/.test(review.imageHash) &&
        /^[a-f0-9]{64}$/.test(review.referenceHash),
    ) &&
    new Set(reviews.map((review) => review!.imageHash)).size === reviews.length &&
    new Set(reviews.map((review) => review!.referenceHash)).size === 1
  );
}
