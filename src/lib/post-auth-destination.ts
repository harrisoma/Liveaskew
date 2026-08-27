import { supabase } from "@/integrations/supabase/client";

/**
 * After auth, decide where to send the user:
 * - If Bee's onboarding conversation hasn't been completed → /chat
 * - Otherwise → /dashboard
 * On any error we fall back to /chat, since Bee is the safest landing surface.
 */
export async function resolvePostAuthDestination(): Promise<"/chat" | "/dashboard"> {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return "/chat";
    const { data } = await supabase
      .from("bee_conversations")
      .select("onboarding_completed_at")
      .eq("user_id", userRes.user.id)
      .not("onboarding_completed_at", "is", null)
      .limit(1)
      .maybeSingle();
    return data?.onboarding_completed_at ? "/dashboard" : "/chat";
  } catch {
    return "/chat";
  }
}
