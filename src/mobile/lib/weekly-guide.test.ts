import { afterEach, describe, expect, it, vi } from "vitest";
import { queueWeeklyGuide, readWeeklyGuide } from "./weekly-guide";
import type { GuideLook } from "./storage";
const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("./api", () => ({ apiFetch }));
afterEach(() => vi.clearAllMocks());
describe("durable weekly preview client", () => {
  it("queues one owned week in day order, rather than driving seven paid requests", async () => {
    apiFetch.mockResolvedValue(
      Response.json({ guide: { id: "job", status: "queued" } }, { status: 202 }),
    );
    const looks = [7, 2, 4, 1, 6, 3, 5].map(
      (day) => ({ id: `look-${day}`, guideDay: day }) as GuideLook,
    );
    await queueWeeklyGuide(looks, "data:image/jpeg;base64,fixture");
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiFetch.mock.calls[0][0]).toBe("/api/guide");
    expect(JSON.parse(apiFetch.mock.calls[0][1].body).lookIds).toEqual(
      [1, 2, 3, 4, 5, 6, 7].map((n) => `look-${n}`),
    );
  });
  it("reconnecting only reads durable progress and never starts another render", async () => {
    const guide = {
      id: "job",
      status: "running",
      completed: 4,
      images: { "look-1": "https://private.example/image" },
    };
    apiFetch.mockImplementation(() => Promise.resolve(Response.json({ guide })));
    expect((await readWeeklyGuide())?.completed).toBe(4);
    expect((await readWeeklyGuide())?.id).toBe("job");
    expect(
      apiFetch.mock.calls.every(
        ([path, options]) =>
          path === "/api/guide" && options.cache === "no-store" && !options.method,
      ),
    ).toBe(true);
  });
  it("does not invent success after a rejected queue or expired session", async () => {
    apiFetch.mockImplementation(() =>
      Promise.resolve(Response.json({ error: "unauthorized" }, { status: 401 })),
    );
    await expect(queueWeeklyGuide([], "fixture")).rejects.toThrow();
    await expect(readWeeklyGuide()).rejects.toThrow("guide_status_unavailable");
  });
});
