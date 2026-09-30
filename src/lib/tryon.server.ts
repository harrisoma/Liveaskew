/** Cache keys are per owner, so one member's render is never served to another. */
export function ownerCacheKey(userId: string, key: string): string {
  return `${userId}:${key}`;
}

/** Letters, digits, dash, underscore only — no path separators or dots. */
export function safeSegment(raw: string | undefined): string {
  return (raw ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 120);
}
