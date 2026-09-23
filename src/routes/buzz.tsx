import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/site/SiteFrame";
import { BUZZ_PLATFORMS, buzzMessage, buzzWeek } from "@/lib/buzz";

export const Route = createFileRoute("/buzz")({
  head: () => ({
    meta: [
      { title: "Buzz — LiveAskew" },
      {
        name: "description",
        content:
          "Buzz posts your style to X, Instagram, Facebook, and Telegram. Upload a photo, tell the AI what to put you in, and it sends a new message every day.",
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
      <section className="mx-auto max-w-[1100px] px-6 pt-16 pb-8 md:pt-24">
        <p className="eyebrow">Buzz</p>
        <h1 className="font-display mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
          Post the look. Every platform. Every day.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80">
          Upload your image. Tell Buzz what to put you in. It writes the post for X, Instagram,
          Facebook, and Telegram — then keeps posting that style each day with a different message.
        </p>
      </section>

      <section className="mx-auto grid max-w-[1100px] gap-5 px-6 pb-16 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form
          className="rounded-[2rem] bg-cream p-6 shadow-neo"
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
              className="mt-2 w-full rounded-[1.25rem] bg-cream px-4 py-3 text-base shadow-neo-inset outline-none"
            />
          </label>
          <button type="submit" className="neo-btn-ink mt-5 disabled:opacity-40" disabled={!photo || !look}>
            Post everywhere
          </button>
          <p className="mt-4 text-sm leading-relaxed text-ink/70">
            Buzz keeps the style and sends a new line each day. Connecting X, Instagram, Facebook,
            and Telegram is what turns the draft into a live post.
          </p>
        </form>

        <div>
          {!ready && (
            <div className="rounded-[2rem] bg-cream px-6 py-10 text-sm leading-relaxed shadow-neo-inset">
              The four posts appear here. Each platform gets its own wording. The week under them
              is the same style, said seven different ways.
            </div>
          )}
          {ready && (
            <>
              <ul className="space-y-3">
                {today.map((post) => (
                  <li key={post.id} className="rounded-[1.5rem] bg-cream px-5 py-4 shadow-neo">
                    <p className="eyebrow">{post.name}</p>
                    <p className="mt-2 text-sm leading-relaxed">{post.message}</p>
                  </li>
                ))}
              </ul>
              <h2 className="font-display mt-8 text-3xl">Every day, a different message</h2>
              <ol className="mt-4 space-y-2">
                {week.map((message, index) => (
                  <li key={message} className="rounded-[1.25rem] bg-cream px-4 py-3 text-sm shadow-neo">
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
