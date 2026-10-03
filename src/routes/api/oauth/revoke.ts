import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS } from "@/lib/mcp/oauth";
import { revokeToken } from "@/lib/mcp/oauth.server";

/** OAuth token revocation (RFC 7009). Always 200, whether or not the token was known. */
export const Route = createFileRoute("/api/oauth/revoke")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const type = request.headers.get("content-type") ?? "";
        const token = type.includes("application/json")
          ? ((await request.json().catch(() => ({}))) as { token?: unknown }).token
          : new URLSearchParams(await request.text()).get("token");
        if (typeof token === "string" && token.length > 0 && token.length <= 200) {
          await revokeToken(token);
        }
        return new Response(null, { status: 200, headers: CORS_HEADERS });
      },
    },
  },
});
