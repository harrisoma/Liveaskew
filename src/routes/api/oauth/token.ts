import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS } from "@/lib/mcp/oauth";
import { exchangeCode, refreshTokens } from "@/lib/mcp/oauth.server";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { ...CORS_HEADERS, "Cache-Control": "no-store", Pragma: "no-cache" },
  });
}

async function readParams(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(body).filter((e): e is [string, string] => typeof e[1] === "string"),
    );
  }
  return Object.fromEntries(new URLSearchParams(await request.text()));
}

/** OAuth token endpoint: authorization_code (with PKCE) and refresh_token grants. */
export const Route = createFileRoute("/api/oauth/token")({
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const p = await readParams(request);
        const clientId = p.client_id ?? "";
        if (!clientId) return json({ error: "invalid_client" }, 401);

        if (p.grant_type === "authorization_code") {
          if (!p.code || !p.redirect_uri || !p.code_verifier) {
            return json({ error: "invalid_request" }, 400);
          }
          const out = await exchangeCode({
            code: p.code,
            clientId,
            redirectUri: p.redirect_uri,
            codeVerifier: p.code_verifier,
          });
          return "error" in out ? json(out, out.error === "server_error" ? 500 : 400) : json(out);
        }
        if (p.grant_type === "refresh_token") {
          if (!p.refresh_token) return json({ error: "invalid_request" }, 400);
          const out = await refreshTokens({ refreshToken: p.refresh_token, clientId });
          return "error" in out ? json(out, out.error === "server_error" ? 500 : 400) : json(out);
        }
        return json({ error: "unsupported_grant_type" }, 400);
      },
    },
  },
});
