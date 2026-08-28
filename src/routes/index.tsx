import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Mic, Sparkles } from "lucide-react";
import { useRef } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import heroOrb from "@/assets/hero-orb.png.asset.json";
import heroEditorial from "@/assets/hero-editorial.jpg";
import flatlayVisual from "@/assets/wardrobe-flatlay.jpg";
import pair from "@/assets/philosophy-pair-flatlay.jpg";
import noir from "@/assets/philosophy-noir-flatlay.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LiveAskew | Meet Bee, your AI stylist" },
      { name: "description", content: "LiveAskew creates useful, intelligent ways to find your style. Meet Bee, the AI stylist who listens before she styles." },
      { property: "og:title", content: "LiveAskew | Style starts with you" },
      { property: "og:description", content: "Meet Bee, the AI stylist who turns your real life into personal style." },
      { property: "og:url", content: "https://www.liveaskew.com/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://www.liveaskew.com/" }],
  }),
  component: LandingPage,
});

const fragments = ["The meetings you lead", "The body you live in", "The culture you carry", "The pieces you repeat", "The money you mean to spend", "The way you want to feel"];

function EnterBee({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/auth" search={{ mode: "signup" }} className={`la-magnetic group inline-flex items-center gap-8 px-6 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.22em] transition active:translate-y-px ${dark ? "bg-ink text-cream hover:bg-ink-soft" : "bg-lime text-ink hover:bg-[#e9ff72]"}`}>
      Enter Bee <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function LandingPage() {
  const storyRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: storyRef, offset: ["start end", "end start"] });
  const thread = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });
  const threadHeight = useTransform(thread, [0.08, 0.82], ["0%", "100%"]);
  const revealScale = useTransform(thread, [0.56, 0.78], [0.82, 1]);
  const revealOpacity = useTransform(thread, [0.52, 0.72], [0.15, 1]);

  return (
    <main className="overflow-hidden bg-cream text-ink">
      <Nav />
      <section className="la-hero relative min-h-[760px] overflow-hidden bg-[#ef5a3c] px-6 pb-14 pt-32 md:px-10 md:pt-40">
        <div className="la-grain absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-[1440px] items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }} className="relative z-10">
            <p className="mb-7 text-[0.68rem] font-semibold uppercase tracking-[0.28em]">LiveAskew presents Bee</p>
            <h1 className="font-display max-w-4xl text-[clamp(4.4rem,10vw,9.2rem)] leading-[0.78] tracking-[-0.065em]">Your life.<br /><em>Your style.</em></h1>
            <p className="mt-9 max-w-lg text-lg font-medium leading-7 md:text-xl">Bee listens to the whole story, then helps you dress like yourself on purpose.</p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <EnterBee dark />
              <a href="#meet-bee" className="border-b-2 border-ink pb-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em]">See how she thinks</a>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9, rotate: 4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 0.12, duration: 0.9, ease: [0.23, 1, 0.32, 1] }} className="relative mx-auto aspect-square w-full max-w-[650px]">
            <div className="absolute inset-[7%] rounded-full bg-lime" /><div className="absolute inset-[14%] rounded-full border-2 border-ink/20" />
            <img src={heroOrb.url} alt="Bee, LiveAskew's intelligent styling companion" className="relative h-full w-full object-contain drop-shadow-[0_28px_45px_rgba(47,23,19,0.28)]" />
            <div className="absolute bottom-[5%] left-[2%] -rotate-6 bg-cream px-4 py-3 font-display text-2xl shadow-[7px_7px_0_#222018]">She listens first.</div>
          </motion.div>
        </div>
      </section>

      <section className="bg-ink px-6 py-8 text-cream md:px-10"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-5"><p className="font-display text-2xl md:text-3xl">LiveAskew is the company.</p><p className="max-w-2xl text-sm leading-6 text-cream/68 md:text-base">We build style products that are useful, personal and alive. Bee is our first.</p></div></section>

      <section id="meet-bee" ref={storyRef} className="relative bg-[#f4efde] px-6 py-24 md:px-10 md:py-36">
        <div className="pointer-events-none absolute bottom-24 left-1/2 top-24 hidden w-px -translate-x-1/2 bg-ink/12 lg:block"><motion.div className="w-full origin-top bg-[#ef5a3c]" style={{ height: threadHeight }} /></div>
        <div className="relative mx-auto max-w-[1440px]"><div className="grid gap-16 lg:grid-cols-2 lg:gap-28">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#bb3e28]">A different kind of stylist</p>
            <h2 className="font-display mt-6 max-w-xl text-6xl leading-[0.88] tracking-[-0.04em] md:text-8xl">Bee starts with what fashion usually skips.</h2>
            <img src={heroEditorial} alt="A confident woman in an expressive personal look" width="900" height="1125" className="mt-12 aspect-[4/5] w-full max-w-lg object-cover object-top" />
          </div>
          <div className="pt-8 lg:pt-36">
            <p className="max-w-lg text-xl leading-8">Not your size and a quiz. Not a trend report. A real conversation about the life your clothes need to serve.</p>
            <div className="mt-16 space-y-5">{fragments.map((fragment, index) => <motion.div key={fragment} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.6 }} transition={{ delay: index * 0.05, duration: 0.5 }} className={`flex items-center gap-4 border-b border-ink/15 py-5 ${index % 2 ? "ml-8 md:ml-20" : ""}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-xs text-cream">{index + 1}</span><span className="font-display text-2xl md:text-3xl">{fragment}</span></motion.div>)}</div>
            <motion.div style={{ scale: revealScale, opacity: revealOpacity }} className="relative mt-28 overflow-hidden bg-[#2724a8] p-8 text-white md:p-12">
              <Sparkles className="text-lime" size={28} /><p className="mt-12 text-sm uppercase tracking-[0.25em] text-white/60">Your style north star</p>
              <h3 className="font-display mt-4 text-5xl leading-[0.9] md:text-7xl">Relaxed authority.<br />Colour with intent.<br />Nothing to prove.</h3>
              <div className="mt-10 flex gap-3">{["#ef5a3c", "#dfff4f", "#f4efde", "#2c241e"].map(color => <span key={color} className="h-10 w-10 rounded-full border border-white/35" style={{ backgroundColor: color }} />)}</div>
            </motion.div>
          </div>
        </div></div>
      </section>

      <section className="bg-lime px-6 py-24 md:px-10 md:py-32"><div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="relative"><img src={flatlayVisual} alt="A considered wardrobe laid out together" width="1200" height="900" className="aspect-[4/3] w-full object-cover" /><div className="absolute -bottom-8 -right-3 max-w-[230px] rotate-3 bg-cream p-5 shadow-[8px_8px_0_#222018] md:right-8"><p className="font-display text-2xl">Less guessing. More wearing.</p></div></div>
        <div className="lg:pl-10"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em]">What Bee makes</p><h2 className="font-display mt-6 text-6xl leading-[0.87] tracking-[-0.04em] md:text-8xl">A wardrobe that knows where it is going.</h2><p className="mt-8 max-w-xl text-lg leading-8">Your interview becomes a practical style direction, useful looks and better decisions about what to keep, tailor, buy or leave behind.</p><div className="mt-9"><EnterBee dark /></div></div>
      </div></section>

      <section id="brands" className="bg-[#ef5a3c] px-6 py-24 md:px-10 md:py-32"><div className="mx-auto max-w-[1440px]">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em]">The LiveAskew world</p><h2 className="font-display mt-5 max-w-5xl text-6xl leading-[0.88] tracking-[-0.045em] md:text-8xl">Bee is the beginning, not the whole story.</h2>
        <div className="mt-20 border-t-2 border-ink">
          <BrandRow title="The Edit" body="Stories, wardrobe intelligence and ideas worth keeping after the trend has moved on." status="In development" />
          <BrandRow title="The Shop" body="A tighter shop with pieces chosen for purpose, repeat wear and real wardrobes." status="Coming soon" />
          <Link to="/bianca" className="group grid gap-5 border-b-2 border-ink py-8 md:grid-cols-[0.65fr_1.5fr_auto] md:items-center"><span className="font-display text-5xl">The Studio</span><p className="max-w-xl text-base leading-7">Private wardrobe direction and personal styling with founder Bianca.</p><ArrowUpRight className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></Link>
        </div>
        <div className="mt-20 grid gap-6 md:grid-cols-2"><img src={pair} alt="Two coordinated wardrobes with distinct personalities" width="1200" height="900" className="aspect-[4/3] h-full w-full object-cover" /><img src={noir} alt="A dark, refined wardrobe selection" width="1200" height="900" className="aspect-[4/3] h-full w-full object-cover" /></div>
      </div></section>

      <section className="relative bg-[#2724a8] px-6 py-28 text-white md:px-10 md:py-44"><div className="absolute right-[8%] top-16 hidden h-28 w-28 rotate-12 rounded-full bg-lime md:block" aria-hidden /><div className="mx-auto max-w-[1100px] text-center"><Mic className="mx-auto text-lime" size={34} /><p className="mt-8 text-xs font-semibold uppercase tracking-[0.28em] text-white/65">Bee is ready when you are</p><h2 className="font-display mt-5 text-6xl leading-[0.88] tracking-[-0.045em] md:text-9xl">Tell her what getting dressed feels like now.</h2><p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-white/75">No perfect answers required. Start with the truth and Bee will take it from there.</p><div className="mt-10"><EnterBee /></div></div></section>
      <Footer />
    </main>
  );
}

function BrandRow({ title, body, status }: { title: string; body: string; status: string }) {
  return <div className="grid gap-5 border-b-2 border-ink py-8 md:grid-cols-[0.65fr_1.5fr_auto] md:items-center"><span className="font-display text-5xl">{title}</span><p className="max-w-xl text-base leading-7">{body}</p><span className="text-xs font-semibold uppercase tracking-[0.2em]">{status}</span></div>;
}
