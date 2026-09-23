import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/site/SiteFrame";
import { SocialMarks } from "@/components/site/SocialMarks";
import { BUZZ_PLATFORMS, buzzMessage, buzzWeek } from "@/lib/buzz";
import buzzHero from "@/assets/wardrobe-flatlay.jpg";

export const Route = createFileRoute("/buzz")({
  head: () => ({
    meta: [
      { title: "Buzz — LiveAskew" },
      {
        name: "description",
        content:
          "Grow your presence. Buzz posts the look to Instagram, TikTok, Pinterest, Facebook, and LinkedIn through each network's own door.",
      },
    ],
  }),
  component: BuzzPage,
});

function BuzzPage() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [ready, setReady] = useState(false);
  const look = instruction.trim();

  const today = useMemo(() => {
    if (!ready) return [];
    return BUZZ_PLATFORMS.map((platform) => ({
      ...platform,
      message: buzzMessage(look, 0, platform.id),
    }));
  }, [look, ready]);

  const week = useMemo(() => (ready ? buzzWeek(look, "instagram") : []), [look, ready]);

  return (
    <SiteFrame>
      <section className="relative min-h-[62svh]">
        <img
          src={buzzHero}
          alt="A flat lay of a black blazer, black handbag, and cream knit on linen"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/20" />
        <div className="relative z-10 flex min-h-[62svh] items-end px-6 pt-32 pb-12 md:px-16">
          <div className="glass-dark max-w-xl rounded-[2rem] px-8 py-8">
            <p className="text-[0.68rem] tracking-[0.28em] uppercase text-[#b8860b]">Buzz</p>
            <h1 className="font-display mt-3 text-5xl leading-[0.95] text-white md:text-6xl">
              Grow your presence.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white">
              Elevate. Uplift. Broadcast to the world. Upload the photo, say what to put you in, and
              Buzz writes a different line for every network.
            </p>
            <SocialMarks ids={["instagram", "tiktok", "pinterest", "facebook", "linkedin"]} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1100px] gap-5 px-6 pb-16 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form
          className="glass rounded-[2rem] p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!photo || !look) return;
            setReady(true);
          }}
        >
          <label className="block text-sm">
            Your photo
            <input
              type="file"
              accept="image/*"
              className="mt-2 block w-full text-sm"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  setPhoto(typeof reader.result === "string" ? reader.result : null);
                  setReady(false);
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
          {photo && (
            <img
              src={photo}
              alt="The photo Buzz will dress and post"
              className="mt-4 h-56 w-full rounded-[1.25rem] object-cover"
            />
          )}
          <label className="mt-5 block text-sm">
            What should you be in?
            <textarea
              value={instruction}
              onChange={(event) => {
                setInstruction(event.target.value);
                setReady(false);
              }}
              rows={4}
              required
              placeholder="Ivory silk shirt, charcoal trouser, almond loafer — a Tuesday at the office."
              className="mt-2 w-full rounded-[1.25rem] border border-black/10 bg-white/80 px-4 py-3 text-base outline-none"
            />
          </label>
          <button
            type="submit"
            className="neo-btn-ink mt-5 disabled:opacity-40"
            disabled={!photo || !look}
          >
            Post everywhere
          </button>
          <p className="mt-4 text-sm leading-relaxed text-black">
            Buzz keeps the style and sends a new line each day. Connect Instagram, TikTok,
            Pinterest, Facebook, and LinkedIn. Buzz posts through each network&apos;s own door. No
            outside scheduler.
          </p>
        </form>

        <div>
          {!ready && (
            <div className="glass rounded-[2rem] px-6 py-10 text-sm leading-relaxed">
              Five posts appear here. Each network gets its own wording. The week under them is the
              same style, said seven different ways.
            </div>
          )}
          {ready && (
            <>
              <ul className="space-y-3">
                {today.map((post) => (
                  <li key={post.id} className="glass rounded-[1.5rem] px-5 py-4">
                    <p className="eyebrow">{post.name}</p>
                    <p className="mt-2 text-sm leading-relaxed">{post.message}</p>
                  </li>
                ))}
              </ul>
              <h2 className="font-display mt-8 text-3xl">Every day, a different message</h2>
              <ol className="mt-4 space-y-2">
                {week.map((message, index) => (
                  <li key={message} className="glass rounded-[1.25rem] px-4 py-3 text-sm">
                    <span className="eyebrow">Day {index + 1}</span>
                    <p className="mt-1">{message}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </section>
    </SiteFrame>
  );
}
