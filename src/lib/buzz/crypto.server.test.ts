import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { openToken, sealToken } from "./crypto.server";

beforeAll(() => {
  process.env.BUZZ_TOKEN_KEY = randomBytes(32).toString("base64");
});

describe("token sealing", () => {
  it("round-trips and never stores the plain token", () => {
    const sealed = sealToken("EAAB-secret-token");
    expect(sealed).not.toContain("secret");
    expect(openToken(sealed)).toBe("EAAB-secret-token");
  });

  it("rejects a tampered token", () => {
    const [v, iv, tag, body] = sealToken("abc").split(":");
    const flipped = Buffer.from(body, "base64");
    flipped[0] ^= 1;
    expect(() => openToken([v, iv, tag, flipped.toString("base64")].join(":"))).toThrow();
  });
});
