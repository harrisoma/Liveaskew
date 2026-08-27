import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

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
      const { createStripeClient, getStripeErrorMessage } = await import(
        "@/lib/stripe.server"
      );
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
        metadata: { userId, price_id: data.priceId, repeat_customer: allowTrial ? "false" : "true" },
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
      const { createStripeClient, getStripeErrorMessage } = await import(
        "@/lib/stripe.server"
      );
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
