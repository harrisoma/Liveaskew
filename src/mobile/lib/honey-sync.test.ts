import { beforeEach, describe, expect, it, vi } from "vitest";
const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("./api", () => ({ apiFetch }));
import { deleteHoney, pullHoney } from "./honey-sync";
beforeEach(() => vi.resetAllMocks());
describe("Honey account sync", () => {
  it("requests the visible calendar date range", async () => {
    apiFetch.mockResolvedValue(Response.json({ items: [] }));
    expect(await pullHoney({ from: "2026-11-01", to: "2026-12-12" })).toEqual([]);
    expect(apiFetch).toHaveBeenCalledWith("/api/honey/?from=2026-11-01&to=2026-12-12");
  });
  it("reports failed removal so the UI can restore the event", async () => {
    apiFetch.mockResolvedValue(new Response(null, { status: 503 }));
    expect(await deleteHoney("event/1")).toBe(false);
    expect(apiFetch).toHaveBeenCalledWith("/api/honey/?id=event%2F1", { method: "DELETE" });
    apiFetch.mockRejectedValue(new Error("offline"));
    expect(await deleteHoney("event/1")).toBe(false);
    apiFetch.mockResolvedValue(Response.json({ ok: true }));
    expect(await deleteHoney("event/1")).toBe(true);
  });
});
