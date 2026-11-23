import { ArrowDown, ChevronDown } from "lucide-react";
import moodboard from "@/assets/site/studio/moodboard.webp";
import blazer from "@/assets/site/studio/blazer.webp";
import gown from "@/assets/site/studio/gown.webp";
import streetwear from "@/assets/site/studio/streetwear.webp";
import athleisure from "@/assets/site/studio/athleisure.webp";
import uniform from "@/assets/site/studio/uniform.webp";
import accessories from "@/assets/site/studio/accessories.webp";
import merch from "@/assets/site/studio/merch.webp";
import sketch from "@/assets/site/studio/sketch.webp";
import swatches from "@/assets/site/studio/swatches.webp";
import fitting from "@/assets/site/studio/fitting.webp";
import { SiteFrame } from "./chrome";
import { BookingBand, Eyebrow } from "./ui";

/**
 * Design tools shown on the page. Official logos live in public/images/brands and are
 * recorded in docs/brand-assets.md. Tools without a logo file show their name only —
 * never initials or an invented mark (AGENTS.md).
 */
const TOOLS = {
  figma: { name: "Figma", logo: "/images/brands/figma.svg" },
  illustrator: { name: "Adobe Illustrator", logo: "/images/brands/adobe-illustrator.svg" },
  photoshop: { name: "Adobe Photoshop", logo: "/images/brands/adobe-photoshop.svg" },
  clo: { name: "CLO 3D", logo: null },
  canva: { name: "Canva", logo: "/images/brands/canva.svg" },
  workspace: { name: "Onixus Workspace", logo: "/images/brands/onixus-workspace.png" },
  procreate: { name: "Procreate", logo: null },
} as const;
type ToolId = keyof typeof TOOLS;

const TOOLKIT: { id: ToolId; use: string }[] = [
  {
    id: "figma",
    use: "Brand boards, line sheets and tech-pack layouts the whole team can comment on.",
  },
  {
    id: "illustrator",
    use: "Precise flats, trims, prints and repeat patterns ready for production.",
  },
  { id: "photoshop", use: "Colorways, fabric renders and realistic product mockups." },
  { id: "clo", use: "3D samples and fit checks before any fabric is cut." },
  { id: "canva", use: "Mood boards, presentations and launch assets for your team." },
  { id: "procreate", use: "First sketches by hand — loose, fast and full of feeling." },
  {
    id: "workspace",
    use: "Where every project lives: briefs, files, feedback and approvals, shared with you from start to finish.",
  },
];

function ToolChip({ id }: { id: ToolId }) {
  const tool = TOOLS[id];
  return (
    <span className="lac-tool-chip">
      {tool.logo ? <img src={tool.logo} alt="" width={18} height={18} /> : null}
      {tool.name}
    </span>
  );
}

const COLLAGE: { src: string; title: string; note: string; alt: string }[] = [
  {
    src: blazer,
    title: "Tailoring",
    note: "gold on black, always",
    alt: "Black blazer with gold floral embroidery on a dress form",
  },
  {
    src: streetwear,
    title: "Streetwear",
    note: "soft, heavy, easy",
    alt: "Black hoodie, joggers and cream sneakers laid flat",
  },
  {
    src: gown,
    title: "Evening & occasion",
    note: "made to move",
    alt: "Black silk evening gown with gold beading on a dress form",
  },
  {
    src: accessories,
    title: "Accessories",
    note: "the finishing line",
    alt: "Black leather handbag with gold hardware, silk scarf and gold hoops",
  },
  {
    src: uniform,
    title: "Uniforms & teamwear",
    note: "your team, on brand",
    alt: "Black waistcoat with gold buttons over an ivory shirt",
  },
  {
    src: athleisure,
    title: "Athleisure",
    note: "ivory, black, a hint of gold",
    alt: "Ivory and black athleisure set laid flat",
  },
  {
    src: merch,
    title: "Merch capsules",
    note: "worn, not tossed",
    alt: "Cream tote, black cap and ivory t-shirt",
  },
];

