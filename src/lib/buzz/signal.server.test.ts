import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../ai-gateway.server", () => ({
  getOnixusAiConfig: () => ({
    baseURL:
      process.env.TEST_GATEWAY_URL ?? "https://example.supabase.co/functions/v1/onixus-ai-gateway",
  }),
  getOnixusAiHeaders: () => ({
    Authorization: "Bearer server-only",
    "X-Onixus-Client": "liveaskew",
  }),
}));
import {
  publishWithSignal,
  signalPostStatus,
  signalPublisherUrl,
  deleteSignalMemberReceipts,
} from "./signal.server";
const post = { id: "post", user_id: "member", caption: "My caption", media_url: null };
const connection = {
  network: "facebook" as const,
  accountId: "own-page",
  accountName: "Member",
  accessToken: "own-token",
  refreshToken: null,
  expiresAt: null,
};
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Signal member bridge", () => {
  it("uses a sibling Signal endpoint with only the member-owned post and connection", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ state: "posted", post_url: "https://facebook.com/p" }));
    vi.stubGlobal("fetch", fetcher);
    await publishWithSignal(post, connection);
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe("https://example.supabase.co/functions/v1/liveaskew-publish");
    expect(JSON.parse(options.body)).toMatchObject({
      memberId: "member",
      postId: "post",
      accountId: "own-page",
      accessToken: "own-token",
    });
    expect(options.headers.Authorization).toBe("Bearer server-only");
  });
  it("keeps accepted results pending", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ state: "publishing" }, { status: 202 })),
    );
    expect((await publishWithSignal(post, connection)).state).toBe("publishing");
  });
  it("status reconciliation sends no credential and cannot request dispatch", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ state: "publishing" }, { status: 202 }));
    vi.stubGlobal("fetch", fetcher);
    await signalPostStatus("member", "post");
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      operation: "status",
      memberId: "member",
      postId: "post",
    });
  });
  it("refuses an unrecognized gateway path", () => {
    vi.stubEnv("TEST_GATEWAY_URL", "https://example.com/wrong");
    expect(() => signalPublisherUrl()).toThrow("signal_publisher_not_configured");
  });
  it("fails closed when bridge receipt cleanup fails", async () => {
    vi.stubEnv("BUZZ_PUBLISHER", "signal");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ error: "offline" }, { status: 503 })),
    );
    await expect(deleteSignalMemberReceipts("member")).rejects.toThrow("publisher_cleanup_failed");
  });
});
