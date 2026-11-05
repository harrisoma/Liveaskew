import type { HoneyItem } from "@/lib/honey";
const escape = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
export function reminderFile(item: HoneyItem, minutes: number, outfit?: string): string {
  if (![15, 60, 1440].includes(minutes)) throw new Error("invalid_reminder");
  const date = item.date.replaceAll("-", "");
  const start = item.time
    ? `DTSTART:${date}T${item.time.replace(":", "")}00`
    : `DTSTART;VALUE=DATE:${date}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LiveAskew//Honey//EN",
    "BEGIN:VEVENT",
    `UID:${escape(item.id)}@liveaskew.com`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "")}`,
    start,
    `SUMMARY:${escape(item.title)}`,
    `LOCATION:${escape(item.location ?? "")}`,
    `DESCRIPTION:${escape([outfit ? `Your outfit: ${outfit}` : "Open Honey to choose your outfit.", item.dressCode ? `Dress code: ${item.dressCode}` : "", "https://www.liveaskew.com/app"].filter(Boolean).join("\n"))}`,
    "BEGIN:VALARM",
    `TRIGGER:-PT${minutes}M`,
    "ACTION:DISPLAY",
    `DESCRIPTION:${escape(item.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // RFC 5545 line folding uses UTF-8 octets, not JS character count.
  return (
    lines
      .map((line) => {
        let folded = "",
          width = 0;
        for (const char of line) {
          const bytes = new TextEncoder().encode(char).length;
          if (width + bytes > 73) {
            folded += "\r\n ";
            width = 1;
          }
          folded += char;
          width += bytes;
        }
        return folded;
      })
      .join("\r\n") + "\r\n"
  );
}
