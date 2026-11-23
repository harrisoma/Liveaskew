import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Megaphone,
  Package,
  Sparkles,
  Store,
} from "lucide-react";
import brandImg from "@/assets/site/consulting/brand.webp";
import marketingImg from "@/assets/site/consulting/marketing.webp";
import retailImg from "@/assets/site/consulting/retail.webp";
import productImg from "@/assets/site/consulting/product.webp";
import { SiteFrame } from "./chrome";
import { Eyebrow } from "./ui";

const CORE = [
  {
    n: "01",
    Icon: Sparkles,
    title: "Brand Identity Creation",
    tag: "Make the brand unmistakable",
    image: brandImg,
    alt: "Two consultants reviewing brand identity sketches, color swatches and typography notes",
    desc: "Name, story, logo direction, color, type, voice, and visual identity — so your brand looks like what it sells.",
    deliverables: [
      "Brand story + positioning",
      "Logo + color + type direction",
      "Identity deck",
      "Brand guidelines",
    ],
  },
  {
    n: "02",
    Icon: Megaphone,
    title: "Marketing",
    tag: "Campaigns that look expensive",
    image: marketingImg,
    alt: "A creative team reviewing printed black and gold editorial photos in front of a moodboard",
    desc: "Campaigns, content, and launches that look expensive because they are styled right.",
    deliverables: [
      "Campaign direction",
      "Content + lookbook planning",
      "Shoot styling",
      "Launch + social calendar",
    ],
  },
  {
    n: "03",
    Icon: Store,
    title: "Retail Strategies",
    tag: "Stores that sell",
    image: retailImg,
    alt: "A stylist arranging a boutique rail of black garments beside jackets with gold embroidery",
    desc: "Stores that sell. Assortment, merchandising, pricing, and floor flow built around how people actually shop.",
    deliverables: [
      "Assortment planning",
      "Visual merchandising",
      "Pricing + margin strategy",
      "Store layout + window direction",
    ],
  },
  {
    n: "04",
    Icon: Package,
    title: "Product Design",
    tag: "Products people want to wear",
    image: productImg,
    alt: "Designers reviewing a jacket tech pack with fabric swatches and a sample",
    desc: "Products people want to wear. From idea to tech pack to sample — with a stylist's eye for fit, fabric, and wearability.",
    deliverables: [
      "Product + collection direction",
      "Tech packs",
      "Fabric + trim sourcing",
      "Sample review + fitting",
    ],
  },
] as const;

type Category = "Brand" | "Retail" | "Content" | "People";

const MENU: { title: string; desc: string; cat: Category }[] = [
  {
    title: "Personal + Executive Styling",
    desc: "A wardrobe and image that match the role you are stepping into.",
    cat: "People",
  },
  {
    title: "Team + Uniform Styling",
    desc: "Corporate wardrobe programs your team will actually wear.",
    cat: "People",
  },
  {
    title: "Image + Presence Coaching",
    desc: "For founders, talent, and executives who need to show up clearly.",
    cat: "People",
  },
  {
    title: "Wardrobe Audits + Closet Systems",
    desc: "Edit, organize, and rebuild wardrobes for teams and clients.",
    cat: "People",
  },
  {
    title: "Fashion Buying + Sourcing Strategy",
    desc: "Buy smarter — the right range, the right suppliers, the right timing.",
    cat: "Retail",
  },
  {
    title: "Vendor + Manufacturer Introductions",
    desc: "Warm introductions to production partners who can deliver.",
    cat: "Retail",
  },
  {
    title: "E-commerce + Product Photography Styling",
    desc: "Product pages that make people add to cart.",
    cat: "Content",
  },
  {
    title: "Lookbooks, Catalogs + Campaign Production",
    desc: "From concept to shoot day to finished assets.",
    cat: "Content",
  },
  {
    title: "Social + Content Direction for Brands",
    desc: "A visual language that holds together across every post.",
    cat: "Content",
  },
  {
    title: "Influencer + Creator Styling",
    desc: "Styling and partnerships that feel believable on camera.",
    cat: "Content",
  },
  {
    title: "Event Styling",
    desc: "Launches, pop-ups, runway, and press — styled end to end.",
    cat: "Brand",
  },
  {
    title: "Trend Forecasting + Seasonal Planning",
    desc: "See what is coming, then plan the season around it.",
    cat: "Brand",
  },
  {
    title: "Pricing, Costing + Margin Review",
    desc: "A clear-eyed review for apparel, with room to grow.",
    cat: "Retail",
  },
  {
    title: "Sustainability + Fabric Strategy",
    desc: "Better materials and honest choices, without losing the look.",
    cat: "Brand",
  },
  {
    title: "Brand Refresh / Rebrand Styling",
    desc: "Keep what works. Restyle what no longer fits.",
    cat: "Brand",
  },
  {
    title: "Training Your Team to Style + Sell",
    desc: "Practical training so styling becomes part of how you sell.",
    cat: "People",
  },
];

const FILTERS: ("All" | Category)[] = ["All", "Brand", "Retail", "Content", "People"];

