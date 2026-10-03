import { isTalkTopic } from "@/lib/bee-talk";
import { beeReply, type BeeMessage, type BeeProfile } from "@/lib/bee-chat.server";
import { guardAi } from "@/lib/entitlement.server";
import { HONEY_COLUMNS, rowToHoney } from "@/lib/honey.server";
import type { HoneyItem } from "@/lib/honey";
import { isToolName, toolError, toolText, type ToolResult } from "./tools";

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type Look = {
  id: string;
  title: string;
  occasion: string;
  formula: string[];
  fit: string;
  feel: string;
  fabric: string;
  palette: string[];
  saved: boolean;
  createdAt: string;
};

function asLook(raw: unknown, saved: boolean): Look | null {
  if (typeof raw !== "object" || raw === null) return null;
  const l = raw as Partial<Look>;
  if (typeof l.title !== "string") return null;
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []);
  return {
    id: String(l.id ?? ""),
    title: l.title,
    occasion: String(l.occasion ?? ""),
    formula: list(l.formula),
    fit: String(l.fit ?? ""),
    feel: String(l.feel ?? ""),
    fabric: String(l.fabric ?? ""),
    palette: list(l.palette),
    saved,
    createdAt: String(l.createdAt ?? ""),
  };
}

function lookText(l: Look): string {
  const lines = [`${l.title}${l.occasion ? ` — ${l.occasion}` : ""}${l.saved ? " (saved)" : ""}`];
  if (l.formula.length) lines.push(`  Pieces: ${l.formula.join("; ")}`);
  if (l.fit) lines.push(`  Fit: ${l.fit}`);
  if (l.feel) lines.push(`  Feel: ${l.feel}`);
  if (l.fabric) lines.push(`  Fabric: ${l.fabric}`);
  if (l.palette.length) lines.push(`  Palette: ${l.palette.join(", ")}`);
  return lines.join("\n");
}

function eventText(e: HoneyItem): string {
  const when = `${e.date}${e.time ? ` ${e.time}` : ""}`;
  const what = e.kind === "post" ? `Buzz post${e.network ? ` to ${e.network}` : ""}` : e.kind;
  const note = e.beeNote ? `\n  Bee: ${e.beeNote}` : "";
  return `${when} · ${e.title} (${what})${note}`;
}

async function profileFor(userId: string): Promise<BeeProfile> {
  const { data } = await (await db())
    .from("member_style")
    .select("onboarding")
    .eq("user_id", userId)
    .maybeSingle();
  const o = (data?.onboarding ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  return { goal: str(o.goal), fit: str(o.fit), budget: str(o.budget) };
}

async function looksFor(userId: string, savedOnly: boolean, limit: number): Promise<Look[]> {
  let q = (await db())
    .from("member_looks")
    .select("look, saved")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (savedOnly) q = q.eq("saved", true);
  const { data } = await q;
  return (data ?? []).map((r) => asLook(r.look, r.saved)).filter((l): l is Look => l !== null);
}

async function eventsFor(userId: string, from: string, to: string): Promise<HoneyItem[]> {
  const { data } = await (await db())
    .from("calendar_events")
    .select(HONEY_COLUMNS)
    .eq("user_id", userId)
    .gte("event_date", from)
    .lte("event_date", to)
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: false })
    .limit(200);
  return (data ?? []).map(rowToHoney);
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
}

function int(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : fallback;
  return Math.min(max, Math.max(min, n));
}

function profileText(p: BeeProfile): string {
  return `Fit: ${p.fit ?? "not named yet"} · Feel: ${p.goal ?? "not named yet"} · Budget: ${p.budget ?? "not named yet"}`;
}

/** Earlier turns an assistant passed along: well-formed ones only, the last twelve. */
export function historyFrom(raw: unknown): BeeMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is BeeMessage =>
        typeof m === "object" &&
        m !== null &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
}

const AI_DENIED: Record<number, string> = {
  402: "Her LiveAskew trial has ended. Bee needs a membership — she can choose one in the app at liveaskew.com/app.",
  429: "Bee has had a lot of questions this hour. Try again in a few minutes.",
};

/** Run a tool for the member behind the token. Null means the tool does not exist. */
export async function callTool(
  userId: string,
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult | null> {
  if (!isToolName(name)) return null;
  // The member's own date when the assistant knows it; UTC otherwise.
  const today = isDate(args.date) ? args.date : new Date().toISOString().slice(0, 10);

  switch (name) {
    case "get_today": {
      const date = today;
      const [profile, events, looks] = await Promise.all([
        profileFor(userId),
        eventsFor(userId, date, date),
        looksFor(userId, false, 1),
      ]);
      const parts = [
        `LiveAskew for ${date}`,
        `Style profile — ${profileText(profile)}`,
        events.length
          ? `On Honey:\n${events.map(eventText).join("\n")}`
          : "Nothing on her Honey calendar for this day.",
        looks[0]
          ? `Bee's latest look:\n${lookText(looks[0])}`
          : "Bee has not put a look together yet.",
      ];
      return toolText(parts.join("\n\n"), { date, profile, events, latestLook: looks[0] ?? null });
    }
    case "list_looks": {
      const savedOnly = args.saved_only === true;
      const looks = await looksFor(userId, savedOnly, int(args.limit, 10, 1, 50));
      const text = looks.length
        ? looks.map(lookText).join("\n\n")
        : savedOnly
          ? "She has not saved any looks yet."
          : "Bee has not put any looks together yet.";
      return toolText(text, { looks });
    }
    case "get_calendar": {
      const days = int(args.days, 14, 1, 60);
      const events = await eventsFor(userId, today, addDays(today, days - 1));
      const text = events.length
        ? events.map(eventText).join("\n")
        : `Nothing on her Honey calendar in the next ${days} days.`;
      return toolText(text, { from: today, days, events });
    }
    case "ask_bee": {
      const message = typeof args.message === "string" ? args.message.trim().slice(0, 2000) : "";
      if (!message) return toolError("ask_bee needs a message.");
      const topic = isTalkTopic(args.topic) ? args.topic : undefined;
      const denied = await guardAi(userId, "chat");
      if (denied) return toolError(AI_DENIED[denied.status] ?? "Bee is not available right now.");
      const result = await beeReply({
        profile: await profileFor(userId),
        messages: [...historyFrom(args.history), { role: "user", content: message }],
        topic,
      });
      if ("error" in result) return toolError("Bee is not available right now. Try again soon.");
      return toolText(result.text);
    }
  }
}
