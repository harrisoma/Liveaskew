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
import { PriceBook } from "./PriceBook";
import { SiteFrame } from "./chrome";

/**
 * Sign-in, checkout, and social connections used to land on "/". The app lives at /app now;
 * anything that still arrives here carrying a session or a result is passed straight through.
 */
function useForwardAppReturns() {
  useEffect(() => {
    const { search, hash } = window.location;
    const params = new URLSearchParams(search);
    const carriesAppState =
      hash.includes("access_token") ||
      hash.includes("error_description") ||
      params.has("code") ||
      params.has("billing") ||
      params.has("buzz");
    if (carriesAppState) window.location.replace(`/app${search}${hash}`);
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
            <p className="kicker mt-5">The styling house</p>
            <h1 className={`${HEADLINE} mt-2 text-[2.9rem] leading-[1] md:text-[4.5rem]`}>
              Dressed for the day she has.
            </h1>
            <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-white/90">
              LiveAskew is for the woman between a school run and a room that requires a shoulder.
              Bee builds the look from her body and the closet she owns. Honey holds the day. Buzz
              shares the look. The Hive is where she talks it through.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="/app" className="glass-btn glass-btn-gold">
                Start 14 days free
              </a>
              <a href="#bee" className="glass-btn glass-btn-light">
                See what we offer
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
                  Bee interviews her before it dresses her. Fit, how she wants to feel, and the
                  cloth. The clothes follow the body she has. The photograph stays the woman in
                  front of it.
                </p>
              </div>
            </div>
          </article>
        </div>
        <Offers
          items={[
            {
              title: "The day she is actually having",
              text: "A school run and a board meeting are one closet with two jobs. Bee plans the hour in front of her, from maternity through the workday, instead of a mood board.",
            },
            {
              title: "What she already owns",
              text: "Wardrobe Reset looks at what is in the closet and says keep, toss, or maybe. Bee builds from what stays, then names the one thing that is missing.",
            },
            {
              title: "Her, in the look",
              text: "When she wants to see it on herself, Bee renders the outfit on her own photo. No slimming, no smoothing, no reshaping. The body stays hers.",
            },
            {
              title: "A person, when the brief is bigger",
              text: "The Private Atelier is a human stylist, one to one. The price is set after a conversation. It is not a published rate.",
            },
          ]}
          cta={
            <a href="/app" className="glass-btn">
              Enter Bee
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
              The questions worth asking.
            </h2>
            <p className="mt-5 max-w-lg text-[1.125rem] leading-relaxed text-white/75">
              Motherhood, the mirror, the marriage, the meeting. Bee opens the conversations that
              are hard to start, asks one honest question at a time, and stays with her through the
              answer.
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
              Bee listens and asks; it is not a therapist. In crisis in the US, call or text 988.
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
                  Schedule the event, the meeting, and the post. Honey holds the day the way a
                  calendar does, Bee dresses every hour of it, and it records the social post and
                  the hour it hits.
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
              title: "Her calendar, brought in",
              text: "Connect Google, iCloud, or Outlook. The school run, the dinner, the thing already on the day, all in one place.",
            },
            {
              title: "Dress me for this",
              text: "Tap any event and Bee chooses the look for that hour, from the room and the reason.",
            },
            {
              title: "Social posting schedule",
              text: "The post lands on the same calendar, with the network and the hour.",
            },
            {
              title: "When it hits",
              text: "A post that has gone out is marked. The hour it hit stays on the day.",
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
                The look goes out on her schedule. Bee writes the caption in her voice, and Buzz
                posts it at the hour she chose — even when the app is closed.
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
              title: "Captions in her voice",
              text: "Bee drafts the words for each network — short for X, fuller for LinkedIn — and she edits or keeps them.",
            },
            {
              title: "On her hour",
              text: "Pick the day and time. Buzz publishes it then, and the post appears on Honey beside everything else.",
            },
            {
              title: "Her accounts stay hers",
              text: "Sign in to each network once. Access is encrypted, and any account disconnects in one tap.",
            },
            {
              title: "From the look to the feed",
              text: "Any look in Bee can be scheduled in a few taps, with her own photo or the look itself.",
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
                A warm, unified space for motherhood, style, work, everyday life, and what's next.
                No juggling five apps. No performing perfect. Just real women, real wardrobes, real
                work.
              </p>
            </div>
          </div>
        </div>
        <Offers
          items={[
            {
              title: "Rooms with a subject",
              text: "Style, Motherhood, Working mom, Family, and Editorial. Walk into the conversation that fits the week.",
            },
            {
              title: "Share the look, ask the question",
              text: "Bring a look from Bee into a room and hear from women dressing the same kind of life.",
            },
            {
              title: "Challenges, not a stranger's feed",
              text: "Style challenges sit with women dressing the same kind of week — school, work, weather, a cloth that has to hold.",
            },
            {
              title: "Kind by design",
              text: "Members choose a Hive name; email and phone are never shown. Reports reach real moderators, and anyone can be blocked.",
            },
          ]}
          cta={
            <a href="/app" className="glass-btn">
              Enter The Hive
            </a>
          }
        />
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-28 bg-[#f5f5f7] px-5 py-24 md:px-8 md:py-32">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="kicker">Membership</p>
          <h2 className={`${HEADLINE} mt-3 text-[2.75rem] leading-[1.02] md:text-[4rem]`}>
            Start free. Stay for you.
          </h2>
          <p className="mt-4 text-[1.125rem] text-black/65">
            Every membership opens with 14 days free. Cancel any time.
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
              Clothes follow your body. We never alter it.
            </h2>
            <p className="mt-5 max-w-lg text-[1.125rem] leading-relaxed text-black/65">
              Your styling photo stays on your device. We never sell your data. Delete your account
              in one tap and everything goes with it.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <a href="/app" className="glass-btn">
                Start 14 days free
              </a>
              <a
                href="/privacy"
                className="inline-flex items-center text-[1rem] font-medium text-[var(--gold)] hover:underline"
              >
                How we protect you <ChevronRight size={18} aria-hidden />
              </a>
            </div>
            <p className="mt-6 text-[0.9rem] text-black/55">
              On the web today. iPhone and Android are on the way.
            </p>
          </div>
          <Phone src={shotToday} alt="The LiveAskew app's Today screen" />
        </div>
      </section>
    </SiteFrame>
  );
}
