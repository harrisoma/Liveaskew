import { describe, expect, it } from "vitest";
import { buzzMessage, buzzWeek, platformLoginUrl } from "./buzz";

describe("buzzMessage", () => {
  it("uses the client's instruction and changes the line each day", () => {
    const week = buzzWeek("ivory silk and a wool trouser");
    expect(new Set(week).size).toBe(7);
    for (const line of week) {
      expect(line.toLowerCase()).toContain("ivory silk");
    }
  });

  it("writes a different close for each platform", () => {
    const look = "a covered work set";
    const instagram = buzzMessage(look, 0, "instagram");
    const tiktok = buzzMessage(look, 0, "tiktok");
    const facebook = buzzMessage(look, 0, "facebook");
    const linkedin = buzzMessage(look, 0, "linkedin");
    expect(tiktok).not.toBe(instagram);
    expect(facebook).not.toBe(instagram);
    expect(linkedin).toMatch(/meeting/i);
  });

  it("opens each network on its own login page", () => {
    expect(platformLoginUrl("instagram")).toContain("instagram.com");
    expect(platformLoginUrl("tiktok")).toContain("tiktok.com");
    expect(platformLoginUrl("pinterest")).toContain("pinterest.com");
    expect(platformLoginUrl("facebook")).toContain("facebook.com");
    expect(platformLoginUrl("linkedin")).toContain("linkedin.com");
  });
});