const STEPS = [
  { title: "Diagnose", text: "Audit brand, product, store, content." },
  { title: "Design", text: "Direction, identity, assortment, campaign." },
  { title: "Deliver", text: "Styling, production, launch." },
  { title: "Support", text: "Ongoing styling, seasonal refresh, team training." },
];

const AUDIENCE = [
  { title: "Startups launching a brand", text: "Start with a look that earns trust from day one." },
  { title: "Boutiques + retailers", text: "Turn foot traffic into loyal, returning customers." },
  {
    title: "Apparel + accessories brands",
    text: "Collections and campaigns that feel considered.",
  },
  { title: "Creators + influencers", text: "Build a brand beyond the feed." },
  { title: "Founders + executives", text: "Build an image that matches the ambition." },
  { title: "Hotels, salons + studios", text: "Build a look guests remember and return to." },
];

const FOCUS: Record<(typeof CORE)[number]["title"], string> = {
  "Brand Identity Creation":
    "We will start with your story and positioning, then shape the visual identity around it.",
  Marketing: "We will shape the campaign idea, then plan the shoot, content, and launch around it.",
  "Retail Strategies":
    "We will walk your assortment, floor, and pricing — then map what to change first.",
  "Product Design":
    "We will review the collection idea, then shape fit, fabric, and the path to sample.",
};

function bookHref(focus?: string) {
  const params = new URLSearchParams({ service: "consulting" });
  if (focus) params.set("focus", focus);
  return `/book?${params.toString()}`;
}