const STAGES: {
  title: string;
  text: string;
  note: string;
  tools: ToolId[];
  image?: { src: string; alt: string };
}[] = [
  {
    title: "Mood & story",
    text: "We start with how the collection should feel. Images, color, texture and story go up on the wall until the direction is clear — and you sign off on it.",
    note: "pin it. live with it. let it change.",
    tools: ["canva", "procreate", "workspace"],
    image: { src: moodboard, alt: "Moodboard wall with fabric swatches, sketches and photos" },
  },
  {
    title: "Sketch & flats",
    text: "Ideas become drawings: first by hand, then as precise flats with every seam, trim and measurement so a maker can read them.",
    note: "loose first, exact later",
    tools: ["procreate", "illustrator", "figma"],
    image: {
      src: sketch,
      alt: "Designer's table with fashion sketches, swatches and a stylus tablet",
    },
  },
  {
    title: "Fabric, color & print",
    text: "We choose materials for fit, feel and fabric — weight, drape, care and comfort — then build colorways and prints around them.",
    note: "touch everything",
    tools: ["photoshop", "illustrator"],
    image: {
      src: swatches,
      alt: "Fanned fabric swatches in black velvet, gold brocade and ivory silk",
    },
  },
  {
    title: "3D sample & tech pack",
    text: "Garments are sampled in 3D to check fit and proportion before cutting, then documented in a tech pack your manufacturer can build from.",
    note: "fit it before we cut it",
    tools: ["clo", "figma"],
  },
  {
    title: "Fitting & final",
    text: "Real fittings on real bodies. We adjust until it's right, and a person — never a template — approves every piece before it's final.",
    note: "human-approved. always.",
    tools: ["workspace"],
    image: { src: fitting, alt: "Muslin toile pinned on a dress form with a measuring tape" },
  },
];

