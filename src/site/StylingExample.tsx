import { Shirt } from "lucide-react";
import workLook from "@/assets/site/sample-work-look.jpg";

export function StylingExample() {
  return (
    <section
      className="mx-auto max-w-[1180px] px-5 pt-10 md:px-8"
      aria-labelledby="styling-example-title"
    >
      <div className="glass rounded-[2rem] p-6 md:p-8">
        <p className="kicker">Your wardrobe + your preferences + your plans</p>
        <h3
          id="styling-example-title"
          className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl"
        >
          From “what do I wear?” to a look that feels like you.
        </h3>
        <p className="mt-3 max-w-2xl leading-relaxed text-black/70">
          A conversation with Bee brings it all together. Here is how styling works inside
          LiveAskew.
        </p>
        <ol className="styling-example-steps mt-6">
          <li className="rounded-2xl border border-black/10 bg-white/60 p-5">
            <p className="kicker">01 · Share your wardrobe</p>
            <Shirt className="my-5 text-[#96722e]" size={30} aria-hidden />
            <h4 className="text-lg font-semibold">Start with what you own.</h4>
            <p className="mt-3 text-sm leading-relaxed text-black/70">
              Add your pieces and share your fit, fabric, and style preferences. Bee starts with
              you.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Example wardrobe pieces">
              {["Ivory shirt", "Navy skirt", "Tan loafers", "Everyday bag"].map((piece) => (
                <li
                  key={piece}
                  className="rounded-full border border-black/10 bg-white/80 px-3 py-2 text-sm"
                >
                  {piece}
                </li>
              ))}
            </ul>
          </li>
          <li className="rounded-2xl border border-black/10 bg-white/60 p-5">
            <p className="kicker">02 · Tell Bee your plans</p>
            <h4 className="mt-5 text-lg font-semibold">Dress for your actual day.</h4>
            <p className="mt-3 text-sm leading-relaxed text-black/70">
              Tell her where you are going and how you want to feel. Comfort counts, too.
            </p>
            <div className="mt-5 rounded-2xl rounded-br-sm border border-[#96722e]/20 bg-[#96722e]/10 p-4">
              <p className="text-xs font-semibold text-[#78591e]">You</p>
              <p className="mt-2 text-sm leading-relaxed">
                “A morning meeting. I want to feel polished, and I will be walking there.”
              </p>
            </div>
          </li>
          <li className="overflow-hidden rounded-2xl border border-black/10 bg-white/60 p-5">
            <p className="kicker">03 · Make it yours</p>
            <h4 className="mt-5 text-lg font-semibold">Find a look. Refine it together.</h4>
            <img
              src={workLook}
              alt="Illustrative outfit: ivory shirt, navy midi skirt, tan loafers and tan bag"
              width="800"
              height="800"
              loading="lazy"
              className="mt-3 h-44 w-full rounded-xl object-contain"
            />
            <p className="mt-3 text-sm leading-relaxed text-black/70">
              Try your ivory shirt with the navy skirt and loafers. Ask Bee for a change, then save
              the looks you love.
            </p>
            <p className="mt-4 rounded-2xl rounded-br-sm border border-[#96722e]/20 bg-[#96722e]/10 p-3 text-sm">
              <span className="font-semibold">You:</span> “Make it more relaxed.”
            </p>
          </li>
        </ol>
        <p className="mt-4 text-xs leading-relaxed text-black/55">
          Illustrative conversation and AI-generated outfit imagery. Your suggestions depend on your
          wardrobe and preferences.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a href="/app" className="glass-btn">
            Find my first look
          </a>
          <p className="text-sm text-black/65">
            Create your account. Try it free for 14 days. No card needed.
          </p>
        </div>
      </div>
    </section>
  );
}
