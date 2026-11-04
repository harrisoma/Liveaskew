import { beforeEach, describe, expect, it, vi } from "vitest";
const { requireApiUser, isHiveModerator, moderationQueue } = vi.hoisted(() => ({
  requireApiUser: vi.fn(),
  isHiveModerator: vi.fn(),
  moderationQueue: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (config: unknown) => config }));
vi.mock("@/lib/api-auth.server", () => ({ requireApiUser }));
vi.mock("@/lib/hive-moderation.server", () => ({
  isHiveModerator,
  moderationQueue,
  moderate: vi.fn(),
}));
import { Route } from "@/routes/api/hive/moderation";
const get = (
  Route as unknown as {
    server: { handlers: { GET: (input: { request: Request }) => Promise<Response> } };
  }
).server.handlers.GET;
beforeEach(() => vi.resetAllMocks());
describe("admin role endpoint", () => {
  it("denies unauthenticated callers", async () => {
    requireApiUser.mockResolvedValue(new Response(null, { status: 401 }));
    expect(
      (await get({ request: new Request("https://liveaskew.com/api/hive/moderation?access=1") }))
        .status,
    ).toBe(401);
    expect(moderationQueue).not.toHaveBeenCalled();
  });
  it.each(["preview", "ordinary-member"])("denies %s", async (user) => {
    requireApiUser.mockResolvedValue(user);
    isHiveModerator.mockResolvedValue(false);
    expect(
      (await get({ request: new Request("https://liveaskew.com/api/hive/moderation?access=1") }))
        .status,
    ).toBe(403);
    expect(moderationQueue).not.toHaveBeenCalled();
  });
  it("returns only role confirmation without fetching reports", async () => {
    requireApiUser.mockResolvedValue("admin-id");
    isHiveModerator.mockResolvedValue(true);
    const response = await get({
      request: new Request("https://liveaskew.com/api/hive/moderation?access=1"),
    });
    expect(await response.json()).toEqual({ admin: true });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(isHiveModerator).toHaveBeenCalledWith("admin-id");
    expect(moderationQueue).not.toHaveBeenCalled();
  });
});
