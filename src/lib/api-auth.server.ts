import { userIdFromAuthHeader } from "@/lib/push.server";

export function supabaseAuthConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}

/**
 * Only a developer's own machine (`npm run dev`) may run without Supabase. Every Vercel
 * deployment — production and preview alike — and every production build must be real.
 */
export function isLocalDev(): boolean {
  return !process.env.VERCEL && process.env.NODE_ENV !== "production";
}

/**
 * Gate for routes that spend AI / render credits. Returns the caller's user id,
 * `"preview"` in local dev without Supabase, or a 401/503 Response to return as-is.
 */
export async function requireApiUser(request: Request): Promise<string | Response> {
  if (!supabaseAuthConfigured()) {
    if (isLocalDev()) return "preview";
    return Response.json({ error: "auth_not_configured" }, { status: 503 });
  }
  const userId = await userIdFromAuthHeader(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  return userId;
}
