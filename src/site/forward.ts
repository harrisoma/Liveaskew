/** True when a visit to "/" really belongs in the app at /app. */
export function forwardsToApp(search: string, hash: string, standalone: boolean): boolean {
  const params = new URLSearchParams(search);
  return (
    standalone ||
    hash.includes("access_token") ||
    hash.includes("error") ||
    ["code", "error", "error_description", "billing", "buzz"].some((k) => params.has(k))
  );
}
