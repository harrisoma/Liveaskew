import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import heroOrb from "@/assets/hero-orb.png.asset.json";
import heroEditorial from "@/assets/hero-editorial.jpg";
import wardrobeFlatlay from "@/assets/wardrobe-flatlay.jpg";
import philosophyPair from "@/assets/philosophy-pair-flatlay.jpg";
import philosophyNoir from "@/assets/philosophy-noir-flatlay.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LiveAskew — Style, considered differently" },
      {
        name: "description",
        content:
          "LiveAskew is a modern style company creating intelligent tools, thoughtful objects and personal styling experiences. Meet Bee, your conversational AI stylist.",
      },
      { property: "og:title", content: "LiveAskew — Style, considered differently" },
      {
        property: "og:description",
        content: "Intelligent style tools, thoughtful objects and deeply personal experiences.",
      },
      { property: "og:url", content: "https://www.liveaskew.com/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://www.liveaskew.com/" }],
  }),
  component: LandingPage,
});

const brands = [
  {
    name: "Bee",
    number: "01",
    status: "Available now",
    description:
      "A conversational AI stylist that learns your life, your body, your culture and your budget before suggesting a single thing.",
    image: heroEditorial,
    imageAlt: "Editorial portrait styled in warm neutral tones",
    href: "/auth",
    action: "Enter Bee",
    live: true,
  },
  {
    name: "The Edit",
    number: "02",
    status: "In development",
    description:
      "A living point of view on personal style—useful stories, wardrobe intelligence and ideas worth keeping beyond the trend cycle.",
    image: philosophyPair,
    imageAlt: "A considered edit of complementary wardrobe pieces",
    action: "Discover the vision",
  },
  {
    name: "LiveAskew Shop",
    number: "03",
    status: "Coming soon",
    description:
      "A tightly curated shop of pieces with purpose. Fewer, better choices selected to work harder in a real wardrobe.",
    image: wardrobeFlatlay,
    imageAlt: "A curated capsule wardrobe arranged as a flat lay",
    action: "Coming soon",
  },
  {
    name: "LiveAskew Studio",
    number: "04",
    status: "By inquiry",
    description:
      "The human service. Private wardrobe direction and personal styling led by founder Bianca for moments that deserve a closer eye.",
    image: philosophyNoir,
    imageAlt: "A refined monochrome wardrobe selection",
    href: "/bianca",
    action: "Work with Bianca",
    live: false,
  },
] as const;

