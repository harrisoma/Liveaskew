import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles, Palette, Gem, Building2 } from "lucide-react";
import { HangerIcon } from "@/components/icons/HangerIcon";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SocialNavigator } from "@/components/SocialNavigator";
import { HomeBeeChat } from "@/components/HomeBeeChat";
import { BeeOrb, type BeeOrbState } from "@/components/BeeOrb";
import { track } from "@/lib/analytics";
import heroOrb from "@/assets/hero-orb.png.asset.json";
import flatlayImage from "@/assets/wardrobe-flatlay.jpg";
import philosophyNoir from "@/assets/philosophy-noir-flatlay.jpg";
import philosophyMens from "@/assets/philosophy-mens-flatlay.jpg";
import philosophyWomens from "@/assets/philosophy-womens-flatlay.jpg";
import philosophyPair from "@/assets/philosophy-pair-flatlay.jpg";
import quoteImage from "@/assets/quote-portrait.jpg";
import beePortrait from "@/assets/bee-portrait.png.asset.json";
import avatar01 from "@/assets/avatars/avatar-01.jpg";
import avatar02 from "@/assets/avatars/avatar-02.jpg";
import avatar03 from "@/assets/avatars/avatar-03.jpg";
import avatar04 from "@/assets/avatars/avatar-04.jpg";
import formulaMaximalist from "@/assets/formulas/formula-maximalist.jpg";
import formulaQuietLuxury from "@/assets/formulas/formula-quiet-luxury.jpg";
import formulaRefinedClassic from "@/assets/formulas/formula-refined-classic.jpg";
import formulaHeritageModern from "@/assets/formulas/formula-heritage-modern.jpg";
import formulaCurveConfident from "@/assets/formulas/formula-curve-confident.jpg";
import formulaModestChic from "@/assets/formulas/formula-modest-chic.jpg";
import formulaAndrogyne from "@/assets/formulas/formula-androgyne.jpg";
import formulaSportLuxe from "@/assets/formulas/formula-sport-luxe.jpg";

// Outfit formulas — no photography, no AI-generated faces.
// Each card is a styling recipe: a named aesthetic and the exact pieces that build it.
const OUTFIT_FORMULAS = [
  {
    label: "Maximalist",
    illustration: formulaMaximalist,
    palette: ["#3d2418", "#8a4a2b", "#c9a84c"],
    formula: [
      "Leopard-print coat",
      "Amber silk blouse",
      "Layered gold chains",
      "Tailored wide-leg trouser",
      "Pointed leather boot",
    ],
  },
  {
    label: "Quiet Luxury",
    illustration: formulaQuietLuxury,
    palette: ["#f1ece2", "#d8cfbe", "#8a7e68"],
    formula: [
      "Ivory silk shirt",
      "Camel high-waist trouser",
      "Slim leather belt",
      "Almond suede mule",
      "Single pearl stud",
    ],
  },
  {
    label: "Refined Classic",
    illustration: formulaRefinedClassic,
    palette: ["#c9a87c", "#e8dcc4", "#2d2418"],
    formula: [
      "Camel cashmere overcoat",
      "Cream cashmere crew",
      "Pearl strand",
      "Pleated wool trouser",
      "Leather loafer",
    ],
  },
  {
    label: "Heritage Modern",
    illustration: formulaHeritageModern,
    palette: ["#0f4a3a", "#7a2b3a", "#c9a84c"],
    formula: [
      "Jewel-toned silk dress",
      "Structured shoulder",
      "Heritage textile scarf",
      "Gold cuff",
      "Sculptural heel",
    ],
  },
  {
    label: "Curve Confident",
    illustration: formulaCurveConfident,
    palette: ["#5a1820", "#8a2a3a", "#e8c8a8"],
    formula: [
      "Burgundy wrap dress",
      "Defined waist tie",
      "Three-quarter sleeve",
      "Nude pointed pump",
      "Gold hoop",
    ],
  },
  {
    label: "Modest Chic",
    illustration: formulaModestChic,
    palette: ["#f5ede0", "#d8c8a8", "#c9a84c"],
    formula: [
      "Cream silk hijab",
      "Long-sleeve column dress",
      "Gold cuff embroidery",
      "Wide leather belt",
      "Leather flat",
    ],
  },
  {
    label: "Androgyne",
    illustration: formulaAndrogyne,
    palette: ["#2a2a2e", "#5a5a5e", "#f1ece2"],
    formula: [
      "Oversized charcoal blazer",
      "Crisp white shirt, collar open",
      "Tailored black trouser",
      "Black leather derby",
      "Silver signet",
    ],
  },
  {
    label: "Sport Luxe",
    illustration: formulaSportLuxe,
    palette: ["#4a5a2a", "#8a9a6a", "#e8dcc4"],
    formula: [
      "Olive fine-knit turtleneck",
      "Cream wide-leg trouser",
      "Slim trench",
      "White leather sneaker",
      "Gold hoop",
    ],
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bee by LiveAskew — Inclusive Personal AI Stylist" },
      {
        name: "description",
        content:
          "Bee is an inclusive conversational AI stylist that builds a monthly style guide only for you. Free for 14 days.",
      },
      { property: "og:title", content: "Bee by LiveAskew — Inclusive Personal AI Stylist" },
      {
        property: "og:description",
        content:
          "An inclusive conversational AI stylist that builds a monthly style guide only for you. Free for 14 days.",
      },
      { property: "og:url", content: "https://liveaskew.com/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://liveaskew.com/" }],
  }),
  component: LandingPage,
});

