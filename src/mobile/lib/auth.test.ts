import { describe, expect, it } from "vitest";
import { parseAuthCallbackUrl } from "./auth";

describe("parseAuthCallbackUrl", () => {
  it("reads a web OAuth code", () => {
    expect(parseAuthCallbackUrl("https://app.liveaskew.co/?code=abc123&state=x")).toBe("abc123");
  });

  it("reads the iOS/Android custom scheme", () => {
    expect(parseAuthCallbackUrl("co.liveaskew.app://?code=native-code")).toBe("native-code");
    expect(parseAuthCallbackUrl("co.liveaskew.app://auth?code=native-code")).toBe("native-code");
  });

  it("returns null when no code is present", () => {
    expect(parseAuthCallbackUrl("https://app.liveaskew.co/")).toBeNull();
  });
});
