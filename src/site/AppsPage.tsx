import { useState, type ReactNode } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import crestBee from "@/assets/brand/crest-bee.webp";
import crestBuzz from "@/assets/brand/crest-buzz.webp";
import crestHive from "@/assets/brand/crest-hive.webp";
import hiveGathering from "@/assets/brand/hive-gathering.webp";
import beeFlatlay from "@/assets/site/bee-flatlay-app.webp";
import buzzBroadcast from "@/assets/site/buzz-broadcast.webp";
import shotToday from "@/assets/site/today.webp";
import { Crest } from "@/mobile/components/Crest";
import { FAQ } from "./faq";
import { BeeSalesChat } from "./BeeSalesChat";
import { StylingExample } from "./StylingExample";
import { HoneyPreview } from "./HoneyPreview";
import { SocialIcon } from "./SocialIcon";
import { PriceBook } from "./PriceBook";
import { SiteFrame } from "./chrome";
import { BookingBand, Eyebrow, PageHero } from "./ui";
import "./miami.css";

/** Section title used by every feature: crest, eyebrow, serif name, one-line promise. */
function FeatureHead({
  crest,
  eyebrow,
  name,
  promise,
  children,
}: {
  crest: ReactNode;
  eyebrow: string;
  name: string;
  promise: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-4">
        {crest}
        <Eyebrow className="text-[#8a6412]">{eyebrow}</Eyebrow>
      </div>
      <h2 className="la-serif mt-4 text-[2.6rem] leading-none md:text-[3.6rem]">{name}</h2>
      <p className="la-serif mt-4 text-[1.5rem] leading-snug text-black/80 italic md:text-[1.75rem]">
        {promise}
      </p>
      {children ? (
        <div className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-black/70">
          {children}
        </div>
      ) : null}
    </div>
  );
}

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

const JUMP = [
  { href: "#bee", label: "Bee" },
  { href: "#honey", label: "Honey" },
  { href: "#buzz", label: "Buzz" },
  { href: "#hive", label: "The Hive" },
  { href: "#pricing", label: "Plans" },
  { href: "#faq", label: "FAQ" },
];

