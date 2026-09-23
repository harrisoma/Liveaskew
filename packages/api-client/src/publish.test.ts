import { describe, expect, it } from "vitest";
import { isDue, publishLook } from "./publish";

describe("direct network publish", () => {
  it("waits when the account is not connected", async () => {
    let called = false;
    const result = await publishLook({
      platform: "instagram",
      imageUrl: "https://example.com/look.jpg",
      caption: "wool coat",
      connection: null,
      fetchImpl: async () => {
        called = true;
        throw new Error("should not call a network");
      },
    });
    expect(result.status).toBe("needs_connection");
    expect(called).toBe(false);
  });

  it("creates an Instagram media container and then publishes it", async () => {
    const urls: string[] = [];
    const result = await publishLook({
      platform: "instagram",
      imageUrl: "https://example.com/look.jpg",
      caption: "wool coat",
      connection: { accessToken: "token", accountId: "1789" },
      fetchImpl: async (input) => {
        urls.push(String(input));
        const creation = urls.length === 1;
        return new Response(JSON.stringify({ id: creation ? "container" : "post" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });
    expect(result.status).toBe("posted");
    expect(urls[0]).toContain("/1789/media");
    expect(urls[1]).toContain("/1789/media_publish");
  });

  it("treats a scheduled look as due only after its hour", () => {
    const now = new Date("2026-09-24T12:00:00.000Z");
    expect(isDue({ status: "scheduled", scheduledFor: "2026-09-24T11:00:00.000Z" }, now)).toBe(
      true,
    );
    expect(isDue({ status: "queued", scheduledFor: "2026-09-24T11:00:00.000Z" }, now)).toBe(false);
    expect(isDue({ status: "scheduled", scheduledFor: "2026-09-24T13:00:00.000Z" }, now)).toBe(
      false,
    );
  });
});
