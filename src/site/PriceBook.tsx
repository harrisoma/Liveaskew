import { useRef, useState } from "react";
import { SITE_PLANS } from "./plans";

function money(priceMonthly: number, inquiry: boolean) {
  return inquiry || priceMonthly === 0 ? "By inquiry" : `$${priceMonthly}`;
}

/** Pricing as a book: a cover, then one spread per membership with tabs down the edge. */
export function PriceBook() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(1);
  const [turning, setTurning] = useState(false);
  const busy = useRef(false);
  const plan = SITE_PLANS[index] ?? SITE_PLANS[0];

  function show(next: number) {
    if (next === index || next < 0 || next >= SITE_PLANS.length || busy.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
        <div className="book-tabs" role="tablist" aria-label="Memberships">
          {SITE_PLANS.map((p, i) => (
            <button
              key={p.slug}
              type="button"
              role="tab"
              id={`plan-tab-${p.slug}`}
              aria-selected={i === index}
              aria-controls="plan-spread"
              className="book-tab"
              onClick={() => show(i)}
            >
              {p.tab}
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
            <h3 className="font-display book-plan">{plan.name}</h3>
            <p className="book-price">
              {money(plan.priceMonthly, plan.inquiry)}
              {!plan.inquiry && <span className="book-cadence">/ month</span>}
            </p>
            <p className="book-note">
              {plan.inquiry
                ? "Set with you, after a conversation."
                : "14 days free, then monthly. Cancel any time."}
            </p>
            <p className="book-tagline font-semibold">{plan.tagline}</p>
            <p className="book-description">{plan.description}</p>
            <a href="/app" className="glass-btn mt-8">
              {plan.inquiry ? "Inquire in the app" : "Start 14 days free"}
            </a>
          </article>
          <article className="book-page book-page-right">
            <p className="book-kicker">In this membership</p>
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
