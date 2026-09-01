import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Plus, Sparkles, ThumbsDown, ThumbsUp, Trash2, X } from "lucide-react";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  generateEventOutfit,
  listCalendarEvents,
} from "@/lib/calendar.functions";
import { submitLookFeedback } from "@/lib/feedback.functions";
import { ActingProfileSwitcher, getActingProfileId } from "@/components/ActingProfileSwitcher";
import { BeeMark } from "@/components/BeeMark";
import { hasEntitlement, loadResolvedTier } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Event Calendar — LiveAskew" },
      { name: "description", content: "Plan upcoming events and let Bee style each one — head to toe." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CalendarPage,
});

type CalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  description: string | null;
  outfit_recommendation: string | null;
  recommendation_status: string;
  recommendation_error: string | null;
  created_at: string;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function CalendarPage() {
  const list = useServerFn(listCalendarEvents);
  const create = useServerFn(createCalendarEvent);
  const remove = useServerFn(deleteCalendarEvent);
  const generate = useServerFn(generateEventOutfit);

  const [tier, setTier] = useState<string | null>(null);
  const [tierLoading, setTierLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(toIsoDate(new Date()));
  const [formDesc, setFormDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const resolved = await loadResolvedTier();
      if (!active) return;
      setTier(resolved);
      setTierLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const allowed = hasEntitlement(tier, "calendar");

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    list()
      .then((res) => {
        if (!active) return;
        setEvents(res.events as CalendarEvent[]);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [list, allowed]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const arr = map.get(e.event_date) ?? [];
      arr.push(e);
      map.set(e.event_date, arr);
    }
    return map;
  }, [events]);

  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: { date: Date | null; iso: string | null }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ date: null, iso: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      cells.push({ date, iso: toIsoDate(date) });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, iso: null });
    return cells;
  }, [cursor]);

  const selectedEvent = events.find((e) => e.id === selectedId) ?? null;
  const todayIso = toIsoDate(new Date());

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const title = formTitle.trim();
    if (!title || saving) return;
    setFormError(null);
    setSaving(true);
    try {
      const { event } = await create({
        data: { title, event_date: formDate, description: formDesc.trim() || null },
      });
      const created = event as CalendarEvent;
      setEvents((prev) => [...prev, created].sort((a, b) => a.event_date.localeCompare(b.event_date)));
      setShowForm(false);
      setFormTitle("");
      setFormDesc("");
      setSelectedId(created.id);

      // Kick off Bee's outfit recommendation in the background.
      generate({ data: { id: created.id, acting_profile_id: getActingProfileId() } })
        .then(({ event: updated }) => {
          setEvents((prev) => prev.map((e) => (e.id === updated.id ? (updated as CalendarEvent) : e)));
        })
        .catch((err) => {
          console.error("Bee styling failed", err);
          setEvents((prev) =>
            prev.map((e) =>
              e.id === created.id
                ? { ...e, recommendation_status: "failed", recommendation_error: String(err?.message ?? err) }
                : e,
            ),
          );
        });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save event.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this event?")) return;
    try {
      await remove({ data: { id } });
      setEvents((prev) => prev.filter((e) => e.id !== id));
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRetry(id: string) {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, recommendation_status: "pending", recommendation_error: null } : e)),
    );
    try {
      const { event } = await generate({ data: { id, acting_profile_id: getActingProfileId() } });
      setEvents((prev) => prev.map((e) => (e.id === event.id ? (event as CalendarEvent) : e)));
    } catch (err) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, recommendation_status: "failed", recommendation_error: String((err as Error)?.message ?? err) }
            : e,
        ),
      );
    }
  }

  if (!tierLoading && !allowed) {
    return <CalendarUpgradeGate />;
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-ink/55 hover:text-gold-deep">
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <BeeMark className="h-5 w-5 text-gold-deep" />
          <span className="font-display text-base font-semibold">Calendar</span>
        </div>
        <div className="flex items-center gap-3">
          <ActingProfileSwitcher tier={tier} />
          <button
            onClick={() => {
              setShowForm(true);
              setFormDate(toIsoDate(new Date()));
            }}
            className="neu-raised inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-ink transition"
          >
            <Plus size={14} /> New Event
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
        <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">Section 02</p>
        <h1 className="font-display mt-3 text-4xl leading-tight md:text-5xl">
          Your season, one date at a time.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/70">
          Add what's ahead — galas, dinners, flights, quiet weekends. Bee dresses each one for you, head to toe,
          in your Fit, Feel & Fabric.
        </p>

        {/* Calendar grid */}
        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-2xl">
              {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                className="neu-raised grid h-9 w-9 place-items-center rounded-full text-ink/60 hover:text-ink"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => {
                  const d = new Date();
                  setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                }}
                className="neu-raised rounded-full px-4 py-2 text-sm font-medium text-ink/70 hover:text-ink"
              >
                Today
              </button>
              <button
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                className="neu-raised grid h-9 w-9 place-items-center rounded-full text-ink/60 hover:text-ink"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="neu-raised grid grid-cols-7 gap-px overflow-hidden rounded-[26px] p-px">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="bg-cream px-2 py-2.5 text-center text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink/45"
              >
                {w}
              </div>
            ))}
            {monthDays.map((cell, i) => {
              const dayEvents = cell.iso ? eventsByDate.get(cell.iso) ?? [] : [];
              const isToday = cell.iso === todayIso;
              return (
                <div
                  key={i}
                  className={`min-h-[110px] p-2 ${cell.date ? "bg-cream" : "bg-cream/40"}`}
                >
                  {cell.date && (
                    <>
                      <div
                        className={`mb-1 text-xs ${
                          isToday ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-deep text-ink" : "text-ink/60"
                        }`}
                      >
                        {cell.date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.map((e) => (
                          <button
                            key={e.id}
                            onClick={() => setSelectedId(e.id)}
                            className={`block w-full truncate rounded-full px-2.5 py-1 text-left text-[0.7rem] leading-tight transition ${
                              selectedId === e.id
                                ? "bg-gradient-to-br from-gold to-gold-deep text-ink"
                                : "neu-inset text-ink/70 hover:text-ink"
                            }`}
                            title={e.title}
                          >
                            {e.title}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Loading / empty */}
        {loading && (
          <div className="mt-8 flex items-center gap-2 text-sm text-ink/55">
            <Loader2 size={14} className="animate-spin" /> Loading your calendar…
          </div>
        )}

        {/* Selected event card */}
        {selectedEvent && (
          <EventCard
            event={selectedEvent}
            onClose={() => setSelectedId(null)}
            onDelete={() => handleDelete(selectedEvent.id)}
            onRetry={() => handleRetry(selectedEvent.id)}
          />
        )}

        {/* Upcoming list */}
        {!loading && events.length > 0 && (
          <section className="mt-12">
            <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-ink/45">Upcoming</p>
            <ul className="mt-4 space-y-2">
              {events
                .filter((e) => e.event_date >= todayIso)
                .slice(0, 8)
                .map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => setSelectedId(e.id)}
                      className="neu-raised grid w-full grid-cols-[100px_1fr_auto] items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition"
                    >
                      <span className="font-display text-sm text-gold-deep">
                        {new Date(e.event_date + "T00:00:00").toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="truncate text-sm text-ink">{e.title}</span>
                      <span className="text-xs font-medium text-ink/45">
                        {e.recommendation_status === "ready"
                          ? "Styled"
                          : e.recommendation_status === "failed"
                          ? "Retry"
                          : "Styling…"}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </div>

      {/* Add event modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
          <form
            onSubmit={handleSave}
            className="neu-raised w-full max-w-lg rounded-[26px] p-6 md:p-8"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">Add upcoming event</p>
                <h3 className="font-display mt-2 text-2xl">Tell Bee what's ahead.</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="neu-inset grid h-8 w-8 place-items-center rounded-full text-ink/40 hover:text-ink"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="neu-inset rounded-2xl px-4 py-3">
                <label className="block text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink/45">Event title</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Charity Gala"
                  maxLength={160}
                  required
                  className="mt-1 w-full bg-transparent text-sm focus:outline-none"
                />
              </div>

              <div className="neu-inset rounded-2xl px-4 py-3">
                <label className="block text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink/45">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="mt-1 w-full bg-transparent text-sm focus:outline-none"
                />
              </div>

              <div className="neu-inset rounded-2xl px-4 py-3">
                <label className="block text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink/45">Context</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Black-tie, October evening in Mayfair, seated dinner…"
                  className="mt-1 w-full resize-none bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            {formError && <p className="mt-4 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-center text-xs text-destructive">{formError}</p>}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full px-4 py-2.5 text-sm font-medium text-ink/60 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !formTitle.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-gold to-gold-deep px-5 py-2.5 text-sm font-semibold text-ink transition disabled:opacity-50"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Save & dress
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function EventCard({
  event,
  onClose,
  onDelete,
  onRetry,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onDelete: () => void;
  onRetry: () => void;
}) {
  const dateLabel = new Date(event.event_date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="neu-raised mt-10 rounded-[26px] p-6 md:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-ink/45">{dateLabel}</p>
          <h3 className="font-display mt-3 text-3xl leading-tight md:text-4xl">{event.title}</h3>
          {event.description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">{event.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="neu-inset grid h-9 w-9 place-items-center rounded-full text-ink/50 hover:text-destructive"
            aria-label="Delete event"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="neu-inset grid h-9 w-9 place-items-center rounded-full text-ink/50 hover:text-ink"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="mt-7">
        <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">Bee's recommendation</p>

        {event.recommendation_status === "pending" && (
          <div className="mt-4 flex items-center gap-3 text-sm text-ink/55">
            <Loader2 size={14} className="animate-spin" />
            Bee is dressing this one — a moment.
          </div>
        )}

        {event.recommendation_status === "failed" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-destructive">
              {event.recommendation_error ?? "Bee couldn't complete this recommendation."}
            </p>
            <button
              onClick={onRetry}
              className="neu-raised inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-ink"
            >
              <Sparkles size={12} /> Ask Bee again
            </button>
          </div>
        )}

        {event.recommendation_status === "ready" && event.outfit_recommendation && (
          <>
            <div className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink/85">
              {event.outfit_recommendation}
            </div>
            <EventFeedbackBar event={event} />
          </>
        )}
      </div>
    </section>
  );
}

function EventFeedbackBar({ event }: { event: CalendarEvent }) {
  const send = useServerFn(submitLookFeedback);
  const [reaction, setReaction] = useState<"approved" | "rejected" | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  async function vote(status: "approved" | "rejected") {
    if (reaction) return;
    setReaction(status);
    try {
      await send({
        data: {
          look_id: null,
          profile_id: getActingProfileId() ?? null,
          image_url: null,
          status,
          style_metadata: {
            source: "calendar_event",
            event_title: event.title,
            event_date: event.event_date,
            description: event.description,
            outfit: event.outfit_recommendation,
          },
        },
      });
    } catch (e) {
      console.error(e);
    }
    if (status === "rejected") setTimeout(() => setCollapsed(true), 500);
  }

  if (collapsed) {
    return (
      <p className="mt-6 text-xs italic text-gold-deep">
        Bee is removing this style pattern from your aesthetic pipeline.
      </p>
    );
  }

  return (
    <div
      className={[
        "mt-6 flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500",
        reaction === "approved" ? "bg-gold-soft/40" : "neu-inset",
      ].join(" ")}
    >
      <span className="text-sm font-medium text-ink/60">
        {reaction === "approved" ? "Saved to vault" : "Bee's referendum"}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => vote("approved")}
          disabled={!!reaction}
          aria-label="Approve"
          className={[
            "h-8 w-8 grid place-items-center rounded-full transition",
            reaction === "approved" ? "bg-gold-deep/15 text-gold-deep" : "text-ink/50 hover:text-gold-deep",
          ].join(" ")}
        >
          <ThumbsUp size={14} />
        </button>
        <button
          onClick={() => vote("rejected")}
          disabled={!!reaction}
          aria-label="Reject"
          className="h-8 w-8 grid place-items-center rounded-full text-ink/50 transition hover:text-ink"
        >
          <ThumbsDown size={14} />
        </button>
      </div>
    </div>
  );
}

function CalendarUpgradeGate() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-cream text-ink">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-ink/55 hover:text-gold-deep">
          <ArrowLeft size={14} />
          <span>Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <BeeMark className="h-5 w-5 text-gold-deep" />
          <span className="font-display text-base font-semibold">Calendar</span>
        </div>
        <span className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">Platinum Plus</span>
      </header>

      {/* Blurred faux-calendar background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 top-[72px] select-none opacity-50 blur-[10px]">
        <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
          <div className="h-8 w-64 bg-ink/10" />
          <div className="mt-6 h-12 w-96 bg-ink/15" />
          <div className="mt-10 grid grid-cols-7 gap-px rounded-[26px] bg-ink/10 overflow-hidden">
            {Array.from({ length: 42 }).map((_, i) => (
              <div key={i} className="h-24 bg-cream p-2">
                <div className="h-3 w-6 bg-ink/15" />
                {i % 5 === 0 && <div className="mt-2 h-4 w-full bg-gold-deep/40" />}
                {i % 7 === 3 && <div className="mt-2 h-4 w-3/4 bg-ink/15" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Foreground upgrade card */}
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center md:py-32">
        <div className="neu-raised w-full rounded-[30px] px-8 py-12 md:px-14 md:py-16">
          <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">Platinum Plus</p>
          <h1 className="font-display mt-5 text-3xl leading-tight md:text-5xl">
            Bee runs your style life.
          </h1>
          <p className="mt-7 text-base leading-relaxed text-ink/75 md:text-lg">
            Upgrade to <span className="text-ink">Platinum Plus</span> to unlock your proactive event
            calendar and travel planning tools — every gala, every flight, every quiet weekend,
            dressed head to toe.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-gold to-gold-deep px-6 py-3 text-sm font-semibold text-ink shadow-lg shadow-gold/30 transition hover:brightness-105"
            >
              See Platinum Plus
            </Link>
            <Link
              to="/dashboard"
              className="neu-raised inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-ink/70 transition hover:text-ink"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
