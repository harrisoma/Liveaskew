import { ArrowRight } from "lucide-react";
import { SiteFrame } from "./chrome";
import { OFFERS } from "./offers";
import { StudioCheckoutButton } from "./StudioCheckout";

const STEPS = ["Choose your path", "Sign up or book", "We get to work"];

export function StartPage() {
  return (
    <SiteFrame current="/start">
      <section className="lac-hero px-5 pt-36 pb-16 md:px-8 md:pt-44">
        <div className="relative mx-auto max-w-[1320px]">
          <div className="max-w-3xl">
            <p className="lac-pill">
              <span aria-hidden className="lac-dot" />
              Get started
            </p>
            <h1 className="la-serif mt-7 text-[2.9rem] leading-[1.04] md:text-[4.4rem]">
              Where would you like to start?
            </h1>
            <p className="mt-6 max-w-xl text-[1.15rem] leading-relaxed text-black/70">
              Four ways to work with LiveAskew: for you, for your business, or for the things your
              brand makes. Start with one and add the rest later.
            </p>
          </div>
          <ol className="lac-funnel-steps mt-10" aria-label="How it works">
            {STEPS.map((step, index) => (
              <li key={step}>
                <span className="la-serif">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="la-section pt-12 md:pt-16" aria-label="Choose your path">
        <ul className="mx-auto grid max-w-[1320px] gap-6 md:grid-cols-2">
          {OFFERS.map((offer) => {
            return (
              <li key={offer.id} id={offer.id} className="lac-path scroll-mt-28">
                <div className="lac-path-body">
                  <p className="la-eyebrow text-[0.75rem] text-[#8a6412]">{offer.forWho}</p>
                  <h2 className="la-serif mt-3 text-[1.7rem] leading-tight md:text-[2rem]">
                    {offer.name}
                  </h2>
                  <p className="mt-3 text-[1.0625rem] leading-relaxed text-black/70">
                    {offer.summary}
                  </p>
                  <p className="mt-6 flex items-baseline gap-2">
                    <span className="la-serif text-[1.7rem] leading-none">{offer.price}</span>
                    <span className="text-[0.92rem] text-black/60">{offer.priceNote}</span>
                  </p>
                  <div className="mt-6 flex flex-wrap items-start gap-3">
                    {offer.id === "design-studio" ? (
                      <>
                        <StudioCheckoutButton />
                        <a href={offer.href} className="la-btn lac-btn-outline">
                          Talk to us first
                        </a>
                      </>
                    ) : (
                      <a href={offer.href} className="la-btn la-btn-dark">
                        {offer.cta} <ArrowRight size={18} aria-hidden />
                      </a>
                    )}
                  </div>
                  <a href={`/pricing#${offer.id}`} className="lac-text-link mt-3">
                    See what's included <ArrowRight size={16} aria-hidden />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mx-auto mt-14 max-w-[1320px] text-center">
          <p className="text-[1.0625rem] text-black/70">
            Not sure which fits?{" "}
            <a href="/book" className="font-semibold text-black underline underline-offset-4">
              Book a consultation
            </a>{" "}
            and we'll point you the right way.
          </p>
        </div>
      </section>
    </SiteFrame>
  );
}
