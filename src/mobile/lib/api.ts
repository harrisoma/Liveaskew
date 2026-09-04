/** Absolute API host for Capacitor store builds. Empty in `npm run dev` (same origin). */
export function apiUrl(path: string): string {
  const base = String(import.meta.env.VITE_API_BASE ?? "")
    .trim()
    .replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
