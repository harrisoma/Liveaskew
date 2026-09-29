import type { HoneySource } from "./honey";

export type IcsEvent = { uid: string; title: string; date: string; time: string | null };

/** Calendar feeds we will fetch server-side. Anything else is refused (no open proxy). */
const FEED_HOSTS: { test: (host: string) => boolean; source: HoneySource }[] = [
  { test: (h) => h === "calendar.google.com", source: "google" },
  { test: (h) => h === "icloud.com" || h.endsWith(".icloud.com"), source: "apple" },
  {
    test: (h) =>
      h === "outlook.office365.com" || h === "outlook.live.com" || h === "outlook.office.com",
    source: "outlook",
  },
];

export function feedSource(raw: string): { url: string; source: HoneySource } | null {
  let url: URL;
  try {
    url = new URL(raw.trim().replace(/^webcal:\/\//i, "https://"));
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const match = FEED_HOSTS.find((h) => h.test(url.hostname.toLowerCase()));
  return match ? { url: url.toString(), source: match.source } : null;
}

function unfold(text: string): string[] {
  return text
    .replace(/\r\n[ \t]/g, "")
    .replace(/\n[ \t]/g, "")
    .split(/\r?\n/);
}

function unescape(value: string): string {
  return value
    .replace(/\\n/gi, " ")
    .replace(/\\([,;\\])/g, "$1")
    .trim();
}

/** DTSTART value → local date + time. UTC ("Z") times are shown in UTC. */
function parseStart(value: string): { date: string; time: string | null } | null {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
  if (!m) return null;
  return { date: `${m[1]}-${m[2]}-${m[3]}`, time: m[4] ? `${m[4]}:${m[5]}` : null };
}

/**
 * Minimal iCalendar reader: one row per VEVENT with SUMMARY, UID, DTSTART.
 * Recurring rules are not expanded — each series shows its first date.
 */
export function parseIcs(text: string, from: string, to: string, limit = 300): IcsEvent[] {
  const events: IcsEvent[] = [];
  let current: (Partial<IcsEvent> & { cancelled?: boolean }) | null = null;
  for (const line of unfold(text)) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (
        current?.uid &&
        current.date &&
        !current.cancelled &&
        current.date >= from &&
        current.date <= to
      ) {
        events.push({
          uid: current.uid,
          title: current.title || "Busy",
          date: current.date,
          time: current.time ?? null,
        });
        if (events.length >= limit) break;
      }
      current = null;
      continue;
    }
    if (!current) continue;
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const name = line.slice(0, colon).split(";")[0].toUpperCase();
    const value = line.slice(colon + 1);
    if (name === "UID") current.uid = value.trim();
    else if (name === "SUMMARY") current.title = unescape(value).slice(0, 160);
    else if (name === "STATUS" && value.trim().toUpperCase() === "CANCELLED")
      current.cancelled = true;
    else if (name === "DTSTART") {
      const start = parseStart(value.trim());
      if (start) {
        current.date = start.date;
        current.time = start.time;
      }
    }
  }
  return events;
}
