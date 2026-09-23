import { useRef, useState } from "react";
import { PLANS, type Plan } from "@/lib/plans";

const TABS = [
  { slug: "silver", label: "Silver" },
  { slug: "gold", label: "Gold" },
  { slug: "platinum", label: "Platinum" },
  { slug: "platinum_plus", label: "Plus" },
  { slug: "platinum_plus_family", label: "Family" },
  { slug: "live_bee", label: "Live Bee" },
] as const;

function money(plan: Plan) {
  if (plan.inquiry || plan.priceMonthly === 0) return "Negotiated";
  return `$${plan.priceMonthly}`;
}

export function PriceBook() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [turning, setTurning] = useState(false);
  const busy = useRef(false);

  const plans = TABS.map((tab) => PLANS.find((plan) => plan.slug === tab.slug)).filter(
    (plan): plan is Plan => Boolean(plan),
  );
  const plan = plans[index] ?? plans[0];

  function show(next: number) {
    if (next === index || next < 0 || next >= plans.length || busy.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setIndex(next);
      return;
    }
    busy.current = true;
    setTurning(true);
    window.setTimeout(() => setIndex(next), 260);
    window.setTimeout(() => {
      busy.current = false;
      setTurning(false);
    }, 560);
  }

  if (!open) {
    return (
      <div className="price-book">
        <button type="button" className="book-cover" onClick={() => setOpen(true)}>
          <span className="book-cover-kicker">LiveAskew</span>
          <span className="book-cover-title">
            14 Day
            <br />
            Free Trial
          </span>
          <span className="book-cover-cta">See pricing</span>
        </button>
      </div>
    );
  }

  return (
    <div className="price-book">
      <div className={`book-open ${turning ? "is-turning" : ""}`}>
        <div className="book-tabs" role="tablist" aria-label="Plans">
          {TABS.map((tab, tabIndex) => (
            <button
              key={tab.slug}
              type="button"
              role="tab"
              id={`plan-tab-${tab.slug}`}
              aria-selected={tabIndex === index}
              aria-controls="plan-spread"
              className="book-tab"
              onClick={() => show(tabIndex)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          id="plan-spread"
          className="book-spread"
          role="tabpanel"
          aria-labelledby={`plan-tab-${plan.slug}`}
        >
          <article className="book-page book-page-left">
            <p className="book-kicker">Membership</p>
            <h2 className="font-display book-plan">{plan.name}</h2>
            <p className="book-price">
              {money(plan)}
              {plan.cadence ? <span className="book-cadence">{plan.cadence}</span> : null}
            </p>
            {plan.priceAnnual > 0 ? (
              <p className="book-annual">${plan.priceAnnual} for the year</p>
            ) : (
              <p className="book-annual">Set with you, after a conversation</p>
            )}
            <p className="book-tagline">{plan.tagline}</p>
            <p className="book-description">{plan.description}</p>
            {plan.inquiry ? (
              <a href="/checkout?plan=live_bee" className="glass-btn mt-8">
                Ask for a Live Bee
              </a>
            ) : (
              <div className="book-pay">
                <a className="glass-btn" href={`/checkout?plan=${plan.slug}&interval=month`}>
                  1 month · {money(plan)}
                </a>
                <a
                  className="glass-btn book-pay-year"
                  href={`/checkout?plan=${plan.slug}&interval=year`}
                >
                  1 year · ${plan.priceAnnual}
                </a>
              </div>
            )}
          </article>
          <article className="book-page book-page-right">
            <p className="book-kicker">In this plan</p>
            <ul className="book-features">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </article>
        </div>
        <button type="button" className="book-close" onClick={() => setOpen(false)}>
          Close the book
        </button>
      </div>
    </div>
  );
}
