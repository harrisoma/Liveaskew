import { describe, expect, it } from "vitest";
import { forwardsToApp } from "./forward";

describe("forwardsToApp", () => {
  it("keeps ordinary visitors on the website", () => {
    expect(forwardsToApp("", "", false)).toBe(false);
    expect(forwardsToApp("?utm_source=instagram", "#pricing", false)).toBe(false);
  });

  it.each([
    ["?code=abc", ""],
    ["?error=access_denied&error_description=cancelled", ""],
    ["", "#access_token=x&refresh_token=y"],
    ["", "#error=server_error"],
    ["?billing=success", ""],
    ["?buzz=finish&token=t", ""],
  ])("forwards app returns: %s%s", (search, hash) => {
    expect(forwardsToApp(search, hash, false)).toBe(true);
  });

  it("opens the app from a home-screen install", () => {
    expect(forwardsToApp("", "", true)).toBe(true);
  });
});
