import { createFileRoute } from "@tanstack/react-router";
import { findClient } from "@/lib/mcp/oauth.server";

/** The approval page asks who is knocking: an assistant's name and its redirect URIs. */
export const Route = createFileRoute("/api/oauth/client")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const id = new URL(request.url).searchParams.get("client_id") ?? "";
        const client = id ? await findClient(id) : null;
        if (!client) return Response.json({ error: "invalid_client" }, { status: 404 });
        return Response.json({ name: client.name, redirect_uris: client.redirect_uris });
      },
    },
  },
});
