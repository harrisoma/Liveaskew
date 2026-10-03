import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import { isValidChallenge, redirectWith } from "@/lib/mcp/oauth";
import { findClient, issueCode } from "@/lib/mcp/oauth.server";

/**
 * The member's answer on /oauth/authorize. Signed in with her LiveAskew session, she
 * approves (a one-time code goes back to the assistant) or declines (access_denied).
 * Returns the URL to send her browser to; the page never builds it itself.
 */
export const Route = createFileRoute("/api/oauth/approve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const clientId = typeof body?.client_id === "string" ? body.client_id : "";
        const redirectUri = typeof body?.redirect_uri === "string" ? body.redirect_uri : "";
        const challenge = typeof body?.code_challenge === "string" ? body.code_challenge : "";
        const state = typeof body?.state === "string" ? body.state : null;

        const client = clientId ? await findClient(clientId) : null;
        if (!client || !client.redirect_uris.includes(redirectUri)) {
          return Response.json({ error: "invalid_client" }, { status: 400 });
        }
        if (body?.approve !== true) {
          return Response.json({
            redirect: redirectWith(redirectUri, { error: "access_denied", state }),
          });
        }

        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        if (caller === "preview") {
          return Response.json({ error: "sign_in_required" }, { status: 401 });
        }
        if (body?.code_challenge_method !== "S256" || !isValidChallenge(challenge)) {
          return Response.json({
            redirect: redirectWith(redirectUri, {
              error: "invalid_request",
              error_description: "PKCE S256 is required.",
              state,
            }),
          });
        }
        const code = await issueCode({
          clientId,
          userId: caller,
          redirectUri,
          codeChallenge: challenge,
        });
        if (!code) return Response.json({ error: "server_error" }, { status: 500 });
        return Response.json({ redirect: redirectWith(redirectUri, { code, state }) });
      },
    },
  },
});
