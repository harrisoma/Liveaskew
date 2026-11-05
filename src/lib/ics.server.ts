import ical from "node-ical";
import type { IcsEvent } from "./ics";

/** Reject unsupported high-frequency feeds rather than silently importing an incomplete series. */
export async function expandCalendar(
  text: string,
  from: string,
  to: string,
  timeZone: string,
): Promise<IcsEvent[]> {
  if (!text.trimEnd().endsWith("END:VCALENDAR")) throw new Error("incomplete_calendar");
  const components = text.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? [];
  if (
    (text.match(/BEGIN:VEVENT/g) ?? []).length !== components.length ||
    components.some(
      (e) => !/^UID:/m.test(e) || (!/^DTSTART[;:]/m.test(e) && !/^STATUS:CANCELLED/m.test(e)),
    )
  )
    throw new Error("incomplete_event");
  if (components.length > 10000 || /^RRULE:.*BY(SECOND|MINUTE|HOUR)=/im.test(text))
    throw new Error("unsupported_recurrence");
  if (/^RRULE:.*FREQ=(SECONDLY|MINUTELY|HOURLY)/im.test(text))
    throw new Error("unsupported_recurrence");
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const calendar = await ical.async.parseICS(text);
  const result: IcsEvent[] = [];
  // Pad the UTC query window to cover every local timezone, then filter by displayed date.
  const start = new Date(`${from}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 1);
  const end = new Date(`${to}T23:59:59Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  for (const event of Object.values(calendar)) {
    if (!event || event.type !== "VEVENT" || event.status === "CANCELLED") continue;
    for (const instance of ical.expandRecurringEvent(event, { from: start, to: end })) {
      if (instance.event.status === "CANCELLED") continue;
      const parts = formatter.formatToParts(instance.start);
      const part = (name: string) => parts.find((p) => p.type === name)?.value ?? "";
      const date = instance.isFullDay
        ? instance.start.toISOString().slice(0, 10)
        : `${part("year")}-${part("month")}-${part("day")}`;
      if (date < from || date > to) continue;
      const summary = instance.summary;
      result.push({
        uid: event.rrule
          ? `${event.uid}#${(instance.event.recurrenceid ?? instance.start).toISOString()}`
          : event.uid,
        title: (typeof summary === "string" ? summary : summary?.val || "Busy").slice(0, 160),
        date,
        time: instance.isFullDay ? null : `${part("hour")}:${part("minute")}`,
      });
      if (result.length > 300) throw new Error("too_many_events");
    }
  }
  return [...new Map(result.map((e) => [e.uid, e])).values()];
}
