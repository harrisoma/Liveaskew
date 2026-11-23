import { useEffect, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { SiteFrame } from "./chrome";
import { APP_TIERS, OFFERS } from "./offers";
import { StudioCheckoutButton } from "./StudioCheckout";
import { Eyebrow, SectionHeading } from "./ui";

export function PricingPage() {
  const [cancelled, setCancelled] = useState(false);
  useEffect(() => {
    setCancelled(new URLSearchParams(window.location.search).get("checkout") === "cancelled");
  }, []);

  return (
    <SiteFrame current="/pricing">
      <section className="lac-hero px-5 pt-36 pb-16 md:px-8 md:pt-44">
        <div className="relative mx-auto max-w-[1320px]">
          <div className="max-w-3xl">
            <p className="lac-pill">
              <span aria-hidden className="lac-dot" />
              Pricing
            </p>
            <h1 className="la-serif mt-7 text-[2.9rem] leading-[1.04] md:text-[4.4rem]">
              Clear pricing for every way in.
            </h1>
            <p className="mt-6 max-w-xl text-[1.15rem] leading-relaxed text-black/70">
              The app and the Design Studio are monthly. Personal styling and business consulting
              start with a consultation, so the price fits what you actually need.
            </p>
          </div>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="Pricing categories">
            {OFFERS.map((offer) => (
              <a
                key={offer.id}
                href={`#${offer.id}`}
                className="lac-filter inline-flex items-center"
              >
                {offer.name}
              </a>
            ))}
          </nav>
          {cancelled ? (
            <p role="status" className="lac-focus mt-6 max-w-xl text-[0.98rem]">
              Checkout was cancelled — nothing was charged. Start again whenever you're ready, or
              book a call to talk it through first.
            </p>
          ) : null}
        </div>
      </section>

      <section className="la-section pt-12 md:pt-16" aria-label="Plans by category">
        <ul className="mx-auto grid max-w-[1320px] gap-5 md:grid-cols-2 xl:grid-cols-4">
          {OFFERS.map((offer) => (
            <li
              key={offer.id}
              id={offer.id}
              className={`lac-price scroll-mt-28 ${offer.id === "design-studio" ? "is-featured" : ""}`}
            >
              <p className="la-eyebrow text-[0.72rem] text-[#8a6412]">{offer.forWho}</p>
              <h2 className="la-serif mt-3 text-[1.7rem] leading-tight">{offer.name}</h2>
              <p className="mt-5 flex min-h-[4.6rem] flex-wrap content-start items-baseline gap-x-2 gap-y-1">
                <span
                  className={`la-serif leading-none ${/\d/.test(offer.price) ? "text-[2.6rem]" : "text-[1.9rem]"}`}
                >
                  {offer.price}
                </span>
                <span className="text-[0.9rem] text-black/60">{offer.priceNote}</span>
              </p>
              <p className="mt-4 text-[0.98rem] leading-relaxed text-black/70">{offer.summary}</p>
              <ul className="lac-checks mt-6">
                {offer.includes.map((item) => (
                  <li key={item}>
                    <Check size={16} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-8">
                {offer.id === "design-studio" ? (
                  <StudioCheckoutButton className="la-btn la-btn-dark w-full" />
                ) : (
                  <a href={offer.href} className="la-btn la-btn-dark w-full">
                    {offer.cta}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="la-section la-panel" aria-labelledby="app-plans">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              eyebrow="The Bee App"
              title={<span id="app-plans">App memberships</span>}
              intro="Every membership starts with 14 days free — no card to get started."
            />
            <a href="/apps#pricing" className="lac-text-link">
              Compare every feature <ArrowRight size={16} aria-hidden />
            </a>
          </div>
          <ul className="mt-10 grid gap-3">
            {APP_TIERS.map((tier) => (
              <li key={tier.slug} className="lac-tier">
                <span>
                  <span className="la-serif block text-[1.35rem]">{tier.name}</span>
                  <span className="text-[0.95rem] text-black/65">{tier.tagline}</span>
                </span>
                <span className="la-serif text-[1.6rem] whitespace-nowrap">
                  {tier.inquiry ? "By inquiry" : `$${tier.priceMonthly}`}
                  {tier.inquiry ? null : (
                    <span className="ml-1 font-sans text-[0.85rem] text-black/55">/ month</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <a href="/app" className="la-btn la-btn-dark mt-8">
            Start your free trial <ArrowRight size={18} aria-hidden />
          </a>
        </div>
      </section>

      <section className="la-section">
        <div className="mx-auto max-w-[1320px] text-center">
          <Eyebrow>Not sure where to start?</Eyebrow>
          <h2 className="la-serif mx-auto mt-4 max-w-2xl text-[2.2rem] leading-tight md:text-[2.8rem]">
            Tell us what you need and we'll point you the right way.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="/start" className="la-btn la-btn-dark">
              Get started <ArrowRight size={18} aria-hidden />
            </a>
            <a href="/book" className="la-btn lac-btn-outline">
              Book a consultation
            </a>
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
