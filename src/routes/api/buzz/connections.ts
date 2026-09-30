import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import { NETWORKS, networkById } from "@/lib/buzz";
import { networkConfigured } from "@/lib/buzz/providers.server";
import { listConnections, removeConnection } from "@/lib/buzz/store.server";

async function signedIn(request: Request) {
  const caller = await requireApiUser(request);
  if (caller instanceof Response) return caller;
  if (caller === "preview") return Response.json({ error: "sign_in_required" }, { status: 401 });
  return caller;
}

/** Which networks this person has connected (names only — tokens never leave the server). */
export const Route = createFileRoute("/api/buzz/connections")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await signedIn(request);
        if (userId instanceof Response) return userId;
        const connections = await listConnections(userId);
        return Response.json({
          connections,
          available: NETWORKS.filter((n) => networkConfigured(n.id)).map((n) => n.id),
        });
      },
      DELETE: async ({ request }) => {
        const userId = await signedIn(request);
        if (userId instanceof Response) return userId;
        const network = networkById(new URL(request.url).searchParams.get("network"));
        if (!network) return Response.json({ error: "unknown_network" }, { status: 400 });
        await removeConnection(userId, network.id);
        return Response.json({ ok: true });
      },
    },
  },
});
