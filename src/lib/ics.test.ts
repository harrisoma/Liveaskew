import { describe, expect, it } from "vitest";
import { feedSource, parseIcs } from "./ics";

const ICS = [
  "BEGIN:VCALENDAR",
  "BEGIN:VEVENT",
  "UID:a1@google.com",
  "DTSTART;TZID=America/Chicago:20261002T183000",
  "SUMMARY:Dinner with Maya\\, downtown",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:b2",
  "DTSTART;VALUE=DATE:20261005",
  "SUMMARY:Board",
  " meeting",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:c3",
  "DTSTART:20261003T090000Z",
  "STATUS:CANCELLED",
  "SUMMARY:Gone",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "UID:old",
  "DTSTART:20250101T090000Z",
  "SUMMARY:Last year",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

describe("parseIcs", () => {
  it("reads timed, all-day, and folded events in range and skips cancelled ones", () => {
    expect(parseIcs(ICS, "2026-09-29", "2026-12-31")).toEqual([
      { uid: "a1@google.com", title: "Dinner with Maya, downtown", date: "2026-10-02", time: "18:30" },
      { uid: "b2", title: "Boardmeeting", date: "2026-10-05", time: null },
    ]);
  });
});

describe("feedSource", () => {
  it("accepts Google, iCloud, and Outlook feeds only", () => {
    expect(feedSource("https://calendar.google.com/calendar/ical/x/basic.ics")?.source).toBe("google");
    expect(feedSource("webcal://p52-caldav.icloud.com/published/2/abc")?.source).toBe("apple");
    expect(feedSource("https://outlook.office365.com/owa/calendar/x/calendar.ics")?.source).toBe(
      "outlook",
    );
    expect(feedSource("https://evil.example.com/cal.ics")).toBeNull();
    expect(feedSource("http://calendar.google.com/x.ics")).toBeNull();
    expect(feedSource("https://169.254.169.254/latest")).toBeNull();
  });
});
