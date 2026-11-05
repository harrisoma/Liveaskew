import { z } from "zod";
import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import { type HoneyItem } from "@/lib/honey";
import { honeyToInsert } from "@/lib/honey.server";
import { createHash } from "node:crypto";
import { expandCalendar } from "@/lib/ics.server";
import { feedSource } from "@/lib/ics";

const MAX_BYTES = 2_000_000;

/** Follow at most 3 redirects, and only to other allowed calendar hosts (iCloud does this). */
async function fetchFeed(url: string): Promise<Response | null> {
  let next = url;
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(next, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "text/calendar" },
    });
    if (res.status < 300 || res.status >= 400) return res;
    const location = res.headers.get("location");
    const allowed = location ? feedSource(new URL(location, next).toString()) : null;
    if (!allowed) return null;
    next = allowed.url;
  }
  return null;
}

/**
 * Pull events from a Google / iCloud / Outlook calendar feed (the private iCal link)
 * into Honey. Rows are keyed on the event UID, so syncing again updates in place.
 */
export const Route = createFileRoute("/api/honey/import")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;

        const parsed = z
          .object({ url: z.string().max(4096), timeZone: z.string().max(100).default("UTC") })
          .safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "unsupported_feed" }, { status: 400 });
        const body = parsed.data;
        try {
          new Intl.DateTimeFormat("en", { timeZone: body.timeZone });
        } catch {
          return Response.json({ error: "invalid_timezone" }, { status: 400 });
        }
        const feed = feedSource(body.url ?? "");
        if (!feed) return Response.json({ error: "unsupported_feed" }, { status: 400 });

        let text: string;
        try {
          const res = await fetchFeed(feed.url);
          if (!res?.ok) return Response.json({ error: "feed_unreachable" }, { status: 502 });
          const length = Number(res.headers.get("content-length") ?? 0);
          if (length > MAX_BYTES)
            return Response.json({ error: "feed_too_large" }, { status: 413 });
          const reader = res.body?.getReader();
          if (!reader) throw new Error("empty_feed");
          const chunks: Uint8Array[] = [];
          let bytes = 0;
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            bytes += chunk.value.byteLength;
            if (bytes > MAX_BYTES) {
              await reader.cancel();
              return Response.json({ error: "feed_too_large" }, { status: 413 });
            }
            chunks.push(chunk.value);
          }
          text = Buffer.concat(chunks).toString("utf8");
        } catch {
          return Response.json({ error: "feed_unreachable" }, { status: 502 });
        }
        if (!text.includes("BEGIN:VCALENDAR")) {
          return Response.json({ error: "not_a_calendar" }, { status: 422 });
        }

        const from = new Intl.DateTimeFormat("sv-SE", {
          timeZone: body.timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());
        const until = new Date(`${from}T12:00:00Z`);
        until.setUTCDate(until.getUTCDate() + 60);
        const to = until.toISOString().slice(0, 10);
        let events;
        try {
          events = await expandCalendar(text, from, to, body.timeZone || "UTC");
        } catch {
          return Response.json({ error: "calendar_not_supported" }, { status: 422 });
        }
        const prefix = `feed_${createHash("sha256").update(feed.url).digest("hex").slice(0, 20)}_`;
        const removedIds: string[] = [];
        const items: HoneyItem[] = events.map((e) => ({
          id: prefix + createHash("sha256").update(e.uid).digest("hex").slice(0, 32),
          title: e.title,
          date: e.date,
          time: e.time,
          kind: "event",
          source: feed.source,
          network: null,
          lookId: null,
          caption: null,
          postStatus: null,
          beeNote: null,
        }));

        if (caller !== "preview") {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const rows = items.map((item) => {
            // Leave Bee's note, its status, and the "Dress me" look out entirely so a
            // re-sync never touches them (sending undefined would still write NULL).
            const {
              outfit_recommendation: _note,
              recommendation_status: _status,
              look_id: _look,
              ...row
            } = honeyToInsert(caller, item);
            return { ...row, external_id: item.id };
          });
          const { error } = rows.length
            ? await supabaseAdmin
                .from("calendar_events")
                .upsert(rows, { onConflict: "user_id,client_id" })
            : { error: null };
          if (error) {
            console.error("[honey] import upsert failed", error.message);
            return Response.json({ error: "honey_unavailable" }, { status: 503 });
          }
          const { data: previous, error: readError } = await supabaseAdmin
            .from("calendar_events")
            .select("client_id")
            .eq("user_id", caller)
            .like("client_id", prefix.replaceAll("_", "\\_") + "%")
            .gte("event_date", from)
            .lte("event_date", to);
          if (readError) return Response.json({ error: "honey_unavailable" }, { status: 503 });
          const currentIds = new Set(items.map((i) => i.id));
          removedIds.push(
            ...(previous ?? [])
              .map((r) => r.client_id)
              .filter((id): id is string => !!id && !currentIds.has(id)),
          );
          if (removedIds.length) {
            const { error: deleteError } = await supabaseAdmin
              .from("calendar_events")
              .delete()
              .eq("user_id", caller)
              .in("client_id", removedIds);
            if (deleteError) return Response.json({ error: "honey_unavailable" }, { status: 503 });
          }
        }
        return Response.json({ source: feed.source, items, prefix, from, to, removedIds });
      },
    },
  },
});