const STEPS = [
  {
    n: "01",
    title: "Meet Bee",
    body: "You arrive. Bee — your AI stylist — introduces herself. No card, no pressure. Just a first conversation.",
  },
  {
    n: "02",
    title: "Your onboarding interview",
    body: "Warm-up, cultural context, style journey, body conversation, photos, colour, budget, wardrobe inventory, lifestyle — closed with a reflection in Bee's own voice.",
  },
  {
    n: "03",
    title: "Choose your tier",
    body: "Fourteen days free on Gold. Add a card so Bee can keep going — you won't be charged until day fourteen.",
  },
  {
    n: "04",
    title: "Your style north star",
    body: "Bee builds eight hero looks and sixteen variations — a thirty-day rotation drawn directly from your profile, delivered as a monthly magazine.",
  },
  {
    n: "05",
    title: "Daily life with Bee",
    body: "Today's look. A voice you can talk to. The magazine. Your wardrobe, always close — and a quarterly Closet Reset to keep it honest.",
  },
];

const PROMISES = [
  {
    k: "Real bodies",
    v: "We never alter, slim or smooth your image. The woman in the mirror is the woman in the guide.",
  },
  {
    k: "Beautiful light",
    v: "Photos are lit, framed and rendered with the care of an editorial shoot — honest, never harsh.",
  },
  {
    k: "A safe space",
    v: "Bee is warm, sharp and protective. Your wardrobe, body and budget stay between the two of you.",
  },
  {
    k: "Cultural fluency",
    v: "Hijab, sari, kente, kimono, modest, maximalist — Bee dresses heritage, never around it.",
  },
];

const RESET_OUTCOMES = [
  { tag: "Keep", body: "It serves the woman you are now. Bee builds around it." },
  { tag: "Tailor", body: "The bones are right. A small alteration brings it home." },
  { tag: "Sell", body: "Beautiful, but for someone else. Bee suggests the route." },
  { tag: "Donate", body: "Its work with you is done. Pass it on, with grace." },
];

const TESTIMONIALS = [
  {
    quote:
      "I never knew my style until LiveAskew showed me. The guide felt like it was written by someone who'd known me for years.",
    name: "Sarah M.",
    tier: "Platinum Plus",
  },
  {
    quote:
      "The conversational intake is unlike anything I've experienced. It felt natural, not clinical. My style guide was perfect.",
    name: "Priya K.",
    tier: "Platinum",
  },
  {
    quote:
      "I finally stopped wasting money on things that don't work together. My closet actually makes sense now.",
    name: "Claire D.",
    tier: "Gold",
  },
];

function HeroCTA() {
  // A/B test variant selector — stable per session via localStorage.
  // Override with ?ab=1, ?ab=2, or ?ab=3 in the URL to preview a specific variant.
  const [variant, setVariant] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("ab");
    if (override === "1" || override === "2" || override === "3") {
      setVariant(Number(override) as 1 | 2 | 3);
      return;
    }
    const stored = localStorage.getItem("la_ab_cta");
    if (stored === "1" || stored === "2" || stored === "3") {
      setVariant(Number(stored) as 1 | 2 | 3);
      return;
    }
    const pick = (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3;
    localStorage.setItem("la_ab_cta", String(pick));
    setVariant(pick);
  }, []);

  const variants = {
    1: {
      label: "Begin your 14-day trial",
      sub: "No card required",
    },
    2: {
      label: "Meet your AI stylist",
      sub: "Free. Personal. Yours.",
    },
    3: {
      label: "Get styled — free",
      sub: "14 days on us",
    },
  };

  const v = variants[variant];

  return (
    <Link
      to="/auth"
      search={{ mode: "signup" }}
      data-ab-variant={variant}
      onClick={() => track({ event: "hero_cta_click", variant, label: v.label })}
      className="neo-btn-gold group inline-flex flex-col items-start gap-0.5 text-[0.72rem]"
    >
      <span className="inline-flex items-center gap-3">
        {v.label}
        <ArrowUpRight
          size={16}
          className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </span>
      <span className="text-[0.6rem] tracking-[0.18em] text-cream/70 normal-case">{v.sub}</span>
    </Link>
  );
}

