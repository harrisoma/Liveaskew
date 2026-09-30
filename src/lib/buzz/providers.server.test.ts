import { describe, expect, it } from "vitest";
import {
  exchangeCode,
  publishPost,
  refreshIfNeeded,
  type LiveConnection,
} from "./providers.server";

type Call = { url: string; method: string; body: string };

/** Answers requests by URL substring, in order; records every call. */
function fakeFetch(routes: [string, (call: Call) => Response][]) {
  const calls: Call[] = [];
  const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body =
      typeof init?.body === "string"
        ? init.body
        : init?.body instanceof URLSearchParams
          ? init.body.toString()
          : "";
    const call = { url, method: init?.method ?? "GET", body };
    calls.push(call);
    const hit = routes.find(([match]) => url.includes(match));
    if (!hit) return new Response(`no route for ${url}`, { status: 404 });
    return hit[1](call);
  }) as typeof fetch;
  return { impl, calls };
}

const ok = (body: unknown, headers?: Record<string, string>) =>
  new Response(JSON.stringify(body), { status: 200, headers });

const conn = (
  network: LiveConnection["network"],
  extra: Partial<LiveConnection> = {},
): LiveConnection => ({
  network,
  accountId: "acct1",
  accountName: "bee",
  accessToken: "tok",
  refreshToken: null,
  expiresAt: null,
  ...extra,
});

describe("publishPost", () => {
  it("Instagram creates a container, waits, publishes, and returns the permalink", async () => {
    const { impl, calls } = fakeFetch([
      ["/acct1/media_publish", () => ok({ id: "post9" })],
      ["/acct1/media", () => ok({ id: "cont1" })],
      ["/cont1?fields=status_code", () => ok({ status_code: "FINISHED" })],
      ["/post9?fields=permalink", () => ok({ permalink: "https://instagram.com/p/abc" })],
    ]);
    const res = await publishPost(
      conn("instagram"),
      { text: "hi", imageUrl: "https://img/1.jpg" },
      impl,
    );
    expect(res).toEqual({ ok: true, url: "https://instagram.com/p/abc" });
    expect(calls.map((c) => c.method)).toEqual(["POST", "GET", "POST", "GET"]);
    expect(JSON.parse(calls[0].body)).toMatchObject({
      image_url: "https://img/1.jpg",
      caption: "hi",
    });
  });

  it("Instagram refuses a post without a photo before calling the network", async () => {
    const { impl, calls } = fakeFetch([]);
    const res = await publishPost(conn("instagram"), { text: "hi", imageUrl: null }, impl);
    expect(res.ok).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("Facebook posts text to the Page feed", async () => {
    const { impl, calls } = fakeFetch([["/acct1/feed", () => ok({ id: "acct1_77" })]]);
    const res = await publishPost(conn("facebook"), { text: "hello", imageUrl: null }, impl);
    expect(res).toEqual({ ok: true, url: "https://www.facebook.com/acct1_77" });
    expect(JSON.parse(calls[0].body).message).toBe("hello");
  });

  it("Threads publishes a text post in two steps", async () => {
    const { impl, calls } = fakeFetch([
      ["/acct1/threads_publish", () => ok({ id: "t2" })],
      ["/acct1/threads", () => ok({ id: "c1" })],
      ["/t2?fields=permalink", () => ok({ permalink: "https://threads.net/@bee/post/x" })],
    ]);
    const res = await publishPost(conn("threads"), { text: "thread me", imageUrl: null }, impl);
    expect(res).toEqual({ ok: true, url: "https://threads.net/@bee/post/x" });
    expect(calls[0].body).toContain("media_type=TEXT");
  });

  it("LinkedIn reads the post URN from the response header", async () => {
    const { impl, calls } = fakeFetch([
      [
        "/rest/posts",
        () => new Response("", { status: 201, headers: { "x-restli-id": "urn:li:share:9" } }),
      ],
    ]);
    const res = await publishPost(
      conn("linkedin", { accountId: "urn:li:person:abc" }),
      { text: "work look", imageUrl: null },
      impl,
    );
    expect(res).toEqual({ ok: true, url: "https://www.linkedin.com/feed/update/urn:li:share:9" });
    expect(JSON.parse(calls[0].body)).toMatchObject({
      author: "urn:li:person:abc",
      commentary: "work look",
    });
  });

  it("X posts and links to the tweet; network errors come back readable", async () => {
    const good = fakeFetch([["/2/tweets", () => ok({ data: { id: "123" } })]]);
    expect(await publishPost(conn("x"), { text: "hi", imageUrl: null }, good.impl)).toEqual({
      ok: true,
      url: "https://x.com/bee/status/123",
    });
    const bad = fakeFetch([
      [
        "/2/tweets",
        () => new Response(JSON.stringify({ detail: "You are not permitted" }), { status: 403 }),
      ],
    ]);
    expect(await publishPost(conn("x"), { text: "hi", imageUrl: null }, bad.impl)).toEqual({
      ok: false,
      error: "X: You are not permitted",
    });
  });
});

describe("refreshIfNeeded", () => {
  it("refreshes an X token that is about to expire and keeps the refresh token", async () => {
    process.env.X_CLIENT_ID = "cid";
    process.env.X_CLIENT_SECRET = "sec";
    const now = Date.parse("2026-09-29T12:00:00Z");
    const { impl, calls } = fakeFetch([
      ["/oauth2/token", () => ok({ access_token: "new", expires_in: 7200 })],
    ]);
    const next = await refreshIfNeeded(
      conn("x", { refreshToken: "r1", expiresAt: "2026-09-29T12:01:00Z" }),
      impl,
      now,
    );
    expect(next?.accessToken).toBe("new");
    expect(next?.refreshToken).toBe("r1");
    expect(calls[0].body).toContain("grant_type=refresh_token");
  });

  it("leaves fresh tokens alone and flags expired LinkedIn sign-ins", async () => {
    const now = Date.parse("2026-09-29T12:00:00Z");
    const { impl } = fakeFetch([]);
    expect(
      await refreshIfNeeded(conn("x", { expiresAt: "2026-09-29T14:00:00Z" }), impl, now),
    ).toBeNull();
    await expect(
      refreshIfNeeded(conn("linkedin", { expiresAt: "2026-09-01T00:00:00Z" }), impl, now),
    ).rejects.toThrow(/Reconnect/);
  });
});

describe("exchangeCode", () => {
  it("Meta returns the Page and its linked Instagram account", async () => {
    process.env.META_APP_ID = "app";
    process.env.META_APP_SECRET = "sec";
    const { impl } = fakeFetch([
      ["grant_type=fb_exchange_token", () => ok({ access_token: "long" })],
      ["/oauth/access_token", () => ok({ access_token: "short" })],
      [
        "/me/accounts",
        () =>
          ok({
            data: [
              {
                id: "page1",
                name: "LiveAskew",
                access_token: "pagetok",
                instagram_business_account: { id: "ig1", username: "liveaskew" },
              },
            ],
          }),
      ],
    ]);
    const accounts = await exchangeCode(
      "instagram",
      { code: "c", redirectUri: "https://app/cb", verifier: null },
      impl,
    );
    expect(accounts.map((a) => [a.network, a.accountId, a.accessToken])).toEqual([
      ["facebook", "page1", "pagetok"],
      ["instagram", "ig1", "pagetok"],
    ]);
  });
});
