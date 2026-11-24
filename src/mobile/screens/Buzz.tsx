import { BuzzAccountPanel } from "./BuzzAccounts";
import { Sparkles, Bookmark } from "lucide-react";
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
  onOpenHoney,
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
  }) => boolean | Promise<boolean>;
  onPublishNow: (post: HoneyItem) => void;
  onOpenHoney?: () => void;
}) {
  const saved = looks.filter((l) => l.saved);
  const [lookId, setLookId] = useState<string | null>(saved[0]?.id ?? null);
  const [network, setNetwork] = useState<NetworkSpec>(NETWORKS[0]);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("09:00");
  const [caption, setCaption] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const look = saved.find((l) => l.id === lookId) ?? null;

  // A try-on render is the natural photo for a look.
  useEffect(() => {
    setPhoto(look?.tryOnUrl && look.tryOnUrl !== "self" ? look.tryOnUrl : null);
  }, [look?.id, look?.tryOnUrl]);

  async function submitPost(now: boolean) {
    if (!look || submitting) return;
    setSubmitting(true);
    setCaptionError(null);
    try {
      const saved = await onSchedule({
        look,
        network,
        date: now ? today : date,
        time,
        caption: caption.trim(),
        photo,
        now,
      });
      if (saved) {
        setCaption("");
        setLookId(null);
      }
    } catch {
      setCaptionError("Your post couldn’t save. Your caption is still here—please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const connected = new Map((accounts?.connections ?? []).map((c) => [c.network, c]));
  const isConnected = connected.has(network.id);
  const problem = look ? postProblem(network, caption, photo) : null;
  const chars = [...caption.trim()].length;
  const upcoming = sortHoney(posts).filter(
    (p) => p.date >= today || p.postStatus === "failed" || p.postStatus === "publishing",
  );

  return (
    <Screen
      title="A look worth sharing"
      detail={<span className="la-community-label">Buzz · Your personal publishing space</span>}
    >
      {notice && (
        <p className="mb-4 neo-inset px-3 py-2 text-sm" role="status">
          {notice}
        </p>
      )}

      <div className="la-buzz-intro">
        <p>
          From your Style Guide to your social feed. Choose a look, write with Bee, and make it
          yours before you share.
        </p>
        <span>Nothing posts without your approval.</span>
      </div>
      <details className="la-buzz-account-details" open={saved.length === 0 ? true : undefined}>
        <summary>
          Manage social accounts <span>{connected.size} connected</span>
        </summary>
        <BuzzAccountPanel accounts={accounts} onConnect={onConnect} onDisconnect={onDisconnect} />
      </details>

      {saved.length === 0 ? (
        <section className="la-buzz-empty">
          <Bookmark size={28} aria-hidden />
          <h2>Your next post starts with a look.</h2>
          <p>
            Save a look in Bee, then come here to pick a photo, create a caption, and choose when to
            share.
          </p>
          <span>Your saved looks will appear here.</span>
        </section>
      ) : (
        <div className="la-buzz-compose">
          <section className="la-buzz-look-picker">
            <h2>Choose a saved look</h2>
            <div className="grid grid-cols-1 gap-2">
              {saved.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  aria-pressed={l.id === lookId}
                  className="la-buzz-look-option"
                  onClick={() => setLookId(l.id)}
                >
                  {l.tryOnUrl && l.tryOnUrl !== "self" && <img src={l.tryOnUrl} alt="" />}
                  <span>
                    <strong>{l.title}</strong>
                    <small>{l.occasion}</small>
                  </span>
                </button>
              ))}
            </div>

            <p className="la-community-note">
              Choose a look from your Style Guide. Bee uses it as the starting point for your
              caption.
            </p>
          </section>
          <section className="la-buzz-editor">
            <h2>Make it yours</h2>
            <p className="la-kicker pt-2">Where and when</p>
            <p className="la-community-note">Scheduled posts appear on your Honey calendar.</p>
            <div className="flex flex-wrap gap-2">
              {NETWORKS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  aria-pressed={n.id === network.id}
                  onClick={() => setNetwork(n)}
                  className={`rounded-[12px] px-3 py-2 text-sm font-semibold ${n.id === network.id ? "neo-inset" : "neo-raised-sm"}`}
                >
                  <img
                    src={`/social/${n.id}.svg`}
                    alt=""
                    width="18"
                    height="18"
                    className="inline-block mr-2 align-middle"
                  />
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
              Your photo {network.requiresImage ? "(needed)" : "(optional)"}
            </p>
            {photo ? (
              <div className="relative">
                <img src={photo} alt="Photo for this post" className="la-buzz-post-photo" />
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

            <p className="la-kicker pt-2">Your caption</p>
            <p className="la-community-note">
              Bee draws on your style interview, Style Guide, and this look. Review and edit before
              posting.
            </p>
            <textarea
              aria-label="Post caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              placeholder="Write it yourself, or let Bee have a go."
              className="neo-input resize-none"
            />
            <p
              className={`text-right text-sm ${chars > network.maxChars ? "font-semibold" : "opacity-60"}`}
            >
              {chars} / {network.maxChars}
            </p>
            <NeoButton
              disabled={!look || writing || submitting}
              onClick={async () => {
                if (!look) return;
                setWriting(true);
                setCaptionError(null);
                try {
                  setCaption(await onCaption(look, network.label));
                } catch (error) {
                  setCaptionError(
                    error instanceof Error
                      ? error.message
                      : "Bee couldn’t write a caption. Please try again.",
                  );
                } finally {
                  setWriting(false);
                }
              }}
            >
              <Sparkles size={15} aria-hidden className="mr-2 inline" />
              {writing ? "Bee is writing…" : "Write with Bee"}
            </NeoButton>
            {captionError && (
              <p role="alert" className="text-sm">
                {captionError}
              </p>
            )}
            {problem && caption.trim() && <p className="text-sm">{problem}</p>}
            <div className="grid grid-cols-2 gap-2">
              <NeoButton
                variant="ink"
                disabled={submitting || writing || !look || !!problem || !date || !time}
                onClick={() => void submitPost(false)}
              >
                <Send size={14} aria-hidden className="mr-1 inline" />
                {submitting ? "Saving…" : "Schedule"}
              </NeoButton>
              <NeoButton
                variant="gold"
                disabled={submitting || writing || !look || !!problem || !isConnected}
                onClick={() => void submitPost(true)}
              >
                Post now
              </NeoButton>
            </div>
          </section>
        </div>
      )}

      {onOpenHoney && (
        <button className="la-buzz-calendar-link" onClick={onOpenHoney}>
          View Honey calendar
        </button>
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
                    {spec && (
                      <img
                        src={`/social/${spec.id}.svg`}
                        alt=""
                        width="18"
                        height="18"
                        className="inline-block mr-2 align-middle"
                      />
                    )}
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
