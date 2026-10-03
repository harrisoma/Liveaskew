import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, publicOrigin } from "@/lib/mcp/oauth";
import { userForAccessToken } from "@/lib/mcp/oauth.server";
import { INVALID_REQUEST, PARSE_ERROR, handleBody } from "@/lib/mcp/protocol";
import { callTool } from "@/lib/mcp/tools.server";

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...CORS_HEADERS, ...extra } });
}

/** 401 that tells an assistant where to start OAuth (MCP authorization, RFC 9728). */
function unauthorized(request: Request) {
  const origin = publicOrigin(request.url);
  return json({ error: "unauthorized" }, 401, {
    "WWW-Authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
  });
}

/** LiveAskew as a remote MCP server: Claude, ChatGPT, Cursor and others connect here. */
export const Route = createFileRoute("/api/mcp")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      // Stateless server: no server-initiated stream and no sessions to end.
      GET: () => json({ error: "method_not_allowed" }, 405, { Allow: "POST, OPTIONS" }),
      DELETE: () => json({ error: "method_not_allowed" }, 405, { Allow: "POST, OPTIONS" }),
      POST: async ({ request }) => {
        const header = request.headers.get("authorization") ?? "";
        const token = /^Bearer\s+(.+)$/i.exec(header)?.[1]?.trim();
        if (!token) return unauthorized(request);
        const userId = await userForAccessToken(token);
        if (!userId) return unauthorized(request);

        const raw = await request.text();
        if (raw.length > 64_000) {
          return json(
            { jsonrpc: "2.0", id: null, error: { code: INVALID_REQUEST, message: "Too large" } },
            413,
          );
        }
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return json(
            { jsonrpc: "2.0", id: null, error: { code: PARSE_ERROR, message: "Parse error" } },
            400,
          );
        }
        const out = await handleBody(body, {
          callTool: (name, args) => callTool(userId, name, args),
        });
        if (out === null) return new Response(null, { status: 202, headers: CORS_HEADERS });
        return json(out);
      },
    },
  },
});
