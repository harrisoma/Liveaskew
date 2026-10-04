import { useEffect } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import hiveGathering from "@/assets/brand/hive-gathering.webp";
import heroEditorial from "@/assets/site/hero-style.jpg";
import outfitEditorial from "@/assets/site/honey-outfits.jpg";
import buzzBroadcast from "@/assets/site/buzz-broadcast.webp";
import { FAQ } from "./faq";
import { forwardsToApp } from "./forward";
import { HoneyPreview } from "./HoneyPreview";
import { SocialIcon } from "./SocialIcon";
import { PriceBook } from "./PriceBook";
import { SITE_PLANS } from "./plans";
import { SiteFrame } from "./chrome";

function useForwardAppReturns() {
  useEffect(() => {
    const { search, hash } = window.location;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (forwardsToApp(search, hash, standalone)) window.location.replace(`/app${search}${hash}`);
  }, []);
}

const NETWORKS = ["Instagram", "Facebook", "LinkedIn", "X", "Threads"];
const STARTING_PRICE = SITE_PLANS.find((p) => p.slug === "silver")!.priceMonthly;

export function Landing() {
  useForwardAppReturns();
  return (
    <SiteFrame>
      <div className="editorial">
        <section className="ed-hero ed-wrap">
          <div className="ed-hero-copy">
            <p className="ed-eyebrow">Personal style. Real life.</p>
            <h1>
              Let's get
              <br />
              you <em>dressed.</em>
            </h1>
            <p className="ed-lead">Your body. Your wardrobe. Your kind of day.</p>
            <p className="ed-copy">
              Meet Bee, your personal AI stylist. Discover what works for you, starting with the
              clothes you already love.
            </p>
            <div className="ed-actions">
              <a className="ed-button" href="/app">
                Start your 14 days free <ArrowUpRight size={18} aria-hidden />
              </a>
              <a className="ed-link" href="#honey">
                See a styled day <ChevronRight size={16} aria-hidden />
              </a>
            </div>
            <p className="ed-note">
              From ${STARTING_PRICE}/month after your trial · Cancel any time
            </p>
          </div>
          <figure className="ed-hero-image">
            <img
              src={heroEditorial}
              alt="Editorial styling inspiration: an ivory shirt, camel blazer and charcoal trousers in warm morning light"
              width={1122}
              height={1402}
              fetchPriority="high"
            />
            <figcaption>
              The everyday, considered. <span>AI-created editorial</span>
            </figcaption>
          </figure>
        </section>

        <div className="ed-cities">
          <div className="ed-wrap">
            <p className="ed-eyebrow">Inspired by the world. Styled for you.</p>
            <ul aria-label="Style inspirations">
              {["Miami", "New York", "California", "Milan", "Paris"].map((city) => (
                <li key={city}>{city}</li>
              ))}
            </ul>
          </div>
        </div>

        <section id="bee" className="ed-section ed-wrap">
          <div className="ed-heading">
            <p className="ed-eyebrow">01 / Bee · Your personal stylist</p>
            <h2>
              More ways to wear
              <br />
              <em>what makes you, you.</em>
            </h2>
            <p className="ed-copy">
              The dress you reach for. A shirt worn a little differently. Bee helps you put it all
              together, with fit, feel and fabric at the heart of every look.
            </p>
          </div>
          <figure className="ed-outfit-strip">
            <img
              src={outfitEditorial}
              width={2172}
              height={724}
              loading="lazy"
              alt="Three outfit ideas: a terracotta day dress, a blue shirt with a chocolate skirt, and a black evening dress"
            />
            <figcaption>
              Dresses, shirts, skirts—and possibilities. <span>AI-created styling inspiration</span>
            </figcaption>
          </figure>
          <ol className="ed-steps">
            <li>
              <span>01</span>
              <h3>Tell Bee about you.</h3>
              <p>Your fit, your taste, your everyday life. Start with a conversation.</p>
            </li>
            <li>
              <span>02</span>
              <h3>Rediscover your wardrobe.</h3>
              <p>Bring the pieces you own. Find new combinations worth wearing.</p>
            </li>
            <li>
              <span>03</span>
              <h3>Make the look yours.</h3>
              <p>Ask for an outfit, refine the details, and save what you love.</p>
            </li>
          </ol>
          <a className="ed-link" href="/app">
            Find your style with Bee <ArrowUpRight size={18} aria-hidden />
          </a>
        </section>

        <section id="honey" className="ed-honey ed-section">
          <div className="ed-wrap">
            <div className="ed-heading ed-heading-row">
              <div>
                <p className="ed-eyebrow">02 / Honey · Your calendar, styled</p>
                <h2>
                  A full day.
                  <br />
                  <em>One less decision.</em>
                </h2>
              </div>
              <div>
                <p className="ed-copy">
                  From a sunlit morning to an evening out. Bring your plans into Honey and ask Bee
                  for a look that fits the occasion.
                </p>
                <p className="ed-note">
                  Connect Google, iCloud or Outlook. Keep scheduled Buzz posts alongside your plans.
                </p>
              </div>
            </div>
            <HoneyPreview />
            <a className="ed-link ed-section-link" href="/app">
              Plan your day with Honey <ArrowUpRight size={18} aria-hidden />
            </a>
          </div>
        </section>

        <section id="buzz" className="ed-section ed-wrap ed-split">
          <figure className="ed-photo">
            <img
              src={buzzBroadcast}
              alt="A woman enjoying a moment on her phone, dressed for her day"
              loading="lazy"
            />
          </figure>
          <div className="ed-dark-copy">
            <p className="ed-eyebrow">03 / Buzz · Share your style</p>
            <h2>
              Love the look?
              <br />
              <em>Let it out.</em>
            </h2>
            <p className="ed-copy">
              A caption in your voice. A post on your time. Share your favourite looks with the
              accounts you choose.
            </p>
            <ul className="ed-networks">
              {NETWORKS.map((network) => (
                <li key={network}>
                  <SocialIcon network={network} />
                  {network}
                </li>
              ))}
            </ul>
            <ul className="ed-short-list">
              <li>Review and edit Bee's captions.</li>
              <li>Choose when your post goes live.</li>
              <li>See scheduled posts in Honey.</li>
            </ul>
            <a className="ed-button ed-button-light" href="/app">
              Open Buzz <ArrowUpRight size={18} aria-hidden />
            </a>
          </div>
        </section>

        <section id="hive" className="ed-hive ed-section">
          <div className="ed-wrap">
            <span id="real-talk" className="ed-anchor" aria-hidden />
            <div className="ed-hive-intro">
              <div>
                <p className="ed-eyebrow">04 / The Hive · Real talk. Real connection.</p>
                <h2>
                  Come for the style.
                  <br />
                  <em>Stay for the conversation.</em>
                </h2>
                <p className="ed-copy">
                  The Hive is where we talk about the rest of life, too. Motherhood, work, the
                  mirror, and whatever's on your mind. Share a look, ask a question, find your
                  people.
                </p>
                <a className="ed-link" href="/app">
                  Step inside The Hive <ArrowUpRight size={18} aria-hidden />
                </a>
              </div>
              <figure className="ed-photo">
                <img
                  src={hiveGathering}
                  alt="Women gathered on a sofa, sharing a relaxed conversation"
                  loading="lazy"
                />
              </figure>
            </div>
            <div className="ed-conversations">
              <p className="ed-eyebrow">A little real talk</p>
              <ul>
                <li>
                  <span>Style & self</span>
                  <p>“When did you last feel completely like yourself?”</p>
                </li>
                <li>
                  <span>Motherhood</span>
                  <p>“What do you wish someone had told you?”</p>
                </li>
                <li>
                  <span>Work & life</span>
                  <p>“What are you making room for next?”</p>
                </li>
              </ul>
              <p className="ed-note">
                Conversation starters, not member quotes. Choose a Hive name, share at your pace,
                and report or block whenever you need.
              </p>
            </div>
          </div>
        </section>

        <section id="pricing" className="ed-section ed-wrap">
          <div className="ed-heading">
            <p className="ed-eyebrow">Your membership</p>
            <h2>
              A little help.
              <br />
              <em>Every day.</em>
            </h2>
            <p className="ed-copy">
              Start with 14 days free. Memberships from ${STARTING_PRICE}/month after your trial.
              Choose the features that fit your life.
            </p>
          </div>
          <PriceBook />
        </section>

        <section id="faq" className="ed-faq ed-section ed-wrap">
          <div>
            <p className="ed-eyebrow">Good questions</p>
            <h2>
              A few things
              <br />
              <em>to know.</em>
            </h2>
          </div>
          <div>
            {FAQ.map((item) => (
              <details key={item.q}>
                <summary>
                  <h3>{item.q}</h3>
                  <ChevronRight size={18} aria-hidden />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="ed-close">
          <div className="ed-wrap">
            <p className="ed-eyebrow">Fit · Feel · Fabric</p>
            <h2>
              Feel like <em>yourself.</em>
              <br />
              Get dressed with Bee.
            </h2>
            <a className="ed-button" href="/app">
              Start your 14 days free <ArrowUpRight size={18} aria-hidden />
            </a>
            <p className="ed-note">Available on the web · iPhone and Android apps coming soon</p>
            <a href="/privacy" className="ed-link">
              Your photos, your choices. Read our privacy policy{" "}
              <ChevronRight size={16} aria-hidden />
            </a>
          </div>
        </section>
      </div>
    </SiteFrame>
  );
}
