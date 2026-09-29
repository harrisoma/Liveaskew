import { apiFetch } from "./api";
import type { PlanSlug } from "./tiers";

export type Membership = { active: boolean; tier: PlanSlug | null };

async function isNative(): Promise<boolean> {
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** Paid access comes only from the server (Stripe webhook → subscriptions). null = unknown. */
export async function fetchMembership(): Promise<Membership | null> {
  try {
    const res = await apiFetch("/api/billing/status");
    if (!res.ok) return null;
    const json = (await res.json()) as { active?: boolean; tier?: PlanSlug | null };
    return { active: Boolean(json.active), tier: json.tier ?? null };
  } catch {
    return null;
  }
}

const CHECKOUT_ERRORS: Record<string, string> = {
  sign_in_required: "Sign in with Google or Apple first, then choose your tier.",
  unauthorized: "Sign in with Google or Apple first, then choose your tier.",
  billing_not_configured: "Payments are not switched on in this environment yet.",
  price_missing: "This tier is not on sale yet. Try another, or ask Bee.",
};

export async function startCheckout(tier: PlanSlug): Promise<{ error: string } | null> {
  const native = await isNative();
  const returnUrl = native ? "co.liveaskew.app://billing" : `${window.location.origin}/`;
  try {
    const res = await apiFetch("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ tier, returnUrl }),
    });
    const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok || !json.url) {
      return { error: CHECKOUT_ERRORS[json.error ?? ""] ?? "Checkout did not open. Try again." };
    }
    if (native) window.open(json.url, "_system");
    else window.location.assign(json.url);
    return null;
  } catch {
    return { error: "No connection. Try again in a moment." };
  }
}

export async function requestAtelier(): Promise<{ error: string } | null> {
  try {
    const res = await apiFetch("/api/billing/inquiry", { method: "POST", body: "{}" });
    if (res.ok) return null;
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    return { error: CHECKOUT_ERRORS[json.error ?? ""] ?? "That did not go through. Try again." };
  } catch {
    return { error: "No connection. Try again in a moment." };
  }
}

/** Strip ?billing=… after Stripe returns, and say whether checkout just finished. */
export function consumeBillingReturn(href: string): "success" | "cancelled" | null {
  try {
    const url = new URL(href);
    const value = url.searchParams.get("billing");
    if (value !== "success" && value !== "cancelled") return null;
    if (typeof window !== "undefined" && url.protocol.startsWith("http")) {
      url.searchParams.delete("billing");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
    return value;
  } catch {
    return null;
  }
}
