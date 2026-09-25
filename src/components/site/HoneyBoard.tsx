import { useEffect, useMemo, useState, type FormEvent } from "react";
import { SocialMarks, type SocialId } from "@/components/site/SocialMarks";
import { runAutonomousPosts } from "@/lib/house";
import {
  HONEY_NETWORKS,
  honeyIcon,
  loadHoney,
  postHasHit,
  saveHoney,
  type HoneyItem,
  type HoneyKind,
} from "@/lib/honey";

function todayStamp(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function HoneyBoard() {
  const [now, setNow] = useState<Date | null>(null);
  const [items, setItems] = useState<HoneyItem[]>([]);
  const [day, setDay] = useState("");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [kind, setKind] = useState<HoneyKind>("event");
  const [network, setNetwork] = useState<(typeof HONEY_NETWORKS)[number]>("Instagram");

  useEffect(() => {
    const clock = new Date();
    const stamp = todayStamp(clock);
    setNow(clock);
    setDay(stamp);
    runAutonomousPosts(clock);
    setItems(loadHoney(stamp));
  }, []);

  const days = useMemo(() => {
    if (!day) return [];
    const start = new Date(`${day}T12:00:00`);
    const monday = new Date(start);
    const offset = (start.getDay() + 6) % 7;
    monday.setDate(start.getDate() - offset);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return todayStamp(date);
    });
  }, [day]);

  function add(event: FormEvent) {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle || !day) return;
    const next: HoneyItem = {
      id: crypto.randomUUID(),
      title: nextTitle,
      date: day,
      time,
      kind,
      network: kind === "post" ? network : null,
    };
    const nextItems = [...items, next].sort((a, b) =>
      `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
    );
    setItems(nextItems);
    saveHoney(nextItems);
    setTitle("");
  }

  const visible = items.filter((item) => item.date === day);

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {days.map((stamp) => (
          <button
            key={stamp}
            type="button"
            onClick={() => setDay(stamp)}
            className={`rounded-2xl px-3 py-3 text-left text-sm ${stamp === day ? "bg-black text-white" : "glass text-black"}`}
          >
            {new Date(`${stamp}T12:00:00`).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </button>
        ))}
      </div>
      <div>
        <ul className="space-y-3">
          {visible.map((item) => {
            const hit = now ? postHasHit(item, now) : false;
            const icon = honeyIcon(item.network);
            return (
              <li key={item.id} className="glass rounded-[1.4rem] px-4 py-4 text-black">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[0.62rem] tracking-[0.18em] uppercase text-[#b8860b]">
                    {item.time} · {item.kind}
                    {item.posted ? " · Posted" : hit ? " · Hit" : ""}
                  </p>
                  {icon ? <SocialMarks ids={[icon as SocialId]} /> : null}
                </div>
                <p className="mt-1 font-display text-2xl">{item.title}</p>
                {item.caption ? (
                  <p className="mt-1 text-sm leading-relaxed">{item.caption}</p>
                ) : null}
              </li>
            );
          })}
          {visible.length === 0 && (
            <li className="glass rounded-[1.4rem] px-4 py-6 text-sm">Nothing on this day yet.</li>
          )}
        </ul>
        <form onSubmit={add} className="glass mt-4 grid gap-3 rounded-[1.4rem] p-4 md:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Event, meeting, or post"
            aria-label="Title"
            className="rounded-xl border border-black/10 bg-white px-3 py-3 text-sm md:col-span-2"
          />
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            aria-label="Time"
            className="rounded-xl border border-black/10 bg-white px-3 py-3 text-sm"
          />
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as HoneyKind)}
            aria-label="Kind"
            className="rounded-xl border border-black/10 bg-white px-3 py-3 text-sm"
          >
            <option value="event">Event</option>
            <option value="meeting">Meeting</option>
            <option value="post">Social post</option>
          </select>
          {kind === "post" && (
            <select
              value={network}
              onChange={(event) =>
                setNetwork(event.target.value as (typeof HONEY_NETWORKS)[number])
              }
              aria-label="Network"
              className="rounded-xl border border-black/10 bg-white px-3 py-3 text-sm md:col-span-2"
            >
              {HONEY_NETWORKS.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          )}
          <button type="submit" className="glass-btn md:col-span-2">
            Add to the day
          </button>
        </form>
      </div>
    </div>
  );
}
