import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GuideLookbook } from "./GuideLookbook";
import { sampleGuideLooks } from "../lib/studio-sample";

describe("visual outfit guide", () => {
  it("presents all sample outfits at once and illustrates the selected outfit pieces", () => {
    const html = renderToStaticMarkup(<GuideLookbook looks={sampleGuideLooks} sample />);
    expect(html).toContain("Your styled outfit gallery");
    for (const look of sampleGuideLooks) expect(html).toContain(look.title);
    expect(html.match(/class="sample-garment-image"/g)).toHaveLength(3);
    expect(html).toContain("How to wear it");
  });
  it("uses the member's existing render instead of sample clothing art", () => {
    const look = { ...sampleGuideLooks[0], tryOnUrl: "https://example.com/own-render.png" };
    const html = renderToStaticMarkup(<GuideLookbook looks={[look]} />);
    expect(html).toContain("https://example.com/own-render.png");
    expect(html).not.toContain("sample-garment-image");
    expect(html).not.toContain("AI-created sample");
  });
  it("does not silently substitute a model when the personal render is missing", () => {
    const html = renderToStaticMarkup(<GuideLookbook looks={[sampleGuideLooks[0]]} />);
    expect(html).toContain("Personal outfit image not ready");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("lookbook-sample-image");
  });
});
