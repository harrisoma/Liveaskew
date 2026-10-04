import type { HoneyItem } from "@/lib/honey";
import type { LookCard, OnboardingAnswers } from "./recommend";

export type AuthProvider = "google" | "apple" | "email";
export type WardrobeVerdict = "keep" | "toss" | "maybe";
export type Phase = "auth" | "verify" | "interview" | "selfie" | "app";

export type ChatMsg = { id: string; role: "user" | "assistant"; content: string };

export type WardrobeItem = {
  id: string;
  photo: string;
  label: string;
  verdict: WardrobeVerdict | null;
  reason: string | null;
  error?: string | null;
};

/** tryOnUrl value meaning "no render yet — show the person's own photo unaltered". */
export const SELF_PHOTO = "self";

/** The picture to show for a look: its try-on render, the selfie, or nothing. */
export function lookPhoto(look: { tryOnUrl: string | null }, selfie: string | null): string | null {
  if (!look.tryOnUrl) return null;
  return look.tryOnUrl === SELF_PHOTO ? selfie : look.tryOnUrl;
}

export type GuideLook = LookCard & {
  saved: boolean;
  createdAt: string;
  garmentNote: string;
  tryOnUrl: string | null;
  tryOnKey: string | null;
};

export type InterviewState = {
  step: number;
  answers: Record<string, string>;
  completed: boolean;
};

export type AppSnapshot = {
  phase: Phase;
  authProvider: AuthProvider | null;
  email: string | null;
  phone: string | null;
  verified: boolean;
  interview: InterviewState;
  onboarding: OnboardingAnswers & { completed: boolean };
  messages: ChatMsg[];
  selfie: string | null;
  trialStartedAt: string | null;
  membershipActive: boolean;
  looks: GuideLook[];
  wardrobe: WardrobeItem[];
  tryOnCache: Record<string, string>;
  tier: string;
  notifications: { beeReady: boolean; tierUpgrade: boolean };
  ratingAsked: boolean;
  honey: HoneyItem[];
  calendarFeeds: string[];
  lastActiveAt: string;
};

const KEY = "la_mobile_v2";

export const emptySnapshot: AppSnapshot = {
  phase: "auth",
  authProvider: null,
  email: null,
  phone: null,
  verified: false,
  interview: { step: 0, answers: {}, completed: false },
  onboarding: { goal: null, fit: null, budget: null, completed: false },
  messages: [],
  selfie: null,
  trialStartedAt: null,
  membershipActive: false,
  looks: [],
  wardrobe: [],
  tryOnCache: {},
  tier: "silver",
  notifications: { beeReady: true, tierUpgrade: true },
  ratingAsked: false,
  honey: [],
  calendarFeeds: [],
  lastActiveAt: new Date().toISOString(),
};

function cloneEmpty(): AppSnapshot {
  return {
    ...emptySnapshot,
    interview: { step: 0, answers: {}, completed: false },
    onboarding: { goal: null, fit: null, budget: null, completed: false },
    notifications: { beeReady: true, tierUpgrade: true },
    messages: [],
    looks: [],
    wardrobe: [],
    tryOnCache: {},
    honey: [],
    calendarFeeds: [],
  };
}

export function loadSnapshot(): AppSnapshot {
  if (typeof window === "undefined") return cloneEmpty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return cloneEmpty();
    const parsed = JSON.parse(raw) as Partial<AppSnapshot>;
    // Older versions stored a full copy of the selfie per look when try-on was offline.
    const selfie = parsed.selfie ?? null;
    if (selfie && parsed.looks) {
      parsed.looks = parsed.looks.map((l) =>
        l.tryOnUrl === selfie ? { ...l, tryOnUrl: SELF_PHOTO } : l,
      );
    }
    if (selfie && parsed.tryOnCache) {
      parsed.tryOnCache = Object.fromEntries(
        Object.entries(parsed.tryOnCache).filter(([, v]) => v !== selfie),
      );
    }
    return {
      ...cloneEmpty(),
      ...parsed,
      interview: { ...emptySnapshot.interview, ...parsed.interview },
      onboarding: { ...emptySnapshot.onboarding, ...parsed.onboarding },
      notifications: { ...emptySnapshot.notifications, ...parsed.notifications },
      tryOnCache: parsed.tryOnCache ?? {},
      wardrobe: parsed.wardrobe ?? [],
      looks: parsed.looks ?? [],
      honey: parsed.honey ?? [],
      calendarFeeds: parsed.calendarFeeds ?? [],
    };
  } catch {
    return cloneEmpty();
  }
}

const MAX_MESSAGES = 120;

/**
 * Progressively lighter copies to try when device storage is full, so a heavy
 * wardrobe never stops looks, chat, and Honey from being saved.
 */
export function snapshotFallbacks(next: AppSnapshot): AppSnapshot[] {
  const base = { ...next, messages: next.messages.slice(-MAX_MESSAGES) };
  return [
    base,
    { ...base, wardrobe: base.wardrobe.slice(0, 20), tryOnCache: {} },
    { ...base, wardrobe: base.wardrobe.map((w) => ({ ...w, photo: "" })), tryOnCache: {} },
    {
      ...base,
      wardrobe: base.wardrobe.map((w) => ({ ...w, photo: "" })),
      tryOnCache: {},
      looks: base.looks.map((l) =>
        l.tryOnUrl?.startsWith("data:") ? { ...l, tryOnUrl: null, tryOnKey: null } : l,
      ),
      messages: base.messages.slice(-30),
    },
  ];
}

export function saveSnapshot(next: AppSnapshot): boolean {
  if (typeof window === "undefined") return false;
  const lastActiveAt = new Date().toISOString();
  for (const candidate of snapshotFallbacks(next)) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ ...candidate, lastActiveAt }));
      return true;
    } catch {
      /* quota: try a lighter copy */
    }
  }
  return false;
}

export function nid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function cacheKey(selfie: string, lookId: string): string {
  let h = 0;
  const sample = `${lookId}:${selfie.length}:${selfie.slice(18, 48)}:${selfie.slice(-24)}`;
  for (let i = 0; i < sample.length; i++) h = (h * 31 + sample.charCodeAt(i)) | 0;
  return `tryon_${lookId}_${h.toString(36)}`;
}