function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-cream text-ink">
      <Nav />
      <main>
        <section className="relative min-h-[780px] overflow-hidden bg-ink px-6 pb-16 pt-32 text-cream md:px-10 md:pb-20 md:pt-40">
          <div className="absolute inset-0 opacity-[0.16] grain-overlay" />
          <div className="absolute -right-32 top-20 h-[560px] w-[560px] rounded-full bg-gold/10 blur-3xl md:right-[-5%] md:h-[720px] md:w-[720px]" />
          <div className="relative mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10 max-w-3xl"
            >
              <p className="text-[0.65rem] font-medium tracking-[0.32em] uppercase text-gold-soft">
                A modern style company
              </p>
              <h1 className="font-display mt-7 text-[clamp(4.5rem,10vw,9.5rem)] leading-[0.78] tracking-[-0.055em]">
                Style,
                <br />
                <em className="font-normal text-gold-soft">considered</em>
                <br />
                differently.
              </h1>
              <p className="mt-10 max-w-xl text-base font-light leading-7 text-cream/68 md:text-lg">
                LiveAskew creates intelligent tools, thoughtful objects and personal
                experiences for people who want to dress with more clarity—and more self.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="group inline-flex items-center justify-between gap-8 bg-gold px-6 py-4 text-[0.68rem] font-semibold tracking-[0.24em] uppercase text-ink transition hover:bg-gold-soft"
                >
                  Enter Bee
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="#brands"
                  className="inline-flex items-center justify-between gap-8 border border-cream/25 px-6 py-4 text-[0.68rem] font-medium tracking-[0.24em] uppercase text-cream transition hover:border-gold hover:text-gold-soft"
                >
                  Explore LiveAskew
                </a>
              </div>
              <p className="mt-4 text-[0.62rem] tracking-[0.16em] uppercase text-cream/38">
                Your private styling interview begins inside
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 1.1, ease: "easeOut" }}
              className="relative mx-auto aspect-square w-full max-w-[620px]"
            >
              <div className="absolute inset-[8%] rounded-full border border-gold/20" />
              <div className="absolute inset-[17%] rounded-full border border-cream/10" />
              <img
                src={heroOrb.url}
                alt="Bee, LiveAskew's intelligent styling companion"
                className="absolute inset-0 h-full w-full object-contain drop-shadow-[0_35px_65px_rgba(0,0,0,0.5)]"
              />
              <span className="absolute bottom-[8%] right-[3%] text-[0.58rem] tracking-[0.3em] uppercase text-cream/42">
                Bee · Style intelligence
              </span>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-ink/10 bg-bone px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto grid max-w-[1400px] gap-10 md:grid-cols-[0.75fr_1.25fr] md:items-end">
            <p className="eyebrow">The company</p>
            <h2 className="font-display text-4xl leading-[1.04] md:text-6xl lg:text-7xl">
              Not another fashion platform. A more intelligent relationship with
              <em className="text-gold-deep"> personal style.</em>
            </h2>
          </div>
        </section>

        <section id="brands" className="px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-[1400px]">
            <div className="flex flex-col justify-between gap-5 border-b border-ink/15 pb-8 md:flex-row md:items-end">
              <div>
                <p className="eyebrow">The LiveAskew world</p>
                <h2 className="font-display mt-4 text-5xl md:text-7xl">Four ways in.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-ink/60">
                Technology where it helps. A human eye where it matters. Every product
                shares one standard: considered, useful and unmistakably personal.
              </p>
            </div>

            <div className="grid gap-px bg-ink/12 md:grid-cols-2">
              {brands.map((brand) => (
                <article key={brand.name} className="group bg-cream p-3 md:p-5">
                  <div className="relative aspect-[4/3] overflow-hidden bg-ink">
                    <img
                      src={brand.image}
                      alt={brand.imageAlt}
                      className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.025] group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-cream md:p-7">
                      <div>
                        <span className="text-[0.58rem] tracking-[0.25em] uppercase text-gold-soft">{brand.status}</span>
                        <h3 className="font-display mt-1 text-4xl md:text-5xl">{brand.name}</h3>
                      </div>
                      <span className="font-display text-2xl text-cream/40">{brand.number}</span>
                    </div>
                  </div>
                  <div className="grid gap-6 px-2 pb-8 pt-7 sm:grid-cols-[1fr_auto] sm:items-end">
                    <p className="max-w-xl text-sm leading-6 text-ink/65">{brand.description}</p>
                    {"href" in brand ? (
                      <Link
                        to={brand.href}
                        search={brand.live ? { mode: "signup" } : undefined}
                        className="inline-flex items-center gap-3 whitespace-nowrap text-[0.62rem] font-semibold tracking-[0.2em] uppercase text-ink transition hover:text-gold-deep"
                      >
                        {brand.action} <ArrowUpRight size={14} />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-3 whitespace-nowrap text-[0.62rem] font-semibold tracking-[0.2em] uppercase text-ink/40">
                        {brand.action}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="bee" className="bg-[#d6a800] px-6 py-20 text-ink md:px-10 md:py-28">
          <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-[0.65rem] font-semibold tracking-[0.3em] uppercase">Introducing Bee</p>
              <h2 className="font-display mt-5 text-7xl leading-[0.86] tracking-[-0.04em] md:text-9xl">
                She listens
                <br />before she styles.
              </h2>
            </div>
            <div className="max-w-xl lg:justify-self-end">
              <p className="text-lg leading-8 text-ink/78">
                Bee begins with an interview, not a shopping cart. She learns how you
                live, what you already own, what you spend and how you want to feel—then
                turns that knowledge into a style direction built only for you.
              </p>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="group mt-9 inline-flex items-center gap-10 bg-ink px-7 py-4 text-[0.68rem] font-semibold tracking-[0.24em] uppercase text-cream"
              >
                Enter the app
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        <section id="standard" className="bg-ink px-6 py-20 text-cream md:px-10 md:py-28">
          <div className="mx-auto max-w-[1400px]">
            <p className="text-[0.65rem] font-medium tracking-[0.3em] uppercase text-gold-soft">The LiveAskew standard</p>
            <div className="mt-12 grid border-y border-cream/15 md:grid-cols-3">
              {[
                ["01", "Personal over prescriptive", "Your body, culture, budget and ambitions are context—not constraints."],
                ["02", "Fewer, better choices", "We help you use what you own and choose what deserves a place beside it."],
                ["03", "Intelligence with taste", "Technology should make style feel more human, never more generic."],
              ].map(([number, title, body]) => (
                <div key={number} className="border-b border-cream/15 py-10 md:border-b-0 md:border-r md:px-9 md:first:pl-0 md:last:border-r-0">
                  <span className="font-display text-2xl text-gold">{number}</span>
                  <h3 className="font-display mt-10 text-3xl">{title}</h3>
                  <p className="mt-5 max-w-sm text-sm leading-6 text-cream/55">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 text-center md:px-10 md:py-36">
          <div className="mx-auto max-w-4xl">
            <p className="eyebrow">Begin with Bee</p>
            <h2 className="font-display mt-6 text-5xl leading-none md:text-8xl">
              Your style should feel like <em className="text-gold-deep">you.</em>
            </h2>
            <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-ink/60">
              Start the private interview. No forms, no fashion rules—just a thoughtful
              conversation that gives Bee the context to style you well.
            </p>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="group mt-9 inline-flex items-center gap-10 bg-ink px-7 py-4 text-[0.68rem] font-semibold tracking-[0.24em] uppercase text-cream transition hover:bg-gold-deep"
            >
              Enter Bee
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
