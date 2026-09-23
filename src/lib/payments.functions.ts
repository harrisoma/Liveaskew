import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const membershipSchema = z.object({
  plan: z.enum(["silver", "gold", "platinum", "platinum_plus", "platinum_plus_family"]),
  interval: z.enum(["month", "year"]),
  method: z.enum(["card", "crypto"]),
  environment: z.enum(["sandbox", "live"]),
  returnUrl: z.string().url().max(500),
});

export const startMembershipCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => membershipSchema.parse(data))
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const { userId, claims } = context;
    const email = (claims as { email?: string })?.email ?? "";
    const { getPlan, membershipAmount } = await import("@/lib/plans");
    const plan = getPlan(data.plan);
    if (!plan || plan.inquiry) return { error: "This plan is negotiated, not charged here." };
    const dollars = membershipAmount(plan, data.interval);
    const cents = Math.round(dollars * 100);
    if (cents < 50) return { error: "This plan has no charge to collect." };

    try {
      const { createStripeClient } = await import("@/lib/stripe.server");
      const stripe = createStripeClient(data.environment);
      const term = data.interval === "year" ? "1 year" : "1 month";
      const shared = {
        customer_email: email || undefined,
        success_url: `${data.returnUrl}${data.returnUrl.includes("?") ? "&" : "?"}status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${data.returnUrl}${data.returnUrl.includes("?") ? "&" : "?"}status=cancelled`,
        metadata: {
          userId,
          plan: data.plan,
          interval: data.interval,
          method: data.method,
        },
      };

      const session =
        data.method === "card"
          ? await stripe.checkout.sessions.create({
              ...shared,
              mode: "subscription",
              line_items: [
                {
                  quantity: 1,
                  price_data: {
                    currency: "usd",
                    unit_amount: cents,
                    recurring: { interval: data.interval },
                    product_data: { name: `${plan.name} · ${term}` },
                  },
                },
              ],
              subscription_data: {
                trial_period_days: 14,
                metadata: { userId, plan: data.plan, interval: data.interval, method: "card" },
              },
            })
          : await stripe.checkout.sessions.create({
              ...shared,
              mode: "payment",
              customer_creation: "always",
              payment_method_types: ["crypto"],
              line_items: [
                {
                  quantity: 1,
                  price_data: {
                    currency: "usd",
                    unit_amount: cents,
                    product_data: { name: `${plan.name} · ${term} · crypto` },
                  },
                },
              ],
            } as Parameters<typeof stripe.checkout.sessions.create>[0]);

      if (!session.url) return { error: "Stripe did not return a checkout URL" };
      return { url: session.url };
    } catch (error) {
      const { getStripeErrorMessage } = await import("@/lib/stripe.server");
      return { error: getStripeErrorMessage(error) };
    }
  });

const checkoutSchema = z.object({
  priceId: z.string().min(1).max(120),
  environment: z.enum(["sandbox", "live"]),
  returnUrl: z.string().url().max(500),
});

type CheckoutResult = { url: string } | { error: string };

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => checkoutSchema.parse(data))
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const { userId, claims, supabase } = context;
    const email = (claims as { email?: string })?.email ?? "";

    try {
      const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
      const stripe = createStripeClient(data.environment);

      // Resolve human-readable price id → Stripe price object via lookup_key
      const prices = await stripe.prices.list({
        lookup_keys: [data.priceId],
        expand: ["data.product"],
        active: true,
        limit: 1,
      });
      const price = prices.data[0];
      if (!price) return { error: `Price not found: ${data.priceId}` };

      // 14-day free trial on every subscription checkout.
      const allowTrial = true;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: price.id, quantity: 1 }],
        customer_email: email || undefined,
        success_url: `${data.returnUrl}?status=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${data.returnUrl}?status=cancelled`,
        subscription_data: {
          metadata: { userId, repeat_customer: allowTrial ? "false" : "true" },
          ...(allowTrial ? { trial_period_days: 14 } : {}),
        },
        metadata: {
          userId,
          price_id: data.priceId,
          repeat_customer: allowTrial ? "false" : "true",
        },
        // managed_payments is a dahlia-version field not yet in stripe-node types
        managed_payments: { enabled: true },
      } as any);

      if (!session.url) return { error: "Stripe did not return a checkout URL" };
      return { url: session.url };
    } catch (error) {
      const { getStripeErrorMessage } = await import("@/lib/stripe.server");
      return { error: getStripeErrorMessage(error) };
    }
  });

const portalSchema = z.object({
  environment: z.enum(["sandbox", "live"]),
  returnUrl: z.string().url().max(500),
});

type PortalResult = { url: string } | { error: string };

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => portalSchema.parse(data))
  .handler(async ({ data, context }): Promise<PortalResult> => {
    const { supabase, userId } = context;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) return { error: "No subscription found" };

    try {
      const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id as string,
        return_url: data.returnUrl,
      });
      return { url: portal.url };
    } catch (error) {
      const { getStripeErrorMessage } = await import("@/lib/stripe.server");
      return { error: getStripeErrorMessage(error) };
    }
  });
