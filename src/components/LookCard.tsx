import { useState } from "react";
import { ArrowRight, ThumbsUp, ThumbsDown, Lock } from "lucide-react";
import { hasEntitlement } from "@/lib/plans";

export interface LookItem {
  name: string;
  brand: string;
  price?: string;
}

export interface LookCardProps {
  number: number;
  occasion: string;
  season: string;
  notes: string;
  items: LookItem[];
  imageUrl?: string | null;
  status: "queued" | "generating" | "done" | "error";
  onRetry?: () => void;
  // Feedback engine
  lookId?: string | null;
  tier?: string | null;
  styleMetadata?: Record<string, unknown>;
  onFeedback?: (args: {
    lookId: string | null;
    status: "approved" | "rejected";
    image_url: string | null;
    style_metadata: Record<string, unknown>;
  }) => Promise<void> | void;
}

export function LookCard({
  number,
  occasion,
  season,
  notes,
  items,
  imageUrl,
  status,
  onRetry,
  lookId = null,
  tier = null,
  styleMetadata = {},
  onFeedback,
}: LookCardProps) {
  const [reaction, setReaction] = useState<"approved" | "rejected" | null>(null);
  const [collapsing, setCollapsing] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [hidden, setHidden] = useState(false);

  const canFeedback = hasEntitlement(tier, "thumbsFeedback");

  async function handleVote(next: "approved" | "rejected") {
    if (!canFeedback) {
      setShowUpgrade(true);
      return;
    }
    if (reaction) return;
    setReaction(next);
    try {
      await onFeedback?.({
        lookId,
        status: next,
        image_url: imageUrl ?? null,
        style_metadata: {
          occasion,
          season,
          items: items.map((it) => ({ brand: it.brand, name: it.name })),
          ...styleMetadata,
        },
      });
    } catch (err) {
      console.error("feedback failed", err);
    }
    if (next === "rejected") {
      setCollapsing(true);
      setTimeout(() => setHidden(true), 600);
    }
  }

  if (hidden) {
    return (
      <div className="border border-dashed border-[var(--gold-soft)] bg-[var(--cream)] p-6 text-center">
        <p className="font-serif text-xs italic text-[var(--gold-deep)]">
          Bee is removing this style pattern from your aesthetic pipeline.
        </p>
      </div>
    );
  }

  return (
    <div
      className={[
        "border bg-white p-6 md:p-8 relative flex flex-col justify-between transition-all duration-500 group",
        reaction === "approved"
          ? "border-[var(--gold)] shadow-[0_0_42px_-6px_var(--gold)]"
          : "border-[var(--gold-soft)] hover:shadow-md",
        collapsing ? "opacity-0 scale-95" : "opacity-100 scale-100",
      ].join(" ")}
    >
      <div className="absolute top-6 right-6 font-mono text-[10px] tracking-widest text-neutral-300 border border-neutral-200 px-2 py-0.5">
        LOOK N° {String(number).padStart(2, "0")} // {season.toUpperCase()}
      </div>

      <div>
        <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold-deep)] font-medium block mb-3">
          {occasion}
        </span>

        <div className="aspect-[4/5] bg-[var(--cream)] border border-neutral-100 overflow-hidden relative mb-4 flex items-center justify-center">
          {status === "done" && imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={occasion}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="p-6 text-center space-y-3">
              {status === "generating" && (
                <div className="space-y-2">
                  <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs uppercase tracking-wider text-[var(--gold-deep)] animate-pulse">
                    Bee is illustrating...
                  </p>
                </div>
              )}
              {status === "queued" && (
                <p className="text-[11px] uppercase tracking-widest text-neutral-400 font-mono">
                  In Rendering Queue
                </p>
              )}
              {status === "error" && (
                <button
                  onClick={onRetry}
                  className="text-xs text-red-700 underline tracking-wider uppercase font-mono"
                >
                  Retry Generation
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feedback control bar */}
        <div className="flex items-center justify-between border-y border-[var(--gold-soft)]/60 py-2.5 mb-5">
          <span className="text-[9px] uppercase tracking-[0.25em] text-[var(--gold-deep)] font-mono">
            {reaction === "approved"
              ? "Saved to vault"
              : canFeedback
                ? "Bee's referendum"
                : "Premium — Bee's referendum"}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Approve look"
              onClick={() => handleVote("approved")}
              disabled={!!reaction}
              className={[
                "h-8 w-8 grid place-items-center border transition",
                reaction === "approved"
                  ? "border-[var(--gold)] bg-[var(--gold)]/15 text-[var(--gold-deep)]"
                  : "border-[var(--gold-soft)] text-[var(--ink)]/70 hover:border-[var(--gold)] hover:text-[var(--gold-deep)]",
                !canFeedback && "opacity-70",
              ].join(" ")}
            >
              {canFeedback ? <ThumbsUp className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
            </button>
            <button
              type="button"
              aria-label="Reject look"
              onClick={() => handleVote("rejected")}
              disabled={!!reaction}
              className={[
                "h-8 w-8 grid place-items-center border transition",
                "border-[var(--gold-soft)] text-[var(--ink)]/70 hover:border-[var(--ink)] hover:text-[var(--ink)]",
                !canFeedback && "opacity-70",
              ].join(" ")}
            >
              {canFeedback ? <ThumbsDown className="w-3.5 h-3.5" /> : <Lock className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {notes && (
          <div className="mb-6 relative pl-4 border-l-2 border-[var(--gold)]">
            <p className="text-sm text-[var(--ink)] font-serif italic leading-relaxed">
              "{notes}"
            </p>
          </div>
        )}

        {items.length > 0 && (
          <div className="border-t border-neutral-100 pt-4 mt-4">
            <h4 className="text-[11px] uppercase tracking-widest font-medium text-neutral-400 mb-3">
              Manifest Breakdown
            </h4>
            <ul className="space-y-2.5">
              {items.map((item, idx) => (
                <li key={idx} className="flex justify-between items-baseline text-xs text-neutral-700">
                  <span className="font-serif text-[var(--ink)] font-medium">{item.brand}</span>
                  <span className="flex-1 border-b border-dotted border-neutral-200 mx-2" />
                  <span className="text-neutral-500 font-light truncate max-w-[50%]">{item.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="pt-6 mt-6 border-t border-[var(--gold-soft)]/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-[10px] uppercase tracking-widest text-[var(--gold-deep)] font-mono">
          Shop This Manifest
        </span>
        <ArrowRight className="w-4 h-4 text-[var(--ink)] transform group-hover:translate-x-1 transition-transform" />
      </div>

      {showUpgrade && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[var(--ink)]/60 px-4"
          onClick={() => setShowUpgrade(false)}
        >
          <div
            className="max-w-md w-full bg-[var(--cream)] border border-[var(--gold-soft)] p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--gold-deep)] mb-3">
              The Flagship Experience
            </p>
            <h3 className="font-serif text-2xl text-[var(--ink)] mb-3">
              See yourself, modeled by Bee.
            </h3>
            <p className="text-sm text-[var(--ink)]/70 leading-relaxed mb-6">
              Selfie-AI rendering, the thumbs feedback loop, and a magazine that
              learns your taste are part of <em>The Premium</em>. Upgrade to step
              inside your own lookbook.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowUpgrade(false)}
                className="px-4 py-2 text-[10px] uppercase tracking-[0.22em] border border-[var(--ink)]/20 text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--cream)]"
              >
                Not now
              </button>
              <a
                href="/pricing"
                className="px-4 py-2 text-[10px] uppercase tracking-[0.22em] bg-[var(--gold-deep)] text-[var(--cream)] hover:bg-[var(--ink)]"
              >
                See Premium
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
