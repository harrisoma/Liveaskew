import { describe, expect, it } from "vitest";
import { styleGuideDelivery } from "./style-guide-delivery";
import { studioSample, sampleGuideLooks } from "@/mobile/lib/studio-sample";
const week = sampleGuideLooks.map((look, i) => ({
  ...look,
  tryOnUrl: `https://example.com/member-${i}.png`,
}));
describe("seven-look delivery standard", () => {
  it("marks a full, distinct, illustrated seven-look guide with variations ready", () =>
    expect(styleGuideDelivery(studioSample, week).ready).toBe(true));
  it("keeps three looks, missing images and original-photo placeholders incomplete", () => {
    expect(styleGuideDelivery(studioSample, week.slice(0, 3)).ready).toBe(false);
    expect(
      styleGuideDelivery(
        studioSample,
        week.map((l, i) => (i === 6 ? { ...l, tryOnUrl: null } : l)),
      ).ready,
    ).toBe(false);
    expect(
      styleGuideDelivery(
        studioSample,
        week.map((l, i) => (i === 6 ? { ...l, tryOnUrl: "self" } : l)),
      ).ready,
    ).toBe(false);
  });
  it("rejects duplicate days, formulas and render errors", () => {
    expect(styleGuideDelivery(studioSample, [...week.slice(0, 6), week[0]]).ready).toBe(false);
    expect(
      styleGuideDelivery(studioSample, [
        ...week.slice(0, 6),
        { ...week[6], formula: week[0].formula },
      ]).ready,
    ).toBe(false);
    expect(
      styleGuideDelivery(studioSample, [
        ...week.slice(0, 6),
        { ...week[6], renderError: "expired" },
      ]).ready,
    ).toBe(false);
  });
  it("rejects one personal image reused for all seven outfits", () => {
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
      styleGuideDelivery(studioSample, [...week.slice(0, 6), { ...week[6], guideDay: undefined }])
        .ready,
    ).toBe(false);
  });
});
