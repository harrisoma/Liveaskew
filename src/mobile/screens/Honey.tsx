import { useState } from "react";
import { CalendarPlus, Link2, Sparkles, Trash2 } from "lucide-react";
import { dayLabel, upcomingByDay, type HoneyItem, type HoneyKind } from "@/lib/honey";
import { NeoButton, NeoField, Screen, Segmented } from "../components/ui";
import type { GuideLook } from "../lib/storage";

const KIND_LABEL: Record<HoneyKind, string> = { event: "Event", meeting: "Meeting", post: "Post" };
const SOURCE_LABEL = { manual: "", google: "Google", apple: "iCloud", outlook: "Outlook" } as const;

export function HoneyScreen({
  items,
  today,
  looks,
  dressingId,
  feeds,
  importing,
  notice,
  onAdd,
  onDelete,
  onDressMe,
  onImport,
}: {
  items: HoneyItem[];
  today: string;
  looks: GuideLook[];
  dressingId: string | null;
  feeds: string[];
  importing: boolean;
  notice: string | null;
  onAdd: (input: { title: string; date: string; time: string | null; kind: HoneyKind }) => void;
  onDelete: (item: HoneyItem) => void;
  onDressMe: (item: HoneyItem) => void;
  onImport: (url: string) => void;
}) {
  const [view, setView] = useState<"days" | "add" | "connect">("days");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [kind, setKind] = useState<HoneyKind>("event");
  const [feedUrl, setFeedUrl] = useState("");
  const days = upcomingByDay(items, today, 45);
  const lookFor = (id: string | null) => looks.find((l) => l.id === id) ?? null;

  return (
    <Screen kicker="Honey" title="Your days">
      <Segmented
        label="Honey view"
        value={view}
        onChange={setView}
        options={[
          { id: "days", label: "Upcoming" },
          { id: "add", label: "Add" },
          { id: "connect", label: "Connect" },
        ]}
      />
      {notice && (
        <p className="mt-4 neo-inset px-3 py-2 text-sm" role="status">
          {notice}
        </p>
      )}

      {view === "days" && (
        <div className="mt-5 space-y-5">
          {days.length === 0 && (
            <div className="neo-inset px-4 py-8 text-sm leading-relaxed">
              Nothing on the calendar yet. Connect Google, iCloud, or Outlook to fill it in, or add
              the day yourself. Buzz posts land here too.
            </div>
          )}
          {days.map((day) => (
            <section key={day.date}>
              <p className="la-kicker">{dayLabel(day.date, today)}</p>
              <ul className="mt-2 space-y-3">
                {day.items.map((item) => {
                  const look = lookFor(item.lookId);
                  return (
                    <li key={item.id} className="neo-raised p-4 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="mt-1 opacity-70">
                            {[
                              item.time ?? "All day",
                              item.kind === "post" ? item.network : KIND_LABEL[item.kind],
                              SOURCE_LABEL[item.source],
                              item.kind === "post" ? item.postStatus : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="neo-icon-btn"
                          aria-label={`Remove ${item.title}`}
                          onClick={() => onDelete(item)}
                        >
                          <Trash2 size={16} aria-hidden />
                        </button>
                      </div>
                      {item.caption && <p className="mt-2 leading-relaxed">{item.caption}</p>}
                      {look ? (
                        <p className="mt-3 neo-inset px-3 py-2 leading-relaxed">
                          <span className="la-kicker">Bee dressed this</span>
                          <br />
                          {look.title} — {look.formula.join(", ")}
                        </p>
                      ) : item.beeNote ? (
                        <p className="mt-3 neo-inset px-3 py-2 leading-relaxed">{item.beeNote}</p>
                      ) : (
                        item.kind !== "post" && (
                          <NeoButton
                            className="mt-3"
                            disabled={dressingId !== null}
                            onClick={() => onDressMe(item)}
                          >
                            <Sparkles size={14} aria-hidden className="mr-1 inline" />
                            {dressingId === item.id ? "Bee is dressing you…" : "Dress me for this"}
                          </NeoButton>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {view === "add" && (
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !date) return;
            onAdd({ title: title.trim(), date, time: time || null, kind });
            setTitle("");
            setTime("");
            setView("days");
          }}
        >
          <NeoField
            placeholder="What's happening?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <NeoField
              type="date"
              aria-label="Date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
            />
            <NeoField
              type="time"
              aria-label="Time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <Segmented
            label="Kind"
            value={kind === "post" ? "event" : kind}
            onChange={(k) => setKind(k)}
            options={[
              { id: "event", label: "Event" },
              { id: "meeting", label: "Meeting" },
            ]}
          />
          <NeoButton type="submit" variant="ink" disabled={!title.trim()}>
            <CalendarPlus size={14} aria-hidden className="mr-1 inline" />
            Add to Honey
          </NeoButton>
        </form>
      )}

      {view === "connect" && (
        <div className="mt-5 space-y-4 text-sm leading-relaxed">
          <p>
            Paste your calendar's private iCal link and Honey fills in the next 60 days. Syncing
            again updates the same events.
          </p>
          <ul className="neo-inset space-y-2 px-4 py-3">
            <li>
              <strong>Google:</strong> Settings → your calendar → “Secret address in iCal format”.
            </li>
            <li>
              <strong>iPhone / iCloud:</strong> Calendar → ⓘ next to the calendar → Public Calendar
              → Share Link.
            </li>
            <li>
              <strong>Outlook:</strong> Settings → Calendar → Shared calendars → Publish → ICS.
            </li>
          </ul>
          <NeoField
            type="url"
            inputMode="url"
            placeholder="https://… or webcal://…"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
          />
          <NeoButton
            variant="ink"
            disabled={importing || !feedUrl.trim()}
            onClick={() => {
              onImport(feedUrl.trim());
              setFeedUrl("");
            }}
          >
            <Link2 size={14} aria-hidden className="mr-1 inline" />
            {importing ? "Reading your calendar…" : "Connect calendar"}
          </NeoButton>
          {feeds.length > 0 && (
            <div>
              <p className="la-kicker">Connected</p>
              <ul className="mt-2 space-y-2">
                {feeds.map((f) => (
                  <li
                    key={f}
                    className="neo-raised-sm flex items-center justify-between gap-2 px-3 py-2"
                  >
                    <span className="truncate">
                      {new URL(f.replace(/^webcal:/i, "https:")).hostname}
                    </span>
                    <button
                      type="button"
                      className="font-semibold"
                      disabled={importing}
                      onClick={() => onImport(f)}
                    >
                      Sync
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}
