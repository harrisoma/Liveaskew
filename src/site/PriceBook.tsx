import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { isComingSoon, SITE_PLANS } from "./plans";

export function PriceBook() {
  const [index, setIndex] = useState(0);
  const plan = SITE_PLANS[index];
  const available = plan.features.filter((f) => !isComingSoon(f));
  const upcoming = plan.features.filter(isComingSoon);
  return (
    <div className="ed-membership">
      <div className="ed-plan-options" aria-label="Choose a membership">
        {SITE_PLANS.map((p, i) => (
          <button
            key={p.slug}
            type="button"
            aria-pressed={i === index}
            aria-controls="membership-detail"
            onClick={() => setIndex(i)}
          >
            <span>{p.tab}</span>
            <strong>
              {p.inquiry ? "By inquiry" : `$${p.priceMonthly}`}
              <small>{p.inquiry ? "" : " / mo"}</small>
            </strong>
          </button>
        ))}
      </div>
      <div id="membership-detail" className="ed-plan-detail" aria-live="polite">
        <div>
          <p className="ed-eyebrow">{plan.name}</p>
          <h3>{plan.tagline}</h3>
          <p className="ed-copy">{plan.description}</p>
          <p className="ed-note">
            {plan.inquiry
              ? "Your brief, your quote. Agreed after a conversation."
              : "14 days free, then billed monthly. Cancel any time."}
          </p>
          <a href="/app" className="ed-button">
            {plan.inquiry ? "Meet your stylist" : "Start your 14 days free"}
            <ArrowUpRight size={18} aria-hidden />
          </a>
        </div>
        <div>
          <h4>Available now</h4>
          <ul>
            {available.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {upcoming.length > 0 && (
            <details>
              <summary>
                Coming soon · {upcoming.length} {upcoming.length === 1 ? "feature" : "features"}
              </summary>
              <ul>
                {upcoming.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
