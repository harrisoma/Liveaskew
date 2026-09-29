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
  caption: z.string().max(5000).nullable(),
  postStatus: z.enum(["scheduled", "publishing", "posted", "failed"]).nullable(),
  beeNote: z.string().max(2000).nullable(),
  scheduledAt: z.string().datetime().nullable().optional(),
  mediaUrl: z.string().url().max(1000).nullable().optional(),
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
        const items = parsed.data.items;
        const { data: existingRows } = await supabaseAdmin
          .from("calendar_events")
          .select("client_id, post_status")
          .eq("user_id", userId)
          .in(
            "client_id",
            items.map((i) => i.id),
          );
        const existing = new Map((existingRows ?? []).map((r) => [r.client_id, r]));
        // Rows with and without post fields go separately so each upsert has one column set.
        const rows = items.map((item) => honeyToInsert(userId, item, existing.get(item.id)));
        const groups = new Map<string, typeof rows>();
        for (const row of rows) {
          const key = Object.keys(row).sort().join(",");
          groups.set(key, [...(groups.get(key) ?? []), row]);
        }
        let error: { message: string } | null = null;
        for (const group of groups.values()) {
          const res = await supabaseAdmin
            .from("calendar_events")
            .upsert(group, { onConflict: "user_id,client_id" });
          if (res.error) error = res.error;
        }
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
