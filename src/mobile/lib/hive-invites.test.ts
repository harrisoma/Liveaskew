import { describe, it, expect } from "vitest";
import { inviteToken, hiveInviteLink } from "./hive-invites";
const token = "00000000-0000-4000-8000-000000000001";
describe("Hive invitation input", () => {
  it("accepts an opaque token or a shared app link without navigating", () => {
    expect(inviteToken(token)).toBe(token);
    expect(inviteToken(`https://liveaskew.com/app?hive_invite=${token}`)).toBe(token);
  });
  it("rejects arbitrary input, script URLs and incomplete codes", () => {
    for (const value of [
      "",
      "javascript:alert(1)",
      "https://liveaskew.com/app",
      "../private",
      "00000000",
    ])
      expect(inviteToken(value)).toBeNull();
  });
});

it("uses an HTTPS app link for native invites", () => {
  expect(hiveInviteLink(token, "capacitor://localhost")).toBe(
    `https://liveaskew.com/app?hive_invite=${token}`,
  );
  expect(hiveInviteLink(token, "http://localhost", "https://www.liveaskew.com")).toContain(
    "https://www.liveaskew.com/app?",
  );
});
