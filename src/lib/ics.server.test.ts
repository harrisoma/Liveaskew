import { describe, expect, it } from "vitest";
import { expandCalendar } from "./ics.server";
const feed = (events: string) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${events}\r\nEND:VCALENDAR`;
const event = (fields: string) => `BEGIN:VEVENT\r\n${fields}\r\nEND:VEVENT`;
describe("calendar recurrence import", () => {
  it("expands weekly events across DST in the member timezone", async () => {
    const rows = await expandCalendar(
      feed(
        event(
          "UID:weekly\r\nDTSTART;TZID=America/New_York:20261026T090000\r\nRRULE:FREQ=WEEKLY;COUNT=3\r\nSUMMARY:Work",
        ),
      ),
      "2026-10-25",
      "2026-11-15",
      "America/New_York",
    );
    expect(rows.map((r) => [r.date, r.time])).toEqual([
      ["2026-10-26", "09:00"],
      ["2026-11-02", "09:00"],
      ["2026-11-09", "09:00"],
    ]);
    expect(new Set(rows.map((r) => r.uid)).size).toBe(3);
  });
  it("respects exclusions and cancelled series", async () => {
    const rows = await expandCalendar(
      feed(
        event(
          "UID:weekly\r\nDTSTART:20261102T140000Z\r\nRRULE:FREQ=WEEKLY;COUNT=3\r\nEXDATE:20261109T140000Z\r\nSUMMARY:Work",
        ) +
          "\r\n" +
          event("UID:gone\r\nDTSTART:20261103T140000Z\r\nSTATUS:CANCELLED"),
      ),
      "2026-11-01",
      "2026-11-30",
      "America/New_York",
    );
    expect(rows.map((r) => r.date)).toEqual(["2026-11-02", "2026-11-16"]);
  });
  it("keeps all-day dates and converts UTC events", async () => {
    const rows = await expandCalendar(
      feed(
        event("UID:day\r\nDTSTART;VALUE=DATE:20261105\r\nSUMMARY:Holiday") +
          "\r\n" +
          event("UID:utc\r\nDTSTART:20261106T020000Z\r\nSUMMARY:Dinner"),
      ),
      "2026-11-01",
      "2026-11-30",
      "America/Los_Angeles",
    );
    expect(rows.map((r) => [r.date, r.time])).toEqual([
      ["2026-11-05", null],
      ["2026-11-05", "18:00"],
    ]);
  });
  it("moves edited instances without duplicating them", async () => {
    const rows = await expandCalendar(
      feed(
        event(
          "UID:weekly\r\nDTSTART:20261102T140000Z\r\nRRULE:FREQ=WEEKLY;COUNT=2\r\nSUMMARY:Work",
        ) +
          "\r\n" +
          event(
            "UID:weekly\r\nRECURRENCE-ID:20261109T140000Z\r\nDTSTART:20261110T160000Z\r\nSUMMARY:Moved",
          ),
      ),
      "2026-11-01",
      "2026-11-30",
      "America/New_York",
    );
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.title === "Moved")).toMatchObject({
      date: "2026-11-10",
      time: "11:00",
    });
  });
  it("refuses high frequency feeds rather than silently truncating", async () => {
    await expect(
      expandCalendar(
        feed(event("UID:x\r\nDTSTART:20261101T000000Z\r\nRRULE:FREQ=MINUTELY")),
        "2026-11-01",
        "2026-11-30",
        "UTC",
      ),
    ).rejects.toThrow();
  });
});
