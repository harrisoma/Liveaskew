import type { ConnectionSummary, NetworkId } from "@/lib/buzz";
import { apiFetch } from "./api";
import { isNativeApp, openExternal } from "./external";

export type BuzzAccounts = {
  connections: ConnectionSummary[];
  /** Networks this deployment has app credentials for. */
  available: NetworkId[];
};

export async function fetchBuzzAccounts(): Promise<BuzzAccounts | null> {
  try {
    const res = await apiFetch("/api/buzz/connections");
    if (!res.ok) return null;
    return (await res.json()) as BuzzAccounts;
  } catch {
    return null;
  }
}

const CONNECT_ERRORS: Record<string, string> = {
  sign_in_required: "Sign in with Google or Apple first, then connect your accounts.",
  unauthorized: "Sign in with Google or Apple first, then connect your accounts.",
  network_not_configured: "This network is not switched on for Bee yet.",
};

export async function connectNetwork(network: NetworkId): Promise<{ error: string } | null> {
  const native = await isNativeApp();
  const returnTo = native ? "co.liveaskew.app://buzz" : `${window.location.origin}/`;
  try {
    const res = await apiFetch("/api/buzz/connect", {
      method: "POST",
      body: JSON.stringify({ network, returnTo }),
    });
    const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok || !json.url) {
      return {
        error: CONNECT_ERRORS[json.error ?? ""] ?? "Could not open that sign-in. Try again.",
      };
    }
    await openExternal(json.url);
    return null;
  } catch {
    return { error: "No connection. Try again in a moment." };
  }
}

export async function disconnectNetwork(network: NetworkId): Promise<boolean> {
  try {
    const res = await apiFetch(`/api/buzz/connections?network=${network}`, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

export type PublishNowResult = {
  ok: boolean;
  post_status?: "scheduled" | "publishing" | "posted" | "failed" | null;
  post_error?: string | null;
  post_url?: string | null;
  error?: string;
};

export async function publishNow(id: string): Promise<PublishNowResult> {
  try {
    const res = await apiFetch("/api/buzz/publish", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    const json = (await res.json().catch(() => ({}))) as PublishNowResult;
    return res.ok ? json : { ok: false, error: json.error ?? "publish_failed" };
  } catch {
    return { ok: false, error: "offline" };
  }
}

/**
 * Networks fetch post images by URL, so a photo on the device goes to the public
 * buzz-media bucket first (in the member's own folder). Returns null when not signed in.
 */
export async function uploadPostImage(dataUrl: string): Promise<string | null> {
  const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!m) return /^https:\/\//.test(dataUrl) ? dataUrl : null;
  try {
    const { isSupabaseConfigured, supabase } = await import("@/integrations/supabase/client");
    if (!isSupabaseConfigured()) return null;
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return null;
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    const ext = m[1] === "image/png" ? "png" : m[1] === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("buzz-media")
      .upload(path, bytes, { contentType: m[1], upsert: false });
    if (error) return null;
    return supabase.storage.from("buzz-media").getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

/** Read ?buzz=… after a network sends the person back, and clean the URL. */
export function consumeBuzzReturn(
  href: string,
): { status: "connected" | "cancelled" | "error"; network: string; reason: string } | null {
  try {
    const url = new URL(href);
    const status = url.searchParams.get("buzz");
    if (status !== "connected" && status !== "cancelled" && status !== "error") return null;
    const result = {
      status,
      network: url.searchParams.get("network") ?? "",
      reason: url.searchParams.get("reason") ?? "",
    } as const;
    if (typeof window !== "undefined" && url.protocol.startsWith("http")) {
      for (const k of ["buzz", "network", "reason"]) url.searchParams.delete(k);
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
    return result;
  } catch {
    return null;
  }
}
