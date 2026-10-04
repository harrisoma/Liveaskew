import { useState } from "react";
import { ArrowUpRight, CalendarDays, Check, Shirt } from "lucide-react";

import morningLook from "@/assets/site/sample-morning-look.jpg";
import workLook from "@/assets/site/sample-work-look.jpg";
import eveningLook from "@/assets/site/sample-evening-look.jpg";

const EVENTS = [
  {
    time: "8:00",
    title: "A morning out",
    occasion: "A comfortable start",
    look: "A breezy dress. Flat sandals. A favourite bag.",
    why: "Miami ease: light fabrics and comfortable shoes for a relaxed start.",
    image: morningLook,
    alt: "Coral midi dress with tan flat sandals and a woven bag",
  },
  {
    time: "10:00",
    title: "Board meeting",
    occasion: "A little more polished",
    look: "A crisp shirt. A navy skirt. Tan loafers.",
    why: "New York and Milan inspiration, adapted to your fit and personal style.",
    image: workLook,
    alt: "Ivory shirt with a navy midi skirt, tan loafers and tan bag",
  },
  {
    time: "19:00",
    title: "Dinner with friends",
    occasion: "An easy evening switch",
    look: "A black midi dress. Gold accents. Low heels.",
    why: "A little Paris inspiration, with the freedom to dress it your way.",
    image: eveningLook,
    alt: "Black midi dress with gold earrings, black low heels and a small gold clutch",
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
        <img
          src={event.image}
          alt={event.alt}
          width="800"
          height="800"
          loading="lazy"
          className="my-4 aspect-square w-full rounded-xl bg-white object-contain"
        />
        <p className="text-sm leading-relaxed text-white/75">{event.why}</p>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-black/55">
        Sample events with AI-generated outfit imagery. Your recommendations are tailored in Bee.
      </p>
    </figure>
  );
}
