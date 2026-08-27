import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { createCheckoutSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

// Payment identifier map — slugs match src/lib/plans.ts PlanSlug.
// Legacy slugs kept for any in-flight checkout links.
const PRICE_BY_TIER: Record<string, string> = {
  silver: "price_silver_monthly",
  gold: "price_gold_monthly",
  platinum: "price_platinum_monthly",
  platinum_plus: "price_platinum_plus_monthly",
  platinum_plus_family: "price_platinum_plus_family_monthly",
  // legacy — safe to keep until Stripe products are renamed
  essential: "price_essential_monthly",
  premium: "price_premium_monthly",
};

export const Route = createFileRoute("/_authenticated/checkout/$tier")({
  ssr: false,
  validateSearch: (search) =>
    z.object({ status: z.enum(["success", "cancelled"]).optional() }).parse(search),
  head: () => ({
    meta: [
      { title: "Checkout — LiveAskew" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { tier } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const checkout = useServerFn(createCheckoutSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (search.status === "success") {
      navigate({ to: "/dashboard" });
      return;
    }
    if (search.status === "cancelled") {
      setError("Checkout cancelled. You can pick a tier again any time.");
      return;
    }
    const priceId = PRICE_BY_TIER[tier];
    if (!priceId) {
      setError(`Unknown tier: ${tier}`);
      return;
    }
    checkout({
      data: {
        priceId,
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/checkout/${tier}`,
      },
    })
      .then((res) => {
        if ("error" in res) setError(res.error);
        else window.location.href = res.url;
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not start checkout"));
  }, [tier, search.status, navigate, checkout]);

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6 text-ink">
      <div className="max-w-sm text-center">
        {error ? (
          <>
            <p className="eyebrow text-destructive">Checkout</p>
            <h1 className="font-display mt-4 text-3xl leading-tight">Something stopped us.</h1>
            <p className="mt-4 text-sm text-ink/70">{error}</p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="mt-8 bg-ink px-6 py-3 text-[0.7rem] font-medium tracking-[0.25em] uppercase text-cream hover:bg-gold-deep"
            >
              Back to home
            </button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto animate-spin text-ink/40" size={28} />
            <p className="mt-6 text-sm text-ink/70">Preparing your checkout…</p>
          </>
        )}
      </div>
    </main>
  );
}
