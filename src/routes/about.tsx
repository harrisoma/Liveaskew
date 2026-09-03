import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Check, Heart, Globe, Shield } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import woman03 from "@/assets/women/woman-03.jpg";
import woman05 from "@/assets/women/woman-05.jpg";
import beePortrait from "@/assets/bee-portrait.png.asset.json";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About LiveAskew — Who We Are" },
      {
        name: "description",
        content:
          "LiveAskew is a personal AI stylist for women. Meet Bee, your conversational wardrobe architect.",
      },
      { property: "og:title", content: "About LiveAskew — Who We Are" },
      {
        property: "og:description",
        content:
          "LiveAskew is a personal AI stylist for women. Meet Bee, your conversational wardrobe architect.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="min-h-screen bg-cream text-ink">
      <Nav />

      {/* ─────── Hero ─────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(800px 400px at 80% 20%, hsl(var(--gold) / 0.15), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[1400px] px-6 pt-28 pb-12 md:px-10 md:pt-36 md:pb-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">Our Story</p>
            <h1 className="font-display mt-8 text-[3.2rem] leading-[0.95] tracking-tight md:text-[5.5rem]">
              A stylist in
              <br />
              <em className="text-gold-deep">every pocket</em>.
            </h1>
            <p className="mt-10 text-lg leading-relaxed text-ink/70">
              LiveAskew was built for the woman who knows style matters — but doesn't have hours to
              spend curating it. Bee is your personal AI stylist: warm, sharp, and always listening.
            </p>
          </div>
        </div>
      </section>

      {/* ─────── Who We Are ─────── */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 md:px-10 md:py-28">
        <div className="grid gap-16 md:grid-cols-2 md:gap-20">
          <div className="space-y-10">
            <div>
              <span className="eyebrow">The Studio</span>
              <h2 className="font-display mt-5 text-4xl leading-tight md:text-[3.2rem]">
                We dress the woman,
                <br />
                not the trend.
              </h2>
            </div>
            <div className="space-y-6 text-base leading-relaxed text-ink/75">
              <p>
                LiveAskew began with a simple observation: most women have wardrobes full of
                beautiful things they never wear — and closets full of gaps they can't name. The
                problem isn't taste. It's translation.
              </p>
              <p>
                We believe every woman deserves a wardrobe that feels like home — curated,
                intentional, and unmistakably her. LiveAskew was built to bridge the gap between
                aspiration and reality: the clothes you own, the life you lead, and the style you
                imagine for yourself.
              </p>
              <p>
                Our approach combines fashion editorial sensibility with AI-powered conversation.
                Bee, the stylist at the heart of LiveAskew, draws on cultural fluency, fabric
                knowledge, and real human understanding to build looks that match your body, your
                calendar, and your world.
              </p>
              <p>
                Every look Bee builds is drawn from your interview, your body, your cultural
                context, and your week. Nothing is generic. Nothing is algorithmic guesswork. It's
                conversation, distilled into dressing.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6">
              {[
                { n: "8", l: "Hero looks / month" },
                { n: "16", l: "Variations built" },
                { n: "30", l: "Days of rotation" },
                { n: "∞", l: "Conversations with Bee" },
              ].map((s) => (
                <div key={s.l} className="rounded-3xl bg-cream p-5 shadow-neo">
                  <span className="font-display text-3xl text-gold-deep">{s.n}</span>
                  <p className="mt-1 text-[0.65rem] font-medium tracking-[0.22em] uppercase text-ink/55">
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <figure className="overflow-hidden">
              <img
                src={woman03}
                alt="A woman in a camel cashmere coat seated in warm ambient light."
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
              />
            </figure>
            <blockquote className="border-l border-gold pl-6">
              <p className="font-display text-2xl leading-snug text-ink/85 md:text-[1.6rem]">
                "Style is not about clothes. It's about the woman who puts them on — and whether she
                feels at home in herself."
              </p>
              <footer className="mt-4 text-sm text-ink/50">
                — The LiveAskew founding principle
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ─────── What Bee Does ─────── */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[1400px] px-6 py-20 md:px-10 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-[auto_1fr] md:gap-16">
            <figure className="mx-auto md:mx-0">
              <div className="relative">
                <span aria-hidden className="absolute -inset-3 border border-gold/40" />
                <img
                  src={beePortrait.url}
                  alt="Bee — the LiveAskew AI stylist, portrayed in a warm portrait with cowrie-shell choker and natural light."
                  className="relative aspect-[3/4] w-[260px] object-cover md:w-[320px]"
                  loading="lazy"
                />
              </div>
              <figcaption className="mt-5 text-center text-[0.65rem] font-medium tracking-[0.3em] uppercase text-ink/55 md:text-left">
                Bee — your stylist
              </figcaption>
            </figure>

            <div className="max-w-2xl">
              <p className="eyebrow">Meet Bee</p>
              <h2 className="font-display mt-6 text-4xl leading-tight md:text-[3.5rem]">
                Hello. I'm <em className="text-gold-deep">Bee</em>.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-ink/70">
                The AI stylist inside LiveAskew. I don't recommend algorithms; I have conversations.
                I ask, I listen, I remember, and I build a wardrobe language that is unmistakably
                yours.
              </p>
              <p className="mt-4 text-base leading-relaxed text-ink/70">
                My story began in <em>Miami</em> — where color, heat, and unapologetic confidence
                taught me that style is a language you wear. But I don't have a single signature.
                Minimal or maximal, quiet or bold, classic or street — I build across every
                aesthetic, because the only one that matters is yours. My craft rests on three
                things:
                <em>fit</em>, <em>feel</em>, and <em>fabric</em>.
              </p>
              <p className="mt-4 text-base leading-relaxed text-ink/70">
                We'll talk like friends. I'll listen more than I speak. And when the moment is
                right, I'll <em>expand</em> what you imagined for yourself,
                <em>explore</em> what suits the life you actually lead, and <em>execute</em> a
                wardrobe that finally feels like home.
              </p>
            </div>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Fit",
                body: "the silhouette that works with how you're actually built.",
              },
              {
                title: "Feel",
                body: "how you feel in your clothing as you move throughout each day.",
              },
              {
                title: "Fabric",
                body: "Cloth chosen for season, climate and culture.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-[1.75rem] bg-cream p-8 shadow-neo md:p-10">
                <p className="text-[0.6rem] tracking-[0.3em] uppercase text-gold-deep">{f.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────── How It Works ─────── */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">The Journey</p>
          <h2 className="font-display mt-6 text-4xl leading-tight md:text-[3.5rem]">
            From first hello to your first look.
          </h2>
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-5">
          {[
            {
              n: "01",
              title: "Meet Bee",
              body: "You arrive. Bee introduces herself. No card, no pressure — just a first conversation.",
            },
            {
              n: "02",
              title: "The Interview",
              body: "Ten questions across culture, body, colour, fabric, wardrobe, and lifestyle. Closed with Bee's own-voice reflection.",
            },
            {
              n: "03",
              title: "Choose Your Tier",
              body: "Fourteen days free on Gold. Add a card so Bee can keep going — you won't be charged until day fourteen.",
            },
            {
              n: "04",
              title: "Your Magazine",
              body: "Eight hero looks, sixteen variations, thirty days — delivered as a personal monthly style guide.",
            },
            {
              n: "05",
              title: "Daily Life",
              body: "Today's look, voice access, your wardrobe inventory, and a quarterly Closet Reset to keep it honest.",
            },
          ].map((s, i) => (
            <div key={s.n} className="relative">
              <span className="font-display text-5xl text-gold/25">{s.n}</span>
              <h3 className="font-display mt-4 text-xl leading-tight">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/65">{s.body}</p>
              {i < 4 && (
                <div className="hidden md:block absolute -right-6 top-8 h-px w-12 bg-ink/10" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─────── Values ─────── */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[1400px] px-6 py-20 md:px-10 md:py-28">
          <div className="grid gap-16 md:grid-cols-2 md:gap-20">
            <div>
              <p className="eyebrow">Our Principles</p>
              <h2 className="font-display mt-6 text-4xl leading-tight md:text-[3.2rem]">
                The four things
                <br />
                we never bend.
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              {[
                {
                  icon: Shield,
                  title: "Real bodies",
                  body: "We never alter a body to fit a garment. We alter the garment to fit the body.",
                },
                {
                  icon: Globe,
                  title: "Cultural fluency",
                  body: "Hijab, sari, kente, kimono, modest, maximalist — Bee dresses heritage, never around it.",
                },
                {
                  icon: Heart,
                  title: "Beautiful light",
                  body: "Every reference image uses real, unretouched women in warm, honest light.",
                },
                {
                  icon: Check,
                  title: "Safe space",
                  body: "Your body, budget, and wardrobe stay between you and Bee. Always.",
                },
              ].map((v) => (
                <div key={v.title} className="rounded-[1.75rem] bg-cream p-6 shadow-neo">
                  <v.icon size={18} strokeWidth={1.5} className="text-gold-deep" />
                  <h3 className="font-display mt-4 text-xl leading-tight">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/65">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────── CTA ─────── */}
      <section className="mx-auto max-w-[1400px] px-6 py-20 text-center md:px-10 md:py-28">
        <figure className="mx-auto max-w-md overflow-hidden">
          <img
            src={woman05}
            alt="A confident woman in a burgundy wrap dress."
            className="aspect-[3/4] w-full object-cover"
            loading="lazy"
          />
        </figure>
        <p className="eyebrow mt-10">Ready?</p>
        <h2 className="font-display mt-6 text-4xl leading-tight md:text-[3.5rem]">
          The woman you are
          <br />
          <em className="text-gold-deep">is already there</em>.
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-ink/70">
          Fourteen days free on Gold. No card required. Bee is waiting — and so, quietly, is the
          version of you that feels at home in her own clothes.
        </p>
        <Link to="/auth" search={{ mode: "signup" }} className="neo-btn-ink mt-10 group">
          Begin your 14-day trial
          <ArrowUpRight
            size={14}
            className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </Link>
      </section>

      <Footer />
    </main>
  );
}
