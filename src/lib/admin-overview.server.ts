/** Aggregate-only data. Called only after the route verifies the administrator role. */
export async function adminOverview() {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const queries = {
    members: db.from("member_style").select("user_id", { count: "exact", head: true }),
    guides: db.from("weekly_guides").select("id", { count: "exact", head: true }),
    messages: db
      .from("hive_messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    posted: db
      .from("calendar_events")
      .select("id", { count: "exact", head: true })
      .eq("kind", "post")
      .eq("post_status", "posted")
      .gte("posted_at", since),
    failed: db
      .from("calendar_events")
      .select("id", { count: "exact", head: true })
      .eq("kind", "post")
      .eq("post_status", "failed"),
    scheduled: db
      .from("calendar_events")
      .select("id", { count: "exact", head: true })
      .eq("kind", "post")
      .eq("post_status", "scheduled"),
  };
  const entries = await Promise.all(
    Object.entries(queries).map(async ([key, query]) => {
      try {
        const result = await query;
        return [key, result.error ? null : result.count] as const;
      } catch {
        return [key, null] as const;
      }
    }),
  );
  return { counts: Object.fromEntries(entries), since, updatedAt: new Date().toISOString() };
}
