import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import askewLogoAsset from "@/assets/askew-logo.png.asset.json";
const askewLogo = askewLogoAsset.url;
import illusRef1Asset from "@/assets/illus-ref-1.png.asset.json";
import illusRef2Asset from "@/assets/illus-ref-2.png.asset.json";
import illusRef3Asset from "@/assets/illus-ref-3.png.asset.json";
const illusRef1 = illusRef1Asset.url;
const illusRef2 = illusRef2Asset.url;
const illusRef3 = illusRef3Asset.url;

export const Route = createFileRoute("/style-guide/")({
  head: () => ({
    meta: [
      { title: "Brand & Style Guide — LiveAskew" },
      {
        name: "description",
        content:
          "The LiveAskew Brand & Style Guide — Vol. 01 / 2026. An editorial reference for the visual language behind Bee, the personal AI stylist.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: BrandBook,
});

/* ───────────────────────────── helpers ───────────────────────────── */

function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>("[data-reveal]");
    items.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(18px)";
      el.style.transition =
        "opacity 1.1s cubic-bezier(.2,.6,.2,1), transform 1.1s cubic-bezier(.2,.6,.2,1)";
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.15 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

function ChapterMark({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-baseline gap-6 mb-12" data-reveal>
      <span
        className="font-display text-3xl"
        style={{ color: "var(--gold-deep)" }}
      >
        {num}
      </span>
      <span className="h-px flex-1 bg-[color:var(--gold)]/45" />
      <span className="eyebrow">{title}</span>
    </div>
  );
}

function FolioBar() {
  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur bg-cream/75 border-b hairline">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-12 flex items-center justify-between text-[10px] tracking-[0.32em] uppercase text-ink/60">
        <a href="/" className="hover:text-ink transition-colors">
          ← LiveAskew
        </a>
        <span className="hidden md:inline">
          Brand &amp; Style Guide · Vol. 01 / 2026
        </span>
        <span>Eight Chapters</span>
      </div>
    </header>
  );
}

/* ───────────────────────────── chapters ───────────────────────────── */

function Cover() {
  return (
    <section className="relative min-h-screen bg-ink text-cream flex flex-col">
      <div className="absolute inset-0 grain">
        <div className="grain-overlay" />
      </div>
      <div className="relative flex-1 flex flex-col justify-between px-8 md:px-16 lg:px-24 pt-28 pb-12">
        <div className="flex items-baseline justify-between text-[10px] tracking-[0.34em] uppercase text-cream/55">
          <span>LiveAskew · MMXXVI</span>
          <span>Vol. 01</span>
        </div>

        <div className="my-24 md:my-32 max-w-5xl">
          <img
            src={askewLogo}
            alt=""
            className="w-16 md:w-20 mb-12 opacity-90"
            style={{ filter: "invert(1) brightness(1.4)" }}
          />
          <p
            className="eyebrow mb-10"
            style={{ color: "var(--gold)" }}
          >
            A Brand &amp; Style Guide
          </p>
          <h1 className="font-display leading-[0.86] tracking-tight text-[18vw] md:text-[14vw] lg:text-[200px]">
            Live<em className="text-[color:var(--gold)]">Askew</em>
          </h1>
          <p className="mt-12 font-display italic text-2xl md:text-4xl text-cream/85 max-w-2xl leading-snug">
            Style that feels like you.
          </p>
        </div>

        <div className="flex items-end justify-between text-[10px] tracking-[0.34em] uppercase text-cream/55">
          <span>
            The Editorial System
            <br />
            for a Personal AI Stylist
          </span>
          <span className="text-right">
            Vol. 01 / 2026
            <br />
            Eight Chapters
          </span>
        </div>
      </div>
    </section>
  );
}

function Essence() {
  const principles = [
    {
      n: "i.",
      h: "Personal, never generic.",
      b: "Every word, every recommendation, every silhouette is tuned to one person.",
    },
    {
      n: "ii.",
      h: "Editorial, not algorithmic.",
      b: "We dress like a magazine sounds — composed, warm, considered.",
    },
    {
      n: "iii.",
      h: "Quiet confidence.",
      b: "Restraint over noise. The whitespace is doing as much work as the ink.",
    },
    {
      n: "iv.",
      h: "Made with hands.",
      b: "Hand-drawn marks, real type, real texture. Never the default.",
    },
  ];
  return (
    <section className="bg-cream text-ink py-32 md:py-44 px-8 md:px-16 lg:px-24">
      <div className="max-w-[1400px] mx-auto">
        <ChapterMark num="01" title="Brand Essence" />
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-24">
          <p
            className="eyebrow lg:col-span-3 lg:pt-3"
            data-reveal
          >
            Positioning
          </p>
          <div className="lg:col-span-9" data-reveal>
            <p className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight">
              LiveAskew is a{" "}
              <em className="text-[color:var(--gold-deep)]">personal</em> AI
              stylist — conversational, intelligent, deeply attuned. Not a
              shopping app. A dressing room with a point of view.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-28">
          <p className="eyebrow lg:col-span-3 lg:pt-3" data-reveal>
            The Stylist
          </p>
          <div className="lg:col-span-9 space-y-6" data-reveal>
            <h3 className="font-display text-3xl md:text-5xl leading-tight">
              Her name is <em>Bee.</em>
            </h3>
            <p className="text-lg md:text-xl text-ink/70 leading-relaxed max-w-3xl">
              Bee is the voice and intelligence of LiveAskew — a stylist who
              remembers what you wore last Thursday, knows the weather in your
              city, and would never recommend a beige cardigan you'd hate. She
              is warm, observant, and quietly opinionated.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          <p className="eyebrow lg:col-span-3 lg:pt-3" data-reveal>
            Principles
          </p>
          <ol className="lg:col-span-9 space-y-12 lg:space-y-16">
            {principles.map((p) => (
              <li
                key={p.n}
                className="grid grid-cols-12 gap-4 items-baseline pb-12 border-b hairline last:border-0"
                data-reveal
              >
                <span
                  className="col-span-2 md:col-span-1 font-display text-2xl italic"
                  style={{ color: "var(--gold-deep)" }}
                >
                  {p.n}
                </span>
                <div className="col-span-10 md:col-span-11">
                  <h4 className="font-display text-3xl md:text-5xl leading-[1.05] tracking-tight">
                    {p.h}
                  </h4>
                  <p className="mt-4 text-base md:text-lg text-ink/65 max-w-2xl leading-relaxed">
                    {p.b}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function Logo() {
  return (
    <section className="bg-bone text-ink py-32 md:py-44 px-8 md:px-16 lg:px-24">
      <div className="max-w-[1400px] mx-auto">
        <ChapterMark num="02" title="The Mark" />

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-24">
          <div className="lg:col-span-4" data-reveal>
            <p className="eyebrow mb-4">The Feather</p>
            <h3 className="font-display text-4xl md:text-5xl leading-tight">
              A single quill.
              <br />
              <em className="text-[color:var(--gold-deep)]">A held breath.</em>
            </h3>
            <p className="mt-6 text-ink/65 leading-relaxed">
              The feather is the entire identity — soft, exact, weightless.
              No wordmark required beside it. Let it sit.
            </p>
          </div>
          <div
            className="lg:col-span-8 aspect-[4/3] bg-cream border hairline flex items-center justify-center relative overflow-hidden"
            data-reveal
          >
            <img src={askewLogo} alt="LiveAskew feather mark" className="w-48 md:w-64" />
            <span className="absolute top-4 left-4 text-[10px] tracking-[0.3em] uppercase text-ink/40">
              Primary
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-[color:var(--gold)]/30 border hairline mb-24">
          <div className="bg-cream p-10" data-reveal>
            <p className="eyebrow mb-3">Clear space</p>
            <p className="font-display text-2xl leading-snug">
              No element within the height of the feather itself.
            </p>
          </div>
          <div className="bg-cream p-10" data-reveal>
            <p className="eyebrow mb-3">Minimum size</p>
            <p className="font-display text-2xl leading-snug">
              24px digital · 12mm print. Smaller, the spine breaks.
            </p>
          </div>
          <div className="bg-cream p-10" data-reveal>
            <p className="eyebrow mb-3">Color</p>
            <p className="font-display text-2xl leading-snug">
              Ink on cream. Cream on ink. Never gold, never tinted.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-[color:var(--gold)]/30 border hairline mb-12">
          <div className="bg-cream aspect-square flex items-center justify-center relative" data-reveal>
            <img src={askewLogo} alt="" className="w-32 md:w-44" />
            <span className="absolute bottom-4 left-4 text-[10px] tracking-[0.3em] uppercase text-ink/45">
              On Cream
            </span>
          </div>
          <div className="bg-ink aspect-square flex items-center justify-center relative" data-reveal>
            <img
              src={askewLogo}
              alt=""
              className="w-32 md:w-44"
              style={{ filter: "invert(1) brightness(1.4)" }}
            />
            <span className="absolute bottom-4 left-4 text-[10px] tracking-[0.3em] uppercase text-cream/55">
              On Ink
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-px bg-[color:var(--gold)]/30 border hairline">
          {[
            { label: "Do", note: "Hold the proportions.", ok: true, transform: "" },
            { label: "Don't", note: "Never stretch.", ok: false, transform: "scaleX(1.6)" },
            { label: "Don't", note: "Never tint gold.", ok: false, transform: "", tint: true },
            { label: "Don't", note: "Never rotate.", ok: false, transform: "rotate(22deg)" },
          ].map((d, i) => (
            <div key={i} className="bg-cream aspect-square p-6 flex flex-col" data-reveal>
              <div className="flex-1 flex items-center justify-center">
                <img
                  src={askewLogo}
                  alt=""
                  className="w-20"
                  style={{
                    transform: d.transform,
                    filter: d.tint
                      ? "sepia(1) saturate(4) hue-rotate(2deg) brightness(0.95)"
                      : undefined,
                  }}
                />
              </div>
              <div className="mt-4 pt-4 border-t hairline">
                <p
                  className="text-[10px] tracking-[0.3em] uppercase"
                  style={{ color: d.ok ? "var(--gold-deep)" : "var(--illus-jewel)" }}
                >
                  {d.label}
                </p>
                <p className="text-xs text-ink/65 mt-1">{d.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Color() {
  const swatches = [
    {
      name: "Ink",
      role: "Foundation · Type · Surface",
      hex: "#161514",
      oklch: "oklch(0.14 0.004 60)",
      bg: "var(--ink)",
      fg: "var(--cream)",
    },
    {
      name: "Cream",
      role: "Page · Negative Space",
      hex: "#FDFCF7",
      oklch: "oklch(0.99 0.004 90)",
      bg: "var(--cream)",
      fg: "var(--ink)",
    },
    {
      name: "Gold",
      role: "Accent · Rule · Mark",
      hex: "#C9A14A",
      oklch: "oklch(0.74 0.118 78)",
      bg: "var(--gold)",
      fg: "var(--ink)",
    },
    {
      name: "Gold Deep",
      role: "Eyebrow · Numerals",
      hex: "#9C7A2E",
      oklch: "oklch(0.58 0.118 72)",
      bg: "var(--gold-deep)",
      fg: "var(--cream)",
    },
    {
      name: "Gold Soft",
      role: "Hairlines · Tint",
      hex: "#E6D29A",
      oklch: "oklch(0.87 0.06 82)",
      bg: "var(--gold-soft)",
      fg: "var(--ink)",
    },
  ];
  return (
    <section className="bg-cream text-ink py-32 md:py-44 px-8 md:px-16 lg:px-24">
      <div className="max-w-[1400px] mx-auto">
        <ChapterMark num="03" title="Color" />

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-20">
          <div className="lg:col-span-5" data-reveal>
            <h3 className="font-display text-5xl md:text-7xl leading-[0.95]">
              Ink, Cream,
              <br />
              <em className="text-[color:var(--gold-deep)]">and Gold.</em>
            </h3>
          </div>
          <p className="lg:col-span-6 lg:col-start-7 text-lg text-ink/70 leading-relaxed" data-reveal>
            A three-note palette. Ink and cream do almost all the work — they
            are the page, the type, the architecture. Gold is the rarely-used
            jewel: a hairline, an italic flourish, a folio mark. Never a button
            fill. Never a background.
          </p>
        </div>

        {/* Usage ratio */}
        <div className="mb-24" data-reveal>
          <p className="eyebrow mb-3">Usage ratio</p>
          <div className="flex h-14 border hairline overflow-hidden">
            <div
              className="flex items-center justify-center text-[10px] tracking-[0.3em] uppercase text-cream"
              style={{ width: "55%", background: "var(--cream)", color: "var(--ink)" }}
            >
              Cream · 55
            </div>
            <div
              className="flex items-center justify-center text-[10px] tracking-[0.3em] uppercase"
              style={{ width: "38%", background: "var(--ink)", color: "var(--cream)" }}
            >
              Ink · 38
            </div>
            <div
              className="flex items-center justify-center text-[10px] tracking-[0.3em] uppercase"
              style={{ width: "7%", background: "var(--gold)", color: "var(--ink)" }}
            >
              Au · 7
            </div>
          </div>
        </div>

        {/* Large fields */}
        <div className="space-y-px bg-[color:var(--gold)]/30">
          {swatches.map((s) => (
            <div
              key={s.name}
              className="grid md:grid-cols-12 min-h-[44vh]"
              data-reveal
            >
              <div
                className="md:col-span-8 relative p-10 md:p-16 flex flex-col justify-between"
                style={{ background: s.bg, color: s.fg }}
              >
                <span
                  className="text-[10px] tracking-[0.32em] uppercase opacity-70"
                >
                  {s.role}
                </span>
                <h4 className="font-display text-6xl md:text-8xl leading-none">
                  {s.name}
                </h4>
              </div>
              <div className="md:col-span-4 bg-cream p-10 md:p-12 flex flex-col justify-between border-l hairline">
                <div>
                  <p className="eyebrow mb-2">Hex</p>
                  <p className="font-mono text-lg">{s.hex}</p>
                </div>
                <div>
                  <p className="eyebrow mb-2">OKLCH</p>
                  <p className="font-mono text-xs text-ink/70">{s.oklch}</p>
                </div>
                <div>
                  <p className="eyebrow mb-2">Token</p>
                  <p className="font-mono text-xs text-ink/70">
                    --{s.name.toLowerCase().replace(" ", "-")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Typography() {
  const scale = [
    { label: "Display 1", size: "96px / 0.95", cls: "text-[88px] md:text-[120px]" },
    { label: "Display 2", size: "72px / 1.0", cls: "text-[64px] md:text-[88px]" },
    { label: "Headline", size: "48px / 1.05", cls: "text-5xl md:text-6xl" },
    { label: "Title", size: "32px / 1.15", cls: "text-3xl md:text-4xl" },
    { label: "Subhead", size: "22px / 1.3", cls: "text-xl md:text-2xl" },
  ];
  return (
    <section className="bg-cream text-ink py-32 md:py-44 px-8 md:px-16 lg:px-24">
      <div className="max-w-[1400px] mx-auto">
        <ChapterMark num="04" title="Typography" />

        {/* Cormorant specimen */}
        <div className="mb-24" data-reveal>
          <div className="flex items-baseline justify-between mb-6 border-b hairline pb-4">
            <p className="eyebrow">Cormorant Garamond · Display</p>
            <p className="text-xs text-ink/55">Regular · Italic · 300 / 400</p>
          </div>
          <p
            className="font-display leading-[0.85] tracking-tight"
            style={{ fontSize: "clamp(80px, 16vw, 240px)" }}
          >
            Aa <em className="text-[color:var(--gold-deep)]">Bb</em>
          </p>
          <p className="font-display text-2xl md:text-3xl mt-6 text-ink/70 tracking-wide">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
            <br />
            <em>abcdefghijklmnopqrstuvwxyz</em> · 0123456789 · &amp; ?!.,—
          </p>
        </div>

        {/* Styled headline */}
        <div className="mb-24 grid lg:grid-cols-12 gap-10 lg:gap-16" data-reveal>
          <p className="eyebrow lg:col-span-3 lg:pt-3">In use</p>
          <h3 className="lg:col-span-9 font-display text-5xl md:text-7xl leading-[1.02] tracking-tight">
            She dressed the way she{" "}
            <em className="text-[color:var(--gold-deep)]">spoke</em> —
            slowly, deliberately, with a hand on every seam.
          </h3>
        </div>

        {/* Scale */}
        <div className="mb-24" data-reveal>
          <p className="eyebrow mb-8">Type Scale</p>
          <div className="divide-y divide-[color:var(--gold)]/30">
            {scale.map((s) => (
              <div
                key={s.label}
                className="grid grid-cols-12 gap-4 items-baseline py-6"
              >
                <span className="col-span-3 md:col-span-2 text-[10px] tracking-[0.3em] uppercase text-ink/55">
                  {s.label}
                </span>
                <span className={`col-span-7 md:col-span-8 font-display leading-none truncate ${s.cls}`}>
                  Style, askew.
                </span>
                <span className="col-span-2 md:col-span-2 text-right font-mono text-xs text-ink/55">
                  {s.size}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Inter paragraph */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16" data-reveal>
          <div className="lg:col-span-3">
            <p className="eyebrow mb-3">Inter · Body</p>
            <p className="text-xs text-ink/55">
              400 / 500 / 600
              <br />
              ss01, cv11 enabled
            </p>
          </div>
          <div className="lg:col-span-9 columns-1 md:columns-2 gap-12 text-[15px] leading-[1.75] text-ink/80">
            <p className="mb-5">
              The body voice is Inter — neutral, exact, modern enough to sit
              beneath Cormorant without competing. We set body type at fifteen
              pixels with generous line height; we let it breathe. Captions and
              eyebrows are uppercase, tracked wide, and almost always in gold-deep.
            </p>
            <p>
              Pairing rule: every Cormorant headline is followed by Inter at no
              less than three-to-one size ratio. The display is the soloist; the
              body is the room around it. Never set body in Cormorant. Never set
              headlines in Inter.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Illustration() {
  const palette = [
    { name: "Kraft", hex: "#A8824E", bg: "var(--illus-kraft)" },
    { name: "Peach", hex: "#F6DDCB", bg: "var(--illus-peach)" },
    { name: "Olive", hex: "#8A8453", bg: "var(--illus-olive)" },
    { name: "Jewel", hex: "#7E1F2B", bg: "var(--illus-jewel)" },
  ];
  return (
    <section className="bg-cream text-ink py-32 md:py-44 px-8 md:px-16 lg:px-24">
      <div className="max-w-[1400px] mx-auto">
        <ChapterMark num="05" title="Illustration Direction" />

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-20">
          <div className="lg:col-span-5" data-reveal>
            <h3 className="font-display text-5xl md:text-7xl leading-[0.95]">
              Hand,
              <br />
              <em className="text-[color:var(--gold-deep)]">not algorithm.</em>
            </h3>
          </div>
          <p className="lg:col-span-6 lg:col-start-7 text-lg text-ink/70 leading-relaxed" data-reveal>
            All LiveAskew illustration reads as if it were drawn this morning at
            a studio table — painterly linework, warm muted backgrounds, the
            occasional handwritten label, a small ink star for emphasis. Editorial
            fashion sketches, never product renderings.
          </p>
        </div>

        {/* Asymmetric gallery */}
        <div className="grid grid-cols-12 gap-4 md:gap-6 mb-24">
          <figure className="col-span-12 md:col-span-7 md:row-span-2" data-reveal>
            <div className="aspect-[4/5] overflow-hidden border hairline bg-bone">
              <img
                src={illusRef1}
                alt="Editorial fashion sketch reference"
                className="w-full h-full object-cover"
              />
            </div>
            <figcaption className="mt-3 flex items-baseline justify-between text-[10px] tracking-[0.3em] uppercase text-ink/55">
              <span>Plate i.</span>
              <span className="font-display italic normal-case tracking-normal text-base text-ink/70">
                "the full figure"
              </span>
            </figcaption>
          </figure>
          <figure className="col-span-7 md:col-span-5" data-reveal>
            <div className="aspect-[5/4] overflow-hidden border hairline bg-bone">
              <img src={illusRef2} alt="" className="w-full h-full object-cover" />
            </div>
            <figcaption className="mt-3 text-[10px] tracking-[0.3em] uppercase text-ink/55">
              Plate ii. · the silhouette study
            </figcaption>
          </figure>
          <figure className="col-span-5 md:col-span-5" data-reveal>
            <div className="aspect-square overflow-hidden border hairline bg-bone">
              <img src={illusRef3} alt="" className="w-full h-full object-cover" />
            </div>
            <figcaption className="mt-3 text-[10px] tracking-[0.3em] uppercase text-ink/55">
              Plate iii. · the close detail
            </figcaption>
          </figure>
        </div>

        {/* Direction list */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-24">
          <p className="eyebrow lg:col-span-3 lg:pt-3" data-reveal>
            Direction
          </p>
          <ul className="lg:col-span-9 space-y-6" data-reveal>
            {[
              "Painterly linework — visible pencil weight, never vector-perfect.",
              "Warm muted backgrounds — kraft, peach, olive. Never pure white.",
              "Handwritten labels in Caveat, set small, set sparingly.",
              "A single ink star for emphasis. Never more than one per plate.",
            ].map((d) => (
              <li
                key={d}
                className="font-display text-2xl md:text-3xl leading-snug border-b hairline pb-6"
              >
                — {d}
              </li>
            ))}
          </ul>
        </div>

        {/* Illustration palette */}
        <div data-reveal>
          <div className="flex items-baseline justify-between mb-6 border-b hairline pb-4">
            <p className="eyebrow">Illustration Palette</p>
            <p className="text-xs italic text-ink/55">
              Appears inside artwork. Never in UI.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[color:var(--gold)]/30 border hairline">
            {palette.map((p) => (
              <div key={p.name} className="bg-cream">
                <div
                  className="aspect-[5/4]"
                  style={{ background: p.bg }}
                />
                <div className="p-5 flex items-baseline justify-between">
                  <span className="font-display text-xl">{p.name}</span>
                  <span className="font-mono text-[11px] text-ink/55">{p.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Voice() {
  const examples = [
    {
      ctx: "Greeting",
      bee: "There you are. Let's find something that feels like Thursday.",
    },
    {
      ctx: "Recommending",
      bee: "Try the cream blouse with the wide trousers — it's quiet, but it isn't shy.",
    },
    {
      ctx: "Declining",
      bee: "It's a lovely jacket. It isn't yours. Let's keep looking.",
    },
  ];
  return (
    <section className="bg-ink text-cream py-32 md:py-44 px-8 md:px-16 lg:px-24">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-baseline gap-6 mb-12" data-reveal>
          <span className="font-display text-3xl text-[color:var(--gold)]">06</span>
          <span className="h-px flex-1 bg-cream/20" />
          <span className="eyebrow text-cream/70">Voice</span>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 mb-24">
          <div className="lg:col-span-5" data-reveal>
            <h3 className="font-display text-5xl md:text-7xl leading-[0.95]">
              Warm.
              <br />
              <em className="text-[color:var(--gold)]">Knowing.</em>
              <br />
              Never clinical.
            </h3>
          </div>
          <p className="lg:col-span-6 lg:col-start-7 text-lg text-cream/70 leading-relaxed" data-reveal>
            Bee talks the way a trusted friend talks — short sentences, gentle
            commas, the occasional italic. She never says "user," "outfit
            inventory," or "based on your data." She notices things.
          </p>
        </div>

        <div className="space-y-px bg-cream/10">
          {examples.map((e) => (
            <div
              key={e.ctx}
              className="bg-ink grid md:grid-cols-12 gap-6 py-10 md:py-14"
              data-reveal
            >
              <p className="md:col-span-3 eyebrow text-cream/55">{e.ctx}</p>
              <p className="md:col-span-9 font-display text-3xl md:text-5xl italic leading-[1.15] text-cream">
                "{e.bee}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InUse() {
  return (
    <section className="bg-cream text-ink py-32 md:py-44 px-8 md:px-16 lg:px-24">
      <div className="max-w-[1400px] mx-auto">
        <ChapterMark num="07" title="In Use" />

        <p className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight mb-20 max-w-4xl" data-reveal>
          The system, <em className="text-[color:var(--gold-deep)]">applied.</em>
        </p>

        <div className="grid lg:grid-cols-12 gap-6 mb-12">
          {/* Card */}
          <article
            className="lg:col-span-5 bg-bone border hairline p-10 flex flex-col"
            data-reveal
          >
            <p className="eyebrow mb-4">Today · Edition 142</p>
            <h4 className="font-display text-4xl leading-[1.05] mb-3">
              The cream blouse, <em>again.</em>
            </h4>
            <p className="text-ink/70 leading-relaxed mb-8">
              Bee's pick for a slow morning meeting — wide trousers, a single
              gold cuff, hair down.
            </p>
            <span className="gold-rule !mx-0 mb-8" />
            <button
              type="button"
              className="self-start px-6 py-3 bg-ink text-cream text-[11px] tracking-[0.28em] uppercase hover:bg-ink/85 transition-colors"
            >
              See the look
            </button>
          </article>

          {/* Pull quote */}
          <figure
            className="lg:col-span-7 bg-ink text-cream p-12 md:p-16 flex flex-col justify-between"
            data-reveal
          >
            <span className="font-display text-7xl leading-none text-[color:var(--gold)]">
              &ldquo;
            </span>
            <blockquote className="font-display italic text-3xl md:text-5xl leading-[1.15]">
              She dressed the way she spoke — slowly, deliberately, with a hand
              on every seam.
            </blockquote>
            <figcaption className="mt-8 text-[10px] tracking-[0.3em] uppercase text-cream/55">
              Bee · Field Note 07
            </figcaption>
          </figure>
        </div>

        {/* Button set */}
        <div className="bg-bone border hairline p-10 md:p-12" data-reveal>
          <p className="eyebrow mb-6">Buttons in context</p>
          <div className="flex flex-wrap gap-4 items-center">
            <button className="px-6 py-3 bg-ink text-cream text-[11px] tracking-[0.28em] uppercase hover:bg-ink/85 transition-colors">
              Primary
            </button>
            <button className="px-6 py-3 border hairline text-[11px] tracking-[0.28em] uppercase hover:bg-cream transition-colors">
              Secondary
            </button>
            <button className="px-2 py-1 text-[11px] tracking-[0.28em] uppercase text-ink/70 hover:text-ink relative after:absolute after:left-2 after:right-2 after:bottom-0 after:h-px after:bg-[color:var(--gold)]">
              Tertiary link
            </button>
            <span className="ml-auto eyebrow">All set in Inter · 11/0.28em</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Colophon() {
  return (
    <section className="bg-ink text-cream py-28 px-8 md:px-16 lg:px-24">
      <div className="max-w-[1400px] mx-auto grid md:grid-cols-3 gap-10 items-end">
        <div>
          <p className="eyebrow text-cream/55 mb-3">Colophon</p>
          <p className="font-display text-3xl md:text-4xl leading-tight">
            Set in Cormorant Garamond &amp; Inter.
            <br />
            Edited by <em className="text-[color:var(--gold)]">Bee.</em>
          </p>
        </div>
        <div className="text-cream/60 text-sm leading-relaxed">
          LiveAskew Brand &amp; Style Guide, Vol. 01, MMXXVI.
          For internal and partner use. Updated continuously.
        </div>
        <div className="md:text-right text-[10px] tracking-[0.32em] uppercase text-cream/55">
          End of Volume 01
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── shell ───────────────────────────── */

function BrandBook() {
  const ref = useReveal();
  return (
    <div ref={ref} className="bg-cream text-ink" style={{ scrollBehavior: "smooth" }}>
      <FolioBar />
      <Cover />
      <Essence />
      <Logo />
      <Color />
      <Typography />
      <Illustration />
      <Voice />
      <InUse />
      <Colophon />
    </div>
  );
}
