import { describe, expect, it, vi, afterEach } from "vitest";
import { generateTryOn, imageBytes, tryOnPrompt } from "./tryon-provider.server";
const look = {
  title: "Workday",
  formula: ["Ivory blouse", "Navy trousers", "Black loafers", "Tan tote", "Gold earrings"],
  fit: "Relaxed",
  fabric: "Cotton",
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("reference outfit rendering", () => {
  it("marks an uncertain gateway failure so automatic workers cannot pay for it twice", async () => {
    vi.stubEnv("ONIXUS_AI_API_KEY", "test");
    vi.stubEnv("ONIXUS_AI_ORGANIZATION_ID", "test");
    vi.stubEnv("ONIXUS_AI_BASE_URL", "https://example.test/v1");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: { message: "AI generation temporarily unavailable" } },
            { status: 502 },
          ),
        ),
    );
    await expect(generateTryOn("data:image/png;base64,AAAA", look)).rejects.toMatchObject({
      name: "ProviderUncertainError",
    });
  });
  it("includes shoes and every accessory in the edit instructions", () => {
    const prompt = tryOnPrompt(look);
    for (const piece of look.formula) expect(prompt).toContain(piece);
    expect(prompt).toContain("Preserve the same person");
    expect(prompt).toContain("head and feet");
  });
  it("rejects external images and oversized references", () => {
    expect(() => imageBytes("https://example.com/photo.png")).toThrow("invalid_photo");
    expect(() => imageBytes("data:image/png;base64," + "A".repeat(3500000))).toThrow(
      "invalid_photo",
    );
  });
  it("does not report an original photo or provider error as a successful render", async () => {
    vi.stubEnv("ONIXUS_AI_API_KEY", "test");
    vi.stubEnv("ONIXUS_AI_ORGANIZATION_ID", "test");
    vi.stubEnv("ONIXUS_AI_BASE_URL", "https://example.test/v1");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [] })));
    await expect(generateTryOn("data:image/png;base64,AAAA", look)).rejects.toThrow(
      "invalid_render",
    );
  });
});
