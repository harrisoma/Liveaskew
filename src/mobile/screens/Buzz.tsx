import { useEffect, useState } from "react";
import { ExternalLink, ImagePlus, Send, X as Close } from "lucide-react";
import {
  NETWORKS,
  networkByLabel,
  postProblem,
  type NetworkId,
  type NetworkSpec,
} from "@/lib/buzz";
import { dayLabel, sortHoney, type HoneyItem, type HoneyNetwork } from "@/lib/honey";
import { NeoButton, NeoField, Screen } from "../components/ui";
import type { BuzzAccounts } from "../lib/buzz-client";
import type { GuideLook } from "../lib/storage";

const STATUS_LABEL = {
  scheduled: "Scheduled",
  publishing: "Posting…",
  posted: "Posted",
  failed: "Didn't post",
} as const;

export function BuzzScreen({
  looks,
  posts,
  today,
  accounts,
  notice,
  busyId,
  onConnect,
  onDisconnect,
  onPickPhoto,
  onCaption,
  onSchedule,
  onPublishNow,
}: {
  looks: GuideLook[];
  posts: HoneyItem[];
  today: string;
  /** null = not signed in / offline: Buzz can still plan posts on Honey. */
  accounts: BuzzAccounts | null;
  notice: string | null;
  busyId: string | null;
  onConnect: (network: NetworkId) => void;
  onDisconnect: (network: NetworkId) => void;
  onPickPhoto: () => Promise<string | null>;
  onCaption: (look: GuideLook, network: HoneyNetwork) => Promise<string>;
  onSchedule: (input: {
    look: GuideLook;
    network: NetworkSpec;
    date: string;
    time: string;
    caption: string;
    photo: string | null;
    now: boolean;
  }) => void;
  onPublishNow: (post: HoneyItem) => void;
}) {
  const saved = looks.filter((l) => l.saved);
  const [lookId, setLookId] = useState<string | null>(null);
  const [network, setNetwork] = useState<NetworkSpec>(NETWORKS[0]);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("09:00");
  const [caption, setCaption] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const look = saved.find((l) => l.id === lookId) ?? null;

  // A try-on render is the natural photo for a look.
  useEffect(() => {
    setPhoto(look?.tryOnUrl ?? null);
  }, [look?.id, look?.tryOnUrl]);

  const connected = new Map((accounts?.connections ?? []).map((c) => [c.network, c]));
  const isConnected = connected.has(network.id);
  const problem = look ? postProblem(network, caption, photo) : null;
  const chars = [...caption.trim()].length;
  const upcoming = sortHoney(posts).filter(
    (p) => p.date >= today || p.postStatus === "failed" || p.postStatus === "publishing",
  );

  return (
    <Screen kicker="Buzz" title="Share your looks">
      {notice && (
        <p className="mb-4 neo-inset px-3 py-2 text-sm" role="status">
          {notice}
        </p>
      )}

      <p className="la-kicker">Accounts</p>
      {accounts ? (
        <ul className="mt-2 space-y-2">
          {NETWORKS.map((n) => {
            const conn = connected.get(n.id);
            const available = accounts.available.includes(n.id);
            return (
              <li
                key={n.id}
                className="neo-raised-sm flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-semibold">{n.label}</span>
                  {conn && <span className="opacity-70"> · {conn.accountName || "connected"}</span>}
                </span>
                {conn ? (
                  <button
                    type="button"
                    className="font-semibold"
                    onClick={() => onDisconnect(n.id)}
                  >
                    Disconnect
                  </button>
                ) : available ? (
                  <button
                    type="button"
                    className="font-semibold text-[var(--gold)]"
                    onClick={() => onConnect(n.id)}
                  >
                    Connect
                  </button>
                ) : (
                  <span className="opacity-60">Coming soon</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 neo-inset px-3 py-2 text-sm leading-relaxed">
          Sign in to connect Instagram, Facebook, LinkedIn, X, and Threads. You can still plan posts
          — they wait on your Honey calendar.
        </p>
      )}

      {saved.length === 0 ? (
        <div className="mt-6 neo-inset px-4 py-8 text-sm leading-relaxed">
          Save a look in Bee first — Buzz shares the looks you keep.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
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
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                type="button"
                aria-pressed={n.id === network.id}
                onClick={() => setNetwork(n)}
                className={`rounded-[12px] px-3 py-2 text-sm font-semibold ${n.id === network.id ? "neo-inset" : "neo-raised-sm"}`}
              >
                {n.label}
              </button>
            ))}
          </div>
          {accounts && !isConnected && (
            <p className="text-sm opacity-80">
              {network.label} isn't connected — the post will wait on Honey until you connect it.
            </p>
          )}
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

          <p className="la-kicker pt-2">
            3 · Photo {network.requiresImage ? "(needed)" : "(optional)"}
          </p>
          {photo ? (
            <div className="relative">
              <img
                src={photo}
                alt="Photo for this post"
                className="h-48 w-full rounded-[16px] object-cover"
              />
              <button
                type="button"
                aria-label="Remove photo"
                className="neo-icon-btn absolute top-2 right-2"
                onClick={() => setPhoto(null)}
              >
                <Close size={16} aria-hidden />
              </button>
            </div>
          ) : (
            <NeoButton
              onClick={async () => {
                const picked = await onPickPhoto();
                if (picked) setPhoto(picked);
              }}
            >
              <ImagePlus size={14} aria-hidden className="mr-1 inline" />
              Add a photo
            </NeoButton>
          )}

          <p className="la-kicker pt-2">4 · Caption</p>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={4}
            placeholder="Write it yourself, or ask Bee."
            className="neo-input resize-none"
          />
          <p
            className={`text-right text-sm ${chars > network.maxChars ? "font-semibold" : "opacity-60"}`}
          >
            {chars} / {network.maxChars}
          </p>
          <NeoButton
            disabled={!look || writing}
            onClick={async () => {
              if (!look) return;
              setWriting(true);
              setCaption(await onCaption(look, network.label));
              setWriting(false);
            }}
          >
            {writing ? "Bee is writing…" : "Bee, write the caption"}
          </NeoButton>
          {problem && caption.trim() && <p className="text-sm">{problem}</p>}
          <div className="grid grid-cols-2 gap-2">
            <NeoButton
              variant="ink"
              disabled={!look || !!problem || !date || !time}
              onClick={() => {
                if (!look) return;
                onSchedule({
                  look,
                  network,
                  date,
                  time,
                  caption: caption.trim(),
                  photo,
                  now: false,
                });
                setCaption("");
                setLookId(null);
              }}
            >
              <Send size={14} aria-hidden className="mr-1 inline" />
              Schedule
            </NeoButton>
            <NeoButton
              variant="gold"
              disabled={!look || !!problem || !isConnected}
              onClick={() => {
                if (!look) return;
                onSchedule({
                  look,
                  network,
                  date: today,
                  time,
                  caption: caption.trim(),
                  photo,
                  now: true,
                });
                setCaption("");
                setLookId(null);
              }}
            >
              Post now
            </NeoButton>
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mt-6">
          <p className="la-kicker">Your posts</p>
          <ul className="mt-2 space-y-2">
            {upcoming.map((p) => {
              const spec = networkByLabel(p.network);
              const canRetry =
                (p.postStatus === "failed" || p.postStatus === "scheduled") &&
                !!spec &&
                connected.has(spec.id);
              return (
                <li key={p.id} className="neo-raised-sm px-3 py-2 text-sm">
                  <p>
                    <span className="font-semibold">{p.network}</span> · {dayLabel(p.date, today)}{" "}
                    {p.time} · {p.postStatus ? STATUS_LABEL[p.postStatus] : "Planned"}
                  </p>
                  {p.postError && <p className="mt-1 opacity-80">{p.postError}</p>}
                  {p.postUrl && (
                    <a
                      href={p.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 font-semibold"
                    >
                      View post <ExternalLink size={12} aria-hidden />
                    </a>
                  )}
                  {canRetry && (
                    <button
                      type="button"
                      className="mt-1 block font-semibold text-[var(--gold)]"
                      disabled={busyId === p.id}
                      onClick={() => onPublishNow(p)}
                    >
                      {busyId === p.id
                        ? "Posting…"
                        : p.postStatus === "failed"
                          ? "Retry now"
                          : "Post now instead"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Screen>
  );
}
