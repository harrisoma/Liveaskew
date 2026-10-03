import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS } from "@/lib/mcp/oauth";
import { registerClient } from "@/lib/mcp/oauth.server";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { ...CORS_HEADERS, "Cache-Control": "no-store" },
  });
}

/** OAuth Dynamic Client Registration (RFC 7591): assistants register themselves here. */
export const Route = createFileRoute("/api/oauth/register")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
        const uris = body?.redirect_uris;
        if (!Array.isArray(uris) || !uris.every((u) => typeof u === "string")) {
          return json({ error: "invalid_redirect_uri" }, 400);
        }
        const authMethod = body?.token_endpoint_auth_method;
        if (authMethod !== undefined && authMethod !== "none") {
          return json(
            {
              error: "invalid_client_metadata",
              error_description:
                "Only public clients (token_endpoint_auth_method none) are supported.",
            },
            400,
          );
        }
        const name = typeof body?.client_name === "string" ? body.client_name : "";
        const client = await registerClient({ name, redirectUris: uris as string[] });
        if ("error" in client) {
          return json({ error: client.error }, client.error === "server_error" ? 500 : 400);
        }
        return json(
          {
            client_id: client.id,
            client_id_issued_at: Math.floor(Date.now() / 1000),
            client_name: client.name,
            redirect_uris: client.redirect_uris,
            grant_types: ["authorization_code", "refresh_token"],
            response_types: ["code"],
            token_endpoint_auth_method: "none",
          },
          201,
        );
      },
    },
  },
});
