import { createFileRoute } from "@tanstack/react-router";
import { networkById } from "@/lib/buzz";
import { buzzRedirectUri, withQuery } from "@/lib/buzz/oauth.server";
import { exchangeCode } from "@/lib/buzz/providers.server";
import { saveAccounts } from "@/lib/buzz/store.server";

/**
 * Networks send the person back here after they approve Bee. The state row proves who
 * started it (single use, 15 minutes); then we store the account and return to the app.
 */
export const Route = createFileRoute("/api/public/buzz/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const state = url.searchParams.get("state") ?? "";
        const code = url.searchParams.get("code");
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: pending } = state
          ? await supabaseAdmin
              .from("social_oauth_states")
              .delete()
              .eq("state", state)
              .select("user_id, network, code_verifier, return_to, created_at")
              .maybeSingle()
          : { data: null };
        if (!pending || Date.parse(pending.created_at) < Date.now() - 15 * 60_000) {
          return new Response("This sign-in link has expired. Go back to Buzz and try again.", {
            status: 400,
          });
        }
        const network = networkById(pending.network);
        const back = (params: Record<string, string>) =>
          Response.redirect(withQuery(pending.return_to, params), 302);
        if (!network) return back({ buzz: "error", reason: "unknown_network" });
        if (!code) {
          return back({ buzz: "cancelled", network: network.id });
        }

        try {
          const accounts = await exchangeCode(network.id, {
            code,
            redirectUri: buzzRedirectUri(request),
            verifier: pending.code_verifier,
          });
          await saveAccounts(pending.user_id, accounts);
          return back({ buzz: "connected", network: accounts.map((a) => a.network).join(",") });
        } catch (err) {
          console.error("[buzz] connect failed", network.id, err);
          return back({
            buzz: "error",
            network: network.id,
            reason: (err instanceof Error ? err.message : "connect_failed").slice(0, 160),
          });
        }
      },
    },
  },
});