export function ConsultingPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [focus, setFocus] = useState<keyof typeof FOCUS>("Brand Identity Creation");
  const shown = filter === "All" ? MENU : MENU.filter((item) => item.cat === filter);

  return (
    <SiteFrame current="/consulting">
      {/* Hero */}
      <section className="lac-hero px-5 pt-36 pb-20 md:px-8 md:pt-44 md:pb-28">
        <p className="lac-hero-word lac-hero-word-top" aria-hidden>
          CONSULTING
        </p>
        <div className="relative mx-auto grid max-w-[1320px] items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="lac-pill">
              <span aria-hidden className="lac-dot" />
              Business consulting
            </p>
            <h1 className="la-serif mt-7 text-[2.9rem] leading-[1.04] md:text-[4.4rem]">
              Business Consulting, From a Professional Stylist.
            </h1>
            <p className="mt-6 max-w-xl text-[1.15rem] leading-relaxed text-black/70">
              A stylist sees what your customer sees first — your brand, your clothes, your store,
              your campaign. We turn that eye into strategy for your whole business.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#services" className="la-btn la-btn-dark">
                Explore the services <ArrowRight size={18} aria-hidden />
              </a>
              <a href="#menu" className="la-btn lac-btn-outline">
                See the full menu
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-black/10 pt-6 text-[0.9rem] font-semibold">
              <li>Brand · Marketing</li>
              <li>Retail · Product</li>
              <li>16 more ways we can help</li>
            </ul>
          </div>
          <figure className="lac-photo-card">
            <img
              src={brandImg}
              fetchPriority="high"
              alt="Two consultants reviewing brand identity sketches, color swatches and typography notes"
            />
            <figcaption className="flex items-center justify-between gap-3 px-2 pt-4 pb-1">
              <span className="la-eyebrow text-[0.75rem]">Brand identity, styled</span>
              <span className="lac-stat text-[0.8rem]">01 — Start here</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Core services */}
      <section id="services" className="la-section scroll-mt-24" aria-labelledby="core-title">
        <div className="mx-auto max-w-[1320px]">
          <div className="max-w-2xl">
            <Eyebrow>Core services</Eyebrow>
            <h2
              id="core-title"
              className="la-serif mt-4 text-[2.4rem] leading-[1.06] md:text-[3.4rem]"
            >
              Four ways to change how your business looks — and sells.
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-black/70">
              Start with one. Build the rest around it. Each service is practical, visual, and made
              to be used.
            </p>
          </div>
          <ol className="mt-14 grid gap-6">
            {CORE.map(({ n, Icon, title, tag, image, alt, desc, deliverables }, index) => (
              <li key={n} className="lac-service">
                <img
                  src={image}
                  alt={alt}
                  loading="lazy"
                  className={`lac-service-img ${index % 2 ? "md:order-2" : ""}`}
                />
                <div className="lac-service-copy">
                  <div className="flex items-center justify-between">
                    <span className="lac-icon" aria-hidden>
                      <Icon size={20} />
                    </span>
                    <span className="la-serif text-[2.4rem] leading-none text-[#b8860b]">{n}</span>
                  </div>
                  <p className="la-eyebrow mt-6 text-[0.75rem]">{tag}</p>
                  <h3 className="la-serif mt-2 text-[2rem] leading-tight md:text-[2.4rem]">
                    {title}
                  </h3>
                  <p className="mt-3 text-[1.0625rem] leading-relaxed text-black/70">{desc}</p>
                  <details className="lac-deliverables mt-6">
                    <summary>
                      <span>What you get — {deliverables.length} included</span>
                      <ChevronDown size={18} aria-hidden />
                    </summary>
                    <ul>
                      {deliverables.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </details>
                  <a href={bookHref(title)} className="lac-text-link mt-6">
                    Start with {title} <ArrowRight size={16} aria-hidden />
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Full menu */}
      <section id="menu" className="la-section la-panel scroll-mt-24" aria-labelledby="menu-title">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <Eyebrow>Full consultancy menu</Eyebrow>
              <h2
                id="menu-title"
                className="la-serif mt-4 text-[2.4rem] leading-[1.06] md:text-[3.4rem]"
              >
                Everything else you can get from a professional stylist.
              </h2>
            </div>
            <p className="max-w-sm text-[1rem] leading-relaxed text-black/65">
              Filter by what you need most. Every item is a real service — not a vague promise.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Filter services">
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                className="lac-filter"
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[0.9rem] text-black/55" aria-live="polite">
            Showing {shown.length} of {MENU.length} services.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {shown.map((item) => {
              const number = String(MENU.indexOf(item) + 1).padStart(2, "0");
              return (
                <li key={item.title} className="la-card">
                  <p className="la-eyebrow text-[0.72rem] text-[#8a6412]">
                    {number} · {item.cat}
                  </p>
                  <h3 className="la-serif mt-3 text-[1.35rem] leading-snug">{item.title}</h3>
                  <p className="mt-2 text-[0.98rem] leading-relaxed text-black/65">{item.desc}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* How we work + who it's for */}
      <section className="la-section la-dark" aria-labelledby="how-title">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Eyebrow>How we work</Eyebrow>
              <h2
                id="how-title"
                className="la-serif mt-4 text-[2.4rem] leading-[1.06] md:text-[3.4rem]"
              >
                Clear steps. No jargon. Work you can see.
              </h2>
              <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed text-white/70">
                We start where your business actually is — then build the look, the offer, and the
                launch around it.
              </p>
              <a href={bookHref()} className="la-btn lac-btn-gold mt-8">
                Start with Diagnose <ArrowRight size={18} aria-hidden />
              </a>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {STEPS.map((step, index) => (
                <li key={step.title} className="lac-dark-card">
                  <span className="la-serif text-[2.6rem] leading-none text-[#e2b04a]">
                    {index + 1}
                  </span>
                  <h3 className="la-serif mt-4 text-[1.7rem]">{step.title}</h3>
                  <p className="mt-2 text-[1rem] leading-relaxed text-white/70">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-24 border-t border-white/15 pt-16">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <h2 className="la-serif text-[2.4rem] leading-[1.06] md:text-[3rem]">Who it's for</h2>
              <p className="max-w-sm text-[1rem] leading-relaxed text-white/70">
                If people see your business before they hear your pitch, styling is strategy.
              </p>
            </div>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {AUDIENCE.map((item) => (
                <li key={item.title} className="lac-light-card">
                  <h3 className="la-serif text-[1.35rem]">{item.title}</h3>
                  <p className="mt-2 text-[0.98rem] leading-relaxed text-black/65">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Book a consulting call */}
      <section className="la-section" aria-labelledby="call-title">
        <div className="lac-call mx-auto grid max-w-[1320px] overflow-hidden lg:grid-cols-[1.1fr_1fr]">
          <div className="p-8 md:p-12">
            <Eyebrow>Book a consulting call</Eyebrow>
            <h2
              id="call-title"
              className="la-serif mt-4 text-[2.4rem] leading-[1.06] md:text-[3.2rem]"
            >
              Let's look at your business the way your customer does.
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-black/70">
              Choose a focus to see where we would start. We'll carry it into your consultation
              request.
            </p>
            <p className="la-eyebrow mt-8 text-[0.75rem]">What do you want to focus on?</p>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Consulting focus">
              {CORE.map(({ title }) => (
                <button
                  key={title}
                  type="button"
                  className="lac-filter"
                  aria-pressed={focus === title}
                  onClick={() => setFocus(title)}
                >
                  {title}
                </button>
              ))}
            </div>
            <div className="lac-focus mt-5" aria-live="polite">
              <p className="la-eyebrow text-[0.72rem] text-[#8a6412]">Your focus: {focus}</p>
              <p className="mt-2 text-[1rem] leading-relaxed">{FOCUS[focus]}</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={bookHref(focus)} className="la-btn la-btn-dark">
                Book a Consulting Call <ArrowUpRight size={18} aria-hidden />
              </a>
              <a href="/design-studio" className="la-btn lac-btn-outline">
                See the Design Studio
              </a>
            </div>
          </div>
          <a href="/design-studio" className="lac-call-media">
            <img
              src={productImg}
              alt="Designers reviewing a jacket tech pack with fabric swatches and a sample"
              loading="lazy"
            />
            <span className="flex items-center justify-between gap-3 px-6 py-5">
              <span className="la-eyebrow text-[0.75rem]">From idea to sample</span>
              <span className="lac-stat text-[0.8rem]">Design Studio</span>
            </span>
          </a>
        </div>
      </section>
    </SiteFrame>
  );
}
