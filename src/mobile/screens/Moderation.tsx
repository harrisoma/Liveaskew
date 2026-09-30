import { useState } from "react";
import { NeoButton, Screen } from "../components/ui";
import { moderateMessage, type ModerationAction, type ModerationItem } from "../lib/moderation";

const REASON_LABEL: Record<string, string> = {
  body_shaming: "about someone's body",
  harassment: "harassment",
  spam: "spam",
  other: "other",
};

export function ModerationScreen({
  items,
  onBack,
  onChanged,
}: {
  items: ModerationItem[];
  onBack: () => void;
  onChanged: (id: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmBan, setConfirmBan] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const act = async (item: ModerationItem, action: ModerationAction) => {
    setBusy(item.id);
    setNotice(null);
    const ok = await moderateMessage(item.id, action);
    setBusy(null);
    setConfirmBan(null);
    if (!ok) {
      setNotice("That did not go through. Try again.");
      return;
    }
    setNotice(
      action === "keep"
        ? "Kept — the message is visible again."
        : action === "remove"
          ? "Removed."
          : `Removed, and ${item.author} can no longer post in the Hive.`,
    );
    onChanged(item.id);
  };

  return (
    <Screen
      kicker="Hive"
      title="Moderation"
      footer={
        <NeoButton onClick={onBack} variant="ink">
          Back to You
        </NeoButton>
      }
    >
      {notice && (
        <p className="mb-4 neo-inset px-3 py-2 text-sm" role="status">
          {notice}
        </p>
      )}
      {items.length === 0 ? (
        <div className="neo-inset px-4 py-8 text-sm">Nothing reported. The Hive is quiet.</div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="neo-raised p-4 text-sm">
              <p className="la-kicker">
                {item.author} · {item.roomId}
                {item.hidden ? " · hidden" : ""}
              </p>
              <p className="mt-2 whitespace-pre-wrap leading-relaxed">{item.body}</p>
              <p className="mt-2 opacity-70">
                {item.reports} report{item.reports === 1 ? "" : "s"}:{" "}
                {Object.entries(item.reasons)
                  .map(([r, n]) => `${REASON_LABEL[r] ?? r}${n > 1 ? ` ×${n}` : ""}`)
                  .join(", ")}
              </p>
              {confirmBan === item.id ? (
                <div className="mt-3 space-y-2">
                  <p>Remove this message and stop {item.author} posting in the Hive?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <NeoButton disabled={busy === item.id} onClick={() => act(item, "ban")}>
                      Yes, ban
                    </NeoButton>
                    <NeoButton onClick={() => setConfirmBan(null)}>Cancel</NeoButton>
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <NeoButton disabled={busy === item.id} onClick={() => act(item, "keep")}>
                    Keep
                  </NeoButton>
                  <NeoButton disabled={busy === item.id} onClick={() => act(item, "remove")}>
                    Remove
                  </NeoButton>
                  <NeoButton disabled={busy === item.id} onClick={() => setConfirmBan(item.id)}>
                    Ban
                  </NeoButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
