import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
export const Route = createFileRoute("/api/wardrobe/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await requireApiUser(request);
        if (user instanceof Response) return user;
        if (user === "preview")
          return Response.json({ error: "sign_in_required" }, { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.getBucket("wardrobe-photos");
        if (error || !data || data.public)
          return Response.json({ error: "private_wardrobe_storage_unavailable" }, { status: 503 });
        return Response.json({ ready: true }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
