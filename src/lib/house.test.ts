import { beforeEach, describe, expect, it } from "vitest";
import {
  attachAccount,
  loadAccounts,
  runAutonomousPosts,
  saveAutonomous,
  scheduleLookOnHoney,
} from "./house";

const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
      },
    },
  });
});

describe("scheduleLookOnHoney", () => {
  it("puts one Honey post on each attached platform and tells the Hive", () => {
    const posts = scheduleLookOnHoney({
      lookId: "boardroom",
      platforms: ["instagram", "linkedin"],
      date: "2026-09-25",
      time: "09:00",
    });
    expect(posts.map((post) => post.network)).toEqual(["Instagram", "LinkedIn"]);
    expect(posts.every((post) => post.kind === "post" && post.lookId === "boardroom")).toBe(true);
    const notes = JSON.parse(store.get("la_hive_room_v1") ?? "[]") as { text: string }[];
    expect(notes[0]?.text).toContain("The boardroom look");
    const alerts = JSON.parse(store.get("la_hive_alerts_v1") ?? "[]") as { text: string }[];
    expect(alerts[0]?.text).toContain("Honey");
  });

  it("keeps an attached account when another is added", () => {
    attachAccount({ platform: "instagram", handle: "@maya" });
    attachAccount({ platform: "linkedin", handle: "maya-cole" });
    expect(
      loadAccounts()
        .map((account) => account.platform)
        .sort(),
    ).toEqual(["instagram", "linkedin"]);
  });

  it("posts on its own once the hour has passed", () => {
    saveAutonomous(true);
    scheduleLookOnHoney({
      lookId: "evening",
      platforms: ["tiktok"],
      date: "2026-09-25",
      time: "07:00",
    });
    const sent = runAutonomousPosts(new Date("2026-09-25T07:30:00"));
    expect(sent).toEqual(["TikTok"]);
  });
});