export function AppsPage() {
  const [meetBeeOpen, setMeetBeeOpen] = useState(false);

  return (
    <SiteFrame current="/apps">
      <button className="bee-chat-launcher" onClick={() => setMeetBeeOpen(true)}>
        Chat with Bee
      </button>
      <BeeSalesChat open={meetBeeOpen} onClose={() => setMeetBeeOpen(false)} />
      <div className="miami-home">
        <PageHero
          eyebrow="The LiveAskew styling app"
          title={
            <>
              Your stylist,
              <br />
              in your pocket.
            </>
          }
          intro={
            <>
              <p>
                Meet Bee, the AI stylist inside the LiveAskew app. Turn the clothes you own into
                outfits for your body, your plans and your personal style. Honey, Buzz and The Hive
                are built in.
              </p>
              <p className="mt-3 text-base text-black/60">
                14 days free. No card to get started. Based in Miami, inspired by the world.
              </p>
            </>
          }
          actions={
            <>
              <a href="/app" className="la-btn la-btn-dark">
                Start your free trial <span aria-hidden>→</span>
              </a>
              <button
                type="button"
                onClick={() => setMeetBeeOpen(true)}
                className="la-btn la-btn-light"
              >
                Meet Bee
              </button>
            </>
          }
          aside={<Phone src={shotToday} alt="The LiveAskew app's Today screen" />}
        />

        <nav className="lac-jump" aria-label="On this page">
          {JUMP.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        {/* Bee */}
        <section id="bee" className="la-section scroll-mt-28">
          <div className="mx-auto max-w-[1320px]">
            <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <FeatureHead
                crest={<img src={crestBee} alt="" className="h-14 w-14" />}
                eyebrow="Your AI stylist"
                name="Meet Bee."
                promise="Outfits from the clothes you already own."
              >
                Tell Bee what you own, where you're going and how you want to feel. She builds a
                look from your wardrobe and adjusts it with you until it suits you.
              </FeatureHead>
              <img
                src={beeFlatlay}
                alt="A look laid out on the bed: burgundy sweater, grey trousers, gold mules, scarf, bag and jewelry, with that look open in Bee"
                loading="lazy"
                className="lac-feature-img"
              />
            </div>
            <StylingExample />
          </div>
        </section>

        {/* Honey */}
        <section id="honey" className="la-section la-panel scroll-mt-28">
          <div className="mx-auto grid max-w-[1320px] items-center gap-10 lg:grid-cols-2">
            <div>
              <FeatureHead
                crest={<Crest name="honey" size={56} decorative />}
                eyebrow="Your calendar"
                name="Honey"
                promise="A look for every plan on your calendar."
              >
                Bring your plans into Honey, from a workday to a coffee date, and Bee suggests a
                look for each one.
              </FeatureHead>
              <ul className="lac-checks mt-8 text-[1.02rem]">
                <li>
                  <ChevronRight size={16} aria-hidden />
                  Bring in your Google, iCloud or Outlook calendar feed
                </li>
                <li>
                  <ChevronRight size={16} aria-hidden />
                  Tap any plan and Bee picks the look
                </li>
                <li>
                  <ChevronRight size={16} aria-hidden />
                  Month, week and agenda views, with an outfit on each plan
                </li>
                <li>
                  <ChevronRight size={16} aria-hidden />
                  Add plans by hand when they're not in a calendar
                </li>
              </ul>
            </div>
            <div className="min-w-0">
              <HoneyPreview />
            </div>
          </div>
        </section>

        {/* Buzz + The Hive */}
        <section className="la-section" aria-label="Buzz and The Hive">
          <div className="mx-auto grid max-w-[1320px] gap-6 lg:grid-cols-2">
            <article id="buzz" className="lac-feature-card scroll-mt-28">
              <img
                src={buzzBroadcast}
                alt="A woman smiling at her phone as her look goes out to her social networks"
                loading="lazy"
                style={{ objectPosition: "65% center" }}
              />
              <div className="p-7 md:p-9">
                <FeatureHead
                  crest={<img src={crestBuzz} alt="" className="h-12 w-12" />}
                  eyebrow="Social posting · Coming soon"
                  name="Buzz"
                  promise="Share a look without leaving the app."
                >
                  Bee will write a caption in your voice for each network. Buzz will post it at the
                  time you choose and add it to Honey.
                </FeatureHead>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {NETWORKS.map((n) => (
                    <li key={n} className="lac-network">
                      <SocialIcon network={n} />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            </article>

            <article id="hive" className="lac-feature-card scroll-mt-28">
              <img
                src={hiveGathering}
                alt="Friends gathered on a sofa in a bright room, laughing and talking"
                loading="lazy"
                style={{ objectPosition: "78% center" }}
              />
              <div className="p-7 md:p-9">
                <FeatureHead
                  crest={<img src={crestHive} alt="" className="h-12 w-12" />}
                  eyebrow="The community"
                  name="The Hive"
                  promise="A private community for women."
                >
                  Talk about style, confidence, family and work with other members. You choose a
                  Hive name, your email and number stay private, and real moderators read every
                  report.
                </FeatureHead>
                <a href="/app" className="la-btn la-btn-dark mt-7">
                  Join The Hive <ArrowRight size={18} aria-hidden />
                </a>
              </div>
            </article>
          </div>
        </section>

        {/* Plans */}
        <section id="pricing" className="la-section la-panel scroll-mt-28">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <Eyebrow>Membership</Eyebrow>
            <h2 className="la-serif mt-4 text-[2.6rem] leading-[1.04] md:text-[3.6rem]">
              Try it free. Fall in love.
            </h2>
            <p className="mt-4 text-[1.0625rem] text-black/65">
              14 days free without a card. Choose a membership when you're ready.{" "}
              <a href="/pricing" className="font-semibold text-black underline underline-offset-4">
                See all LiveAskew pricing
              </a>
              .
            </p>
          </div>
          <PriceBook />
        </section>

        {/* Questions */}
        <section id="faq" className="la-section scroll-mt-28">
          <div className="mx-auto max-w-3xl">
            <Eyebrow>Good questions</Eyebrow>
            <h2 className="la-serif mt-4 text-[2.4rem] leading-[1.04] md:text-[3.2rem]">
              Everything you're wondering.
            </h2>
            <div className="mt-10 divide-y divide-black/10 border-y border-black/10">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[1.15rem]">
                    <h3>{item.q}</h3>
                    <ChevronRight
                      size={20}
                      aria-hidden
                      className="shrink-0 text-[#8a6412] transition-transform group-open:rotate-90"
                    />
                  </summary>
                  <p className="mt-3 text-[1.0625rem] leading-relaxed text-black/70">{item.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-[0.98rem] text-black/65">
              Clothes follow your body. We never alter it, and we never sell your data.{" "}
              <a href="/privacy" className="font-semibold text-black underline underline-offset-4">
                How we keep you safe
              </a>
              .
            </p>
          </div>
        </section>
      </div>
      <BookingBand
        title="Want a stylist, not just an app?"
        text="Book a consultation with a LiveAskew stylist. Your looks carry straight into Bee."
        service="styling"
      />
    </SiteFrame>
  );
}
