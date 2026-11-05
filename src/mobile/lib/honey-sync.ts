import type { HoneyItem } from "@/lib/honey";
import { apiFetch } from "./api";

/** Honey is local-first: the device copy always works; signed-in accounts sync to Supabase. */
export async function pullHoney(range?: { from: string; to: string }): Promise<HoneyItem[] | null> {
  try {
    const res = await apiFetch(
      range
        ? `/api/honey/?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`
        : "/api/honey/",
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { items?: HoneyItem[] };
    return json.items ?? [];
  } catch {
    return null;
  }
}

export async function pushHoney(items: HoneyItem[]): Promise<boolean> {
  if (items.length === 0) return true;
  try {
    const res = await apiFetch("/api/honey/", {
      method: "POST",
      body: JSON.stringify({ items: items.slice(0, 200) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteHoney(id: string): Promise<boolean> {
  try {
    const response = await apiFetch(`/api/honey/?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch {
    return false;
  }
}

const IMPORT_ERRORS: Record<string, string> = {
  calendar_not_supported:
    "This calendar could not be fully read. Your existing plans are unchanged. Try a smaller calendar or add the plan manually.",
  unsupported_feed:
    "Use the private iCal link from Google Calendar, iCloud, or Outlook (it starts with https:// or webcal://).",
  feed_unreachable:
    "That calendar link did not answer. Check it is the secret/public iCal address.",
  not_a_calendar: "That link is not a calendar feed.",
  feed_too_large: "That calendar is too large to import at once.",
};

export async function importCalendar(
  url: string,
): Promise<{ items: HoneyItem[]; prefix: string; from: string; to: string } | { error: string }> {
  try {
    const res = await apiFetch("/api/honey/import", {
      method: "POST",
      body: JSON.stringify({ url, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      items?: HoneyItem[];
      error?: string;
      prefix: string;
      from: string;
      to: string;
    };
    if (!res.ok || !json.items) {
      return {
        error: IMPORT_ERRORS[json.error ?? ""] ?? "Could not read that calendar. Try again.",
      };
    }
    return { items: json.items, prefix: json.prefix, from: json.from, to: json.to };
  } catch {
    return { error: "No connection. Try again in a moment." };
  }
}
