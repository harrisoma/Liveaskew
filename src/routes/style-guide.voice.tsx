import { createFileRoute } from "@tanstack/react-router";
import { StyleGuideShell, PageTitle, SectionHeader } from "@/components/StyleGuideNav";

export const Route = createFileRoute("/style-guide/voice")({
  head: () => ({
    meta: [
      { title: "Voice — LiveAskew Style Guide" },
      { name: "description", content: "Editorial tone, vocabulary, and copy patterns." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: VoicePage,
});

const VOCAB = {
  prefer: ["tailored", "considered", "on purpose", "uniform", "edit", "look", "studied", "quiet"],
  avoid: ["vibes", "drip", "fit", "outfit goals", "slay", "obsessed", "literally", "girlies"],
};

const PAIRS = [
  {
    do: "Soft tailoring in a sand-washed silk — for evenings that begin late.",
    dont: "Obsessed with this silk dress!! Such a vibe for date night 💕",
  },
  {
    do: "Your monthly edit. Built for the way you actually dress.",
    dont: "Get your AI-powered fit recommendations now!",
  },
  {
    do: "One unexpected element is enough. Three is a costume.",
    dont: "Pro tip: always add 3+ statement pieces to elevate your fit!",
  },
];

function VoicePage() {
  return (
    <StyleGuideShell current="/style-guide/voice">
      <PageTitle
        num="07"
        eyebrow="The way Bee talks"
        title="Voice &"
        italic="Tone."
        intro="Editorial, not promotional. Considered, not breathless. Bee writes like the smartest friend you have who happens to have spent twenty years inside fashion."
      />

      <section className="mb-28">
        <SectionHeader eyebrow="07.01 — Tone pillars" title="Four words. In this order." />
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { word: "Considered", desc: "Every sentence earns its place. Edit twice, post once." },
            { word: "Warm", desc: "Personal, never cold. Bee remembers — that's the whole product." },
            { word: "Editorial", desc: "Magazine cadence. Pull quotes over bullet points." },
            { word: "Quiet", desc: "No exclamation marks. No emoji in body copy. No hype." },
          ].map((t) => (
            <div key={t.word} className="border hairline bg-bone p-8">
              <p className="font-display text-3xl mb-3" style={{ color: "var(--illus-jewel)" }}>{t.word}</p>
              <p className="text-ink/70 leading-[1.7] text-sm">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-28">
        <SectionHeader eyebrow="07.02 — Vocabulary" title="Words we use. Words we don't." />
        <div className="grid md:grid-cols-2 gap-px bg-[color:var(--gold)]/30 border hairline">
          <div className="bg-cream p-10">
            <p className="eyebrow mb-6" style={{ color: "var(--illus-jewel)" }}>Prefer</p>
            <ul className="space-y-3">
              {VOCAB.prefer.map((w) => (
                <li key={w} className="font-display text-2xl">{w}</li>
              ))}
            </ul>
          </div>
          <div className="bg-cream p-10">
            <p className="eyebrow mb-6 text-ink/40">Avoid</p>
            <ul className="space-y-3">
              {VOCAB.avoid.map((w) => (
                <li key={w} className="font-display text-2xl line-through text-ink/30">{w}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <SectionHeader eyebrow="07.03 — In practice" title="Do this. Not that." />
        <div className="space-y-px bg-[color:var(--gold)]/30 border hairline">
          {PAIRS.map((p, i) => (
            <div key={i} className="grid md:grid-cols-2 gap-px bg-[color:var(--gold)]/30">
              <div className="bg-cream p-8">
                <p className="eyebrow mb-3" style={{ color: "var(--illus-jewel)" }}>Do</p>
                <p className="font-display text-2xl leading-snug">{p.do}</p>
              </div>
              <div className="bg-cream p-8">
                <p className="eyebrow mb-3 text-ink/40">Don't</p>
                <p className="font-display text-2xl leading-snug text-ink/40 line-through decoration-1">
                  {p.dont}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </StyleGuideShell>
  );
}
