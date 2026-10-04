import { useEffect, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import crestBee from "@/assets/brand/crest-bee.webp";
import crestBuzz from "@/assets/brand/crest-buzz.webp";
import crestHive from "@/assets/brand/crest-hive.webp";
import hiveGathering from "@/assets/brand/hive-gathering.webp";
import heroEditorial from "@/assets/site/hero-editorial.webp";
import beeFlatlay from "@/assets/site/bee-flatlay-app.webp";
import buzzBroadcast from "@/assets/site/buzz-broadcast.webp";
import shotToday from "@/assets/site/today.webp";
import { Crest } from "@/mobile/components/Crest";
import { FAQ } from "./faq";
import { forwardsToApp } from "./forward";
import { BeeSalesChat } from "./BeeSalesChat";
import { StylingExample } from "./StylingExample";
import { HoneyPreview } from "./HoneyPreview";
import { SocialIcon } from "./SocialIcon";
import { PriceBook } from "./PriceBook";
import { SiteFrame } from "./chrome";
import "./miami.css";

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
  const [meetBeeOpen, setMeetBeeOpen] = useState(false);

  return (
    <SiteFrame>
      <button className="bee-chat-launcher" onClick={() => setMeetBeeOpen(true)}>
        Chat with Bee
      </button>
      <BeeSalesChat open={meetBeeOpen} onClose={() => setMeetBeeOpen(false)} />
      <div className="miami-home">
        {/* Hero */}
        <section className="relative min-h-[100svh]">
          <img
            src={heroEditorial}
            fetchPriority="high"
            alt="A woman in a tailored black and gold ensemble, standing in a modern interior among framed looks"
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
              <p className="kicker mt-5">Miami-born. Styling for women.</p>
              <h1 className={`${HEADLINE} mt-2 text-[2.6rem] leading-[1.05] md:text-[3.5rem]`}>
                Get dressed for your life. Feel like yourself.
              </h1>
              <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-white/90">
                LiveAskew is your personal styling app. Meet Bee, your AI stylist inside it. Turn
                the clothes you own into outfits for your body, your plans, and your personal style.
              </p>
              <p className="mt-3 text-sm text-white/80">
                14 days free for new members. Card required. Cancel before billing starts.
              </p>
              <div className="hero-actions mt-7 grid grid-cols-2 gap-3">
                <a href="/app" className="glass-btn glass-btn-gold">
                  Start your free trial
                </a>
                <button
                  type="button"
                  onClick={() => setMeetBeeOpen(true)}
                  className="glass-btn glass-btn-light"
                >
                  Meet Bee
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="miami-inspirations" aria-label="Our roots and style inspirations">
          <div className="glass mx-auto max-w-[1180px] rounded-[2rem] px-6 py-7 text-center">
            <p className="kicker">Based in Miami. Inspired by the world. Styled for you.</p>
            <ul className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-3 text-lg font-semibold">
              {["Miami", "New York", "California", "Milan", "Paris"].map((place) => (
                <li key={place}>{place}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Bee */}
        <section id="bee" className="scroll-mt-28 bg-white">
          <div className="mx-auto max-w-[1180px] px-5 pt-24 md:px-8 md:pt-32">
            <article className="relative min-h-[520px] w-full overflow-hidden rounded-[2rem] p-4 md:aspect-[2752/1536] md:p-6">
              <img
                src={beeFlatlay}
                alt="A look laid out on the bed: burgundy sweater, grey trousers, gold mules, scarf, bag, and jewelry, with that look open in Bee"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="relative z-10 sm:max-w-[70%] lg:max-w-[52%]">
                <div className="glass rounded-[2rem] px-5 py-5 md:px-8 md:py-7">
                  <ProductMark
                    crest={<img src={crestBee} alt="" className="h-14 w-14" />}
                    index="01"
                    kicker="Your AI stylist inside LiveAskew"
                  />
                  <h2 className={`${HEADLINE} mt-2 text-[2.75rem] leading-none md:text-[4rem]`}>
                    Meet Bee.
                  </h2>
                  <p className="mt-4 text-xl font-semibold tracking-tight md:text-2xl">
                    Less second-guessing. More getting on with your day.
                  </p>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-black/80 md:mt-4 md:text-[1.0625rem]">
                    Bee is the voice and styling intelligence behind LiveAskew. Share what you own,
                    where you are going, and how you want to feel. She helps you put a look
                    together, then refine it through conversation. Your body. Your style. Your
                    rules.
                  </p>
                </div>
              </div>
            </article>
          </div>
          <StylingExample />
          <Offers
            items={[
              {
                title: "Clothes, but nothing to wear?",
                text: "Find fresh combinations in your own wardrobe. Bee helps turn the pieces you already love into a look for today.",
              },
              {
                title: "A plan, but no outfit?",
                text: "A meeting, dinner, or an ordinary Tuesday. Tell Bee the occasion and your comfort preferences to shape the suggestion.",
              },
              {
                title: "Not quite your style?",
                text: "Say what you would change: softer fabrics, more coverage, or flats instead of heels. Refine the look with Bee until it feels like you.",
              },
              {
                title: "Want to picture the whole look?",
                text: "Use a virtual try-on to preview an outfit on your photo. Explore the idea before deciding what to wear.",
              },
            ]}
            cta={
              <a href="/app" className="glass-btn">
                Start styling with Bee
              </a>
            }
          />
        </section>

        {/* Honey */}
        <section id="honey" className="scroll-mt-28 bg-white">
          <div className="mx-auto max-w-[1180px] px-5 pt-24 md:px-8 md:pt-32">
            <article className="glass overflow-hidden rounded-[2rem] bg-[radial-gradient(900px_500px_at_100%_0%,rgba(226,176,74,0.2),transparent)] md:grid md:grid-cols-2">
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
                  <p className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
                    Your day, already dressed.
                  </p>
                  <p className="mt-5 text-[1.0625rem] leading-relaxed text-black/80">
                    Your calendar, with style built in. A workday, a coffee date, a
                    celebration—bring your plans into Honey and ask Bee for a look that feels right
                    for you.
                  </p>
                </div>
              </div>
              <div className="min-w-0 px-4 pb-6 sm:px-6 md:py-10 md:pr-8">
                <HoneyPreview />
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
                  Love the look? Share it without the faff. Bee writes the caption in your voice,
                  and Buzz posts it when you say, even if your phone's at the bottom of your bag.
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {NETWORKS.map((n) => (
                    <li
                      key={n}
                      className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-3.5 py-2 text-[0.85rem]"
                    >
                      <SocialIcon network={n} />
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
              alt="Friends gathered on a sofa in a bright room, laughing and talking"
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
                  The Hive.
                  <br />
                  Real talk. Real you.
                </h2>
                <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-white/90">
                  A community for women, beyond the outfit. Talk about confidence, relationships,
                  family, work and whatever life looks like for you. Different perspectives, shared
                  experiences, room to be yourself.
                </p>
              </div>
            </div>
          </div>
          <Offers
            items={[
              {
                title: "A room for every part of you",
                text: "Explore style, family, work and everyday life. Join the conversations that feel like you.",
              },
              {
                title: "Share a look, ask a question",
                text: "Share a look or start a real conversation. Find encouragement and a fresh perspective from the community.",
              },
              {
                title: "Challenges with your people",
                text: "Try a new combination, share your take and discover how differently we can wear the same idea.",
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
          <div id="real-talk" className="mx-auto max-w-[1180px] scroll-mt-28 px-5 pb-16 md:px-8">
            <div className="glass rounded-[2rem] p-7 md:p-10">
              <p className="kicker">Real Talk, inside The Hive</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight">
                More than what we wear.
              </h3>
              <ul className="mt-6 grid gap-6 md:grid-cols-3">
                <li>
                  <p className="kicker">Style & identity</p>
                  <p className="mt-2">What makes you feel most like yourself?</p>
                </li>
                <li>
                  <p className="kicker">Life & connection</p>
                  <p className="mt-2">What is something you wish people understood?</p>
                </li>
                <li>
                  <p className="kicker">Work & possibility</p>
                  <p className="mt-2">What are you making room for next?</p>
                </li>
              </ul>
              <p className="mt-6 text-sm text-black/60">
                Conversation starters, not member quotes. Share at your own pace.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-28 bg-[#f5f5f7] px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="kicker">Membership</p>
            <h2 className={`${HEADLINE} mt-3 text-[2.75rem] leading-[1.02] md:text-[4rem]`}>
              Try it free. Fall in love.
            </h2>
            <p className="mt-4 text-[1.125rem] text-black/65">
              Choose your plan and add your card securely. New eligible members get 14 days free,
              then monthly billing unless cancelled.
            </p>
          </div>
          <PriceBook />
        </section>

        {/* Questions */}
        <section id="faq" className="scroll-mt-28 bg-white px-5 py-24 md:px-8 md:py-32">
          <div className="mx-auto max-w-3xl">
            <p className="kicker">Good questions</p>
            <h2 className={`${HEADLINE} mt-3 text-[2.5rem] leading-[1.02] md:text-[3.5rem]`}>
              Everything you're wondering.
            </h2>
            <div className="mt-10 divide-y divide-black/10 border-y border-black/10">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.15rem] font-semibold">
                    <h3>{item.q}</h3>
                    <ChevronRight
                      size={20}
                      aria-hidden
                      className="shrink-0 text-[var(--gold)] transition-transform group-open:rotate-90"
                    />
                  </summary>
                  <p className="mt-3 text-[1.0625rem] leading-relaxed text-black/70">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
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
                Your style belongs to you. We never sell your data. Read how photos are processed,
                what is stored, and the controls you have over your account.
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
      </div>
    </SiteFrame>
  );
}
