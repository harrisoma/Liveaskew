import { createFileRoute } from "@tanstack/react-router";
import ref1 from "@/assets/illus-ref-1.png.asset.json";
import ref2 from "@/assets/illus-ref-2.png.asset.json";
import ref3 from "@/assets/illus-ref-3.png.asset.json";
import { StyleGuideShell, PageTitle, SectionHeader } from "@/components/StyleGuideNav";
import { IllustrationGenerator } from "@/components/IllustrationGenerator";

export const Route = createFileRoute("/style-guide/illustration")({
  head: () => ({
    meta: [
      { title: "Illustration Direction — LiveAskew Style Guide" },
      { name: "description", content: "Internal reference for LiveAskew's signature fashion-illustration aesthetic." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: IllustrationDirection,
});

const SWATCHES = [
  { name: "--illus-kraft", hex: "#A8824E", label: "Warm kraft paper", varName: "var(--illus-kraft)", dark: true },
  { name: "--illus-peach", hex: "#F6DDCB", label: "Soft editorial peach", varName: "var(--illus-peach)", dark: false },
  { name: "--illus-olive", hex: "#8A8453", label: "Olive-taupe", varName: "var(--illus-olive)", dark: true },
  { name: "--illus-jewel", hex: "#7E1F2B", label: "Deep jewel red", varName: "var(--illus-jewel)", dark: true },
  { name: "--illus-ink (reuses --ink)", hex: "#161514", label: "Linework", varName: "var(--ink)", dark: true },
];

const REFS = [
  { src: ref1.url, caption: "Will Jacket / Romina Dress" },
  { src: ref2.url, caption: "Editorial gesture study" },
  { src: ref3.url, caption: "Annotation + sparkle accents" },
];

function IllustrationDirection() {
  return (
    <StyleGuideShell current="/style-guide/illustration">
      <PageTitle
        num="04"
        eyebrow="The hand-drawn vocabulary"
        title="Illustration"
        italic="Direction."
        intro="The hand-drawn vocabulary behind LiveAskew's editorial moments — how Bee sees, sketches, and annotates a look."
      />


        {/* 1. Direction */}
        <section className="mb-28">
          <SectionHeader eyebrow="01 — Direction" title="An editorial sketchbook, not a fashion plate." />
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <p className="text-ink/80 leading-[1.75]">
              Our illustration voice is <em>hand-rendered</em> editorial fashion sketching —
              painterly, loose, and gestural. Linework breathes; proportions are confident
              but never clinical. Backgrounds stay warm and muted (kraft, peach, olive)
              so figures and garments lead the eye.
            </p>
            <p className="text-ink/80 leading-[1.75]">
              Every illustration is annotated like a designer's working page: a
              handwritten label beside the figure ("<span style={{ fontFamily: "var(--font-hand)" }} className="text-xl">Will Jacket / Romina Dress</span>"),
              the occasional star or sparkle accent, and the sense that someone
              <em> drew this on purpose</em>.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {REFS.map((r) => (
              <figure key={r.src} className="group">
                <div
                  className="aspect-[3/4] overflow-hidden rounded-sm border hairline"
                  style={{ background: "var(--illus-peach)" }}
                >
                  <img
                    src={r.src}
                    alt={r.caption}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption
                  className="mt-3 text-lg text-ink/70"
                  style={{ fontFamily: "var(--font-hand)" }}
                >
                  {r.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* 2. Palette */}
        <section className="mb-28">
          <SectionHeader eyebrow="02 — Palette" title="Five tones. Warm paper, jewel ink." />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {SWATCHES.map((s) => (
              <div key={s.name} className="flex flex-col">
                <div
                  className="aspect-[4/5] rounded-sm border hairline flex items-end p-4"
                  style={{ background: s.varName }}
                >
                  <span
                    className="text-xs tracking-[0.18em] uppercase font-medium"
                    style={{ color: s.dark ? "var(--cream)" : "var(--ink)" }}
                  >
                    {s.hex}
                  </span>
                </div>
                <p className="mt-3 font-display text-xl leading-tight">{s.label}</p>
                <code className="mt-1 text-xs text-ink/55 font-mono">{s.name}</code>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Annotation Type */}
        <section className="mb-28">
          <SectionHeader eyebrow="03 — Annotation Type" title="Handwritten labels. Quiet captions." />

          <div
            className="grid md:grid-cols-2 gap-0 rounded-sm border hairline overflow-hidden"
          >
            <div className="p-10 md:p-14" style={{ background: "var(--illus-peach)" }}>
              <p className="eyebrow mb-6" style={{ color: "var(--illus-jewel)" }}>Display · Caveat</p>
              <p
                className="text-5xl md:text-6xl text-ink leading-[1.1]"
                style={{ fontFamily: "var(--font-hand)" }}
              >
                Will Jacket /<br />Romina Dress ✦
              </p>
              <p
                className="mt-6 text-2xl text-ink/70"
                style={{ fontFamily: "var(--font-hand)" }}
              >
                aa bb cc · 1 2 3 · ★
              </p>
              <code className="mt-8 block text-xs text-ink/55 font-mono">font-family: var(--font-hand)</code>
            </div>

            <div className="p-10 md:p-14 bg-bone">
              <p className="eyebrow mb-6">Caption · Inter</p>
              <p className="text-base leading-[1.7] text-ink/80">
                Soft tailoring in a sand-washed silk. The jacket falls just past the
                hip, paired with a column dress in deep jewel red — meant for evenings
                that begin late.
              </p>
              <p className="mt-4 text-xs tracking-[0.22em] uppercase text-ink/50">
                Look 04 · Summer Edit
              </p>
              <code className="mt-8 block text-xs text-ink/55 font-mono">font-family: var(--font-sans)</code>
            </div>
          </div>

          <p className="mt-6 text-sm text-ink/60 max-w-2xl">
            Caveat is the working recommendation — any warm, slightly irregular
            handwritten face with consistent x-height will do. Avoid script fonts
            that feel like wedding stationery.
          </p>
        </section>

        {/* 4. Rules */}
        <section className="mb-20">
          <SectionHeader eyebrow="04 — Rules" title="When to draw, when to shoot." />

          <ul className="space-y-5 max-w-3xl">
            {[
              "Illustration is reserved for editorial and Bee moments — never product detail.",
              "Photography carries product, garment texture, and shoppable looks.",
              "Annotation labels sit beside the figure, in handwritten type, never overlaid on the body.",
              "Backgrounds stay within the illustration palette: kraft, peach, olive, or bone.",
              "Real bodies are never altered, slimmed, or smoothed — gesture is the only stylization.",
              "Sparkle and star accents are punctuation, not decoration. One or two per composition.",
            ].map((rule, i) => (
              <li key={i} className="flex gap-5 items-start">
                <span
                  className="font-display text-2xl leading-none mt-1 shrink-0"
                  style={{ color: "var(--illus-jewel)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-lg text-ink/80 leading-[1.6]">{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 5. Live generator */}
        <section className="mb-12">
          <SectionHeader eyebrow="05 — Generator" title="Make one. In the vibe." />
          <IllustrationGenerator />
        </section>
    </StyleGuideShell>
  );

}
