import { useState } from "react";
import { ArrowUpRight, CalendarDays, Check, Shirt } from "lucide-react";

const EVENTS = [
  {
    time: "8:00",
    title: "School run",
    occasion: "A comfortable start",
    look: "Soft knit. Easy trousers. Your favourite trainers.",
    why: "Comfort for the walk, with a light layer for a cooler morning.",
    colors: ["#efe5d4", "#454b43", "#fafafa"],
  },
  {
    time: "10:00",
    title: "Board meeting",
    occasion: "A little more polished",
    look: "Tailored trousers. Burgundy knit. Gold accents.",
    why: "Keep the comfortable base. Add a structured jacket for the meeting.",
    colors: ["#672937", "#686464", "#c9a45b"],
  },
  {
    time: "19:00",
    title: "Dinner with friends",
    occasion: "An easy evening switch",
    look: "The same trousers. A silk blouse. Statement earrings.",
    why: "A change of texture takes your daytime pieces into the evening.",
    colors: ["#e4d1b6", "#686464", "#c9a45b"],
  },
];

/** A self-contained sample, never a representation of a connected user's calendar. */
export function HoneyPreview() {
  const [selected, setSelected] = useState(1);
  const event = EVENTS[selected];
  return (
    <figure className="min-w-0 rounded-[1.6rem] border border-black/10 bg-white p-5 shadow-xl shadow-black/5 sm:p-7">
      <figcaption className="mb-6 flex items-center justify-between gap-3 border-b border-black/10 pb-4">
        <span className="flex items-center gap-2 font-semibold">
          <CalendarDays size={18} aria-hidden /> A day with Honey
        </span>
        <span className="text-xs text-black/60">Illustrative preview</span>
      </figcaption>
      <p className="mb-3 text-sm text-black/65">Pick an event. See how the outfit changes.</p>
      <div className="grid gap-2" aria-label="Example calendar events">
        {EVENTS.map((item, index) => (
          <button
            key={item.title}
            type="button"
            aria-pressed={selected === index}
            aria-controls="honey-example-look"
            onClick={() => setSelected(index)}
            className={`flex min-h-16 w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black ${selected === index ? "border-[#b88c37] bg-[#faf3e3]" : "border-black/10 bg-white hover:bg-black/5"}`}
          >
            <span className="w-10 shrink-0 text-sm tabular-nums text-black/60">{item.time}</span>
            <span className="flex-1 font-semibold">{item.title}</span>
            {selected === index ? (
              <Check size={18} aria-hidden />
            ) : (
              <ArrowUpRight size={18} aria-hidden className="text-black/40" />
            )}
          </button>
        ))}
      </div>
      <div
        id="honey-example-look"
        aria-live="polite"
        aria-atomic="true"
        className="mt-5 rounded-xl bg-[#171714] p-5 text-white"
      >
        <p className="flex items-center gap-2 text-sm text-[#e2b04a]">
          <Shirt size={18} aria-hidden /> {event.occasion}
        </p>
        <h3 className="mt-3 text-xl font-semibold leading-snug">{event.look}</h3>
        <div className="my-4 flex gap-2" aria-hidden>
          {event.colors.map((color, i) => (
            <span
              key={i}
              className="h-7 w-7 rounded-full border border-white/30"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <p className="text-sm leading-relaxed text-white/75">{event.why}</p>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-black/55">
        Sample events and styling ideas. Your recommendations are tailored in Bee.
      </p>
    </figure>
  );
}
