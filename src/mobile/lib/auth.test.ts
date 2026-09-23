import { describe, expect, it } from "vitest";
import { oauthProviderFor, parseAuthCallbackUrl, usesPhoneVerify, withAuthApiKey } from "./auth";

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

describe("withAuthApiKey", () => {
  it("adds apikey when the authorize URL omitted it", () => {
    const next = withAuthApiKey(
      "https://jpxswrcwpsdgbwndjmow.supabase.co/auth/v1/authorize?provider=google",
      "test-anon-key",
    );
    expect(new URL(next).searchParams.get("apikey")).toBe("test-anon-key");
    expect(new URL(next).searchParams.get("provider")).toBe("google");
  });

  it("does not overwrite an existing apikey", () => {
    const next = withAuthApiKey(
      "https://jpxswrcwpsdgbwndjmow.supabase.co/auth/v1/authorize?provider=google&apikey=keep",
      "other",
    );
    expect(new URL(next).searchParams.get("apikey")).toBe("keep");
  });
});

describe("oauthProviderFor", () => {
  it("sends Instagram through Facebook Login", () => {
    expect(oauthProviderFor("instagram")).toBe("facebook");
    expect(oauthProviderFor("facebook")).toBe("facebook");
    expect(oauthProviderFor("google")).toBe("google");
    expect(oauthProviderFor("apple")).toBe("apple");
  });

  it("uses SMS only for Apple", () => {
    expect(usesPhoneVerify("apple")).toBe(true);
    expect(usesPhoneVerify("google")).toBe(false);
    expect(usesPhoneVerify("facebook")).toBe(false);
    expect(usesPhoneVerify("instagram")).toBe(false);
  });
});
