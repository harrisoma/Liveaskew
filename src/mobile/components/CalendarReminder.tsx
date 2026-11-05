import { useState } from "react";
import type { HoneyItem } from "@/lib/honey";
import { reminderFile } from "../lib/calendar-reminder";
import { NeoButton } from "./ui";
export function CalendarReminder({ item, outfit }: { item: HoneyItem; outfit?: string }) {
  const [minutes, setMinutes] = useState(60);
  const [saved, setSaved] = useState(false);
  return (
    <details className="calendar-manage">
      <summary>Plan an outfit reminder</summary>
      <label>
        Remind me
        <select
          className="neo-input"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        >
          <option value={15}>15 minutes before</option>
          <option value={60}>1 hour before</option>
          <option value={1440}>1 day before</option>
        </select>
      </label>
      <p className="calendar-connect-note">
        Open the downloaded event in your calendar and save it to enable the alert. This creates a
        separate Honey event; later changes here won’t update that copy.{" "}
        {item.time ? "Uses the time shown in Honey." : "All-day alerts are relative to midnight."}
      </p>
      <NeoButton
        onClick={() => {
          const url = URL.createObjectURL(
            new Blob([reminderFile(item, minutes, outfit)], {
              type: "text/calendar;charset=utf-8",
            }),
          );
          const a = document.createElement("a");
          a.href = url;
          a.download = "honey-reminder.ics";
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          setSaved(true);
        }}
      >
        Add to my calendar
      </NeoButton>
      {saved && (
        <p role="status">
          Open honey-reminder.ics and confirm the event and alert in your calendar.
        </p>
      )}
    </details>
  );
}
