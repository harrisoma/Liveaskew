/** Absolute API host for Capacitor store builds. Empty in `npm run dev` (same origin). */
export function apiUrl(path: string): string {
  const base = String(import.meta.env.VITE_API_BASE ?? "")
    .trim()
    .replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export async function sessionBearer(): Promise<string | null> {
  try {
    const { isSupabaseConfigured, supabase } = await import("@/integrations/supabase/client");
    if (!isSupabaseConfigured()) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/** fetch against the Bee API with the signed-in user's bearer token when there is one. */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const bearer = await sessionBearer();
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
  return fetch(apiUrl(path), { ...init, headers });
}

/** Reject HTML fallbacks and malformed API bodies without exposing parser output to members. */
export async function apiJson(response: Response) {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json") && !contentType.includes("+json")) {
    throw new Error(
      "Bee could not reach the service. Your saved guide is unchanged. Please try again shortly.",
    );
  }
  try {
    return await response.json();
  } catch {
    throw new Error(
      "Bee received an incomplete response. Your saved guide is unchanged. Please try again shortly.",
    );
  }
}
