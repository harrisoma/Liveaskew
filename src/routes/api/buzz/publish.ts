import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import { claimPost, publishClaimed } from "@/lib/buzz/store.server";

/**
 * "Post now" and "Retry": puts the post back to scheduled-for-now and publishes it
 * immediately for its owner.
 */
export const Route = createFileRoute("/api/buzz/publish")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        if (caller === "preview") {
          return Response.json({ error: "sign_in_required" }, { status: 401 });
        }
        const body = (await request.json().catch(() => ({}))) as { id?: string };
        const clientId = body.id?.trim();
        if (!clientId) return Response.json({ error: "missing_id" }, { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("calendar_events")
          .select("id, post_status")
          .eq("user_id", caller)
          .eq("client_id", clientId)
          .eq("kind", "post")
          .maybeSingle();
        if (!row) return Response.json({ error: "not_found" }, { status: 404 });
        if (row.post_status === "posted" || row.post_status === "publishing") {
          return Response.json({ error: "already_" + row.post_status }, { status: 409 });
        }
        await supabaseAdmin
          .from("calendar_events")
          .update({ post_status: "scheduled", scheduled_at: new Date().toISOString() })
          .eq("id", row.id)
          .in("post_status", ["scheduled", "failed"]);

        const [claimed] = await claimPost({ id: row.id, userId: caller, limit: 1 });
        if (!claimed) return Response.json({ error: "already_publishing" }, { status: 409 });
        const result = await publishClaimed(claimed);

        const { data: after } = await supabaseAdmin
          .from("calendar_events")
          .select("post_status, post_error, post_url")
          .eq("id", row.id)
          .maybeSingle();
        return Response.json({ ok: result.ok, ...after });
      },
    },
  },
});
