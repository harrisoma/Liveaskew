import { createFileRoute } from "@tanstack/react-router";
import { billingConfigured, billingEnvironment } from "@/lib/billing.server";
import { STUDIO_LOOKUP_KEY, STUDIO_PRODUCT, studioReturnUrls } from "@/lib/studio-checkout.server";

// Small per-IP budget: each call creates a Stripe Checkout Session.
const windows = new Map<string, { count: number; end: number }>();
function allowed(ip: string, now = Date.now()) {
  for (const [key, value] of windows) if (value.end <= now) windows.delete(key);
  const window = windows.get(ip) ?? { count: 0, end: now + 600_000 };
  if (window.count >= 10 || windows.size >= 5000) return false;
  window.count++;
  windows.set(ip, window);
  return true;
}

/** Starts a Design Studio subscription ($199/month) in Stripe Checkout. */
export const Route = createFileRoute("/api/public/studio-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = new URL(request.url).origin;
        if (request.headers.get("origin") !== origin)
          return Response.json({ error: "invalid_origin" }, { status: 403 });
        const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "local";
        if (!allowed(ip)) return Response.json({ error: "rate_limited" }, { status: 429 });

        const env = billingEnvironment();
        if (!billingConfigured(env))
          return Response.json({ error: "billing_not_configured" }, { status: 503 });

        const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
        try {
          const stripe = createStripeClient(env);
          const prices = await stripe.prices.list({
            lookup_keys: [STUDIO_LOOKUP_KEY],
            active: true,
            limit: 1,
          });
          const price = prices.data[0];
          if (!price) return Response.json({ error: "price_missing" }, { status: 503 });

          const metadata = { product: STUDIO_PRODUCT, client: "liveaskew" };
          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: price.id, quantity: 1 }],
            ...studioReturnUrls(origin),
            billing_address_collection: "auto",
            allow_promotion_codes: true,
            subscription_data: { metadata },
            metadata,
          });
          if (!session.url) return Response.json({ error: "no_checkout_url" }, { status: 502 });
          return Response.json({ url: session.url });
        } catch (error) {
          console.error("[studio] checkout failed", getStripeErrorMessage(error));
          return Response.json({ error: "checkout_failed" }, { status: 502 });
        }
      },
    },
  },
});
