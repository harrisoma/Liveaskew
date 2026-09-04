export async function persistTrialStartedAt(startedAt: string): Promise<void> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase
      .from("profiles")
      .update({ trial_started_at: startedAt } as never)
      .eq("id", data.user.id)
      .is("trial_started_at", null);
  } catch {
    /* preview / dummy supabase */
  }
}

export async function authBearer(): Promise<string | null> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function registerPushToken(opts: {
  token: string;
  platform: "ios" | "android" | "web";
  trialStartedAt?: string | null;
}): Promise<boolean> {
  try {
    const bearer = await authBearer();
    if (!bearer) return false;
    const res = await fetch("/api/push/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`,
      },
      body: JSON.stringify({
        token: opts.token,
        platform: opts.platform,
        trialStartedAt: opts.trialStartedAt ?? undefined,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
