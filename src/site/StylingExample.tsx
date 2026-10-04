import { CalendarDays, Shirt } from "lucide-react";
import workLook from "@/assets/site/sample-work-look.jpg";

export function StylingExample() {
  return (
    <section
      className="mx-auto max-w-[1180px] px-5 pt-10 md:px-8"
      aria-labelledby="styling-example-title"
    >
      <div className="glass rounded-[2rem] p-6 md:p-8">
        <p className="kicker">Your wardrobe → Your occasion → Your outfit</p>
        <h3
          id="styling-example-title"
          className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl"
        >
          A new look. Starting with what you own.
        </h3>
        <ol className="styling-example-steps mt-6">
          <li className="rounded-2xl border border-black/10 bg-white/60 p-5">
            <p className="kicker">01 · Your wardrobe</p>
            <Shirt className="my-5 text-[#96722e]" size={30} aria-hidden />
            <h4 className="text-lg font-semibold">Start with familiar favourites.</h4>
            <p className="mt-3 text-sm leading-relaxed text-black/70">
              An ivory shirt. A navy skirt. Your tan loafers and everyday bag.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-black/70">
              Add the pieces you own to Bee.
            </p>
          </li>
          <li className="rounded-2xl border border-black/10 bg-white/60 p-5">
            <p className="kicker">02 · Your occasion</p>
            <CalendarDays className="my-5 text-[#96722e]" size={30} aria-hidden />
            <h4 className="text-lg font-semibold">Give Bee a little context.</h4>
            <p className="mt-3 text-sm leading-relaxed text-black/70">
              “A morning meeting. I want to feel polished, and I'll be walking there.”
            </p>
            <p className="mt-3 text-sm leading-relaxed text-black/70">
              Your plans, comfort and preferences shape the suggestion.
            </p>
          </li>
          <li className="overflow-hidden rounded-2xl border border-black/10 bg-white/60">
            <p className="kicker px-5 pt-5">03 · Your outfit</p>
            <img
              src={workLook}
              alt="Sample outfit: ivory shirt, navy midi skirt, tan loafers and tan bag"
              width="800"
              height="800"
              loading="lazy"
              className="mt-3 aspect-square w-full object-contain"
            />
            <p className="p-5 text-sm leading-relaxed text-black/70">
              Bring the pieces together: tuck the shirt, add your loafers, and you're ready.
            </p>
          </li>
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-black/55">
          Illustrative styling example with AI-generated outfit imagery. Your wardrobe and
          recommendations are personal to you.
        </p>
        <a href="/app" className="glass-btn mt-5">
          Find my first look
        </a>
      </div>
    </section>
  );
}
