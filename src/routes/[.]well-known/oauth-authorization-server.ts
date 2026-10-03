import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, authorizationServerMetadata, publicOrigin } from "@/lib/mcp/oauth";

/** RFC 8414: LiveAskew's own OAuth authorization server, for MCP connectors. */
export const Route = createFileRoute("/.well-known/oauth-authorization-server")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: ({ request }) =>
        Response.json(authorizationServerMetadata(publicOrigin(request.url)), {
          headers: CORS_HEADERS,
        }),
    },
  },
});
