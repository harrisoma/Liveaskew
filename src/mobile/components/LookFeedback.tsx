import { useState } from "react";
import type { LookFeedback as Feedback } from "@/lib/bee-context";
import { NeoButton, NeoField } from "./ui";
export function LookFeedback({
  value,
  onChange,
}: {
  value?: Feedback;
  onChange: (next: Feedback) => Promise<void>;
}) {
  const [note, setNote] = useState(value?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  async function save(choice: Feedback["choice"]) {
    setBusy(true);
    setStatus("");
    try {
      await onChange({ choice, note: note.trim(), updatedAt: new Date().toISOString() });
      setStatus("Saved. Bee will use this when styling you.");
    } catch {
      setStatus("Saved on this device. Account sync failed; try again when connected.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="look-feedback">
      <summary>Make Bee more you</summary>
      <p>Tell Bee what works. Your feedback shapes future suggestions.</p>
      <div className="wardrobe-filters" role="group" aria-label="Outfit feedback">
        {(
          [
            ["love", "Love this"],
            ["not_me", "Not my style"],
            ["budget", "Too expensive"],
          ] as const
        ).map(([choice, label]) => (
          <button
            type="button"
            key={choice}
            disabled={busy}
            aria-pressed={value?.choice === choice}
            onClick={() => void save(choice)}
          >
            {label}
          </button>
        ))}
      </div>
      <NeoField
        aria-label="Your outfit feedback"
        placeholder="Or tell Bee in your own words…"
        maxLength={300}
        disabled={busy}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <NeoButton
        disabled={busy || !note.trim()}
        onClick={() => void save("custom")}
        className="mt-3"
      >
        {busy ? "Saving…" : "Save my feedback"}
      </NeoButton>
      {status && <p role="status">{status}</p>}
    </details>
  );
}
