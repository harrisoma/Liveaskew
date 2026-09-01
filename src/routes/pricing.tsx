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
    <main className="min-h-screen bg-cream text-ink">
      <Nav />

      {/* HERO — dark glass */}
      <section className="relative overflow-hidden bg-ink px-6 pb-16 pt-32 text-cream md:px-10 md:pb-20 md:pt-40">
        <div aria-hidden className="glass-glow left-1/2 top-0 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/3" />
        <div className="relative mx-auto max-w-[1400px] text-center">
          <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold">Plans &amp; Membership</p>
          <h1 className="font-display mt-6 text-4xl leading-[1.05] md:text-6xl">
            Invest in how you <span className="text-gold">show up</span>.
          </h1>
          <p className="mt-6 text-base text-cream/65">
            Cancel any time. Upgrade or downgrade as your life shifts.
          </p>

          <div className="neu-inset mt-9 inline-flex items-center gap-1 rounded-full p-1">
            {(["monthly", "annual"] as const).map((c) => {
              const active = cadence === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCadence(c)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-gradient-to-br from-gold to-gold-deep text-ink"
                      : "text-cream/55 hover:text-cream"
                  }`}
                >
                  {c === "monthly" ? "Monthly" : "Annual · 20% off"}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

function TierCard({ plan, cadence }: { plan: Plan; cadence: Cadence }) {
  const showAnnual = cadence === "annual" && !plan.inquiry;
  const monthlyEq = showAnnual ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;

  return (
    <article className="neu-raised relative flex flex-col rounded-[26px] p-7">
      {plan.flagship && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-br from-gold to-gold-deep px-4 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink shadow-md shadow-gold/30">
          Flagship Experience
        </span>
      )}

      <header>
        <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">{plan.name}</p>
        <p className="mt-3 text-sm italic text-ink/60">{plan.tagline}</p>

        <div className="mt-6">
          {plan.inquiry ? (
            <span className="font-display text-3xl leading-none text-ink">By Inquiry</span>
          ) : showAnnual ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-4xl leading-none text-ink">${plan.priceAnnual}</span>
                <span className="text-xs text-ink/55">/ year</span>
              </div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-gold-deep">
                20% off · 2 months free
              </p>
              <p className="mt-1 text-xs text-ink/55">≈ ${monthlyEq} / month</p>
            </>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl leading-none text-ink">${plan.priceMonthly}</span>
              <span className="text-xs text-ink/55">{plan.cadence}</span>
            </div>
          )}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ink/70">{plan.description}</p>
      </header>

      <ul className="mt-8 flex-1 space-y-3.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <Check size={14} className="mt-1 shrink-0 text-gold-deep" strokeWidth={2.5} />
            <span className="text-sm leading-relaxed text-ink/75">{f}</span>
          </li>
        ))}
      </ul>

      {plan.inquiry ? (
        <Link
          to="/inquiry"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-center text-sm font-semibold text-cream transition hover:bg-ink/85"
        >
          Inquire for Atelier Access
          <ArrowUpRight size={14} />
        </Link>
      ) : (
        <Link
          to="/checkout/$tier"
          params={{ tier: plan.slug }}
          className={`mt-8 block rounded-full py-3.5 text-center text-sm font-semibold transition ${
            plan.flagship
              ? "bg-gradient-to-br from-gold to-gold-deep text-ink shadow-md shadow-gold/30 hover:brightness-105"
              : "neu-inset text-ink/75 hover:text-ink"
          }`}
        >
          Begin with {plan.name}
        </Link>
      )}
    </article>
  );
}
