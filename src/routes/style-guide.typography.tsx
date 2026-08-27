import { createFileRoute } from "@tanstack/react-router";
import { StyleGuideShell, PageTitle, SectionHeader } from "@/components/StyleGuideNav";

export const Route = createFileRoute("/style-guide/typography")({
  head: () => ({
    meta: [
      { title: "Typography — LiveAskew Style Guide" },
      { name: "description", content: "Cormorant Garamond, Inter, and Caveat." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: TypographyPage,
});

const SCALE = [
  { label: "Display 8XL", className: "font-display text-8xl leading-[0.9]", sample: "Live Askew" },
  { label: "Display 6XL", className: "font-display text-6xl leading-[0.95]", sample: "Personal AI Stylist" },
  { label: "Display 5XL", className: "font-display text-5xl leading-[1.05]", sample: "An editorial sketchbook" },
  { label: "Display 4XL", className: "font-display text-4xl leading-[1.1]", sample: "Section header" },
  { label: "Display 2XL italic", className: "font-display italic text-3xl", sample: "for women who dress on purpose" },
  { label: "Body Large", className: "text-lg leading-[1.7] text-ink/80", sample: "Soft tailoring in a sand-washed silk — a jacket that falls just past the hip." },
  { label: "Body", className: "text-base leading-[1.7] text-ink/80", sample: "Conversational AI styling. Monthly looks built only for you." },
  { label: "Eyebrow", className: "eyebrow", sample: "Style Guide / 02" },
  { label: "Caption", className: "text-xs tracking-[0.22em] uppercase text-ink/50", sample: "Look 04 · Summer Edit" },
];

function TypographyPage() {
  return (
    <StyleGuideShell current="/style-guide/typography">
      <PageTitle
        num="02"
        eyebrow="Three faces. One voice."
        title="Type"
        italic="System."
        intro="Cormorant Garamond carries the editorial voice. Inter carries the work. Caveat carries the hand."
      />

      {/* Faces */}
      <section className="mb-28 grid md:grid-cols-3 gap-px bg-[color:var(--gold)]/30 border hairline">
        <div className="bg-cream p-10">
          <p className="eyebrow mb-6">Display</p>
          <p className="font-display text-7xl leading-none">Aa</p>
          <p className="font-display text-2xl mt-6">Cormorant Garamond</p>
          <p className="text-sm text-ink/60 mt-2">Regular · Medium · Italic</p>
          <code className="block mt-6 text-xs text-ink/55 font-mono">var(--font-serif)</code>
        </div>
        <div className="bg-cream p-10">
          <p className="eyebrow mb-6">Sans</p>
          <p className="text-7xl leading-none font-light">Aa</p>
          <p className="font-display text-2xl mt-6">Inter</p>
          <p className="text-sm text-ink/60 mt-2">300 · 400 · 500 · 600</p>
          <code className="block mt-6 text-xs text-ink/55 font-mono">var(--font-sans)</code>
        </div>
        <div className="bg-cream p-10">
          <p className="eyebrow mb-6">Hand</p>
          <p className="text-7xl leading-none" style={{ fontFamily: "var(--font-hand)" }}>Aa</p>
          <p className="font-display text-2xl mt-6">Caveat</p>
          <p className="text-sm text-ink/60 mt-2">Annotation only</p>
          <code className="block mt-6 text-xs text-ink/55 font-mono">var(--font-hand)</code>
        </div>
      </section>

      {/* Scale */}
      <section className="mb-28">
        <SectionHeader eyebrow="02.01 — Scale" title="From wordmark to caption." />
        <div className="divide-y hairline border-y hairline">
          {SCALE.map((s) => (
            <div key={s.label} className="grid md:grid-cols-[180px_1fr] gap-6 py-8 items-baseline">
              <p className="text-xs tracking-[0.22em] uppercase text-ink/50">{s.label}</p>
              <p className={s.className}>{s.sample}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pairings */}
      <section className="mb-28">
        <SectionHeader eyebrow="02.02 — Pairings" title="Headlines in serif. Everything else in sans." />
        <div className="grid md:grid-cols-2 gap-10">
          <div className="p-10 bg-bone border hairline">
            <p className="eyebrow mb-4">Style Guide / 02</p>
            <h3 className="font-display text-4xl leading-[1.05]">
              An editorial <em>sketchbook</em>
            </h3>
            <p className="mt-4 text-ink/75 leading-[1.7]">
              Hand-rendered fashion sketching, loose linework, jewel accents. Drawn with intent.
            </p>
          </div>
          <div className="p-10 bg-bone border hairline">
            <p className="eyebrow mb-4">Annotation</p>
            <p className="text-3xl" style={{ fontFamily: "var(--font-hand)" }}>
              Will Jacket / Romina Dress ✦
            </p>
            <p className="mt-4 text-ink/75 leading-[1.7]">
              Handwritten labels live beside the figure, never overlaid on the body.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <SectionHeader eyebrow="02.03 — Rules" title="Restraint." />
        <ul className="space-y-5 max-w-3xl">
          {[
            "Display serif for headlines, pull quotes, prices. Never body copy.",
            "Italics in Cormorant carry tone — use sparingly for emphasis and editorial voice.",
            "Inter handles everything functional: body, UI, eyebrows, captions.",
            "Caveat is reserved for illustration annotation. Never UI, never CTAs.",
            "Eyebrows always use 0.28em tracking and gold-deep color.",
          ].map((r, i) => (
            <li key={i} className="flex gap-5 items-start">
              <span className="font-display text-2xl leading-none mt-1 shrink-0" style={{ color: "var(--illus-jewel)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-lg text-ink/80 leading-[1.6]">{r}</span>
            </li>
          ))}
        </ul>
      </section>
    </StyleGuideShell>
  );
}
