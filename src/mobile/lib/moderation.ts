import type { ModerationAction, ModerationItem } from "@/lib/hive-moderation.server";
import { apiFetch } from "./api";

export type { ModerationAction, ModerationItem };

/** The report queue, or null when this person is not a moderator (or offline). */
export async function fetchModerationQueue(): Promise<ModerationItem[] | null> {
  try {
    const res = await apiFetch("/api/hive/moderation");
    if (!res.ok) return null;
    const json = (await res.json()) as { items?: ModerationItem[] };
    return json.items ?? [];
  } catch {
    return null;
  }
}

export async function moderateMessage(id: string, action: ModerationAction): Promise<boolean> {
  try {
    const res = await apiFetch("/api/hive/moderation", {
      method: "POST",
      body: JSON.stringify({ id, action }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Server role check; never infer administrator access from email or local metadata. */
export async function fetchAdminAccess(): Promise<boolean> {
  try {
    const response = await apiFetch("/api/hive/moderation?access=1");
    if (!response.ok) return false;
    const result = await response.json();
    return result.admin === true;
  } catch {
    return false;
  }
}
