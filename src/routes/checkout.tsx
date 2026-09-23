import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { SiteFrame } from "@/components/site/SiteFrame";
import { getPlan, membershipAmount, type Plan } from "@/lib/plans";
import { startMembershipCheckout } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import { resumeAuthSession } from "@/mobile/lib/auth";

const PLANS_YOU_CAN_BUY = [
  "silver",
  "gold",
  "platinum",
  "platinum_plus",
  "platinum_plus_family",
] as const;

type Interval = "month" | "year";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    plan: typeof search.plan === "string" ? search.plan : "gold",
    interval: search.interval === "year" ? "year" : "month",
    status: typeof search.status === "string" ? search.status : "",
  }),
  head: () => ({
    meta: [
      { title: "Pay — LiveAskew" },
      {
        name: "description",
        content: "Pay for a LiveAskew membership by card or crypto.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { plan: planSlug, interval, status } = Route.useSearch();
  const plan = getPlan(planSlug);
  const payable = PLANS_YOU_CAN_BUY.includes(planSlug as (typeof PLANS_YOU_CAN_BUY)[number]);

  return (
    <SiteFrame>
      <section className="bg-white px-5 pt-36 pb-20 md:px-8 md:pt-40">
        <div className="pay-sheet">
          {status === "success" ? (
            <PaidNote />
          ) : status === "cancelled" ? (
            <p className="pay-note mb-6">
              The payment was cancelled. You can start it again below.
            </p>
          ) : null}
          {!plan || !payable ? (
            <Negotiated plan={plan} />
          ) : (
            <PayForm plan={plan} interval={interval as Interval} />
          )}
        </div>
      </section>
    </SiteFrame>
  );
}

function PaidNote() {
  return (
    <div className="pay-card mb-6">
      <p className="book-kicker">Payment received</p>
      <h1 className="font-display mt-3 text-4xl">You are in.</h1>
      <a href="/app" className="glass-btn mt-6">
        Enter Bee
      </a>
    </div>
  );
}

function Negotiated({ plan }: { plan: Plan | null }) {
  return (
    <div className="pay-card">
      <p className="book-kicker">1-on-1 Live Bee</p>
      <h1 className="font-display mt-3 text-4xl">{plan?.name ?? "This plan"}</h1>
      <p className="pay-note">
        The price is set with you after a conversation. It is not a published rate, and it is not
        charged on this page.
      </p>
      <a href="/app" className="glass-btn mt-6">
        Talk with Bee
      </a>
    </div>
  );
}

function PayForm({ plan, interval }: { plan: Plan; interval: Interval }) {
  const start = useServerFn(startMembershipCheckout);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<"card" | "crypto" | null>(null);
  const amount = membershipAmount(plan, interval);
  const term = interval === "year" ? "1 year" : "1 month";

  useEffect(() => {
    let cancel = false;
    resumeAuthSession().then((session) => {
      if (cancel) return;
      setEmail(session.email);
      setReady(true);
    });
    return () => {
      cancel = true;
    };
  }, []);

  async function pay(method: "card" | "crypto") {
    setError("");
    if (!email) {
      setError("Sign in on this page, then pay.");
      return;
    }
    setPending(method);
    try {
      const result = await start({
        data: {
          plan: plan.slug as (typeof PLANS_YOU_CAN_BUY)[number],
          interval,
          method,
          environment: getStripeEnvironment(),
          returnUrl: window.location.href,
        },
      });
      if ("url" in result && result.url) {
        window.location.assign(result.url);
        return;
      }
      setError("error" in result ? result.error : "Payment could not start.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not start.");
    } finally {
      setPending(null);
    }
  }

  async function signIn(provider: "google" | "apple" | "facebook") {
    setError("");
    if (!isSupabaseConfigured()) {
      setError("Sign-in is not configured on this preview.");
      return;
    }
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.href },
    });
    if (authError) setError(authError.message);
  }

  return (
    <div className="pay-grid">
      <article className="pay-card">
        <p className="book-kicker">LiveAskew</p>
        <h1 className="font-display mt-3 text-4xl leading-none">{plan.name}</h1>
        <p className="book-price mt-4">
          ${amount}
          <span className="book-cadence">/ {term}</span>
        </p>
        <p className="pay-note">{plan.tagline}</p>
        <ul className="book-features">
          {plan.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </article>
      <article className="pay-card">
        <p className="book-kicker">Payment</p>
        <h2 className="font-display mt-3 text-3xl">Card or crypto</h2>
        <p className="pay-note">
          A card starts a 14-day free trial, then renews for this {term}. Crypto pays this {term}{" "}
          now in USDC. A wallet does not renew itself, and it does not start the free trial.
        </p>
        {ready && email ? <p className="pay-note">Signed in as {email}</p> : null}
        {ready && !email ? (
          <div className="pay-actions">
            <button type="button" className="glass-btn" onClick={() => signIn("google")}>
              Sign in with Google
            </button>
            <button type="button" className="glass-btn" onClick={() => signIn("apple")}>
              Sign in with Apple
            </button>
            <button type="button" className="glass-btn" onClick={() => signIn("facebook")}>
              Sign in with Facebook
            </button>
          </div>
        ) : null}
        <div className="pay-actions">
          <button
            type="button"
            className="glass-btn"
            disabled={pending !== null}
            onClick={() => pay("card")}
          >
            {pending === "card" ? "Opening card checkout" : "Pay with card"}
          </button>
          <button
            type="button"
            className="glass-btn book-pay-year"
            disabled={pending !== null}
            onClick={() => pay("crypto")}
          >
            {pending === "crypto" ? "Opening crypto checkout" : "Pay with crypto"}
          </button>
        </div>
        {error ? <p className="pay-note">{error}</p> : null}
      </article>
    </div>
  );
}
