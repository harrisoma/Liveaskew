import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, Globe, Heart, Shield } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BeeMark } from "@/components/BeeMark";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Bee by LiveAskew" },
      { name: "description", content: "LiveAskew is a personal AI stylist for women. Meet Bee, your conversational wardrobe architect." },
      { property: "og:title", content: "About Bee by LiveAskew" },
      { property: "og:description", content: "LiveAskew is a personal AI stylist for women. Meet Bee, your conversational wardrobe architect." },
    ],
  }),
  component: AboutPage,
});

const VALUES = [
  { icon: Shield, title: "Real bodies", body: "We never alter a body to fit a garment. We alter the garment to fit the body." },
  { icon: Globe, title: "Cultural fluency", body: "Hijab, sari, kente, kimono, modest, maximalist — Bee dresses heritage, never around it." },
  { icon: Heart, title: "Beautiful light", body: "Every reference image uses real, unretouched women in warm, honest light." },
  { icon: Check, title: "Safe space", body: "Your body, budget, and wardrobe stay between you and Bee. Always." },
];

function AboutPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <Nav />

      {/* HERO — dark glass, one clear thesis */}
      <section className="relative overflow-hidden bg-ink px-6 pb-16 pt-32 text-cream md:px-10 md:pb-20 md:pt-40">
        <div aria-hidden className="glass-glow -top-32 right-[-10%] h-[460px] w-[460px]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-2">
            <BeeMark className="h-6 w-6 text-gold" />
            <span className="font-display text-base font-semibold">Bee</span>
            <span className="text-[0.55rem] font-semibold tracking-[0.14em] uppercase text-cream/50">
              by LiveAskew
            </span>
          </div>
          <h1 className="font-display mt-7 text-4xl leading-[1.05] md:text-6xl">
            A stylist in <span className="text-gold">every pocket</span>.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-cream/70">
            Built for the woman who knows style matters but doesn't have hours
            to spend curating it. Bee is your personal AI stylist — warm,
            sharp, and always listening.
          </p>
        </div>
      </section>

      {/* MEET BEE */}
      <section className="px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">Meet Bee</p>
          <h2 className="font-display mt-4 text-3xl leading-tight md:text-4xl">
            Hello. I'm <span className="text-gold-deep">Bee</span>.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-ink/70">
            I don't recommend algorithms; I have conversations. I ask, I
            listen, I remember, and I build a wardrobe language that is
            unmistakably yours — across every aesthetic, because the only one
            that matters is yours. My craft rests on three things: fit, feel,
            and fabric.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4">
          {[
            { title: "Fit", body: "The silhouette that works with how you're actually built." },
            { title: "Feel", body: "How you feel in your clothing as you move through each day." },
            { title: "Fabric", body: "Cloth chosen for season, climate and culture." },
          ].map((f) => (
            <div key={f.title} className="neu-raised rounded-2xl p-5 text-center">
              <p className="text-[0.6rem] font-semibold tracking-[0.1em] uppercase text-gold-deep">{f.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-ink/65">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VALUES */}
      <section className="relative overflow-hidden bg-ink px-6 py-20 text-cream md:px-10 md:py-24">
        <div aria-hidden className="glass-glow bottom-0 left-1/2 h-[420px] w-[420px] -translate-x-1/2 translate-y-1/3" />
        <div className="relative mx-auto max-w-[1200px]">
          <p className="text-center text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold">
            The four things we never bend
          </p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="glass-card rounded-2xl p-6">
                <v.icon size={18} strokeWidth={1.5} className="text-gold" />
                <h3 className="font-display mt-4 text-lg leading-tight text-cream">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cream/65">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl px-6 py-24 text-center md:px-10 md:py-28">
        <h2 className="font-display text-3xl leading-tight md:text-4xl">
          The woman you are is already there.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink/70">
          Fourteen days free on Gold. No card required. Bee is waiting.
        </p>
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="group mt-9 inline-flex items-center gap-3 rounded-full bg-gradient-to-br from-gold to-gold-deep px-8 py-4 text-sm font-semibold text-ink shadow-lg shadow-gold/30 transition hover:brightness-105"
        >
          Begin your 14-day trial
          <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </section>

      <Footer />
    </main>
  );
}
