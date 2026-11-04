import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAdminAccess } from "./moderation";
const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("./api", () => ({ apiFetch }));
beforeEach(() => vi.resetAllMocks());
describe("administrator entry", () => {
  it("requires an explicit server-confirmed role", async () => {
    apiFetch.mockResolvedValue(Response.json({ admin: true }));
    expect(await fetchAdminAccess()).toBe(true);
    expect(apiFetch).toHaveBeenCalledWith("/api/hive/moderation?access=1");
  });
  it.each([{ admin: false }, { admin: "true" }, { email: "sales@liveaskew.com" }, {}])(
    "rejects email and unverified role claims",
    async (body) => {
      apiFetch.mockResolvedValue(Response.json(body));
      expect(await fetchAdminAccess()).toBe(false);
    },
  );
  it.each([401, 403, 500])("fails closed for HTTP %i", async (status) => {
    apiFetch.mockResolvedValue(Response.json({ admin: true }, { status }));
    expect(await fetchAdminAccess()).toBe(false);
  });
  it("fails closed offline", async () => {
    apiFetch.mockRejectedValue(new Error("offline"));
    expect(await fetchAdminAccess()).toBe(false);
  });
});
