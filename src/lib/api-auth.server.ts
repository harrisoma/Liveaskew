import { userIdFromAuthHeader } from "@/lib/push.server";

export function supabaseAuthConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";
}

/**
 * Gate for routes that spend AI / render credits. Returns the caller's user id,
 * `"preview"` in local dev without Supabase, or a 401/503 Response to return as-is.
 */
export async function requireApiUser(request: Request): Promise<string | Response> {
  if (!supabaseAuthConfigured()) {
    if (!isProductionRuntime()) return "preview";
    return Response.json({ error: "auth_not_configured" }, { status: 503 });
  }
  const userId = await userIdFromAuthHeader(request);
  if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
  return userId;
}
