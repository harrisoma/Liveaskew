import type { Database } from "@/integrations/supabase/types";
import { HONEY_NETWORKS, type HoneyItem, type HoneyNetwork } from "./honey";

type Row = Database["public"]["Tables"]["calendar_events"]["Row"];
type Insert = Database["public"]["Tables"]["calendar_events"]["Insert"];

export const HONEY_COLUMNS =
  "id, client_id, title, event_date, start_time, kind, source, network, look_id, caption, post_status, outfit_recommendation, scheduled_at, media_url, post_error, post_url";

function asNetwork(value: string | null): HoneyNetwork | null {
  return (HONEY_NETWORKS as readonly string[]).includes(value ?? "")
    ? (value as HoneyNetwork)
    : null;
}

export function rowToHoney(
  row: Pick<
    Row,
    | "id"
    | "client_id"
    | "title"
    | "event_date"
    | "start_time"
    | "kind"
    | "source"
    | "network"
    | "look_id"
    | "caption"
    | "post_status"
    | "outfit_recommendation"
    | "scheduled_at"
    | "media_url"
    | "post_error"
    | "post_url"
  >,
): HoneyItem {
  return {
    id: row.client_id ?? row.id,
    title: row.title,
    date: row.event_date,
    time: row.start_time ? row.start_time.slice(0, 5) : null,
    kind: row.kind === "meeting" || row.kind === "post" ? row.kind : "event",
    source:
      row.source === "google" || row.source === "apple" || row.source === "outlook"
        ? row.source
        : "manual",
    network: asNetwork(row.network),
    lookId: row.look_id,
    caption: row.caption,
    postStatus:
      row.post_status === "scheduled" ||
      row.post_status === "publishing" ||
      row.post_status === "posted" ||
      row.post_status === "failed"
        ? row.post_status
        : null,
    beeNote: row.outfit_recommendation,
    scheduledAt: row.scheduled_at,
    mediaUrl: row.media_url,
    postError: row.post_error,
    postUrl: row.post_url,
  };
}

/**
 * Row from a device's copy. Publishing state (status, error, link, posted time) is the
 * server's: a new post starts as scheduled, and an existing row keeps whatever the
 * publisher recorded — so an old copy on a phone can never re-queue a published post.
 */
export function honeyToInsert(
  userId: string,
  item: HoneyItem,
  existing?: { post_status: string | null } | null,
): Insert {
  const locked = existing?.post_status === "publishing" || existing?.post_status === "posted";
  const postFields =
    item.kind !== "post"
      ? { post_status: null }
      : existing
        ? locked
          ? {}
          : {
              // Editing a scheduled/failed post may move its time and media, not its status.
              scheduled_at: item.scheduledAt ?? null,
              media_url: item.mediaUrl ?? null,
            }
        : {
            post_status: "scheduled",
            scheduled_at: item.scheduledAt ?? null,
            media_url: item.mediaUrl ?? null,
          };
  return {
    user_id: userId,
    client_id: item.id,
    title: item.title.slice(0, 160),
    event_date: item.date,
    start_time: item.time,
    kind: item.kind,
    source: item.source,
    network: item.network,
    look_id: item.lookId,
    caption: item.caption?.slice(0, 5000) ?? null,
    ...postFields,
    outfit_recommendation: item.beeNote,
    recommendation_status: item.beeNote ? "ready" : "pending",
  };
}
