import { beforeEach, describe, expect, it } from "vitest";
import {
  attachAccount,
  ensureLookOfTheDay,
  handedWeek,
  weekDays,
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

describe("handed looks", () => {
  it("places Tuesday earlier in the week and marks Friday as the look of the day", () => {
    const week = handedWeek(new Date("2026-09-25T12:00:00"));
    expect(week.map((item) => item.id)).toEqual([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "boardroom",
    ]);
    expect(week.find((item) => item.id === "tuesday")?.date).toBe("2026-09-22");
    expect(week.find((item) => item.ofTheDay)?.title).toBe("The boardroom look");
  });

  it("already has the look of the day ready to post", () => {
    const today = new Date("2026-09-25T08:00:00");
    const items = ensureLookOfTheDay(today);
    const handed = items.filter(
      (item) => item.kind === "post" && item.date === "2026-09-25" && item.lookId === "boardroom",
    );
    expect(handed).toHaveLength(1);
    expect(handed[0]?.posted).toBeFalsy();
    const again = ensureLookOfTheDay(today);
    expect(
      again.filter((item) => item.kind === "post" && item.lookId === "boardroom"),
    ).toHaveLength(1);
    const notes = JSON.parse(store.get("la_hive_room_v1") ?? "[]") as { lookId: string }[];
    expect(notes.filter((note) => note.lookId === "boardroom")).toHaveLength(1);
  });

  it("lists every day of the week so a look can be reposted on any of them", () => {
    const days = weekDays(new Date("2026-09-25T12:00:00"));
    expect(days.map((day) => day.weekday)).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    expect(days[0]?.date).toBe("2026-09-21");
    expect(days[6]?.date).toBe("2026-09-27");
    expect(days.find((day) => day.today)?.weekday).toBe("Friday");
  });

  it("reposts a look on a chosen day of the week", () => {
    const posts = scheduleLookOnHoney({
      lookId: "tuesday",
      platforms: ["instagram"],
      date: "2026-09-23",
      time: "16:00",
    });
    expect(posts[0]).toMatchObject({
      title: "Tuesday column",
      date: "2026-09-23",
      lookId: "tuesday",
      posted: false,
    });
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
