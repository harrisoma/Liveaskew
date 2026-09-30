/**
 * Post photos must live in the member's own folder of the public buzz-media bucket.
 * The server fetches them for LinkedIn and X, so anything else (internal hosts,
 * other members' files, path tricks) is refused.
 */
export function isOwnBuzzMedia(
  raw: string | null | undefined,
  userId: string,
  supabaseUrl = process.env.SUPABASE_URL ?? "",
): boolean {
  if (!raw || !supabaseUrl) return false;
  let url: URL;
  let base: URL;
  try {
    url = new URL(raw);
    base = new URL(supabaseUrl);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.origin !== base.origin) return false;
  if (url.username || url.password || url.search || url.hash) return false;
  const prefix = `/storage/v1/object/public/buzz-media/${userId}/`;
  const path = decodeURIComponent(url.pathname);
  return path.startsWith(prefix) && !path.includes("..") && path.length > prefix.length;
}