export function DesignStudioPage() {
  return (
    <SiteFrame current="/design-studio">
      {/* Hero */}
      <section className="lac-hero lac-studio-hero px-5 pt-36 pb-24 md:px-8 md:pt-44">
        <p className="lac-outline-word" aria-hidden>
          STUDIO
        </p>
        <div className="relative mx-auto grid max-w-[1320px] items-start gap-14 lg:grid-cols-[1fr_1.15fr]">
          <div className="pt-4">
            <p className="lac-pill">
              <span aria-hidden className="lac-dot" />
              The studio process · Mood to final fit
            </p>
            <h1 className="la-serif lac-display mt-7">
              The Design <em>Studio.</em>
            </h1>
            <p className="mt-7 max-w-lg text-[1.15rem] leading-relaxed text-black/70">
              Where ideas become apparel. Mood, sketch, fabric, 3D sampling and real fittings — all
              in one studio, for brands and companies that want to be worn and remembered.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#process" className="la-btn la-btn-dark">
                Explore the process <ArrowDown size={18} aria-hidden />
              </a>
              <a href="/book?service=design-studio" className="la-btn lac-btn-outline">
                Start a design project
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Studio at a glance">
              {["5 stages", "Sketch to sample", "Real fittings", "Human-approved"].map((item) => (
                <li key={item} className="lac-stat">
                  {item}
                </li>
              ))}
            </ul>
            <p className="lac-hand mt-10 max-w-md text-[1.35rem] leading-snug">
              Nothing here is a template. Every piece starts as a feeling — then becomes cloth.
            </p>
          </div>

          <div className="relative">
            <figure className="lac-board">
              <span className="lac-tape lac-tape-top" aria-hidden />
              <img
                src={moodboard}
                fetchPriority="high"
                alt="A moodboard wall pinned with black velvet, gold brocade and ivory silk swatches, sketches and photos"
              />
              <figcaption className="flex flex-wrap items-end justify-between gap-4 px-1 pt-5">
                <span>
                  <span className="la-serif block text-[1.2rem] font-semibold">
                    The moodboard wall
                  </span>
                  <span className="text-[0.95rem] text-black/60">
                    Where every collection begins.
                  </span>
                </span>
                <span className="lac-hand lac-sticky-gold">mood first →</span>
              </figcaption>
            </figure>
            <p className="lac-hand lac-note lac-note-corner" aria-hidden>
              color · texture · story
            </p>
            <div className="lac-note lac-note-studio">
              <p className="la-eyebrow text-[0.7rem]">Studio note</p>
              <p className="lac-hand mt-1 text-[1.3rem] leading-tight">
                Pin it. Live with it. Let it change.
              </p>
            </div>
          </div>
        </div>
        <a href="#collage" className="lac-scroll" aria-label="See what we design">
          <ChevronDown size={22} aria-hidden />
        </a>
      </section>

      {/* Collage */}
      <section id="collage" className="la-section scroll-mt-24">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <Eyebrow>What we design</Eyebrow>
              <h2 className="la-serif mt-4 text-[2.4rem] leading-[1.06] md:text-[3.4rem]">
                One studio. Every kind of wear.
              </h2>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-black/70">
                Tailoring to teamwear, evening to everyday. If it can be worn or carried, we can
                design it — in your brand's voice.
              </p>
            </div>
            <p className="lac-hand text-[1.2rem] text-black/70">design concepts ↓</p>
          </div>
          <ul className="lac-collage mt-14">
            {COLLAGE.map((piece, index) => (
              <li key={piece.title} className={`lac-polaroid lac-tilt-${index % 4}`}>
                <span className="lac-pin" aria-hidden />
                <img src={piece.src} alt={piece.alt} loading="lazy" />
                <div className="flex items-baseline justify-between gap-3 px-1 pt-3">
                  <h3 className="la-serif text-[1.35rem]">{piece.title}</h3>
                  <span className="lac-hand text-[1rem] text-black/60">{piece.note}</span>
                </div>
              </li>
            ))}
            <li className="lac-note lac-collage-note">
              <p className="la-eyebrow text-[0.7rem]">Also in the studio</p>
              <p className="lac-hand mt-2 text-[1.2rem] leading-snug">
                prints & scarves · knitwear · kids & family · bridal party · event capsules
              </p>
            </li>
          </ul>
          <p className="mt-8 text-[0.85rem] text-black/50">
            Concept images created for this page to show the range of the studio.
          </p>
        </div>
      </section>

      {/* Toolkit */}
      <section className="la-section la-panel" aria-labelledby="toolkit-title">
        <div className="mx-auto max-w-[1320px]">
          <div className="max-w-2xl">
            <Eyebrow>The studio toolkit</Eyebrow>
            <h2
              id="toolkit-title"
              className="la-serif mt-4 text-[2.4rem] leading-[1.06] md:text-[3.4rem]"
            >
              Hand, screen and fitting room.
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-black/70">
              The same professional tools the industry builds on, so your files move straight to
              your manufacturer, printer or team.
            </p>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLKIT.map(({ id, use }) => {
              const tool = TOOLS[id];
              return (
                <li
                  key={id}
                  className={`la-card ${id === "workspace" ? "is-featured sm:col-span-2 lg:col-span-3" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    {tool.logo ? (
                      <span className="lac-tool-logo">
                        <img src={tool.logo} alt="" />
                      </span>
                    ) : null}
                    <h3 className="text-[1.2rem] font-semibold">{tool.name}</h3>
                  </div>
                  <p className="mt-4 text-[1rem] leading-relaxed text-black/70">{use}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="la-section scroll-mt-24" aria-labelledby="process-title">
        <div className="mx-auto max-w-[1320px]">
          <div className="max-w-2xl">
            <Eyebrow>The process</Eyebrow>
            <h2
              id="process-title"
              className="la-serif mt-4 text-[2.4rem] leading-[1.06] md:text-[3.4rem]"
            >
              From a feeling to a finished piece.
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-black/70">
              Five stages, start to finish. You see and approve the work at every one.
            </p>
          </div>
          <ol className="lac-stages mt-16">
            {STAGES.map((stage, index) => (
              <li key={stage.title} className="lac-stage">
                <div className="lac-stage-copy">
                  <span className="la-serif lac-stage-num">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="la-serif mt-3 text-[2rem] leading-tight md:text-[2.4rem]">
                    {stage.title}
                  </h3>
                  <p className="mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-black/70">
                    {stage.text}
                  </p>
                  {stage.tools.length ? (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {stage.tools.map((id) => (
                        <ToolChip key={id} id={id} />
                      ))}
                    </div>
                  ) : null}
                  <p className="lac-hand mt-6 text-[1.3rem] text-[#8a6412]">{stage.note}</p>
                </div>
                {stage.image ? (
                  <figure className={`lac-polaroid lac-stage-media lac-tilt-${index % 4}`}>
                    <span className="lac-tape lac-tape-top" aria-hidden />
                    <img src={stage.image.src} alt={stage.image.alt} loading="lazy" />
                  </figure>
                ) : (
                  <div className="lac-note lac-stage-media lac-stage-note">
                    <p className="la-eyebrow text-[0.7rem]">Before we cut</p>
                    <p className="lac-hand mt-2 text-[1.4rem] leading-snug">
                      sample in 3D → check fit &amp; proportion → tech pack your maker can build
                      from
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <BookingBand
        title="Have something in mind?"
        text="Tell us about your project — a capsule, a uniform, a product line — and we'll set up a design consultation."
        service="design-studio"
      />
    </SiteFrame>
  );
}
