import { apiUrl, sessionBearer } from "./api";

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

export const authBearer = sessionBearer;

export async function registerPushToken(opts: {
  token: string;
  platform: "ios" | "android" | "web";
  trialStartedAt?: string | null;
}): Promise<boolean> {
  try {
    const bearer = await authBearer();
    if (!bearer) return false;
    const res = await fetch(apiUrl("/api/push/register"), {
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

export async function notifyRecommendationReady(): Promise<void> {
  try {
    const bearer = await authBearer();
    if (!bearer) return;
    await fetch(apiUrl("/api/push/recommend"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`,
      },
    });
  } catch {
    /* no session / preview */
  }
}

/** Permanently delete the account on the server. Returns an error message, or null on success. */
export async function deleteMyAccount(): Promise<string | null> {
  try {
    const { apiFetch } = await import("./api");
    const res = await apiFetch("/api/account/delete", {
      method: "POST",
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    if (res.ok) return null;
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    return json.error === "subscription_cancel_failed"
      ? "We could not cancel your membership automatically, so nothing was deleted. Try again, or contact us."
      : json.error === "unauthorized"
        ? null // not signed in: only this device holds data, which is cleared next
        : "That did not go through. Try again in a moment.";
  } catch {
    return "No connection. Try again in a moment.";
  }
}
