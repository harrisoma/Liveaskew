import { completeWeeklyGuide, type GeneratedLook } from "@/lib/bee-looks";
import { apiFetch } from "./api";
import { looksFromInterview } from "./interview";
import { lookId, type LookCard } from "./recommend";
import type { GuideLook } from "./storage";

export function toGuideLook(look: LookCard): GuideLook {
  return {
    ...look,
    saved: false,
    createdAt: new Date().toISOString(),
    garmentNote: look.formula[0] ?? look.title,
    tryOnUrl: null,
    tryOnKey: null,
  };
}

/**
 * Bee writes the looks from the interview (and a Honey calendar item, when given).
 * If the model is unreachable, the rule-based guide keeps the app usable offline.
 */
export async function generateLooks(opts: {
  interview: Record<string, string>;
  occasion?: { title: string; date?: string; kind?: string };
  count?: number;
}): Promise<{
  looks: GuideLook[];
  source: "bee" | "local" | "locked" | "limited" | "unavailable";
}> {
  const count = opts.count ?? (opts.occasion ? 1 : 8);
  try {
    const res = await apiFetch("/api/bee/looks", {
      method: "POST",
      body: JSON.stringify({
        interview: opts.interview,
        occasion: opts.occasion,
        count,
      }),
    });
    if (res.status === 402) return { looks: [], source: "locked" };
    if (res.status === 429) return { looks: [], source: "limited" };
    if (res.ok) {
      const json = (await res.json()) as { looks?: GeneratedLook[] };
      const looks = (json.looks ?? []).map((l) => toGuideLook({ ...l, id: lookId(l.title) }));
      if (count === 8) {
        if (!completeWeeklyGuide(json.looks ?? [])) return { looks: [], source: "unavailable" };
        return {
          looks: looks.map((look, index) => ({ ...look, guideDay: index + 1 })),
          source: "bee",
        };
      }
      if (looks.length > 0) return { looks, source: "bee" };
    }
  } catch {
    /* offline — local guide */
  }
  // Never substitute an offline sample for a requested eight-look guide.
  if (count === 8) return { looks: [], source: "unavailable" };
  const local = looksFromInterview(opts.interview).map(toGuideLook);
  return {
    looks: local
      .slice(0, count)
      .map((l) => (opts.occasion ? { ...l, occasion: opts.occasion.title.slice(0, 40) } : l)),
    source: "local",
  };
}
