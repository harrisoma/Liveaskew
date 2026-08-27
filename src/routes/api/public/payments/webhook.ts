import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, createStripeClient, verifyWebhook } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient<any>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<any>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata", subscription.id);
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId =
    item?.price?.lookup_key ||
    item?.price?.metadata?.lovable_external_id ||
    item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        product_id: productId,
        price_id: priceId,
        status: subscription.status,
        current_period_start: periodStart
          ? new Date(periodStart * 1000).toISOString()
          : null,
        current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );

  // If this is a trialing subscription, record it in trial_history so the
  // same user/email cannot start another free trial later.
  if (subscription.status === "trialing") {
    try {
      const stripe = createStripeClient(env);
      const customer: any = await stripe.customers.retrieve(subscription.customer);
      const email = customer?.email ?? null;
      if (email) {
        // Upsert by (user_id, environment) — unique index handles dedupe;
        // a second insert attempt from the email index will silently fail.
        await getSupabase()
          .from("trial_history")
          .upsert(
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

async function markCanceled(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handlePaymentFailed(invoice: any, env: StripeEnv) {
  const subscriptionId = invoice.subscription;
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

async function handlePaymentSucceeded(invoice: any, env: StripeEnv) {
  const subscriptionId = invoice.subscription;
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
              await upsertSubscription(event.data.object, env);
              break;
            case "customer.subscription.deleted":
              await markCanceled(event.data.object, env);
              break;
            case "invoice.payment_failed":
              await handlePaymentFailed(event.data.object, env);
              break;
            case "invoice.payment_succeeded":
              await handlePaymentSucceeded(event.data.object, env);
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
