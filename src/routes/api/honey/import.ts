import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import { isoDay, type HoneyItem } from "@/lib/honey";
import { honeyToInsert } from "@/lib/honey.server";
import { feedSource, parseIcs } from "@/lib/ics";

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

        const body = (await request.json().catch(() => ({}))) as { url?: string };
        const feed = feedSource(body.url ?? "");
        if (!feed) return Response.json({ error: "unsupported_feed" }, { status: 400 });

        let text: string;
        try {
          const res = await fetchFeed(feed.url);
          if (!res?.ok) return Response.json({ error: "feed_unreachable" }, { status: 502 });
          const length = Number(res.headers.get("content-length") ?? 0);
          if (length > MAX_BYTES)
            return Response.json({ error: "feed_too_large" }, { status: 413 });
          text = (await res.text()).slice(0, MAX_BYTES);
        } catch {
          return Response.json({ error: "feed_unreachable" }, { status: 502 });
        }
        if (!text.includes("BEGIN:VCALENDAR")) {
          return Response.json({ error: "not_a_calendar" }, { status: 422 });
        }

        const today = new Date();
        const until = new Date(today);
        until.setDate(until.getDate() + 60);
        const events = parseIcs(text, isoDay(today), isoDay(until));
        const items: HoneyItem[] = events.map((e) => ({
          id: `${feed.source}_${e.uid}`.slice(0, 120),
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

        if (caller !== "preview" && items.length > 0) {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const rows = items.map((item) => {
            // Leave Bee's note and its status out entirely so a re-sync never touches them
            // (sending undefined would still write NULL).
            const {
              outfit_recommendation: _note,
              recommendation_status: _status,
              ...row
            } = honeyToInsert(caller, item);
            return { ...row, external_id: item.id };
          });
          const { error } = await supabaseAdmin
            .from("calendar_events")
            .upsert(rows, { onConflict: "user_id,client_id" });
          if (error) {
            console.error("[honey] import upsert failed", error.message);
            return Response.json({ error: "honey_unavailable" }, { status: 503 });
          }
        }
        return Response.json({ source: feed.source, items });
      },
    },
  },
});
