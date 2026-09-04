import type { ReactNode } from "react";
import type { GuideLook, WardrobeItem } from "../lib/storage";
import { NeoButton, Skeleton } from "./ui";

export function LookCard({
  look,
  actionLabel,
  onAction,
  rendering,
  footer,
}: {
  look: GuideLook;
  actionLabel?: string;
  onAction?: () => void;
  rendering?: boolean;
  footer?: ReactNode;
}) {
  return (
    <article className="neo-raised p-4">
      {rendering ? (
        <Skeleton className="mb-3 h-56 w-full" />
      ) : look.tryOnUrl ? (
        <img
          src={look.tryOnUrl}
          alt={`${look.title} on you — unaltered proportions`}
          className="mb-3 h-56 w-full rounded-[16px] object-cover"
          loading="lazy"
        />
      ) : (
        <div className="mb-3 flex h-28 items-end gap-2 rounded-[16px] neo-inset p-3" aria-hidden>
          {look.palette.map((c) => (
            <span key={c} className="h-10 flex-1 rounded-[8px]" style={{ background: c }} />
          ))}
        </div>
      )}
      <p className="la-kicker">{look.occasion}</p>
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

export function WardrobeCard({ item }: { item: WardrobeItem }) {
  const tone =
    item.verdict === "keep"
      ? "Keep"
      : item.verdict === "toss"
        ? "Toss"
        : item.verdict === "maybe"
          ? "Maybe"
          : "Reading";
  return (
    <article className="neo-raised p-4">
      <img
        src={item.photo}
        alt={item.label}
        className="mb-3 h-40 w-full rounded-[16px] object-cover"
        loading="lazy"
      />
      <p className="la-kicker">{tone}</p>
      <h2 className="la-display mt-1 text-xl font-semibold">{item.label}</h2>
      {item.reason ? (
        <p className="mt-2 text-sm leading-relaxed">{item.reason}</p>
      ) : (
        <Skeleton className="mt-3 h-12" />
      )}
    </article>
  );
}
