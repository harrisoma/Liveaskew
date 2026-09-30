export type HoneyKind = "event" | "meeting" | "post";
export type HoneySource = "manual" | "google" | "apple" | "outlook";
export type PostStatus = "scheduled" | "publishing" | "posted" | "failed";

export const HONEY_NETWORKS = ["Instagram", "Facebook", "LinkedIn", "X", "Threads"] as const;
export type HoneyNetwork = (typeof HONEY_NETWORKS)[number];

/** One row on the Honey calendar — a day's event, a meeting, or a Buzz post. */
export type HoneyItem = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM
  kind: HoneyKind;
  source: HoneySource;
  network: HoneyNetwork | null;
  lookId: string | null;
  caption: string | null;
  postStatus: PostStatus | null;
  beeNote: string | null;
  /** Posts: the exact publish moment (ISO, from the device's local date + time). */
  scheduledAt?: string | null;
  /** Posts: public image URL (Instagram needs one; the others may post text only). */
  mediaUrl?: string | null;
  postError?: string | null;
  postUrl?: string | null;
};

export function isoDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function sortHoney(items: HoneyItem[]): HoneyItem[] {
  return [...items].sort((a, b) =>
    a.date === b.date
      ? (a.time ?? "99:99").localeCompare(b.time ?? "99:99")
      : a.date.localeCompare(b.date),
  );
}

/** Group upcoming items by day, starting today. */
export function upcomingByDay(
  items: HoneyItem[],
  today: string,
  days = 30,
): { date: string; items: HoneyItem[] }[] {
  const end = new Date(`${today}T00:00:00`);
  end.setDate(end.getDate() + days);
  const last = isoDay(end);
  const groups = new Map<string, HoneyItem[]>();
  for (const item of sortHoney(items)) {
    if (item.date < today || item.date > last) continue;
    const list = groups.get(item.date) ?? [];
    list.push(item);
    groups.set(item.date, list);
  }
  return [...groups.entries()].map(([date, list]) => ({ date, items: list }));
}

/** Merge server rows into the local calendar: the server copy wins, local-only rows stay. */
export function mergeHoney(local: HoneyItem[], remote: HoneyItem[]): HoneyItem[] {
  const byId = new Map(local.map((i) => [i.id, i]));
  for (const r of remote) byId.set(r.id, r);
  return sortHoney([...byId.values()]);
}

export function dayLabel(date: string, today: string): string {
  if (date === today) return "Today";
  const t = new Date(`${today}T00:00:00`);
  t.setDate(t.getDate() + 1);
  if (date === isoDay(t)) return "Tomorrow";
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
