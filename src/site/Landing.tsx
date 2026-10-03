import { useEffect, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import crestBee from "@/assets/brand/crest-bee.webp";
import crestBuzz from "@/assets/brand/crest-buzz.webp";
import crestHive from "@/assets/brand/crest-hive.webp";
import hiveGathering from "@/assets/brand/hive-gathering.webp";
import heroEditorial from "@/assets/site/hero-editorial.webp";
import beeFlatlay from "@/assets/site/bee-flatlay-app.webp";
import buzzBroadcast from "@/assets/site/buzz-broadcast.webp";
import shotToday from "@/assets/site/today.webp";
import shotHoney from "@/assets/site/honey.webp";
import shotTalk from "@/assets/site/realtalk.webp";
import { TALK_GUIDES, TALK_TOPICS } from "@/lib/bee-talk";
import { Crest } from "@/mobile/components/Crest";
import { forwardsToApp } from "./forward";
import { PriceBook } from "./PriceBook";
import { SiteFrame } from "./chrome";

/**
 * Sign-in, checkout, and social connections used to land on "/", and home-screen installs
 * still open "/". The app lives at /app now; anything that arrives here carrying a session,
 * a result, or an error — or launched from the home screen — is passed straight through.
 */
function useForwardAppReturns() {
  useEffect(() => {
    const { search, hash } = window.location;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (forwardsToApp(search, hash, standalone)) {
      window.location.replace(`/app${search}${hash}`);
    }
  }, []);
}

type Offer = { title: string; text: string };

function Offers({ items, cta }: { items: Offer[]; cta: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8 md:py-16">
      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((offer) => (
          <li key={offer.title} className="glass rounded-[1.6rem] px-6 py-6">
            <h3 className="font-display text-[1.4rem] leading-tight font-semibold">
              {offer.title}
            </h3>
            <p className="mt-2.5 text-[1rem] leading-relaxed text-black/70">{offer.text}</p>
          </li>
        ))}
      </ul>
      <div className="mt-8">{cta}</div>
    </div>
  );
}

function ProductMark({
  crest,
  index,
  kicker,
}: {
  crest: ReactNode;
  index: string;
  kicker: string;
}) {
  return (
    <div className="flex items-center gap-4">
      {crest}
      <p className="kicker">
        {index} — {kicker}
      </p>
    </div>
  );
}

const HEADLINE = "font-display font-bold tracking-[-0.035em]";

