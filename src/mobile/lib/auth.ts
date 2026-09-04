import type { AuthProvider } from "./storage";

export type VerifyChannel = "email" | "sms";

const PREVIEW_CODE = "000000";

async function supabaseOrNull() {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    return supabase;
  } catch {
    return null;
  }
}

export async function signInWithProvider(provider: AuthProvider): Promise<{
  redirected: boolean;
  email: string | null;
}> {
  const supabase = await supabaseOrNull();
  if (supabase) {
    try {
      const redirectTo = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (!error && data.url) {
        window.location.assign(data.url);
        return { redirected: true, email: null };
      }
    } catch {
      /* fall through to preview */
    }
  }
  return { redirected: false, email: provider === "google" ? "client@liveaskew.app" : null };
}

export async function sendVerifyCode(
  channel: VerifyChannel,
  destination: string,
): Promise<{ ok: boolean; preview: boolean; error?: string }> {
  if (!destination.trim()) return { ok: false, preview: false, error: "Add a destination first." };
  try {
    const res = await fetch("/api/public/verify?action=send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, destination: destination.trim() }),
    });
    if (res.ok) {
      const json = (await res.json()) as { preview?: boolean };
      return { ok: true, preview: Boolean(json.preview) };
    }
  } catch {
    /* preview */
  }
  return { ok: true, preview: true };
}

export async function confirmVerifyCode(
  channel: VerifyChannel,
  destination: string,
  code: string,
): Promise<boolean> {
  const trimmed = code.replace(/\s/g, "");
  try {
    const res = await fetch("/api/public/verify?action=confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, destination: destination.trim(), code: trimmed }),
    });
    if (res.ok) return true;
  } catch {
    /* preview */
  }
  return trimmed === PREVIEW_CODE;
}
