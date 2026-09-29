import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import { activeMembership, billingEnvironment } from "@/lib/billing.server";

/** The only source of truth for paid access: Stripe → webhook → subscriptions. */
export const Route = createFileRoute("/api/billing/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        if (caller === "preview") return Response.json({ active: false, tier: null });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("subscriptions")
          .select("status, price_id, current_period_end")
          .eq("user_id", caller)
          .eq("environment", billingEnvironment())
          .order("current_period_end", { ascending: false });
        if (error) return Response.json({ error: "status_unavailable" }, { status: 503 });

        const membership = activeMembership(data ?? []);
        return Response.json({
          active: Boolean(membership),
          tier: membership?.tier ?? null,
          status: membership?.status ?? null,
        });
      },
    },
  },
});
