import type { AuthProvider } from "./storage";
import { apiUrl } from "./api";
import { closeExternal, openExternal } from "./external";

export function parseAuthCallbackUrl(raw: string): string | null {
  const query = raw.includes("?")
    ? raw.slice(raw.indexOf("?") + 1)
    : raw.includes("#")
      ? raw.slice(raw.indexOf("#") + 1)
      : "";
  if (!query) return null;
  try {
    return new URLSearchParams(query.replace(/^#/, "")).get("code");
  } catch {
    return null;
  }
}

export type VerifyChannel = "email" | "sms";

const PREVIEW_CODE = "000000";

/** The offline 000000 fallback exists for `npm run dev` only — never in a shipped build. */
export function localPreviewAllowed(): boolean {
  return Boolean(import.meta.env.DEV);
}

async function supabaseOrNull() {
  try {
    const { isSupabaseConfigured, supabase } = await import("@/integrations/supabase/client");
    if (!isSupabaseConfigured()) return null;
    return supabase;
  } catch {
    return null;
  }
}

export function oauthUrlIsLive(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return !host.includes("dummy") && !host.endsWith(".supabase.local");
  } catch {
    return false;
  }
}

export function withAuthApiKey(url: string, apiKey?: string): string {
  const key = (
    apiKey ??
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
    ""
  ).trim();
  if (!key) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("apikey")) parsed.searchParams.set("apikey", key);
    return parsed.toString();
  } catch {
    return url;
  }
}

async function providerEnabled(provider: AuthProvider): Promise<boolean> {
  const url = String(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim();
  if (!url || !key) return false;
  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { external?: Record<string, boolean | undefined> };
    return Boolean(json.external?.[provider]);
  } catch {
    return false;
  }
}

async function oauthRedirect(): Promise<string> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) return "co.liveaskew.app://";
  } catch {
    /* web */
  }
  return `${window.location.origin}/app`;
}

export async function signInWithProvider(provider: AuthProvider): Promise<{
  redirected: boolean;
  email: string | null;
}> {
  const supabase = await supabaseOrNull();
  if (supabase && (await providerEnabled(provider))) {
    try {
      const redirectTo = await oauthRedirect();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (!error && data.url && oauthUrlIsLive(data.url)) {
        await openExternal(withAuthApiKey(data.url));
        return { redirected: true, email: null };
      }
    } catch {
      /* fall through to preview */
    }
  }
  return { redirected: false, email: null };
}

type OtpType = "email" | "sms" | "email_change" | "phone_change";
const pendingOtpType = new Map<string, OtpType>();

type SupabaseClientLike = NonNullable<Awaited<ReturnType<typeof supabaseOrNull>>>;

/**
 * Signed in already (Google / Apple): confirm the address on that same account.
 * Not signed in: the code itself signs the person in.
 */
async function startOtp(
  supabase: SupabaseClientLike,
  channel: VerifyChannel,
  destination: string,
): Promise<{ type: OtpType; error: string | null }> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (user && channel === "email" && user.email?.toLowerCase() !== destination.toLowerCase()) {
    const { error } = await supabase.auth.updateUser({ email: destination });
    return { type: "email_change", error: error?.message ?? null };
  }
  if (user && channel === "sms") {
    const { error } = await supabase.auth.updateUser({ phone: destination });
    return { type: "phone_change", error: error?.message ?? null };
  }
  const { error } =
    channel === "email"
      ? await supabase.auth.signInWithOtp({ email: destination })
      : await supabase.auth.signInWithOtp({ phone: destination });
  return { type: channel, error: error?.message ?? null };
}

export async function sendVerifyCode(
  channel: VerifyChannel,
  destination: string,
): Promise<{ ok: boolean; preview: boolean; error?: string }> {
  const dest = destination.trim();
  if (!dest) return { ok: false, preview: false, error: "Add a destination first." };

  const supabase = await supabaseOrNull();
  if (supabase) {
    try {
      const { type, error } = await startOtp(supabase, channel, dest);
      if (error)
        return {
          ok: false,
          preview: false,
          error: "Could not send a code. Check it and try again.",
        };
      pendingOtpType.set(dest, type);
      return { ok: true, preview: false };
    } catch {
      return { ok: false, preview: false, error: "No connection. Try again in a moment." };
    }
  }

  try {
    const res = await fetch(apiUrl("/api/public/verify?action=send"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, destination: dest }),
    });
    if (res.ok) {
      const json = (await res.json()) as { preview?: boolean };
      return { ok: true, preview: Boolean(json.preview) };
    }
    return { ok: false, preview: false, error: "Could not send a code. Check it and try again." };
  } catch {
    // No Bee API at all: only local dev may continue with the preview code.
    if (localPreviewAllowed()) return { ok: true, preview: true };
    return { ok: false, preview: false, error: "No connection. Try again in a moment." };
  }
}

export async function confirmVerifyCode(
  channel: VerifyChannel,
  destination: string,
  code: string,
): Promise<boolean> {
  const dest = destination.trim();
  const token = code.replace(/\s/g, "");

  const supabase = await supabaseOrNull();
  if (supabase) {
    const type = pendingOtpType.get(dest) ?? channel;
    try {
      const { error } =
        type === "email" || type === "email_change"
          ? await supabase.auth.verifyOtp({ email: dest, token, type })
          : await supabase.auth.verifyOtp({ phone: dest, token, type });
      if (error) return false;
      pendingOtpType.delete(dest);
      return true;
    } catch {
      return false;
    }
  }

  try {
    const res = await fetch(apiUrl("/api/public/verify?action=confirm"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, destination: dest, code: token }),
    });
    return res.ok;
  } catch {
    return localPreviewAllowed() && token === PREVIEW_CODE;
  }
}

export async function resumeAuthSession(
  currentUrl = typeof window === "undefined" ? "" : window.location.href,
): Promise<{
  signedIn: boolean;
  email: string | null;
}> {
  const supabase = await supabaseOrNull();
  if (!supabase) return { signedIn: false, email: null };

  try {
    const code = currentUrl ? parseAuthCallbackUrl(currentUrl) : null;
    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (typeof window !== "undefined") {
        const clean = new URL(window.location.href);
        clean.searchParams.delete("code");
        clean.searchParams.delete("state");
        window.history.replaceState({}, "", `${clean.pathname}${clean.search}${clean.hash}`);
      }
      if (!error && data.session) {
        return { signedIn: true, email: data.session.user.email ?? null };
      }
    }

    const { data } = await supabase.auth.getSession();
    return {
      signedIn: Boolean(data.session),
      email: data.session?.user.email ?? null,
    };
  } catch {
    return { signedIn: false, email: null };
  }
}

export function bindNativeAuthResume(onResume: (email: string | null) => void): () => void {
  let remove: (() => void) | undefined;
  void (async () => {
    try {
      const { App } = await import("@capacitor/app");
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;
      const handle = await App.addListener("appUrlOpen", async (event) => {
        if (!parseAuthCallbackUrl(event.url)) return;
        void closeExternal();
        const result = await resumeAuthSession(event.url);
        if (result.signedIn) onResume(result.email);
      });
      remove = () => {
        void handle.remove();
      };
    } catch {
      /* web / missing plugin */
    }
  })();
  return () => remove?.();
}

export async function signOut(): Promise<void> {
  const supabase = await supabaseOrNull();
  try {
    await supabase?.auth.signOut();
  } catch {
    /* already signed out */
  }
}
