import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";

/** The only source of truth for paid access: Stripe → webhook → subscriptions. */
export const Route = createFileRoute("/api/billing/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        if (caller === "preview") return Response.json({ active: false, tier: null });

        try {
          const { signupStatus } = await import("@/lib/signup-status.server");
          const state = await signupStatus(caller);
          return Response.json(
            {
              active: Boolean(state.membership),
              tier: state.membership?.tier ?? null,
              status: state.membership?.status ?? null,
              trialEligible: state.trialEligible,
              legacyTrialActive: state.legacyTrialActive,
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch {
          return Response.json({ error: "status_unavailable" }, { status: 503 });
        }
      },
    },
  },
});
