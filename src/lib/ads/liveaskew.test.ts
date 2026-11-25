import { describe, expect, it } from "vitest";
import { adFrame, LIVEASKEW_AD_BRAND, LIVEASKEW_AD_FORMATS } from "./liveaskew";
describe("LiveAskew ad timeline", () => {
  it("keeps a deterministic finite hook, fashion and CTA sequence", () => {
    expect(adFrame(0).phase).toBe("hook");
    expect(adFrame(90).phase).toBe("fashion");
    expect(adFrame(330).phase).toBe("cta");
    expect(adFrame(900)).toEqual(adFrame(449));
    expect(adFrame(-1)).toEqual(adFrame(0));
    expect(adFrame(NaN)).toEqual(adFrame(0));
  });
  it("uses the approved vertical brand contract for all four formats", () => {
    expect(LIVEASKEW_AD_BRAND.width / LIVEASKEW_AD_BRAND.height).toBe(9 / 16);
    expect(new Set(LIVEASKEW_AD_FORMATS.map((f) => f.id)).size).toBe(4);
    for (const format of LIVEASKEW_AD_FORMATS) {
      expect(format.cta.length).toBeGreaterThan(0);
      expect(format.shots).toHaveLength(3);
    }
  });
});
