import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import {
  billingConfigured,
  billingEnvironment,
  isPaidTier,
  stripeTrialEnd,
  tierLookupKey,
} from "@/lib/billing.server";

type Body = { tier?: string; returnUrl?: string };

function safeReturnUrl(raw: string | undefined, request: Request): string {
  const fallback = new URL("/", request.url).toString();
  if (!raw) return fallback;
  try {
    const url = new URL(raw);
    // Web origin or the native app scheme only — never an arbitrary redirect.
    if (url.protocol === "co.liveaskew.app:") return raw;
    if (url.origin === new URL(request.url).origin) return url.toString();
  } catch {
    /* fall through */
  }
  return fallback;
}

export const Route = createFileRoute("/api/billing/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        if (caller === "preview") {
          return Response.json({ error: "sign_in_required" }, { status: 401 });
        }

        const body = (await request.json().catch(() => ({}))) as Body;
        if (!isPaidTier(body.tier)) {
          return Response.json({ error: "invalid_tier" }, { status: 400 });
        }
        const env = billingEnvironment();
        if (!billingConfigured(env)) {
          return Response.json({ error: "billing_not_configured" }, { status: 503 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const [{ data: profile }, { data: userData }] = await Promise.all([
          supabaseAdmin.from("profiles").select("trial_started_at").eq("id", caller).maybeSingle(),
          supabaseAdmin.auth.admin.getUserById(caller),
        ]);

        const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
        try {
          const stripe = createStripeClient(env);
          const lookupKey = tierLookupKey(body.tier);
          const prices = await stripe.prices.list({
            lookup_keys: [lookupKey],
            active: true,
            limit: 1,
          });
          const price = prices.data[0];
          if (!price) return Response.json({ error: "price_missing", lookupKey }, { status: 503 });

          let returnUrl = safeReturnUrl(body.returnUrl, request);
          // Stripe needs https; the app-return page hands off to the installed app.
          if (returnUrl.startsWith("co.liveaskew.app:")) {
            const base = (process.env.PUBLIC_APP_URL ?? new URL(request.url).origin).replace(
              /\/$/,
              "",
            );
            returnUrl = `${base}/api/public/app-return?path=billing`;
          }
          const sep = returnUrl.includes("?") ? "&" : "?";
          const trialEnd = stripeTrialEnd(profile?.trial_started_at);
          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: price.id, quantity: 1 }],
            customer_email: userData?.user?.email ?? undefined,
            client_reference_id: caller,
            success_url: `${returnUrl}${sep}billing=success`,
            cancel_url: `${returnUrl}${sep}billing=cancelled`,
            subscription_data: {
              metadata: { userId: caller, tier: body.tier },
              ...(trialEnd ? { trial_end: trialEnd } : {}),
            },
            metadata: { userId: caller, price_id: lookupKey },
          });
          if (!session.url) return Response.json({ error: "no_checkout_url" }, { status: 502 });
          return Response.json({ url: session.url });
        } catch (error) {
          console.error("[billing] checkout failed", getStripeErrorMessage(error));
          return Response.json({ error: "checkout_failed" }, { status: 502 });
        }
      },
    },
  },
});
