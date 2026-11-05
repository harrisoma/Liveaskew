import { useState } from "react";
import { NeoButton, NeoField, Screen } from "../components/ui";
import { WardrobeCard } from "../components/LookCard";
import type { AppSnapshot } from "../lib/storage";

export function WardrobeReset({
  items,
  busy,
  error,
  onDecide,
  onUpload,
  onRetry,
  onRename,
  onStyle,
  onSync,
}: {
  onSync: () => void;
  onRetry: (item: AppSnapshot["wardrobe"][number]) => void;
  onRename: (id: string, label: string) => void;
  onStyle: () => void;
  items: AppSnapshot["wardrobe"];
  busy: boolean;
  error: string | null;
  onDecide: (id: string, verdict: "keep" | "toss" | "maybe") => void;
  onUpload: () => void;
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const kept = items.filter((item) => item.verdict === "keep" && !item.error);
  const visible = items.filter(
    (item) =>
      (filter === "all" ||
        (filter === "review" ? !item.verdict || Boolean(item.error) : item.verdict === filter)) &&
      item.label.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Screen
      kicker="Wardrobe Reset"
      title="Make room for what works"
      footer={
        <NeoButton variant="ink" onClick={onUpload} disabled={busy}>
          {busy ? "Working on your wardrobe…" : "Add clothes, shoes or accessories"}
        </NeoButton>
      }
    >
      <p className="mb-4 text-sm leading-relaxed">
        Add one item per photo: clothes, shoes, bags, jewellery or other accessories. Bee checks
        each one against your Fit, Feel and Fabric. Keep what serves you, set aside what doesn’t,
        and decide on the maybes after a try-on. “Let go” can mean donate, sell or set aside. Your
        photos and decisions save on this device. Use Sync wardrobe to back them up to your private
        account or restore them on another device. This device’s decisions win for matching pieces.
      </p>
      <NeoButton className="mb-4" disabled={busy} onClick={onSync}>
        Sync wardrobe
      </NeoButton>
      <div className="wardrobe-summary">
        <span>
          <strong>{items.length}</strong> pieces
        </span>
        <span>
          <strong>{kept.length}</strong> to keep
        </span>
        <span>
          <strong>{items.filter((i) => i.verdict === "maybe").length}</strong> to revisit
        </span>
      </div>
      <NeoButton className="mb-4" disabled={!kept.length || busy} onClick={onStyle}>
        Style my kept pieces
      </NeoButton>
      <NeoField
        aria-label="Search wardrobe"
        placeholder="Find a piece…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="wardrobe-filters" role="group" aria-label="Filter wardrobe">
        {[
          ["all", "All"],
          ["keep", "Keep"],
          ["maybe", "Maybe"],
          ["toss", "Let go"],
          ["review", "Needs review"],
        ].map(([id, label]) => (
          <button key={id} aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mb-4 text-sm">
          {error}
        </p>
      )}
      {busy && (
        <p role="status" className="mb-4 text-sm">
          Please wait while your wardrobe updates. Your saved pieces will stay here.
        </p>
      )}
      {items.length === 0 ? (
        <div className="neo-inset px-4 py-8 text-sm leading-relaxed">
          Nothing here yet. Start with the pieces you reach for most.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visible.length === 0 && (
            <p className="neo-inset p-4 text-sm">No pieces match. Try another filter or search.</p>
          )}
          {visible.map((item) => (
            <WardrobeCard
              key={item.id}
              item={item}
              onDecide={(verdict) => onDecide(item.id, verdict)}
              onRename={(label) => onRename(item.id, label)}
              onRetry={item.photo ? () => onRetry(item) : undefined}
              busy={busy}
            />
          ))}
        </div>
      )}
    </Screen>
  );
}
