import { randomBytes } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import { networkById } from "@/lib/buzz";
import { tokenKeyConfigured } from "@/lib/buzz/crypto.server";
import { buzzRedirectUri, safeBuzzReturn } from "@/lib/buzz/oauth.server";
import { authorizeUrl, networkConfigured, pkcePair } from "@/lib/buzz/providers.server";

/** Start connecting a network: remember who asked, then send them to the network's sign-in. */
export const Route = createFileRoute("/api/buzz/connect")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        if (caller === "preview") {
          return Response.json({ error: "sign_in_required" }, { status: 401 });
        }
        const body = (await request.json().catch(() => ({}))) as {
          network?: string;
          returnTo?: string;
        };
        const network = networkById(body.network);
        if (!network) return Response.json({ error: "unknown_network" }, { status: 400 });
        if (!networkConfigured(network.id) || !tokenKeyConfigured()) {
          return Response.json({ error: "network_not_configured" }, { status: 503 });
        }

        const state = randomBytes(24).toString("base64url");
        const { verifier, challenge } = pkcePair();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // Old, unfinished sign-ins expire after 15 minutes.
        await supabaseAdmin
          .from("social_oauth_states")
          .delete()
          .lt("created_at", new Date(Date.now() - 15 * 60_000).toISOString());
        const { error } = await supabaseAdmin.from("social_oauth_states").insert({
          state,
          user_id: caller,
          network: network.id,
          code_verifier: verifier,
          return_to: safeBuzzReturn(body.returnTo, request),
        });
        if (error) return Response.json({ error: "connect_failed" }, { status: 503 });

        return Response.json({
          url: authorizeUrl(network.id, {
            state,
            redirectUri: buzzRedirectUri(request),
            challenge,
          }),
        });
      },
    },
  },
});
