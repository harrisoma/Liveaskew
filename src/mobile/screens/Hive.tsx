import { NeoButton, Screen } from "../components/ui";
import type { GuideLook } from "../lib/storage";

/** Hive rooms move in next (Stage 2). Until then, the look conversation happens with Bee. */
export function HiveScreen({
  looks,
  onDiscuss,
}: {
  looks: GuideLook[];
  onDiscuss: (look: GuideLook) => void;
}) {
  const saved = looks.filter((l) => l.saved);
  return (
    <Screen kicker="The Hive" title="Talk about your looks">
      <div className="neo-inset px-4 py-4 text-sm leading-relaxed">
        The Hive is where members talk through their looks together. Rooms open in the next update.
        For now, start the conversation with Bee on any saved look.
      </div>
      <ul className="mt-5 space-y-3">
        {saved.map((l) => (
          <li key={l.id} className="neo-raised p-4 text-sm">
            <p className="font-semibold">{l.title}</p>
            <p className="mt-1 opacity-70">{l.formula.slice(0, 3).join(", ")}</p>
            <NeoButton className="mt-3" onClick={() => onDiscuss(l)}>
              Talk it through
            </NeoButton>
          </li>
        ))}
      </ul>
      {saved.length === 0 && (
        <p className="mt-5 text-sm opacity-70">Save a look in Bee to bring it here.</p>
      )}
    </Screen>
  );
}
