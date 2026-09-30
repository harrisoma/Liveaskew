import { createVerify, generateKeyPairSync } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { apnsJwt, apnsOutcome, resetApnsJwtCache } from "./apns.server";

describe("apnsJwt", () => {
  beforeEach(() => resetApnsJwtCache());

  it("signs an ES256 token Apple can verify, and reuses it within 50 minutes", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const now = Date.parse("2026-09-30T12:00:00Z");
    const jwt = apnsJwt({ keyId: "KEY123", teamId: "TEAM456", privateKey: pem }, now);
    const [h, c, s] = jwt.split(".");
    expect(JSON.parse(Buffer.from(h, "base64url").toString())).toEqual({
      alg: "ES256",
      kid: "KEY123",
    });
    expect(JSON.parse(Buffer.from(c, "base64url").toString())).toEqual({
      iss: "TEAM456",
      iat: now / 1000,
    });
    const verify = createVerify("SHA256");
    verify.update(`${h}.${c}`);
    expect(
      verify.verify({ key: publicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url")),
    ).toBe(true);
    expect(apnsJwt({ keyId: "x", teamId: "y", privateKey: pem }, now + 49 * 60_000)).toBe(jwt);
    expect(
      apnsJwt({ keyId: "KEY123", teamId: "TEAM456", privateKey: pem }, now + 51 * 60_000),
    ).not.toBe(jwt);
  });
});

describe("apnsOutcome", () => {
  it("drops dead tokens and keeps the rest", () => {
    expect(apnsOutcome(200, undefined)).toBe("sent");
    expect(apnsOutcome(410, "Unregistered")).toBe("invalid");
    expect(apnsOutcome(400, "BadDeviceToken")).toBe("invalid");
    expect(apnsOutcome(403, "InvalidProviderToken")).toBe("skipped");
  });
});
