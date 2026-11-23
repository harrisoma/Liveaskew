import { useEffect } from "react";
import crestBee from "@/assets/brand/crest-bee.webp";
import crestBuzz from "@/assets/brand/crest-buzz.webp";
import crestHive from "@/assets/brand/crest-hive.webp";
import heroPortrait from "@/assets/site/hero-portrait.webp";
import { Crest } from "@/mobile/components/Crest";
import { forwardsToApp } from "./forward";
import { SiteFrame } from "./chrome";
import { BookingBand, Eyebrow, ItemGrid, SectionHeading, ServiceCard, Steps } from "./ui";

/**
 * Sign-in, checkout, and social connections used to land on "/", and home-screen installs
 * still open "/". The app lives at /app; anything that arrives here carrying a session,
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

function Feather({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${dark ? "bg-[#111]" : "bg-white shadow-[0_6px_20px_rgba(0,0,0,0.08)]"}`}
    >
      <img
        src="/liveaskew-signature.png"
        alt=""
        className="h-9 w-auto"
        style={{ aspectRatio: "866 / 1610" }}
      />
    </span>
  );
}

const APP_FEATURES = [
  {
    crest: <img src={crestBee} alt="" className="h-12 w-12" />,
    name: "Bee",
    text: "Your AI stylist. Outfits from the clothes you own, for your body and your plans.",
  },
  {
    crest: <Crest name="honey" size={48} decorative />,
    name: "Honey",
    text: "Your calendar, dressed. Bring in your plans and get a look for each one.",
  },
  {
    crest: <img src={crestBuzz} alt="" className="h-12 w-12" />,
    name: "Buzz",
    text: "Share your looks to social with captions in your voice. Coming soon.",
  },
  {
    crest: <img src={crestHive} alt="" className="h-12 w-12" />,
    name: "The Hive",
    text: "A community for women. Real talk about style, work, family and life.",
  },
];

export function HomePage() {
  useForwardAppReturns();

  return (
    <SiteFrame current="/">
      {/* Hero */}
      <section className="lac-hero px-5 pt-36 md:px-8 md:pt-40" aria-labelledby="home-title">
        <p className="lac-hero-word" aria-hidden>
          LIVEASKEW
        </p>
        <div className="relative mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.6fr)] lg:items-end">
          <div className="order-2 pb-4 lg:order-1 lg:pb-56">
            <Eyebrow>Professional Stylist · Apps · Consulting · Design Studio</Eyebrow>
            <h1
              id="home-title"
              className="la-serif mt-5 text-[3rem] leading-[1.04] md:text-[4.6rem]"
            >
              Professional Styling, Done Right.
            </h1>
            <p className="mt-6 max-w-lg text-[1.15rem] leading-relaxed text-black/80">
              Live Askew is a professional styling company. We style people and brands, and back it
              with apps, consulting and a design studio.
            </p>
            <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
              <a href="/book?service=styling" className="la-btn la-btn-dark">
                Book a Styling Consultation <span aria-hidden>→</span>
              </a>
              <a href="/apps" className="la-btn la-btn-light">
                Explore the Styling App
              </a>
            </div>
          </div>
          <figure className="lac-hero-figure order-1 lg:order-2">
            <img
              src={heroPortrait}
              fetchPriority="high"
              width={1000}
              height={3128}
              alt="A woman in a tailored black suit with gold floral embroidery on the jacket"
            />
          </figure>
        </div>

        {/* Service cards */}
        <div className="relative z-10 mx-auto grid max-w-[1320px] gap-5 pt-10 pb-14 lg:-mt-44 lg:pt-0 lg:grid-cols-3 lg:items-end lg:pb-16">
          <ServiceCard
            href="#styling"
            chip="Professional Styling"
            title="Professional Styling"
            text="Work one on one with a stylist on your wardrobe, your image and your events."
            icon={<Feather />}
          />
          <ServiceCard
            href="/apps"
            chip="Styling App"
            title="Styling App"
            text="Your stylist in your pocket. Plan outfits, save looks, manage your wardrobe."
            featured
            icon={<Feather dark />}
            className="lg:-mt-10 lg:pb-14"
          />
          <ServiceCard
            href="#business"
            chip="Consulting + Design Studio"
            title="Consulting + Design Studio"
            text="Strategy, image, and apparel design that scale together."
          />
        </div>
      </section>

      {/* Professional styling */}
      <section id="styling" className="la-section scroll-mt-28">
        <div className="mx-auto max-w-[1320px]">
          <SectionHeading
            eyebrow="Professional styling"
            title="A stylist who works with your body, your life and your wardrobe."
            intro="LiveAskew starts with real styling. Every session is built on our Fit · Feel · Fabric method, so your clothes work for you."
          />
          <ItemGrid
            items={[
              {
                title: "Fit",
                text: "Shapes, cuts and proportions chosen for your body as it is today. We style the body you have; we never ask you to change it.",
              },
              {
                title: "Feel",
                text: "How you want to feel at work, on the weekend or at an event guides every choice.",
              },
              {
                title: "Fabric",
                text: "Textures, weights and care that suit your climate, your comfort and the way you actually live.",
              },
            ]}
          />
          <h3 className="la-serif mt-20 text-[2rem] md:text-[2.4rem]">How it works</h3>
          <Steps
            steps={[
              {
                title: "Book a consultation",
                text: "Tell us what you need and when you're free. We'll confirm a time with you.",
              },
              {
                title: "Meet your stylist",
                text: "We talk through your goals, your wardrobe and your plans, then build your looks together.",
              },
              {
                title: "Keep it going",
                text: "Take your looks home in the Bee app, so the styling carries on between sessions.",
              },
            ]}
          />
          <a href="/book?service=styling" className="la-btn la-btn-dark mt-12">
            Book a Styling Consultation <span aria-hidden>→</span>
          </a>
        </div>
      </section>

      {/* The app */}
      <section className="la-section la-panel" aria-labelledby="home-app">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <Eyebrow>The Bee app</Eyebrow>
              <h2
                id="home-app"
                className="la-serif mt-4 text-[2.4rem] leading-[1.06] md:text-[3.4rem]"
              >
                Your stylist in your pocket.
              </h2>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-black/75">
                Our styling app puts the LiveAskew method in your hand. Try it free for 14 days. No
                card needed.
              </p>
            </div>
            <a href="/apps" className="la-btn la-btn-light shrink-0">
              Explore the app <span aria-hidden>→</span>
            </a>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {APP_FEATURES.map((feature) => (
              <li key={feature.name} className="la-card">
                {feature.crest}
                <h3 className="la-serif mt-5 text-[1.7rem]">{feature.name}</h3>
                <p className="mt-2 text-[1rem] leading-relaxed text-black/70">{feature.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Business services */}
      <section id="business" className="la-section scroll-mt-28">
        <div className="mx-auto max-w-[1320px]">
          <SectionHeading
            eyebrow="For companies and brands"
            title="Styling for your business, too."
            intro="The eye that dresses our clients also shapes brands. We help companies with marketing, brand image and the products themselves."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <ServiceCard
              href="/consulting"
              chip="Business Consulting"
              title="Business Consulting"
              text="Brand image, marketing and styling strategy for companies, teams and public-facing people."
            />
            <ServiceCard
              href="/design-studio"
              chip="Design Studio"
              title="Design Studio"
              text="Apparel, merchandise and visual design for brands that want to be worn and remembered."
            />
          </div>
        </div>
      </section>

      <BookingBand />
    </SiteFrame>
  );
}
