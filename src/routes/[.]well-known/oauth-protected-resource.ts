import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, protectedResourceMetadata, publicOrigin } from "@/lib/mcp/oauth";

/** RFC 9728: where the MCP endpoint's authorization server lives. */
export const Route = createFileRoute("/.well-known/oauth-protected-resource")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: ({ request }) =>
        Response.json(protectedResourceMetadata(publicOrigin(request.url)), {
          headers: CORS_HEADERS,
        }),
    },
  },
});
