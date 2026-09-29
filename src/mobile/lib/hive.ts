import type { GuideLook } from "./storage";

export type HiveRoom = { id: string; name: string; kind: string; blurb: string };

export type HiveLook = { title: string; formula: string[]; palette: string[] };

export type HiveMessage = {
  id: string;
  roomId: string;
  userId: string;
  author: string;
  body: string;
  look: HiveLook | null;
  hidden: boolean;
  createdAt: string;
};

export type ReportReason = "harassment" | "spam" | "body_shaming" | "other";

type MessageRow = {
  id: string;
  room_id: string;
  user_id: string;
  author_name: string;
  body: string;
  look: unknown;
  hidden: boolean;
  created_at: string;
};

const MESSAGE_COLUMNS = "id, room_id, user_id, author_name, body, look, hidden, created_at";

export function lookForHive(look: GuideLook): HiveLook {
  return {
    title: look.title.slice(0, 60),
    formula: look.formula.slice(0, 6).map((f) => f.slice(0, 80)),
    palette: look.palette.filter((c) => /^#[0-9a-fA-F]{6}$/.test(c)).slice(0, 4),
  };
}

function asLook(value: unknown): HiveLook | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<HiveLook>;
  if (typeof v.title !== "string" || !Array.isArray(v.formula)) return null;
  return {
    title: v.title,
    formula: v.formula.filter((f): f is string => typeof f === "string"),
    palette: Array.isArray(v.palette)
      ? v.palette.filter((c): c is string => typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c))
      : [],
  };
}

export function rowToMessage(row: MessageRow): HiveMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    author: row.author_name || "Member",
    body: row.body,
    look: asLook(row.look),
    hidden: row.hidden,
    createdAt: row.created_at,
  };
}

/** Insert or replace by id, oldest first, capped — realtime can deliver our own insert twice. */
export function upsertMessage(list: HiveMessage[], msg: HiveMessage, cap = 200): HiveMessage[] {
  const next = list.filter((m) => m.id !== msg.id);
  next.push(msg);
  next.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return next.slice(-cap);
}

async function client() {
  const { isSupabaseConfigured, supabase } = await import("@/integrations/supabase/client");
  if (!isSupabaseConfigured()) return null;
  return supabase;
}

export type HiveSession =
  | { state: "offline" }
  | { state: "signed_out" }
  | { state: "ready"; userId: string; displayName: string | null };

/** Who is in the Hive: needs a live Supabase and a signed-in account. */
export async function hiveSession(): Promise<HiveSession> {
  const supabase = await client();
  if (!supabase) return { state: "offline" };
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return { state: "signed_out" };
  const { data: profile } = await supabase
    .from("hive_profiles")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();
  return { state: "ready", userId, displayName: profile?.display_name ?? null };
}

export async function saveDisplayName(userId: string, name: string): Promise<string | null> {
  const clean = name.trim().replace(/\s+/g, " ");
  if (clean.length < 2 || clean.length > 40) return "Use 2–40 characters.";
  const supabase = await client();
  if (!supabase) return "The Hive is not connected here.";
  const { error } = await supabase
    .from("hive_profiles")
    .upsert(
      { user_id: userId, display_name: clean, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  return error ? "That name did not save. Try again." : null;
}

export async function listRooms(): Promise<HiveRoom[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hive_rooms")
    .select("id, name, kind, blurb")
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function listMessages(roomId: string, limit = 60): Promise<HiveMessage[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hive_messages")
    .select(MESSAGE_COLUMNS)
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map(rowToMessage).reverse();
}

export async function sendMessage(opts: {
  roomId: string;
  userId: string;
  body: string;
  look?: HiveLook | null;
}): Promise<HiveMessage | { error: string }> {
  const body = opts.body.trim().slice(0, 2000);
  if (!body) return { error: "Write something first." };
  const supabase = await client();
  if (!supabase) return { error: "The Hive is not connected here." };
  const { data, error } = await supabase
    .from("hive_messages")
    .insert({
      room_id: opts.roomId,
      user_id: opts.userId,
      body,
      look: opts.look ?? null,
    })
    .select(MESSAGE_COLUMNS)
    .single();
  if (error || !data) {
    return {
      error: error?.message.includes("hive_profile_required")
        ? "Choose your Hive name first."
        : error?.message.includes("hive_banned")
          ? "Your Hive posting has been paused by the moderators."
          : "That did not send. Try again.",
    };
  }
  return rowToMessage(data);
}

export async function deleteMessage(id: string): Promise<boolean> {
  const supabase = await client();
  if (!supabase) return false;
  const { error } = await supabase.from("hive_messages").delete().eq("id", id);
  return !error;
}

export async function reportMessage(
  messageId: string,
  reporterId: string,
  reason: ReportReason,
): Promise<boolean> {
  const supabase = await client();
  if (!supabase) return false;
  const { error } = await supabase
    .from("hive_reports")
    .insert({ message_id: messageId, reporter_id: reporterId, reason });
  // Reporting twice is fine — the first report stands.
  return !error || error.code === "23505";
}

export async function blockMember(blockerId: string, blockedId: string): Promise<boolean> {
  const supabase = await client();
  if (!supabase) return false;
  const { error } = await supabase
    .from("hive_blocks")
    .insert({ blocker_id: blockerId, blocked_id: blockedId });
  return !error || error.code === "23505";
}

export async function listBlocked(blockerId: string): Promise<string[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("hive_blocks")
    .select("blocked_id")
    .eq("blocker_id", blockerId);
  return (data ?? []).map((r) => r.blocked_id);
}

/** Live inserts and deletes for one room. Returns an unsubscribe function. */
export function subscribeRoom(
  roomId: string,
  handlers: { onInsert: (m: HiveMessage) => void; onDelete: (id: string) => void },
): () => void {
  let stop: (() => void) | null = null;
  let cancelled = false;
  void (async () => {
    const supabase = await client();
    if (!supabase || cancelled) return;
    const channel = supabase
      .channel(`hive:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "hive_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => handlers.onInsert(rowToMessage(payload.new as MessageRow)),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "hive_messages" },
        (payload) => {
          const id = (payload.old as { id?: string }).id;
          if (id) handlers.onDelete(id);
        },
      )
      .subscribe();
    stop = () => {
      void supabase.removeChannel(channel);
    };
  })();
  return () => {
    cancelled = true;
    stop?.();
  };
}
