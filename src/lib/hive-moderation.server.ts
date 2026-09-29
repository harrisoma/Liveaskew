export type ModerationItem = {
  id: string;
  roomId: string;
  authorId: string;
  author: string;
  body: string;
  look: unknown;
  hidden: boolean;
  createdAt: string;
  reports: number;
  reasons: Record<string, number>;
  lastReportedAt: string;
};

export type ModerationAction = "keep" | "remove" | "ban";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function isHiveModerator(userId: string): Promise<boolean> {
  const db = await admin();
  const { data } = await db
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return Boolean(data);
}

type ReportRow = { message_id: string; reason: string; created_at: string };

/** Group reports by message, counting only reports newer than the last review. */
export function groupReports(
  reports: ReportRow[],
  reviewedAt: Map<string, string | null>,
): Map<string, { count: number; reasons: Record<string, number>; last: string }> {
  const out = new Map<string, { count: number; reasons: Record<string, number>; last: string }>();
  for (const r of reports) {
    const since = reviewedAt.get(r.message_id);
    if (since && r.created_at <= since) continue;
    const entry = out.get(r.message_id) ?? { count: 0, reasons: {}, last: r.created_at };
    entry.count++;
    entry.reasons[r.reason] = (entry.reasons[r.reason] ?? 0) + 1;
    if (r.created_at > entry.last) entry.last = r.created_at;
    out.set(r.message_id, entry);
  }
  return out;
}

/** Reported messages still waiting on a decision, hidden ones first, then most reported. */
export async function moderationQueue(limit = 50): Promise<ModerationItem[]> {
  const db = await admin();
  const { data: reports } = await db
    .from("hive_reports")
    .select("message_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  const ids = [...new Set((reports ?? []).map((r) => r.message_id))];
  if (ids.length === 0) return [];
  const { data: messages } = await db
    .from("hive_messages")
    .select("id, room_id, user_id, author_name, body, look, hidden, created_at, reviewed_at")
    .in("id", ids);
  const byId = new Map((messages ?? []).map((m) => [m.id, m]));
  const grouped = groupReports(
    reports ?? [],
    new Map((messages ?? []).map((m) => [m.id, m.reviewed_at])),
  );
  const items: ModerationItem[] = [];
  for (const [id, g] of grouped) {
    const m = byId.get(id);
    if (!m) continue;
    items.push({
      id,
      roomId: m.room_id,
      authorId: m.user_id,
      author: m.author_name,
      body: m.body,
      look: m.look,
      hidden: m.hidden,
      createdAt: m.created_at,
      reports: g.count,
      reasons: g.reasons,
      lastReportedAt: g.last,
    });
  }
  items.sort((a, b) =>
    a.hidden !== b.hidden
      ? a.hidden
        ? -1
        : 1
      : b.reports - a.reports || b.lastReportedAt.localeCompare(a.lastReportedAt),
  );
  return items.slice(0, limit);
}

export async function moderate(
  moderatorId: string,
  messageId: string,
  action: ModerationAction,
): Promise<{ ok: boolean; error?: string }> {
  const db = await admin();
  const { data: message } = await db
    .from("hive_messages")
    .select("id, user_id")
    .eq("id", messageId)
    .maybeSingle();
  if (!message) return { ok: false, error: "not_found" };

  if (action === "keep") {
    const { error } = await db
      .from("hive_messages")
      .update({ hidden: false, reviewed_at: new Date().toISOString() })
      .eq("id", messageId);
    return error ? { ok: false, error: error.message } : { ok: true };
  }
  if (action === "ban") {
    if (message.user_id === moderatorId) return { ok: false, error: "cannot_ban_self" };
    const { error } = await db.from("hive_bans").upsert(
      {
        user_id: message.user_id,
        banned_by: moderatorId,
        reason: `Reported message ${messageId}`,
      },
      { onConflict: "user_id" },
    );
    if (error) return { ok: false, error: error.message };
  }
  const { error } = await db.from("hive_messages").delete().eq("id", messageId);
  return error ? { ok: false, error: error.message } : { ok: true };
}
