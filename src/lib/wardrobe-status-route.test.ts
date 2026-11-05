import { beforeEach, describe, it, expect, vi } from "vitest";
const { requireApiUser, getBucket } = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  getBucket: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (config: unknown) => config }));
vi.mock("@/lib/api-auth.server", () => ({ requireApiUser }));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { storage: { getBucket } },
}));
import { Route } from "@/routes/api/wardrobe/status";
const get = (
  Route as unknown as {
    server: { handlers: { GET: (i: { request: Request }) => Promise<Response> } };
  }
).server.handlers.GET;
const request = new Request("https://liveaskew.com/api/wardrobe/status");
beforeEach(() => vi.resetAllMocks());
describe("private wardrobe storage readiness", () => {
  it("requires a real signed-in member", async () => {
    requireApiUser.mockResolvedValue("preview");
    expect((await get({ request })).status).toBe(401);
    expect(getBucket).not.toHaveBeenCalled();
  });
  it("rejects public or unavailable buckets", async () => {
    requireApiUser.mockResolvedValue("member");
    getBucket.mockResolvedValue({ data: { public: true }, error: null });
    expect((await get({ request })).status).toBe(503);
    getBucket.mockResolvedValue({ data: null, error: { message: "missing" } });
    expect((await get({ request })).status).toBe(503);
  });
  it("only permits a verified private bucket and disables caching", async () => {
    requireApiUser.mockResolvedValue("member");
    getBucket.mockResolvedValue({ data: { public: false }, error: null });
    const response = await get({ request });
    expect(await response.json()).toEqual({ ready: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
