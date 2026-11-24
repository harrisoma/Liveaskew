export function inviteToken(value: string): string | null {
  let token = value.trim();
  try {
    if (/^https?:\/\//i.test(token)) token = new URL(token).searchParams.get("hive_invite") ?? "";
  } catch {
    return null;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)
    ? token
    : null;
}

/** A native localhost origin must never be shared as a friend invitation. */
export function hiveInviteLink(token: string, origin: string, apiBase = ""): string {
  const base = apiBase || (/^https?:\/\//.test(origin) ? origin : "https://liveaskew.com");
  const url = new URL("/app", base);
  if (!/^https?:$/.test(url.protocol)) throw new Error("Invitation host is not configured.");
  url.searchParams.set("hive_invite", token);
  return url.toString();
}
