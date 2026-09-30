import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import { billingConfigured, billingEnvironment } from "@/lib/billing.server";

/** Stripe's customer portal: change tier, update card, or cancel. */
export const Route = createFileRoute("/api/billing/portal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        if (caller === "preview") {
          return Response.json({ error: "sign_in_required" }, { status: 401 });
        }
        const env = billingEnvironment();
        if (!billingConfigured(env)) {
          return Response.json({ error: "billing_not_configured" }, { status: 503 });
        }
        const body = (await request.json().catch(() => ({}))) as { native?: boolean };
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("stripe_customer_id")
          .eq("user_id", caller)
          .eq("environment", env)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!sub?.stripe_customer_id) {
          return Response.json({ error: "no_subscription" }, { status: 404 });
        }
        const base = (process.env.PUBLIC_APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
        const returnUrl = body.native ? `${base}/api/public/app-return?path=billing` : `${base}/`;
        const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
        try {
          const portal = await createStripeClient(env).billingPortal.sessions.create({
            customer: sub.stripe_customer_id,
            return_url: returnUrl,
          });
          return Response.json({ url: portal.url });
        } catch (error) {
          console.error("[billing] portal failed", getStripeErrorMessage(error));
          return Response.json({ error: "portal_failed" }, { status: 502 });
        }
      },
    },
  },
});
