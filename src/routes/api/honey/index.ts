import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/api-auth.server";
import { HONEY_NETWORKS } from "@/lib/honey";
import { HONEY_COLUMNS, honeyToInsert, rowToHoney } from "@/lib/honey.server";

const itemSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  kind: z.enum(["event", "meeting", "post"]),
  source: z.enum(["manual", "google", "apple", "outlook"]),
  network: z.enum(HONEY_NETWORKS).nullable(),
  lookId: z.string().max(120).nullable(),
  caption: z.string().max(2200).nullable(),
  postStatus: z.enum(["scheduled", "posted", "failed"]).nullable(),
  beeNote: z.string().max(2000).nullable(),
});

const upsertSchema = z.object({ items: z.array(itemSchema).min(1).max(200) });

async function signedIn(request: Request) {
  const caller = await requireApiUser(request);
  if (caller instanceof Response) return caller;
  if (caller === "preview") return Response.json({ error: "sign_in_required" }, { status: 401 });
  return caller;
}

/** Honey calendar rows for the signed-in person (events, meetings, Buzz posts). */
export const Route = createFileRoute("/api/honey/")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await signedIn(request);
        if (userId instanceof Response) return userId;
        const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("calendar_events")
          .select(HONEY_COLUMNS)
          .eq("user_id", userId)
          .gte("event_date", since)
          .order("event_date", { ascending: true })
          .limit(500);
        if (error) return Response.json({ error: "honey_unavailable" }, { status: 503 });
        return Response.json({ items: (data ?? []).map(rowToHoney) });
      },
      POST: async ({ request }) => {
        const userId = await signedIn(request);
        if (userId instanceof Response) return userId;
        const parsed = upsertSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "invalid_body" }, { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("calendar_events").upsert(
          parsed.data.items.map((item) => honeyToInsert(userId, item)),
          { onConflict: "user_id,client_id" },
        );
        if (error) {
          console.error("[honey] upsert failed", error.message);
          return Response.json({ error: "honey_unavailable" }, { status: 503 });
        }
        return Response.json({ ok: true });
      },
      DELETE: async ({ request }) => {
        const userId = await signedIn(request);
        if (userId instanceof Response) return userId;
        const id = new URL(request.url).searchParams.get("id")?.trim();
        if (!id) return Response.json({ error: "missing_id" }, { status: 400 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("calendar_events")
          .delete()
          .eq("user_id", userId)
          .eq("client_id", id);
        if (error) return Response.json({ error: "honey_unavailable" }, { status: 503 });
        return Response.json({ ok: true });
      },
    },
  },
});
