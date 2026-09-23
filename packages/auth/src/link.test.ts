import { describe, expect, it } from "vitest";
import { linkIdentity } from "./link";
import { openSession, sealSession } from "./session";

describe("linkIdentity", () => {
  it("keeps one Hive member when Google and Instagram share an email", () => {
    const google = linkIdentity([], {
      provider: "google",
      providerAccountId: "google-1",
      email: "Member@LiveAskew.com",
      name: "Amina Cole",
    });
    const both = linkIdentity(google.users, {
      provider: "instagram",
      providerAccountId: "ig-1",
      email: "member@liveaskew.com",
      name: "Amina",
    });

    expect(both.users).toHaveLength(1);
    expect(both.user.id).toBe(google.user.id);
    expect(both.user.accounts.map((account) => account.provider)).toEqual(["google", "instagram"]);
  });

  it("does not merge people who use different emails", () => {
    const first = linkIdentity([], {
      provider: "apple",
      providerAccountId: "apple-1",
      email: "a@liveaskew.com",
      name: "A",
    });
    const second = linkIdentity(first.users, {
      provider: "tiktok",
      providerAccountId: "tt-1",
      email: "b@liveaskew.com",
      name: "B",
    });
    expect(second.users).toHaveLength(2);
  });
});

describe("session seal", () => {
  it("round-trips claims and rejects a bad signature", async () => {
    const claims = {
      userId: "user-1",
      email: "member@liveaskew.com",
      name: "Amina Cole",
      providers: ["google"],
    };
    const token = await sealSession(claims, "secret");
    expect(await openSession(token, "secret")).toEqual(claims);
    expect(await openSession(token, "other")).toBeNull();
  });
});
