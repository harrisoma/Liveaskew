import { afterEach, describe, expect, it, vi } from "vitest";
import { generateLooks } from "./looks";
const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("./api", () => ({ apiFetch }));
const week = Array.from({ length: 7 }, (_, i) => ({
  title: `Look ${i + 1}`,
  occasion: "Everyday",
  formula: [`Blouse ${i + 1}`, "Midi skirt", "Flats"],
  fit: "Easy fit",
  feel: "Confident",
  fabric: "Soft cotton",
  palette: ["#111111", "#eeeeee"],
}));
afterEach(() => vi.clearAllMocks());
describe("first seven-day guide", () => {
  it("requests seven outfits, labels all days and keeps the photo out of the text model request", async () => {
    apiFetch.mockResolvedValueOnce(Response.json({ looks: week }));
    const result = await generateLooks({ interview: { life: "Work and weekends" }, count: 7 });
    expect(result.source).toBe("bee");
    expect(result.looks.map((l) => l.guideDay)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(result.looks.map((l) => l.id)).size).toBe(7);
    const body = JSON.parse(apiFetch.mock.calls[0][1].body);
    expect(body.count).toBe(7);
    expect(body).not.toHaveProperty("selfie");
  });
  it("does not replace an incomplete week or offline failure with sample looks", async () => {
    apiFetch.mockResolvedValueOnce(Response.json({ looks: week.slice(0, 3) }));
    expect(await generateLooks({ interview: {}, count: 7 })).toEqual({
      looks: [],
      source: "unavailable",
    });
    apiFetch.mockRejectedValueOnce(new Error("offline"));
    expect(await generateLooks({ interview: {}, count: 7 })).toEqual({
      looks: [],
      source: "unavailable",
    });
  });
  it.each([
    [402, "locked"],
    [429, "limited"],
  ] as const)("preserves server gate %s", async (status, source) => {
    apiFetch.mockResolvedValueOnce(Response.json({ error: "denied" }, { status }));
    expect(await generateLooks({ interview: {}, count: 7 })).toEqual({ looks: [], source });
  });
});
