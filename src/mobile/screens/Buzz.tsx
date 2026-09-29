import { useState } from "react";
import { Send } from "lucide-react";
import {
  HONEY_NETWORKS,
  dayLabel,
  sortHoney,
  type HoneyItem,
  type HoneyNetwork,
} from "@/lib/honey";
import { NeoButton, NeoField, Screen } from "../components/ui";
import type { GuideLook } from "../lib/storage";

export function BuzzScreen({
  looks,
  posts,
  today,
  onCaption,
  onSchedule,
}: {
  looks: GuideLook[];
  posts: HoneyItem[];
  today: string;
  onCaption: (look: GuideLook, network: HoneyNetwork) => Promise<string>;
  onSchedule: (input: {
    look: GuideLook;
    network: HoneyNetwork;
    date: string;
    time: string;
    caption: string;
  }) => void;
}) {
  const saved = looks.filter((l) => l.saved);
  const [lookId, setLookId] = useState<string | null>(null);
  const [network, setNetwork] = useState<HoneyNetwork>("Instagram");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("09:00");
  const [caption, setCaption] = useState("");
  const [writing, setWriting] = useState(false);
  const look = saved.find((l) => l.id === lookId) ?? null;
  const upcoming = sortHoney(posts).filter((p) => p.date >= today);

  return (
    <Screen kicker="Buzz" title="Share your looks">
      <p className="mb-4 text-sm leading-relaxed">
        Pick a saved look, let Bee write the caption, and set the day. Scheduled posts show on your
        Honey calendar. Direct posting switches on once your social accounts are connected.
      </p>

      {saved.length === 0 ? (
        <div className="neo-inset px-4 py-8 text-sm leading-relaxed">
          Save a look in Bee first — Buzz shares the looks you keep.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="la-kicker">1 · Look</p>
          <div className="grid grid-cols-1 gap-2">
            {saved.map((l) => (
              <button
                key={l.id}
                type="button"
                aria-pressed={l.id === lookId}
                className="neo-choice flex-col items-start"
                onClick={() => setLookId(l.id)}
              >
                <span className="font-semibold">{l.title}</span>
                <span className="text-sm font-normal opacity-70">
                  {l.formula.slice(0, 3).join(", ")}
                </span>
              </button>
            ))}
          </div>

          <p className="la-kicker pt-2">2 · Where and when</p>
          <div className="flex flex-wrap gap-2">
            {HONEY_NETWORKS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={n === network}
                onClick={() => setNetwork(n)}
                className={`rounded-[12px] px-3 py-2 text-sm font-semibold ${n === network ? "neo-inset" : "neo-raised-sm"}`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NeoField
              type="date"
              aria-label="Post date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
            />
            <NeoField
              type="time"
              aria-label="Post time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <p className="la-kicker pt-2">3 · Caption</p>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            maxLength={2200}
            placeholder="Write it yourself, or ask Bee."
            className="neo-input resize-none"
          />
          <NeoButton
            disabled={!look || writing}
            onClick={async () => {
              if (!look) return;
              setWriting(true);
              setCaption(await onCaption(look, network));
              setWriting(false);
            }}
          >
            {writing ? "Bee is writing…" : "Bee, write the caption"}
          </NeoButton>
          <NeoButton
            variant="ink"
            disabled={!look || !caption.trim() || !date || !time}
            onClick={() => {
              if (!look) return;
              onSchedule({ look, network, date, time, caption: caption.trim() });
              setCaption("");
              setLookId(null);
            }}
          >
            <Send size={14} aria-hidden className="mr-1 inline" />
            Schedule on Honey
          </NeoButton>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mt-6">
          <p className="la-kicker">Scheduled</p>
          <ul className="mt-2 space-y-2">
            {upcoming.map((p) => (
              <li key={p.id} className="neo-raised-sm px-3 py-2 text-sm">
                <span className="font-semibold">{p.network}</span> · {dayLabel(p.date, today)}{" "}
                {p.time} · {p.postStatus}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Screen>
  );
}