function Phone({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto aspect-[390/844] w-full max-w-[290px] rounded-[46px] bg-[#1d1d1f] p-[9px] shadow-[0_0_0_1.5px_#3a3a3c,0_40px_80px_-20px_rgba(0,0,0,0.4)]">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="block h-full w-full rounded-[37px] object-cover"
      />
    </div>
  );
}

const NETWORKS = ["Instagram", "Facebook", "LinkedIn", "X", "Threads"];

export function Landing() {
  useForwardAppReturns();

  return (
    <SiteFrame>
      {/* Hero */}
      <section className="relative min-h-[100svh]">
        <img
          src={heroEditorial}
          alt="A mother in a tailored black and gold ensemble, standing in a modern interior among framed looks"
          className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/30" />
        <div className="relative z-10 flex min-h-[100svh] items-end px-5 pt-36 pb-12 md:items-center md:px-16 md:pb-16">
          <div className="glass-dark max-w-xl rounded-[2rem] px-7 py-8 md:px-10 md:py-10">
            <img
              src="/liveaskew-signature.png"
              alt="LiveAskew"
              className="h-24 w-auto md:h-32"
              style={{ aspectRatio: "866 / 1610" }}
            />
            <p className="kicker mt-5">Your styling bestie</p>
            <h1 className={`${HEADLINE} mt-2 text-[2.9rem] leading-[1] md:text-[4.5rem]`}>
              Let's get you dressed.
            </h1>
            <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-white/90">
              You've got a lot on. School run at 8, boardroom at 10, the dinner you almost cancelled
              at 7. Bee knows your body, your closet and your calendar, so the outfit's ready before
              your coffee goes cold.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="/app" className="glass-btn glass-btn-gold">
                Start your 14 days free
              </a>
              <a href="#bee" className="glass-btn glass-btn-light">
                Show me around
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bee */}
      <section id="bee" className="scroll-mt-28 bg-white">
        <div className="mx-auto max-w-[1180px] px-5 pt-24 md:px-8 md:pt-32">
          <article className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] sm:aspect-[2752/1536]">
            <img
              src={beeFlatlay}
              alt="A look laid out on the bed: burgundy sweater, grey trousers, gold mules, scarf, bag, and jewelry, with that look open in Bee"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-4 left-4 z-10 max-w-[calc(100%-2rem)] sm:max-w-[52%] md:top-6 md:left-6">
              <div className="glass rounded-[2rem] px-5 py-5 md:px-8 md:py-7">
                <ProductMark
                  crest={<img src={crestBee} alt="" className="h-14 w-14" />}
                  index="01"
                  kicker="The styling app"
                />
                <h2 className={`${HEADLINE} mt-2 text-[2.75rem] leading-none md:text-[4rem]`}>
                  Bee
                </h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-black/80 md:mt-4 md:text-[1.0625rem]">
                  Bee is the friend who always knows what to wear, and she listens first. How do you
                  like things to fit? How do you want to feel? Then she dresses the body you have,
                  not one you're &ldquo;working towards.&rdquo;
                </p>
              </div>
            </div>
          </article>
        </div>
        <Offers
          items={[
            {
              title: "For the day you're actually having",
              text: "School run, then the big meeting? Same closet, two jobs. Bee plans the outfit for the hour in front of you, from bump to boardroom. Not a mood board you'll never wear.",
            },
            {
              title: "Shop your own closet first",
              text: "Wardrobe Reset goes through what you've got: keep, toss, or maybe. Bee styles from the keepers and tells you the one piece that's actually missing. Just one. Promise.",
            },
            {
              title: "See it on you",
              text: "Curious how it'll look? Bee puts the outfit on your own photo. No slimming, no smoothing, no sneaky edits. Just you, wearing it.",
            },
            {
              title: "When you want a real person",
              text: "Big event? Whole new chapter? The Private Atelier pairs you with a human stylist, one to one. We talk first, then agree a price that fits what you need.",
            },
          ]}
          cta={
            <a href="/app" className="glass-btn">
              Meet Bee
            </a>
          }
        />
      </section>

      {/* Real Talk */}
      <section id="real-talk" className="on-dark scroll-mt-28 bg-black text-white">
        <div className="mx-auto grid max-w-[1180px] items-center gap-14 px-5 py-24 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-32">
          <div>
            <p className="kicker">Real Talk, with Bee</p>
            <h2 className={`${HEADLINE} mt-3 text-[2.75rem] leading-[1.02] md:text-[4rem]`}>
              The stuff we don't say out loud.
            </h2>
            <p className="mt-5 max-w-lg text-[1.125rem] leading-relaxed text-white/75">
              Motherhood, the mirror, the marriage, the meeting. Bee asks the questions most people
              skip, one at a time and with zero judgment, and she sticks around for the answer.
            </p>
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {TALK_TOPICS.map((t) => (
                <li key={t} className="glass-dark rounded-[1.4rem] px-5 py-5">
                  <p className="kicker">{TALK_GUIDES[t].label}</p>
                  <p className="mt-2 text-[1rem] leading-snug">“{TALK_GUIDES[t].openers[1]}”</p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[0.85rem] text-white/55">
              Bee's a great listener, but she isn't a therapist. If you're in crisis in the US, call
              or text 988.
            </p>
          </div>
          <Phone src={shotTalk} alt="Real Talk in Bee: a conversation about motherhood" />
        </div>
      </section>

      {/* Honey */}
      <section id="honey" className="scroll-mt-28 bg-white">
        <div className="mx-auto max-w-[1180px] px-5 pt-24 md:px-8 md:pt-32">
          <article className="glass overflow-hidden rounded-[2rem] bg-[radial-gradient(900px_500px_at_100%_0%,rgba(226,176,74,0.2),transparent)] md:grid md:grid-cols-[1.1fr_0.9fr]">
            <div className="flex items-center px-7 py-10 md:px-12 md:py-14">
              <div className="max-w-xl">
                <ProductMark
                  crest={<Crest name="honey" size={56} decorative />}
                  index="02"
                  kicker="The calendar"
                />
                <h2 className={`${HEADLINE} mt-2 text-[2.75rem] leading-none md:text-[4rem]`}>
                  Honey
                </h2>
                <p className="mt-5 text-[1.0625rem] leading-relaxed text-black/80">
                  Honey is your calendar with a wardrobe attached. Meetings, birthday parties, the
                  post you want out on Friday: it's all here, and Bee has already picked what you're
                  wearing to each one.
                </p>
              </div>
            </div>
            <div className="h-[420px] overflow-hidden px-6 pt-4 md:h-auto md:pt-12">
              <Phone
                src={shotHoney}
                alt="Honey in the app: today's board meeting, already dressed"
              />
            </div>
          </article>
        </div>
        <Offers
          items={[
            {
              title: "Bring your calendar",
              text: "Hook up Google, iCloud or Outlook and everything you've already got lands in one place. Nothing to retype.",
            },
            {
              title: "Dress me for this",
              text: "Tap any event and Bee picks the look, based on where you're going and why.",
            },
            {
              title: "Your posts, on the same page",
              text: "Scheduled a Buzz post? It sits right there on the day, next to everything else.",
            },
            {
              title: "Know when it went live",
              text: 'Once a post goes out, Honey marks the time, so you\'re never wondering "did that actually post?"',
            },
          ]}
          cta={
            <a href="/app" className="glass-btn">
              Open Honey
            </a>
          }
        />
      </section>

      {/* Buzz */}
      <section id="buzz" className="scroll-mt-28 bg-white">
        <div className="relative min-h-[78svh]">
          <img
            src={buzzBroadcast}
            alt="A woman smiling at her phone as her look goes out to her social networks"
            className="absolute inset-0 h-full w-full object-cover object-[65%_center]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="relative z-10 flex min-h-[78svh] items-end px-5 pt-32 pb-10 md:px-16 md:pb-16">
            <div className="glass-dark max-w-2xl rounded-[2rem] px-7 py-8 md:px-10 md:py-10">
              <ProductMark
                crest={<img src={crestBuzz} alt="" className="h-14 w-14" />}
                index="03"
                kicker="Social posting"
              />
              <h2 className={`${HEADLINE} mt-2 text-[2.75rem] leading-none md:text-[4rem]`}>
                Buzz
              </h2>
              <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-white/90">
                Love the look? Share it without the faff. Bee writes the caption in your voice, and
                Buzz posts it when you say, even if your phone's at the bottom of your bag.
              </p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {NETWORKS.map((n) => (
                  <li
                    key={n}
                    className="rounded-full border border-white/30 px-3.5 py-1.5 text-[0.85rem]"
                  >
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <Offers
          items={[
            {
              title: "Captions that sound like you",
              text: "Bee drafts one for each network: snappy for X, a little fuller for LinkedIn. Keep it, tweak it, make it yours.",
            },
            {
              title: "Post on your time",
              text: "Pick the day and time and you're done. Buzz handles it, and the post shows up on Honey too.",
            },
            {
              title: "Your accounts, your rules",
              text: "Sign in to each network once. Everything's encrypted, and you can disconnect any account in one tap.",
            },
            {
              title: "From outfit to feed in seconds",
              text: "Any look in Bee can be scheduled in a few taps, with your own photo or the look itself.",
            },
          ]}
          cta={
            <a href="/app" className="glass-btn">
              Open Buzz
            </a>
          }
        />
      </section>

      {/* The Hive */}
      <section id="hive" className="scroll-mt-28 bg-white">
        <div className="relative min-h-[78svh]">
          <img
            src={hiveGathering}
            alt="Mothers gathered on a sofa in a bright room, laughing and sipping wine, casually dressed"
            className="absolute inset-0 h-full w-full object-cover object-[78%_center]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <div className="relative z-10 flex min-h-[78svh] items-end px-5 pt-32 pb-10 md:px-16 md:pb-16">
            <div className="glass-dark max-w-2xl rounded-[2rem] px-7 py-8 md:px-10 md:py-10">
              <ProductMark
                crest={<img src={crestHive} alt="" className="h-14 w-14" />}
                index="04"
                kicker="The community"
              />
              <h2 className={`${HEADLINE} mt-2 text-[2.5rem] leading-[1] md:text-[3.5rem]`}>
                One community.
                <br />
                Every side of you.
              </h2>
              <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-white/90">
                Your people, all in one place: motherhood, style, work, everyday life and whatever's
                next. No juggling five apps. No pretending it's all perfect. Just real women, real
                wardrobes, real life.
              </p>
            </div>
          </div>
        </div>
        <Offers
          items={[
            {
              title: "A room for every part of you",
              text: "Style, Motherhood, Working Mom, Family and Editorial. Pop into whichever one fits your week.",
            },
            {
              title: "Share a look, ask a question",
              text: "Bring an outfit from Bee into a room and get honest takes from women living a life like yours.",
            },
            {
              title: "Challenges with your people",
              text: "Style challenges with women juggling the same school runs, deadlines and weather. Not a stranger's highlight reel.",
            },
            {
              title: "Kind, on purpose",
              text: "You pick a Hive name, and your email and number are never shown. Real moderators read every report, and you can block anyone, any time.",
            },
          ]}
          cta={
            <a href="/app" className="glass-btn">
              Join The Hive
            </a>
          }
        />
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-28 bg-[#f5f5f7] px-5 py-24 md:px-8 md:py-32">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="kicker">Membership</p>
          <h2 className={`${HEADLINE} mt-3 text-[2.75rem] leading-[1.02] md:text-[4rem]`}>
            Try it free. Fall in love.
          </h2>
          <p className="mt-4 text-[1.125rem] text-black/65">
            Every membership starts with 14 days on us. Cancel any time, no hard feelings.
          </p>
        </div>
        <PriceBook />
      </section>

      {/* Close */}
      <section className="bg-white px-5 py-24 md:px-8 md:py-32">
        <div className="mx-auto grid max-w-[1180px] items-center gap-14 md:grid-cols-2">
          <div>
            <p className="kicker">Fit · Feel · Fabric</p>
            <h2 className={`${HEADLINE} mt-3 text-[2.75rem] leading-[1.02] md:text-[4rem]`}>
              Clothes should fit you. Not the other way round.
            </h2>
            <p className="mt-5 max-w-lg text-[1.125rem] leading-relaxed text-black/65">
              Your styling photo stays on your phone. We never sell your data. And if you ever want
              to leave, one tap deletes your account and everything in it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a href="/app" className="glass-btn">
                Start your 14 days free
              </a>
              <a
                href="/privacy"
                className="inline-flex items-center text-[1rem] font-medium text-[var(--gold)] hover:underline"
              >
                How we keep you safe <ChevronRight size={18} aria-hidden />
              </a>
            </div>
            <p className="mt-6 text-[0.9rem] text-black/55">
              Live on the web today. iPhone and Android are coming soon.
            </p>
          </div>
          <Phone src={shotToday} alt="The LiveAskew app's Today screen" />
        </div>
      </section>
    </SiteFrame>
  );
}
