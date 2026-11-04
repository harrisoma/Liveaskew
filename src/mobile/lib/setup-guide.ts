import type { GuideLook } from "./storage";

/** Only reuse a complete saved week. Partial or duplicate days need rebuilding. */
export function savedSetupWeek(looks: GuideLook[]): GuideLook[] | null {
  const week = looks.filter((look) => look.guideDay != null);
  if (week.length !== 7 || new Set(week.map((look) => look.id)).size !== 7) return null;
  const sorted = [...week].sort((a, b) => a.guideDay! - b.guideDay!);
  return sorted.every((look, index) => look.guideDay === index + 1) ? sorted : null;
}
