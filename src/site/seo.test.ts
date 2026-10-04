import { describe, expect, it } from "vitest";
import { TIERS } from "@/mobile/lib/tiers";
import { FAQ } from "./faq";
import { APP, FAQ_PAGE, KEYWORDS, ORGANIZATION, SITE_DESCRIPTION, SITE_TITLE } from "./seo";

describe("seo", () => {
  it("keeps titles and descriptions within what search results show", () => {
    expect(SITE_TITLE.length).toBeLessThanOrEqual(65);
    expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(300);
    expect(SITE_TITLE).toMatch(/AI Personal Stylist/);
  });

  it("quotes the real Silver price in the FAQ", () => {
    const silver = TIERS.find((t) => t.slug === "silver")!;
    expect(FAQ.some((f) => f.a.includes(`$${silver.priceMonthly} a month`))).toBe(true);
  });

  it("prices the app from the tier list", () => {
    const paid = TIERS.filter((t) => !t.inquiry && t.priceMonthly > 0).map((t) => t.priceMonthly);
    expect(APP.offers.lowPrice).toBe(Math.min(...paid));
    expect(APP.offers.highPrice).toBe(Math.max(...paid));
  });

  it("publishes the logo and every FAQ as structured data", () => {
    expect(ORGANIZATION.logo.url).toMatch(/^https:\/\/www\.liveaskew\.com\/logo\.png$/);
    expect(FAQ_PAGE.mainEntity).toHaveLength(FAQ.length);
    expect(KEYWORDS).toContain("AI personal stylist");
  });

  it("does not promise native apps that are not live yet", () => {
    const app = FAQ.find((f) => f.q.includes("iPhone"))!;
    expect(app.a).toMatch(/coming soon/i);
  });
});
