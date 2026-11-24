import { Home } from "lucide-react";
import { Crest, type CrestName } from "./Crest";
export type Tab = "today" | "bee" | "honey" | "buzz" | "hive" | "you";
export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; label: string; crest: CrestName | null }[] = [
    { id: "today", label: "Today", crest: null },
    { id: "bee", label: "Bee", crest: "bee" },
    { id: "honey", label: "Honey", crest: "honey" },
    { id: "buzz", label: "Buzz", crest: "buzz" },
    { id: "hive", label: "Hive", crest: "hive" },
  ];
  return (
    <nav aria-label="Main" className="la-tabbar grid grid-cols-5 px-2 pt-1.5">
      {items.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.id)}
            className="flex flex-col items-center gap-0.5 px-1 py-1 text-[0.66rem] font-medium"
          >
            {item.crest ? (
              <Crest name={item.crest} size={26} decorative />
            ) : (
              <Home size={26} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
            )}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
