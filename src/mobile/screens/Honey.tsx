import { CalendarReminder } from "../components/CalendarReminder";
import type { CalendarPreferences, CalendarSettings } from "../lib/calendar-settings";
import { CalendarConnect } from "../components/CalendarConnect";
import { calendarDays, shiftCalendar } from "../lib/calendar-grid";
import { useEffect, useState } from "react";
import {
  CalendarPlus,
  Link2,
  Sparkles,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { dayLabel, upcomingByDay, type HoneyItem, type HoneyKind } from "@/lib/honey";
import { NeoButton, NeoField, Screen, Segmented } from "../components/ui";
import { lookPhoto, type GuideLook } from "../lib/storage";

const KIND_LABEL: Record<HoneyKind, string> = { event: "Event", meeting: "Meeting", post: "Post" };
const SOURCE_LABEL = { manual: "", google: "Google", apple: "iCloud", outlook: "Outlook" } as const;

export function HoneyScreen({
  items,
  today,
  looks,
  dressingId,
  feeds,
  calendarPreferences = {},
  onCalendarChange,
  onDisconnect,
  importing,
  notice,
  onAdd,
  onUpdate,
  onRange,
  onDelete,
  onDressMe,
  onImport,
}: {
  items: HoneyItem[];
  today: string;
  looks: GuideLook[];
  dressingId: string | null;
  feeds: string[];
  calendarPreferences?: CalendarPreferences;
  onCalendarChange?: (url: string, settings: CalendarSettings) => void;
  onDisconnect?: (url: string) => void;
  importing: boolean;
  notice: string | null;
  onAdd: (input: {
    location?: string;
    dressCode?: string;
    weatherNote?: string;
    title: string;
    date: string;
    time: string | null;
    kind: HoneyKind;
    lookId: string | null;
  }) => void;
  onUpdate: (item: HoneyItem) => void;
  onRange?: (from: string, to: string) => void;
  onDelete: (item: HoneyItem) => void;
  onDressMe: (item: HoneyItem) => void;
  onImport: (url: string) => Promise<boolean | void> | void;
}) {
  const [view, setView] = useState<"calendar" | "days" | "add" | "connect">("calendar");
  const [calendarMode, setCalendarMode] = useState<"month" | "week">("month");
  const [selectedDay, setSelectedDay] = useState(today);
  const [editing, setEditing] = useState<HoneyItem | null>(null);
  const [lookId, setLookId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [weatherNote, setWeatherNote] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [kind, setKind] = useState<HoneyKind>("event");
  const days =
    view === "calendar"
      ? [
          {
            date: selectedDay,
            items: items
              .filter((i) => i.date === selectedDay)
              .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")),
          },
        ]
      : upcomingByDay(items, today, 90);
  const gridDays = calendarDays(selectedDay, calendarMode);
  const rangeStart = gridDays[0],
    rangeEnd = gridDays[gridDays.length - 1];
  useEffect(() => {
    if (view === "calendar") onRange?.(rangeStart, rangeEnd);
  }, [view, rangeStart, rangeEnd, onRange]);
  const monthLabel = new Date(`${selectedDay}T12:00:00`).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  function startAdd() {
    setEditing(null);
    setTitle("");
    setLocation("");
    setDressCode("");
    setWeatherNote("");
    setDate(selectedDay);
    setTime("");
    setKind("event");
    setLookId("");
    setView("add");
  }
  function startEdit(item: HoneyItem) {
    setEditing(item);
    setTitle(item.title);
    setLocation(item.location ?? "");
    setDressCode(item.dressCode ?? "");
    setWeatherNote(item.weatherNote ?? "");
    setDate(item.date);
    setTime(item.time ?? "");
    setKind(item.kind);
    setLookId(item.lookId ?? "");
    setView("add");
  }

  const lookFor = (id: string | null) => looks.find((l) => l.id === id) ?? null;

  return (
    <Screen kicker="Honey" title={view === "connect" ? "Connect your calendar" : "Your days"}>
      {view === "connect" ? (
        <button
          type="button"
          className="la-text-action calendar-guide-back"
          onClick={() => setView("calendar")}
        >
          <ChevronLeft size={16} aria-hidden />
          Back to calendar
        </button>
      ) : (
        <div className="honey-actions">
          <NeoButton onClick={startAdd}>
            <CalendarPlus size={16} /> Add event
          </NeoButton>
          <NeoButton onClick={() => setView("connect")}>
            <Link2 size={16} /> Calendars
          </NeoButton>
        </div>
      )}
      {view !== "connect" && (
        <Segmented
          label="Honey view"
          value={view === "days" ? "agenda" : calendarMode}
          onChange={(mode) => {
            if (mode === "agenda") setView("days");
            else {
              setCalendarMode(mode);
              setView("calendar");
            }
          }}
          options={[
            { id: "month", label: "Month" },
            { id: "week", label: "Week" },
            { id: "agenda", label: "Agenda" },
          ]}
        />
      )}
      {view === "calendar" && (
        <div className="honey-calendar">
          <div className="honey-calendar-nav">
            <button
              className="neo-icon-btn"
              aria-label={`Previous ${calendarMode}`}
              onClick={() => setSelectedDay(shiftCalendar(selectedDay, -1, calendarMode))}
            >
              <ChevronLeft size={18} />
            </button>
            <h2 aria-live="polite">{monthLabel}</h2>
            <button
              className="neo-icon-btn"
              aria-label={`Next ${calendarMode}`}
              onClick={() => setSelectedDay(shiftCalendar(selectedDay, 1, calendarMode))}
            >
              <ChevronRight size={18} />
            </button>
            <button className="honey-today" onClick={() => setSelectedDay(today)}>
              Today
            </button>
          </div>
          <div className="honey-weekdays" aria-hidden="true">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="honey-date-grid" role="group" aria-label={`${calendarMode} dates`}>
            {gridDays.map((day) => {
              const count = items.filter((item) => item.date === day).length;
              return (
                <button
                  key={day}
                  aria-pressed={selectedDay === day}
                  aria-current={day === today ? "date" : undefined}
                  data-outside={day.slice(0, 7) !== selectedDay.slice(0, 7)}
                  aria-label={`${new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}, ${count} ${count === 1 ? "event" : "events"}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span>{Number(day.slice(-2))}</span>
                  {count > 0 && <i aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {notice && (
        <p className="mt-4 neo-inset px-3 py-2 text-sm" role="status">
          {notice}
        </p>
      )}

      {(view === "days" || view === "calendar") && (
        <div className="mt-5 space-y-5">
          {days.length === 0 && (
            <div className="neo-inset px-4 py-8 text-sm leading-relaxed">
              Your calendar's looking wide open! Connect Google, iCloud or Outlook to fill it in, or
              add the day yourself. Buzz posts land here too.
            </div>
          )}
          {days.map((day) => (
            <section key={day.date}>
              <h2 className="font-semibold">{dayLabel(day.date, today)}</h2>
              {day.items.length === 0 && (
                <div className="neo-inset p-4 mt-3 text-sm">
                  <p>No plans for this day.</p>
                  <NeoButton className="mt-3" onClick={startAdd}>
                    Plan something
                  </NeoButton>
                </div>
              )}
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
                          {(item.location || item.dressCode) && (
                            <p className="mt-2 opacity-70">
                              {[item.location, item.dressCode].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {item.source === "manual" && item.kind !== "post" && (
                            <button
                              className="neo-icon-btn"
                              aria-label={`Edit ${item.title}`}
                              onClick={() => startEdit(item)}
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          <button
                            className="neo-icon-btn"
                            aria-label={`Remove ${item.title}`}
                            onClick={() => setConfirmDelete(item.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      {confirmDelete === item.id && (
                        <div className="neo-inset p-3 mt-3">
                          <p>Remove this item from Honey?</p>
                          <div className="flex gap-3 mt-2">
                            <NeoButton
                              onClick={() => {
                                onDelete(item);
                                setConfirmDelete(null);
                              }}
                            >
                              Remove
                            </NeoButton>
                            <NeoButton onClick={() => setConfirmDelete(null)}>Cancel</NeoButton>
                          </div>
                        </div>
                      )}
                      {item.source !== "manual" && (
                        <p className="text-xs mt-2 la-secondary">
                          Imported event. Edit its details in the source calendar, then sync.
                        </p>
                      )}
                      {item.caption && <p className="mt-2 leading-relaxed">{item.caption}</p>}
                      {look ? (
                        <div className="mt-3 neo-inset px-3 py-2 leading-relaxed">
                          {lookPhoto(look, null) && (
                            <img
                              src={lookPhoto(look, null)!}
                              alt={look.title}
                              className="honey-outfit"
                              loading="lazy"
                            />
                          )}
                          <span className="la-kicker">Bee dressed this</span>
                          <br />
                          {look.title} — {look.formula.join(", ")}
                        </div>
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
                      {item.kind !== "post" && (
                        <CalendarReminder
                          item={item}
                          outfit={look ? `${look.title}: ${look.formula.join(", ")}` : undefined}
                        />
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
            if (editing)
              onUpdate({
                ...editing,
                title: title.trim(),
                location,
                dressCode,
                weatherNote,
                date,
                time: time || null,
                kind,
                lookId: lookId || null,
                beeNote: lookId === editing.lookId ? editing.beeNote : null,
              });
            else
              onAdd({
                title: title.trim(),
                location,
                dressCode,
                weatherNote,
                date,
                time: time || null,
                kind,
                lookId: lookId || null,
              });
            setSelectedDay(date);
            setEditing(null);
            setTitle("");
            setLocation("");
            setDressCode("");
            setWeatherNote("");
            setTime("");
            setView("calendar");
          }}
        >
          <NeoField
            aria-label="Event title"
            maxLength={160}
            required
            placeholder="What's coming up?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <NeoField
              type="date"
              aria-label="Date"
              value={date}
              required
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
          <details className="calendar-manage">
            <summary>Help Bee dress you for the occasion</summary>
            <label>
              Location
              <NeoField
                maxLength={160}
                value={location}
                placeholder="Miami · rooftop dinner"
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>
            <label>
              Dress code
              <NeoField
                maxLength={160}
                value={dressCode}
                placeholder="Choose below or use your words"
                onChange={(e) => setDressCode(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {["Casual", "Smart casual", "Cocktail", "Black tie"].map((code) => (
                <button
                  type="button"
                  className="neo-btn"
                  aria-pressed={dressCode === code}
                  key={code}
                  onClick={() => setDressCode(code)}
                >
                  {code}
                </button>
              ))}
            </div>
            <label>
              Weather or comfort notes
              <NeoField
                maxLength={160}
                value={weatherNote}
                placeholder="Warm evening, outdoors, bring a light layer"
                onChange={(e) => setWeatherNote(e.target.value)}
              />
            </label>
            <p className="calendar-connect-note">
              Your notes guide Bee. This is not a live weather forecast.
            </p>
          </details>
          <label className="block text-sm">
            Outfit (optional)
            <select
              aria-label="Outfit (optional)"
              className="neo-input mt-2 w-full"
              value={lookId}
              onChange={(e) => setLookId(e.target.value)}
            >
              <option value="">Choose later with Bee</option>
              {looks.map((look) => (
                <option key={look.id} value={look.id}>
                  {look.title}
                </option>
              ))}
            </select>
          </label>
          <NeoButton type="submit" variant="ink" disabled={!title.trim() || !date}>
            <CalendarPlus size={14} aria-hidden className="mr-1 inline" />
            {editing ? "Save changes" : "Add to Honey"}
          </NeoButton>
          <NeoButton
            onClick={() => {
              setEditing(null);
              setView("calendar");
            }}
          >
            Cancel
          </NeoButton>
        </form>
      )}

      {view === "connect" && (
        <CalendarConnect
          feeds={feeds}
          preferences={calendarPreferences}
          onChange={onCalendarChange}
          onDisconnect={onDisconnect}
          importing={importing}
          onImport={onImport}
          onDone={() => setView("calendar")}
        />
      )}
    </Screen>
  );
}
