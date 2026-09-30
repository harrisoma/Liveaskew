import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type StripeEnv, createStripeClient, verifyWebhook } from "@/lib/stripe.server";

function getSupabase() {
  return supabaseAdmin;
}

function idOf(ref: string | { id: string } | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}

/** Newer Stripe API versions moved invoice.subscription under invoice.parent. */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as unknown as { subscription?: string | { id: string } | null })
    .subscription;
  return idOf(invoice.parent?.subscription_details?.subscription ?? legacy);
}

async function upsertSubscription(subscription: Stripe.Subscription, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata", subscription.id);
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.id || "";
  const productId = idOf(item?.price?.product) ?? "";
  // Period dates live on the item in current API versions, on the subscription in older ones.
  const legacy = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  const periodStart = item?.current_period_start ?? legacy.current_period_start;
  const periodEnd = item?.current_period_end ?? legacy.current_period_end;

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: idOf(subscription.customer) ?? "",
        product_id: productId,
        price_id: priceId,
        status: subscription.status,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );

  // A Stripe trial is this member's free trial: record it so the app's own 14 days
  // cannot be claimed again later (first start wins).
  if (subscription.status === "trialing") {
    await getSupabase()
      .from("member_trials")
      .upsert(
        { user_id: userId, started_at: new Date().toISOString() },
        { onConflict: "user_id", ignoreDuplicates: true },
      );
  }

  // If this is a trialing subscription, record it in trial_history so the
  // same user/email cannot start another free trial later.
  if (subscription.status === "trialing") {
    try {
      const stripe = createStripeClient(env);
      const customerId = idOf(subscription.customer);
      const customer = customerId ? await stripe.customers.retrieve(customerId) : null;
      const email = customer && !customer.deleted ? customer.email : null;
      if (email) {
        // Upsert by (user_id, environment) — unique index handles dedupe;
        // a second insert attempt from the email index will silently fail.
        await getSupabase().from("trial_history").upsert(
          {
            user_id: userId,
            email,
            environment: env,
            stripe_subscription_id: subscription.id,
            started_at: new Date().toISOString(),
          },
          { onConflict: "user_id,environment", ignoreDuplicates: true },
        );
      }
    } catch (e) {
      console.error("trial_history record failed", e);
    }
  }
}

async function markCanceled(subscription: Stripe.Subscription, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handlePaymentFailed(invoice: Stripe.Invoice, env: StripeEnv) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  // Increment dunning counter on our row, then pause collection after 3 failures.
  const { data: row } = await getSupabase()
    .from("subscriptions")
    .select("dunning_attempts")
    .eq("stripe_subscription_id", subscriptionId)
    .eq("environment", env)
    .maybeSingle();

  const attempts = (row?.dunning_attempts ?? 0) + 1;

  await getSupabase()
    .from("subscriptions")
    .update({
      status: "past_due",
      dunning_attempts: attempts,
      dunning_last_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId)
    .eq("environment", env);

  // After the 3rd failure, pause collection so the chat gate (which checks
  // status) blocks access. Stripe stops further retries.
  if (attempts >= 3) {
    try {
      const stripe = createStripeClient(env);
      await stripe.subscriptions.update(subscriptionId, {
        pause_collection: { behavior: "mark_uncollectible" },
      });
    } catch (e) {
      console.error("Failed to pause subscription after 3 failures", e);
    }
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, env: StripeEnv) {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;
  // Reset dunning counter when a payment finally succeeds.
  await getSupabase()
    .from("subscriptions")
    .update({
      dunning_attempts: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId)
    .eq("environment", env);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
              await upsertSubscription(event.data.object as Stripe.Subscription, env);
              break;
            case "customer.subscription.deleted":
              await markCanceled(event.data.object as Stripe.Subscription, env);
              break;
            case "invoice.payment_failed":
              await handlePaymentFailed(event.data.object as Stripe.Invoice, env);
              break;
            case "invoice.payment_succeeded":
              await handlePaymentSucceeded(event.data.object as Stripe.Invoice, env);
              break;
            default:
              console.log("Unhandled payment event:", event.type);
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
