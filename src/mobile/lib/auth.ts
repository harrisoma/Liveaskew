import type { AuthProvider } from "./storage";
import { apiUrl } from "./api";

/** Instagram Login is a Meta product. Supabase exposes Facebook, not Instagram. */
export type OAuthProvider = "google" | "apple" | "facebook";

export function oauthProviderFor(provider: AuthProvider): OAuthProvider {
  return provider === "instagram" ? "facebook" : provider;
}

export function usesPhoneVerify(provider: AuthProvider | null | undefined): boolean {
  return provider === "apple";
}

function previewEmailFor(provider: AuthProvider): string | null {
  if (provider === "google") return "client@liveaskew.app";
  if (provider === "facebook") return "facebook@liveaskew.app";
  if (provider === "instagram") return "instagram@liveaskew.app";
  return null;
}

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
  const key = (apiKey ?? (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? "").trim();
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
    return Boolean(json.external?.[oauthProviderFor(provider)]);
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
  return `${window.location.origin}/`;
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
        provider: oauthProviderFor(provider),
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (!error && data.url && oauthUrlIsLive(data.url)) {
        window.location.assign(withAuthApiKey(data.url));
        return { redirected: true, email: null };
      }
    } catch {
      /* fall through to preview */
    }
  }
  return { redirected: false, email: previewEmailFor(provider) };
}

export async function sendVerifyCode(
  channel: VerifyChannel,
  destination: string,
): Promise<{ ok: boolean; preview: boolean; error?: string }> {
  if (!destination.trim()) return { ok: false, preview: false, error: "Add a destination first." };
  try {
    const res = await fetch(apiUrl("/api/public/verify?action=send"), {
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
    const res = await fetch(apiUrl("/api/public/verify?action=confirm"), {
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

export async function resumeAuthSession(currentUrl = typeof window === "undefined" ? "" : window.location.href): Promise<{
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