function LandingPage() {
  // Live hero demo — cycle Bee through her behaviors so visitors actually see them.
  // idle → listening → thinking → speaking → presenting(with palette) → idle…
  const [beeState, setBeeState] = useState<BeeOrbState>("idle");
  const [beePalette, setBeePalette] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    const PALETTES: string[][] = [
      ["#3d2418", "#8a4a2b", "#c9a84c"], // maximalist
      ["#1f2a37", "#8a8f7d", "#e9e3d3"], // quiet luxury
      ["#2b1d3a", "#5b6cff", "#e6cd86"], // editorial
      ["#5a1f1f", "#c97a4a", "#f3e6c8"], // heritage
    ];
    let i = 0;
    const cycle = [
      { state: "idle" as const, dur: 2600, palette: undefined },
      { state: "listening" as const, dur: 2200, palette: undefined },
      { state: "thinking" as const, dur: 2000, palette: undefined },
      { state: "speaking" as const, dur: 2200, palette: undefined },
      { state: "presenting" as const, dur: 2600, palette: PALETTES[0] },
      { state: "idle" as const, dur: 2400, palette: PALETTES[0] },
      { state: "presenting" as const, dur: 2600, palette: PALETTES[1] },
      { state: "idle" as const, dur: 2400, palette: PALETTES[1] },
      { state: "presenting" as const, dur: 2600, palette: PALETTES[2] },
      { state: "idle" as const, dur: 2400, palette: PALETTES[2] },
      { state: "presenting" as const, dur: 2600, palette: PALETTES[3] },
      { state: "idle" as const, dur: 3000, palette: undefined },
    ];
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const step = cycle[i % cycle.length];
      setBeeState(step.state);
      setBeePalette(step.palette);
      i++;
      timer = setTimeout(tick, step.dur);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <Nav />

      {/* ───────── Hero — dark clay neomorphism, gold orb ───────── */}
      <section className="relative overflow-hidden text-cream neo-dark pt-8">
        {/* radial gold glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(1100px 700px at 50% 55%, color-mix(in oklab, var(--gold) 22%, transparent), transparent 65%), radial-gradient(700px 400px at 85% 15%, color-mix(in oklab, var(--gold) 12%, transparent), transparent 60%)",
          }}
        />
        {/* faint gold grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--gold) 1px, transparent 1px), linear-gradient(to bottom, var(--gold) 1px, transparent 1px)",
            backgroundSize: "120px 120px",
          }}
        />
        {/* sweeping gold lines */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 1400 900"
        >
          <defs>
            <linearGradient id="goldLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--gold)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 0 300 Q 350 180 700 360 T 1400 320"
            fill="none"
            stroke="url(#goldLine)"
            strokeWidth="1.2"
          />
          <path
            d="M 0 560 Q 400 700 800 520 T 1400 600"
            fill="none"
            stroke="url(#goldLine)"
            strokeWidth="1"
            opacity="0.7"
          />
          <path
            d="M 0 720 Q 500 600 900 760 T 1400 700"
            fill="none"
            stroke="url(#goldLine)"
            strokeWidth="0.8"
            opacity="0.5"
          />
        </svg>

        <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 gap-10 px-6 pt-28 pb-20 md:px-10 lg:grid-cols-12 lg:gap-10 lg:pt-32 lg:pb-28">
          {/* Left column */}
          <div className="lg:col-span-5 lg:pt-6">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <p className="eyebrow text-gold">Issue 01 · Personal AI Styling</p>
              <span className="hidden h-px w-10 bg-gold/60 md:block" />
              <span className="inline-flex items-center gap-2 text-[0.6rem] font-medium tracking-[0.28em] uppercase text-cream/60">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
                </span>
                Intake open · Spring volume
              </span>
            </div>

            <h1 className="font-display mt-8 text-[3.4rem] leading-[0.92] tracking-tight text-cream md:text-[4.4rem] lg:text-[5.2rem]">
              Style that
              <br />
              feels like{" "}
              <span className="relative inline-block">
                <em className="relative z-10 text-gold">you</em>
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 z-0 h-3 w-full rounded-full bg-gold/25 md:h-4"
                />
              </span>
              .
            </h1>

            <div className="mt-10 flex items-start gap-5 max-w-md">
              <span className="mt-3 h-1 w-10 shrink-0 rounded-full bg-gold" />
              <p className="text-base leading-relaxed text-cream/75">
                Bee by LiveAskew is an inclusive personal AI stylist — conversational, intelligent,
                and built for every body, heritage, and way of dressing. From assessment to
                wardrobe, we do the quiet work so you can simply get dressed.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
              <HeroCTA />
              <a
                href="#process"
                className="text-[0.72rem] font-medium tracking-[0.22em] text-cream uppercase pb-1 hover:text-gold"
              >
                Read the process
              </a>

              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[avatar01, avatar02, avatar03, avatar04].map((s, i) => (
                    <img
                      key={i}
                      src={s}
                      alt=""
                      aria-hidden
                      className="h-7 w-7 rounded-full border-2 border-ink object-cover"
                    />
                  ))}
                </div>
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-cream/65">
                  2,400+ styled
                </span>
              </div>
            </div>

            <dl className="mt-14 grid max-w-lg grid-cols-3 gap-4">
              {[
                ["30", "Daily looks / month"],
                ["8", "Hero pieces"],
                ["1", "Wardrobe, refined"],
              ].map(([k, v]) => (
                <div key={v} className="neo-dark-inset rounded-3xl px-3 py-4 text-center">
                  <dt className="font-display text-3xl text-gold">{k}</dt>
                  <dd className="mt-1 text-[0.65rem] tracking-[0.2em] uppercase text-cream/65">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right column — the orb */}
          <div className="relative flex items-center lg:col-span-7">
            <figure className="relative mx-auto w-full max-w-[520px]">
              <div className="relative neo-dark-inset rounded-[3rem] p-8 md:p-12">
                <img
                  src={heroOrb.url}
                  alt="The LiveAskew AI Stylist orb — a gold woven sphere projecting wardrobe analysis, outfit recommendations, style insights, color guide and curated shopping"
                  className="relative mx-auto w-full max-w-[400px] select-none drop-shadow-[0_0_24px_color-mix(in_oklab,var(--gold)_55%,transparent)]"
                  draggable={false}
                  loading="eager"
                />

                {/* Animated gold icon callouts — orbiting around the orb */}
                {[
                  {
                    Icon: HangerIcon,
                    title: "Wardrobe",
                    desc: "Your closet, decoded",
                    top: "6%",
                    left: "-14%",
                    align: "left" as const,
                    delay: "0s",
                  },
                  {
                    Icon: Building2,
                    title: "Shop",
                    desc: "Curated just for you",
                    top: "10%",
                    right: "-14%",
                    align: "right" as const,
                    delay: "0.8s",
                  },
                  {
                    Icon: Gem,
                    title: "Your Look",
                    desc: "Looks made for you",
                    top: "40%",
                    left: "-16%",
                    align: "left" as const,
                    delay: "1.6s",
                  },
                  {
                    Icon: Palette,
                    title: "Palette",
                    desc: "Colors that complement",
                    top: "46%",
                    right: "-16%",
                    align: "right" as const,
                    delay: "2.2s",
                  },
                  {
                    Icon: Sparkles,
                    title: "Bee AI",
                    desc: "Your personal stylist",
                    top: "-12%",
                    left: "50%",
                    align: "center" as const,
                    delay: "1.2s",
                  },
                ].map(({ Icon, title, desc, top, left, right, align, delay }, i) => {
                  const isCenter = align === "center";
                  const isLeft = align === "left";
                  const posStyle: React.CSSProperties = isCenter
                    ? { top, left: left ?? "50%", transform: "translateX(-50%) translateY(-50%)" }
                    : isLeft
                      ? { top, left: left ?? "0%", transform: "translateY(-50%)" }
                      : { top, right: right ?? "0%", transform: "translateY(-50%)" };
                  const textAlign = isCenter ? "text-center" : isLeft ? "text-left" : "text-right";
                  const itemsAlign = isCenter
                    ? "items-center"
                    : isLeft
                      ? "items-start"
                      : "items-end";
                  const animName = isCenter ? "float-center" : "float-edge";

                  return (
                    <span
                      key={i}
                      aria-hidden
                      className={`absolute flex flex-col gap-1.5 ${itemsAlign}`}
                      style={{
                        ...posStyle,
                        animation: `${animName} 4s ease-in-out ${delay} infinite`,
                      }}
                    >
                      {/* pulsing halo */}
                      <span className="relative">
                        <span
                          className="absolute inset-0 -m-3 rounded-full bg-gold/40 blur-md"
                          style={{ animation: `gold-pulse 3s ease-in-out ${delay} infinite` }}
                        />
                        <span className="relative grid h-11 w-11 place-items-center rounded-full neo-dark-raised">
                          <Icon size={16} className="text-gold" strokeWidth={1.4} />
                        </span>
                      </span>
                      {/* label */}
                      <div className={`whitespace-nowrap ${textAlign}`}>
                        <p className="text-[0.65rem] font-semibold tracking-[0.18em] uppercase text-gold">
                          {title}
                        </p>
                        <p className="text-[0.6rem] tracking-[0.12em] text-cream/60">{desc}</p>
                      </div>
                    </span>
                  );
                })}
              </div>

              <figcaption className="mt-6 flex items-center justify-between">
                <p className="text-[0.6rem] tracking-[0.25em] uppercase text-cream/55">
                  The Stylist · Vol. 01 / 2026
                </p>
                <p className="font-display italic text-sm text-cream/70">
                  "AI that understands you."
                </p>
              </figcaption>
            </figure>
          </div>
        </div>

        {/* Marquee strip */}
        <div className="relative px-6 py-8 md:px-10">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-center gap-3">
            {[
              "Inclusive styling",
              "AI-generated guides",
              "Conversational intake",
              "Curated shopping",
              "Stylist reviewed",
              "Free for 14 days",
            ].map((f) => (
              <span
                key={f}
                className="neo-dark-raised rounded-full px-4 py-2 text-[0.65rem] font-medium tracking-[0.22em] uppercase text-cream/75"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Talk to Bee — live chat, no account needed ───────── */}
      <HomeBeeChat />

      {/* ───────── Meet Bee ───────── */}
      <section
        id="bee"
        className="neo-dark px-6 py-24 sm:px-8 md:px-10 md:py-32 lg:px-12 lg:py-36 xl:px-16"
      >
        <div className="mx-auto grid max-w-[1400px] grid-cols-12 items-start gap-10 sm:gap-12 md:gap-10 lg:gap-16 xl:gap-24">
          <div className="order-2 col-span-12 min-w-0 md:order-1 md:col-span-7 md:pr-4 lg:col-span-8 lg:pr-6 xl:pr-10">
            <p className="eyebrow">Plate I · Meet Bee</p>
            <h2 className="font-display mt-6 text-5xl leading-[1] tracking-tight text-cream md:text-6xl lg:text-7xl">
              Hello. I'm <em className="text-gold">Bee</em>.
            </h2>
            <span className="gold-rule mt-8 !mx-0" />
            <p className="mt-8 max-w-xl text-base leading-relaxed text-cream/70">
              The AI stylist inside LiveAskew. I don't recommend algorithms; I have conversations. I
              ask, I listen, I remember, and I build a wardrobe language that is unmistakably yours.
            </p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/70">
              My story began in <em className="text-cream/90">Miami</em> — where color, heat, and
              unapologetic confidence taught me that style is a language you wear. But I don't have
              a single signature. Minimal or maximal, quiet or bold, classic or street — I build
              across every aesthetic, because the only one that matters is yours. My craft rests on
              three things:
              <em className="text-cream/90"> fit</em>, <em className="text-cream/90">feel</em>, and{" "}
              <em className="text-cream/90">fabric</em>.
            </p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/70">
              We'll talk like friends. I'll listen more than I speak. And when the moment is right,
              I'll <em className="text-cream/90">expand</em> what you imagined for yourself,
              <em className="text-cream/90"> explore</em> what suits the life you actually lead, and{" "}
              <em className="text-cream/90">execute</em> a wardrobe that finally feels like home.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {[
                {
                  title: "She Listens",
                  body: "Voice-first styling. No quizzes — just talk.",
                  stat: "60",
                  statLabel: "MIN / mo",
                },
                {
                  title: "She Learns",
                  body: "Remembers your shape, climate, and mood.",
                  stat: "30",
                  statLabel: "Looks",
                },
                {
                  title: "She Creates",
                  body: "Monthly editorial Magazine with hero looks.",
                  stat: "8",
                  statLabel: "Hero pcs",
                },
                {
                  title: "She Shows Truth",
                  body: "Real bodies. Zero retouching. Zero shame.",
                  stat: "0",
                  statLabel: "Edit",
                },
                {
                  title: "She Edits",
                  body: "Closet curation. Know what you own.",
                  stat: "∞",
                  statLabel: "Items",
                },
                {
                  title: "She Remembers",
                  body: "Your complete style history, always.",
                  stat: "1",
                  statLabel: "Profile",
                },
                {
                  title: "She Plans",
                  body: "Calendar-aware occasion dressing.",
                  stat: "52",
                  statLabel: "Wks / yr",
                },
                {
                  title: "She Shops",
                  body: "Curated links. Buy less, buy right.",
                  stat: "1",
                  statLabel: "Click",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="flex min-w-[150px] flex-1 flex-col rounded-3xl neo-dark-raised p-4"
                >
                  <p className="text-[0.55rem] tracking-[0.25em] uppercase text-gold">
                    {card.title}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-cream/70">{card.body}</p>

                  <div className="mt-auto pt-4">
                    <span className="font-display text-2xl text-gold">{card.stat}</span>
                    <span className="ml-1.5 text-[0.55rem] tracking-[0.15em] uppercase text-cream/50">
                      {card.statLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link to="/auth" search={{ mode: "signup" }} className="neo-btn-gold group">
                Meet Bee — free
                <ArrowUpRight
                  size={14}
                  className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
              <span className="text-[0.65rem] tracking-[0.25em] uppercase text-cream/50">
                No card · No pressure · ~60 min voice / mo on Gold
              </span>
            </div>
          </div>

          <div className="order-1 col-span-12 flex min-w-0 justify-center md:order-2 md:col-span-5 md:justify-end lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative flex w-full max-w-[320px] flex-col items-center sm:max-w-[360px] md:max-w-[300px] lg:max-w-[380px] xl:max-w-[420px] md:sticky md:top-24"
            >
              <BeeOrb
                state={beeState}
                palette={beePalette}
                size={380}
                surface="dark"
                showOuterGlow={false}
                ariaLabel="Bee — your AI stylist"
                className="mx-auto"
              />
              {/* voice card */}
              <div className="mt-8 flex items-center gap-2 rounded-full neo-dark-raised px-4 py-2.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                </span>
                <span className="text-[0.55rem] tracking-[0.28em] uppercase text-cream/65">
                  Bee is listening
                </span>
                <span className="ml-3 font-display italic text-xs text-gold">60 MIN/MO</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────── Styled for every woman ───────── */}
      <section className="bg-cream py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="eyebrow">The Spectrum</p>
              <h2 className="font-display mt-6 text-5xl leading-[0.98] tracking-tight md:text-6xl lg:text-7xl">
                Styled for
                <br />
                <em className="text-gold-deep">every</em>&nbsp;body.
              </h2>
            </div>
            <div className="lg:col-span-5">
              <span className="gold-rule !mx-0" />
              <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/65">
                Twenty-five. Sixty-five. Curve, petite, tall. Hijabi, modest, maximalist, sport.
                Heritage cloth or sharp suiting. LiveAskew listens, then dresses the woman in front
                of it — never a type.
              </p>
            </div>
          </div>

          {/* Outfit-formula cards — typographic, no portraiture */}
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {OUTFIT_FORMULAS.map((o, i) => (
              <motion.article
                key={o.label}
                initial={{ opacity: 0, scale: 0.88, y: 40 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.08 }}
                className="group relative flex flex-col rounded-[2rem] bg-cream p-6 shadow-neo md:p-8"
              >
                <header className="flex items-start justify-between gap-4">
                  <span className="text-[0.55rem] tracking-[0.3em] uppercase text-ink/40">
                    N° {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex gap-1.5" aria-hidden>
                    {o.palette.map((c) => (
                      <span
                        key={c}
                        className="h-3 w-3 rounded-full ring-1 ring-ink/10"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </header>

                <div className="relative mt-6 aspect-[3/4] overflow-hidden rounded-3xl shadow-neo-inset">
                  <img
                    src={o.illustration}
                    alt={`Hand-painted fashion illustration of the ${o.label} outfit formula.`}
                    width={768}
                    height={1024}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                </div>

                <h3 className="font-display mt-6 text-2xl leading-tight md:text-3xl">{o.label}</h3>
                <span className="mt-3 block h-1 w-8 rounded-full bg-gold" />

                <ul className="mt-5 space-y-1.5">
                  {o.formula.map((piece, idx) => (
                    <li key={piece} className="flex gap-3 text-sm leading-relaxed text-ink/75">
                      <span className="font-display text-gold-deep tabular-nums">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span>{piece}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Process ───────── */}
      <section id="process" className="px-6 py-28 md:px-10 md:py-36">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
              <p className="eyebrow">The Process</p>
              <h2 className="font-display mt-6 text-5xl leading-[1] tracking-tight md:text-6xl">
                Five quiet
                <br />
                steps to a<br />
                considered
                <br />
                wardrobe.
              </h2>
              <span className="gold-rule mt-8 !mx-0" />
              <p className="mt-8 max-w-sm text-sm leading-relaxed text-ink/65">
                We move slowly, deliberately, and with care. Nothing rushed — because the way you
                dress is rarely an emergency.
              </p>
            </div>

            <ol className="flex flex-col gap-5 lg:col-span-8">
              {STEPS.map((s, i) => (
                <li
                  key={s.n}
                  className="group grid grid-cols-12 items-start gap-6 rounded-[1.75rem] bg-cream p-6 shadow-neo md:p-8"
                >
                  <span className="col-span-2 font-display text-3xl text-gold-deep md:text-4xl">
                    {s.n}
                  </span>
                  <div className="col-span-10 md:col-span-7">
                    <h3 className="font-display text-2xl md:text-3xl">{s.title}</h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/65">{s.body}</p>
                  </div>
                  <div className="hidden md:col-span-3 md:flex md:justify-end">
                    <span className="text-[0.6rem] tracking-[0.3em] uppercase text-ink/35">
                      Step {i + 1}/5
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ───────── Editorial quote ───────── */}
      <section className="relative mx-6 my-8 h-[68vh] min-h-[520px] overflow-hidden rounded-[2.5rem] shadow-neo-lg md:mx-10">
        <img
          src={quoteImage}
          alt="Editorial side portrait, warm golden light"
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/55 to-transparent" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] items-center px-6 md:px-10">
          <figure className="max-w-xl">
            <p className="eyebrow text-gold-soft">A Founder's Note</p>
            <blockquote className="font-display mt-6 text-3xl leading-[1.15] text-cream md:text-5xl">
              "Your wardrobe should tell the world who you are —{" "}
              <em className="text-gold-soft">before you speak</em>."
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-3 text-cream/70">
              <span className="h-px w-10 bg-gold" />
              <span className="text-[0.65rem] tracking-[0.3em] uppercase">Founder, LiveAskew</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ───────── The Philosophy — Bee revitalizes your closet ───────── */}
      <section className="px-6 py-28 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <article className="neo-dark relative overflow-hidden rounded-[2.5rem] shadow-neo-lg">
            {/* gold hairline frame */}
            <span className="pointer-events-none absolute inset-x-6 top-6 h-px bg-gold/40" />
            <span className="pointer-events-none absolute inset-x-6 bottom-6 h-px bg-gold/40" />
            <span className="pointer-events-none absolute inset-y-6 left-6 w-px bg-gold/40" />
            <span className="pointer-events-none absolute inset-y-6 right-6 w-px bg-gold/40" />

            <div className="px-8 pt-14 md:px-14 md:pt-20 lg:px-16 lg:pt-24">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-gold" />
                <p className="text-[0.6rem] font-medium tracking-[0.4em] uppercase text-gold">
                  The Philosophy
                </p>
              </div>
              <h2 className="font-display mt-8 max-w-3xl text-4xl leading-[1.05] text-cream md:text-5xl lg:text-[3.4rem]">
                Bee revitalizes
                <br />
                <em className="text-gold not-italic font-normal italic">your closet.</em>
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 px-8 pt-12 pb-14 md:px-14 md:pb-20 lg:grid-cols-4 lg:px-16 lg:pb-24">
              {[
                { src: philosophyNoir, label: "Atelier Noir", tag: "His · Eveningwear" },
                { src: philosophyMens, label: "Tailored Day", tag: "His · Workweek" },
                { src: philosophyWomens, label: "Quiet Luxury", tag: "Hers · Daily" },
                { src: philosophyPair, label: "His & Hers", tag: "Weekend Pairing" },
              ].map((look, i) => (
                <figure
                  key={look.label}
                  className="group relative overflow-hidden rounded-3xl neo-dark-inset"
                >
                  <img
                    src={look.src}
                    alt={`${look.label} flatlay styled by Bee`}
                    loading="lazy"
                    width={1024}
                    height={1280}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                    <p className="font-display text-[0.55rem] tracking-[0.35em] uppercase text-gold/80">
                      Plate {["I", "II", "III", "IV"][i]}
                    </p>
                    <p className="font-display mt-2 text-lg text-cream md:text-xl">{look.label}</p>
                    <p className="mt-1 text-[0.6rem] tracking-[0.25em] uppercase text-cream/55">
                      {look.tag}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="border-t border-gold/15 px-8 pb-14 pt-8 text-center md:px-14 lg:px-16">
              <p className="text-[0.55rem] tracking-[0.45em] uppercase text-cream/40">
                LiveAskew · Maison Doctrine · MMXXVI
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* ───────── The Promise ───────── */}
      <section className="neo-dark mx-6 my-8 rounded-[2.5rem] px-6 py-28 shadow-neo-lg md:mx-10 md:px-10 md:py-32">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="eyebrow">The Promise</p>
              <h2 className="font-display mt-6 text-5xl leading-[1] tracking-tight text-cream md:text-6xl">
                Real bodies.
                <br />
                <em className="text-gold">Beautiful light.</em>
                <br />
                Never altered.
              </h2>
            </div>
            <div className="lg:col-span-5">
              <span className="gold-rule !mx-0" />
              <p className="mt-6 max-w-md text-sm leading-relaxed text-cream/65">
                Other tools slim, smooth and edit you into someone else. Bee does the opposite — she
                lights you well and dresses you truthfully. That is the entire foundation.
              </p>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map((p, i) => (
              <article key={p.k} className="neo-dark-raised rounded-[1.75rem] p-8">
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-3xl text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="text-[0.55rem] tracking-[0.3em] uppercase text-cream/40">
                    Vow {i + 1}/4
                  </p>
                </div>
                <h3 className="font-display mt-6 text-2xl leading-tight text-cream">{p.k}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cream/70">{p.v}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Closet Reset ───────── */}
      <section className="bg-cream px-6 py-28 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <p className="eyebrow">Quarterly · The Closet Reset</p>
            <h2 className="font-display mt-6 text-5xl leading-[1] tracking-tight md:text-6xl">
              Four questions.
              <br />
              <em className="text-gold-deep">Four answers.</em>
            </h2>
            <span className="gold-rule mt-8 !mx-0" />
            <p className="mt-8 max-w-sm text-sm leading-relaxed text-ink/65">
              Once a season, Bee walks your wardrobe with you. Piece by piece. She asks four quiet
              questions, and every garment finds one of four homes — so your closet keeps pace with
              the woman you're becoming.
            </p>
          </div>

          <ol className="flex flex-col gap-5 lg:col-span-7">
            {RESET_OUTCOMES.map((o, i) => (
              <li
                key={o.tag}
                className="group grid grid-cols-12 items-start gap-6 rounded-[1.75rem] bg-cream p-6 shadow-neo md:p-8"
              >
                <span className="col-span-2 font-display text-3xl text-gold-deep md:text-4xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="col-span-7 md:col-span-7">
                  <h3 className="font-display text-2xl md:text-3xl">{o.tag}</h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/65">{o.body}</p>
                </div>
                <div className="col-span-3 hidden md:flex md:justify-end">
                  <span className="text-[0.6rem] tracking-[0.3em] uppercase text-ink/35">
                    Outcome {i + 1}/4
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── Testimonials ───────── */}
      <section className="px-6 py-28 md:px-10 md:py-36">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-2xl">
            <p className="eyebrow">Letters from Members</p>
            <h2 className="font-display mt-6 text-4xl leading-[1.05] md:text-5xl">
              Wardrobes transformed.
              <br />
              <em className="text-gold-deep">Confidence, restored.</em>
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-[2rem] bg-cream p-10 shadow-neo">
                <p className="font-display text-xl italic leading-snug text-ink/85">"{t.quote}"</p>
                <figcaption className="mt-10 flex items-center gap-3">
                  <span className="h-px w-6 bg-gold" />
                  <div>
                    <p className="text-sm font-medium text-ink">{t.name}</p>
                    <p className="text-[0.6rem] tracking-[0.3em] uppercase text-gold-deep">
                      {t.tier} Member
                    </p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="relative mx-6 my-8 rounded-[2.5rem] px-6 py-32 text-cream shadow-neo-lg neo-dark md:mx-10 md:px-10 md:py-40">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow text-gold-soft">An Invitation</p>
          <h2 className="font-display mt-8 text-5xl leading-[1] md:text-7xl">
            Ready to meet
            <br />
            <em className="text-gold-soft">your style</em>?
          </h2>
          <span className="gold-rule mt-10" />
          <p className="mt-10 text-base leading-relaxed text-cream/65">
            Fourteen days, on us. No card required. Your inclusive AI stylist is waiting — and so,
            quietly, is the version of you that's already there.
          </p>
          <Link to="/auth" search={{ mode: "signup" }} className="neo-btn-gold mt-12 group">
            Begin today
            <ArrowUpRight
              size={14}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </section>

      <SocialNavigator />
      <Footer />
    </main>
  );
}
