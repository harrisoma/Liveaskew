import { afterEach, describe, expect, it, vi } from "vitest";
import { reviewOutfitImage } from "./style-guide-review.server";
import { VISUAL_REVIEW_CRITERIA, visualReviewPassed } from "./style-guide-visual-review";
vi.mock("./ai-gateway.server", () => ({
  getOnixusAiConfig: () => ({ baseURL: "https://example.test/functions/v1/onixus-ai-gateway/v1" }),
  getOnixusAiHeaders: () => ({ Authorization: "Bearer test-only", "X-Onixus-Client": "liveaskew" }),
}));
const look = { formula: ["Blue shirt", "Jeans", "Loafers"], fit: "Relaxed", fabric: "Cotton" };
const checks = Object.fromEntries(VISUAL_REVIEW_CRITERIA.map((key) => [key, "pass"]));
const photo = "data:image/png;base64,AAAA";
const bytes = new Uint8Array([1, 2, 3]);
function reply(content: unknown) {
  return Response.json(
    {
      model: "configured-vision-model",
      usage: { cost: 0.001 },
      choices: [
        { message: { content: typeof content === "string" ? content : JSON.stringify(content) } },
      ],
    },
    { headers: { "X-Onixus-Request-ID": "review-1" } },
  );
}
afterEach(() => vi.unstubAllGlobals());
describe("Onixus outfit visual review", () => {
  it("compares the actual image and reference through the existing tenant-authenticated service", async () => {
    const fetch = vi.fn().mockResolvedValue(reply({ checks, issues: [] }));
    vi.stubGlobal("fetch", fetch);
    const result = await reviewOutfitImage(photo, bytes, "image/png", look);
    expect(visualReviewPassed(result, look)).toBe(true);
    expect(result).toMatchObject({
      model: "configured-vision-model",
      requestId: "review-1",
      costUsd: 0.001,
    });
    expect(result.imageHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.referenceHash).not.toBe(result.imageHash);
    expect(fetch.mock.calls[0][0]).toBe("https://example.test/functions/v1/liveaskew-media");
    const options = fetch.mock.calls[0][1];
    expect(options.headers.Authorization).toBe("Bearer test-only");
    expect(options.redirect).toBe("error");
    expect(JSON.parse(options.body)).toMatchObject({
      photoDataUrl: "data:image/png;base64,AQID",
      referencePhotoDataUrl: photo,
    });
    expect(options.body).not.toContain("images/edits");
  });
  it.each(["fail", "uncertain"])("one %s criterion blocks approval", async (outcome) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        reply({
          checks: { ...checks, outfit_matches: outcome },
          issues: ["Requested loafers are missing."],
        }),
      ),
    );
    const result = await reviewOutfitImage(photo, bytes, "image/png", look);
    expect(result.status).toBe("failed");
    expect(visualReviewPassed(result, look)).toBe(false);
  });
  it.each([
    "not JSON",
    { checks: { head_to_toe: "pass" }, issues: [] },
    { checks, issues: ["The requested garment is missing."] },
    { checks: { ...checks, head_to_toe: "fail" }, issues: [] },
  ])("never fabricates approval from malformed evidence", async (content) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply(content)));
    expect((await reviewOutfitImage(photo, bytes, "image/png", look)).status).toBe("unavailable");
  });
  it("keeps provider errors separate from rejected artwork", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ error: "outage" }, { status: 503 })),
    );
    expect(await reviewOutfitImage(photo, bytes, "image/png", look)).toMatchObject({
      status: "unavailable",
      issues: ["review_provider_unavailable"],
      model: null,
      costUsd: null,
    });
  });
  it("rejects unsupported or oversized images before a paid request", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(
      (await reviewOutfitImage("https://example.com/selfie", bytes, "image/png", look)).status,
    ).toBe("unavailable");
    expect(
      (await reviewOutfitImage(photo, new Uint8Array(2700001), "image/png", look)).issues,
    ).toContain("review_image_too_large");
    expect(fetch).not.toHaveBeenCalled();
  });
});
