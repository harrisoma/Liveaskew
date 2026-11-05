import { expect, it } from "vitest";
import { reminderFile } from "./calendar-reminder";
import type { HoneyItem } from "@/lib/honey";
it("exports an escaped timed event with a user-selected alarm", () => {
  const item = {
    id: "one",
    title: "Dinner, friends\nMiami",
    date: "2026-11-05",
    time: "19:00",
  } as HoneyItem;
  const text = reminderFile(item, 60, "Silk dress");
  expect(text).toContain("DTSTART:20261105T190000");
  expect(text).toContain("TRIGGER:-PT60M");
  expect(text).toContain("Dinner\\, friends\\nMiami");
  expect(text).toContain("Your outfit: Silk dress");
});
it("rejects unsupported reminder timing", () =>
  expect(() => reminderFile({} as HoneyItem, -1)).toThrow());
