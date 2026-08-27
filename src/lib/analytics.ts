// Lightweight client-side analytics for A/B testing the hero CTA.
// Events are pushed to window.dataLayer (GTM-compatible), logged in dev,
// and buffered in localStorage under "la_events" for inspection / later flush.

export type AnalyticsEvent =
  | { event: "hero_cta_click"; variant: 1 | 2 | 3; label: string }
  | { event: "signup_started"; variant: 1 | 2 | 3 | null; method: "email" | "google" }
  | { event: "signup_completed"; variant: 1 | 2 | 3 | null; method: "email" | "google" };

const STORAGE_KEY = "la_events";
const VARIANT_KEY = "la_ab_cta";
const COMPLETED_KEY = "la_signup_completed";

export function getHeroVariant(): 1 | 2 | 3 | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(VARIANT_KEY);
  return v === "1" || v === "2" || v === "3" ? (Number(v) as 1 | 2 | 3) : null;
}

export function track(payload: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  const enriched = { ...payload, ts: Date.now(), path: window.location.pathname };
  try {
    // GTM / GA4 dataLayer hook — no-op if absent.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push(enriched);
  } catch {
    /* ignore */
  }
  try {
    const buf = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    buf.push(enriched);
    // Keep last 50 events only.
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buf.slice(-50)));
  } catch {
    /* ignore */
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug("[analytics]", enriched);
  }
}

// Fire signup_completed exactly once per browser, after email verification or OAuth.
export function trackSignupCompletedOnce(method: "email" | "google") {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(COMPLETED_KEY)) return;
  window.localStorage.setItem(COMPLETED_KEY, "1");
  track({ event: "signup_completed", variant: getHeroVariant(), method });
}
