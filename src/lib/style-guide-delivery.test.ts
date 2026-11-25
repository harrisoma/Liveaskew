import { STYLE_GUIDE_STANDARD } from "./style-guide-standard";
import {
  VISUAL_REVIEW_CRITERIA,
  visualBrief,
  type OutfitVisualReview,
} from "./style-guide-visual-review";
import { describe, expect, it } from "vitest";
import { styleGuideDelivery } from "./style-guide-delivery";
import { studioSample, sampleGuideLooks } from "@/mobile/lib/studio-sample";
const week = sampleGuideLooks.map((look, i) => ({
  ...look,
  tryOnUrl: `https://example.com/member-${i}.png`,
  visualReview: {
    status: "passed",
    standardVersion: STYLE_GUIDE_STANDARD.version,
    brief: visualBrief(look),
    imageHash: (i + 1).toString(16).repeat(64),
    referenceHash: "b".repeat(64),
    checkedAt: "2026-11-24T00:00:00Z",
    checks: Object.fromEntries(VISUAL_REVIEW_CRITERIA.map((key) => [key, "pass"])),
    issues: [],
    model: "vision",
    requestId: null,
    costUsd: null,
  } as OutfitVisualReview,
}));
describe("eight-look delivery standard", () => {
  it("marks a full, distinct, illustrated eight-look guide with variations ready", () =>
    expect(styleGuideDelivery(studioSample, week).ready).toBe(true));
  it("rejects duplicate image bytes and inconsistent references even if individual reviews say pass", () => {
    expect(
      styleGuideDelivery(
        studioSample,
        week.map((look) => ({
          ...look,
          visualReview: { ...look.visualReview, imageHash: "a".repeat(64) },
        })),
      ).ready,
    ).toBe(false);
    expect(
      styleGuideDelivery(
        studioSample,
        week.map((look, i) => ({
          ...look,
          visualReview: { ...look.visualReview, referenceHash: (i + 1).toString(16).repeat(64) },
        })),
      ).ready,
    ).toBe(false);
  });
  it("does not call eight loaded but unreviewed images finished", () => {
    expect(
      styleGuideDelivery(
        studioSample,
        week.map((look) => ({ ...look, visualReview: null })),
      ).ready,
    ).toBe(false);
  });
  it("keeps three looks, missing images and original-photo placeholders incomplete", () => {
    expect(styleGuideDelivery(studioSample, week.slice(0, 3)).ready).toBe(false);
    expect(
      styleGuideDelivery(
        studioSample,
        week.map((l, i) => (i === 7 ? { ...l, tryOnUrl: null } : l)),
      ).ready,
    ).toBe(false);
    expect(
      styleGuideDelivery(
        studioSample,
        week.map((l, i) => (i === 7 ? { ...l, tryOnUrl: "self" } : l)),
      ).ready,
    ).toBe(false);
  });
  it("rejects duplicate days, formulas and render errors", () => {
    expect(styleGuideDelivery(studioSample, [...week.slice(0, 7), week[0]]).ready).toBe(false);
    expect(
      styleGuideDelivery(studioSample, [
        ...week.slice(0, 7),
        { ...week[7], formula: week[0].formula },
      ]).ready,
    ).toBe(false);
    expect(
      styleGuideDelivery(studioSample, [
        ...week.slice(0, 7),
        { ...week[7], renderError: "expired" },
      ]).ready,
    ).toBe(false);
  });
  it("rejects one personal image reused for all eight outfits", () => {
    expect(
      styleGuideDelivery(
        studioSample,
        week.map((look) => ({ ...look, tryOnUrl: week[0].tryOnUrl })),
      ).ready,
    ).toBe(false);
  });
  it("does not call a legacy guide without styling variations complete", () => {
    expect(styleGuideDelivery({ ...studioSample, stylingVariations: undefined }, week).ready).toBe(
      false,
    );
    expect(styleGuideDelivery(null, week).ready).toBe(false);
  });
  it("does not let extra occasion looks replace a missing weekly outfit", () => {
    expect(
      styleGuideDelivery(studioSample, [...week.slice(0, 7), { ...week[7], guideDay: undefined }])
        .ready,
    ).toBe(false);
  });
  it("requires the pictured outfit pieces to belong to the guide wardrobe", () => {
    expect(
      styleGuideDelivery(
        {
          ...studioSample,
          capsule: studioSample.capsule.map((piece, i) =>
            i === 0 ? { ...piece, name: "Unrelated item" } : piece,
          ),
        },
        week,
      ).ready,
    ).toBe(false);
  });
});
