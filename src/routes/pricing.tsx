import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PLANS, type Plan } from "@/lib/plans";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — LiveAskew" },
      {
        name: "description",
        content:
          "Personal AI styling from $20/month. Silver, Gold, Platinum, Platinum Plus, and The Private Atelier — by inquiry.",
      },
      { property: "og:title", content: "Pricing — LiveAskew" },
      {
        property: "og:description",
        content:
          "Personal AI styling from $20/month. Silver, Gold, Platinum, Platinum Plus, and The Private Atelier — by inquiry.",
      },
      { property: "og:url", content: "https://liveaskew.com/pricing" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://liveaskew.com/pricing" }],
  }),
  component: PricingPage,
});

type Cadence = "monthly" | "annual";

function PricingPage() {
  const [cadence, setCadence] = useState<Cadence>("monthly");

  return (
    <main className="min-h-screen" style={{ background: "var(--cream)", color: "var(--ink)" }}>
      <Nav />

      <section className="px-6 pt-32 pb-28 md:px-10 md:pt-40 md:pb-36">
        <div className="mx-auto max-w-[1400px]">
          <div className="text-center">
            <p className="eyebrow" style={{ color: "var(--gold-deep)" }}>
              Plans &amp; Membership
            </p>
            <h2 className="font-display mt-6 text-4xl leading-[1.05] md:text-6xl">
              Invest in how you
              <br />
              <em style={{ color: "var(--gold-deep)" }}>show up</em>.
            </h2>
            <span className="mt-8 inline-block h-px w-16" style={{ background: "var(--gold)" }} />
            <p
              className="mt-6 text-sm"
              style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}
            >
              Cancel any time. Upgrade or downgrade as your life shifts.
            </p>

            <CadenceToggle value={cadence} onChange={setCadence} />
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {PLANS.map((plan) => (
              <TierCard key={plan.slug} plan={plan} cadence={cadence} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function CadenceToggle({ value, onChange }: { value: Cadence; onChange: (c: Cadence) => void }) {
  return (
    <div className="mt-10 inline-flex items-center rounded-full bg-cream p-1.5 shadow-neo-inset">
      {(["monthly", "annual"] as const).map((c) => {
        const active = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="rounded-full px-5 py-2 text-[0.65rem] uppercase tracking-[0.25em] transition"
            style={
              active
                ? { background: "var(--ink)", color: "var(--cream)" }
                : { color: "color-mix(in oklab, var(--ink) 55%, transparent)" }
            }
          >
            {c === "monthly" ? "Monthly" : "Annual · 20% off"}
          </button>
        );
      })}
    </div>
  );
}

function TierCard({ plan, cadence }: { plan: Plan; cadence: Cadence }) {
  const showAnnual = cadence === "annual" && !plan.inquiry;
  const monthlyEq = showAnnual ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;

  return (
    <article
      className={`relative flex flex-col rounded-[2rem] bg-cream p-8 shadow-neo ${plan.flagship ? "shadow-neo-lg" : ""}`}
    >
      {plan.flagship && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-[0.6rem] font-medium tracking-[0.3em] uppercase shadow-neo-sm"
          style={{ background: "var(--gold)", color: "var(--ink)" }}
        >
          Flagship Experience
        </span>
      )}

      <header>
        <p
          className="text-[0.65rem] tracking-[0.3em] uppercase"
          style={{ color: "var(--gold-deep)" }}
        >
          {plan.name}
        </p>
        <p
          className="mt-3 font-display italic text-base"
          style={{ color: "color-mix(in oklab, var(--ink) 65%, transparent)" }}
        >
          {plan.tagline}
        </p>

        <div className="mt-6">
          {plan.inquiry ? (
            <span className="font-display text-4xl leading-none">By Inquiry</span>
          ) : showAnnual ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl leading-none">${plan.priceAnnual}</span>
                <span
                  className="text-xs"
                  style={{ color: "color-mix(in oklab, var(--ink) 55%, transparent)" }}
                >
                  / year
                </span>
              </div>
              <p
                className="mt-2 text-[0.65rem] uppercase tracking-[0.22em]"
                style={{ color: "var(--gold-deep)" }}
              >
                20% off · 2 months free
              </p>
              <p
                className="mt-1 text-xs"
                style={{ color: "color-mix(in oklab, var(--ink) 55%, transparent)" }}
              >
                ≈ ${monthlyEq} / month
              </p>
            </>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-5xl leading-none">${plan.priceMonthly}</span>
              <span
                className="text-xs"
                style={{ color: "color-mix(in oklab, var(--ink) 55%, transparent)" }}
              >
                {plan.cadence}
              </span>
            </div>
          )}
        </div>

        <p
          className="mt-6 text-sm leading-relaxed"
          style={{ color: "color-mix(in oklab, var(--ink) 75%, transparent)" }}
        >
          {plan.description}
        </p>
      </header>

      <ul
        className="mt-10 flex-1 space-y-4 border-t pt-8"
        style={{ borderColor: "var(--gold-soft)" }}
      >
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <Check
              size={14}
              className="mt-1 shrink-0"
              style={{ color: "var(--gold-deep)" }}
              strokeWidth={2.5}
            />
            <span
              className="text-sm leading-relaxed"
              style={{ color: "color-mix(in oklab, var(--ink) 80%, transparent)" }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>

      {plan.inquiry ? (
        <Link to="/inquiry" className="neo-btn-ink mt-10">
          Inquire for Atelier Access
          <ArrowUpRight size={14} />
        </Link>
      ) : (
        <Link
          to="/checkout/$tier"
          params={{ tier: plan.slug }}
          className={`mt-10 block rounded-full py-4 text-center text-[0.7rem] font-medium tracking-[0.25em] uppercase ${
            plan.flagship ? "neo-btn-ink" : "neo-btn"
          }`}
        >
          Begin with {plan.name}
        </Link>
      )}
    </article>
  );
}
