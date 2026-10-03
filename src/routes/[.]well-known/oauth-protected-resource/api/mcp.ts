import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, protectedResourceMetadata, publicOrigin } from "@/lib/mcp/oauth";

/** RFC 9728 path-suffixed form, which some clients try first for /api/mcp. */
export const Route = createFileRoute("/.well-known/oauth-protected-resource/api/mcp")({
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
