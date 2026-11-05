import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { lookPhoto, type GuideLook, type WardrobeItem } from "../lib/storage";
import { NeoButton, Skeleton } from "./ui";

export function LookCard({
  look,
  actionLabel,
  onAction,
  rendering,
  footer,
  selfie = null,
}: {
  look: GuideLook;
  selfie?: string | null;
  actionLabel?: string;
  onAction?: () => void;
  rendering?: boolean;
  footer?: ReactNode;
}) {
  return (
    <article className="neo-raised p-4">
      {rendering ? (
        <Skeleton className="mb-3 h-56 w-full" />
      ) : lookPhoto(look, selfie) ? (
        <img
          src={lookPhoto(look, selfie) ?? undefined}
          alt={`${look.title} — AI outfit preview using your reference photo`}
          className="mb-3 h-56 w-full rounded-[16px] object-contain"
          loading="lazy"
        />
      ) : (
        <div className="mb-3 flex h-28 items-end gap-2 rounded-[16px] neo-inset p-3" aria-hidden>
          {look.palette.map((c) => (
            <span key={c} className="h-10 flex-1 rounded-[8px]" style={{ background: c }} />
          ))}
        </div>
      )}
      {rendering && (
        <p role="status" className="mb-3 text-sm">
          Creating your outfit preview…
        </p>
      )}
      {look.renderError && (
        <p role="alert" className="mb-3 text-sm">
          {look.renderError}
        </p>
      )}
      <p className="la-kicker">
        {look.guideDay ? `Day ${look.guideDay} · ` : ""}
        {look.occasion}
      </p>
      <h2 className="la-display mt-1 text-xl font-semibold">{look.title}</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {look.formula.map((piece) => (
          <li key={piece}>· {piece}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm leading-relaxed">
        <strong>Fit.</strong> {look.fit}
      </p>
      <p className="mt-2 text-sm leading-relaxed">
        <strong>Feel.</strong> {look.feel}
      </p>
      <p className="mt-2 text-sm leading-relaxed">
        <strong>Fabric.</strong> {look.fabric}
      </p>
      {actionLabel && onAction && (
        <NeoButton className="mt-4" variant={look.saved ? "raised" : "gold"} onClick={onAction}>
          {actionLabel}
        </NeoButton>
      )}
      {footer}
    </article>
  );
}

export function WardrobeCard({
  item,
  onDecide,
  onRename,
  onRetry,
  busy = false,
}: {
  onRename?: (label: string) => void;
  onRetry?: () => void;
  busy?: boolean;
  item: WardrobeItem;
  onDecide?: (verdict: "keep" | "toss" | "maybe") => void;
}) {
  const [name, setName] = useState(item.label);
  useEffect(() => setName(item.label), [item.label]);
  const tone = item.error
    ? "Could not read"
    : item.verdict === "keep"
      ? "Keep"
      : item.verdict === "toss"
        ? "Let go"
        : item.verdict === "maybe"
          ? "Maybe"
          : "Reading";
  return (
    <article className="neo-raised p-4">
      {item.photo ? (
        <img
          src={item.photo}
          alt={item.label}
          className="mb-3 h-40 w-full rounded-[16px] object-contain"
          loading="lazy"
        />
      ) : (
        <div className="mb-3 neo-inset px-4 py-6 text-sm opacity-70">
          Photo cleared to free space on this device.
        </div>
      )}
      <p className="la-kicker">{tone}</p>
      <h2 className="la-display mt-1 text-xl font-semibold">{item.label}</h2>
      {onDecide && (
        <div className="studio-decisions" aria-label={`Your decision for ${item.label}`}>
          {(["keep", "toss", "maybe"] as const).map((v) => (
            <button
              key={v}
              disabled={busy}
              aria-pressed={item.verdict === v}
              onClick={() => onDecide(v)}
            >
              {v === "toss" ? "Let go" : v === "keep" ? "Keep" : "Maybe"}
            </button>
          ))}
        </div>
      )}
      {onRename && (
        <details className="mt-3">
          <summary className="py-3 text-sm">Edit piece name</summary>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) onRename(name.trim());
            }}
          >
            <label className="text-sm">
              Piece name
              <input
                className="neo-input w-full my-2"
                maxLength={160}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <NeoButton type="submit" disabled={busy || !name.trim()}>
              Save name
            </NeoButton>
          </form>
        </details>
      )}
      {item.error && onRetry && (
        <NeoButton className="mt-3" disabled={busy} onClick={onRetry}>
          Retry review
        </NeoButton>
      )}
      {item.error ? (
        <p className="mt-2 text-sm leading-relaxed">{item.error}</p>
      ) : item.reason ? (
        <p className="mt-2 text-sm leading-relaxed">{item.reason}</p>
      ) : (
        <Skeleton className="mt-3 h-12" />
      )}
    </article>
  );
}
