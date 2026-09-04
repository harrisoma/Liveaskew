import type { LookCard, OnboardingAnswers } from "./recommend";

export type AuthProvider = "google" | "apple";
export type WardrobeVerdict = "keep" | "toss" | "maybe";
export type Phase = "auth" | "verify" | "interview" | "selfie" | "app";

export type ChatMsg = { id: string; role: "user" | "assistant"; content: string };

export type WardrobeItem = {
  id: string;
  photo: string;
  label: string;
  verdict: WardrobeVerdict | null;
  reason: string | null;
};

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
  };
}

export function loadSnapshot(): AppSnapshot {
  if (typeof window === "undefined") return cloneEmpty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return cloneEmpty();
    const parsed = JSON.parse(raw) as Partial<AppSnapshot>;
    return {
      ...cloneEmpty(),
      ...parsed,
      interview: { ...emptySnapshot.interview, ...parsed.interview },
      onboarding: { ...emptySnapshot.onboarding, ...parsed.onboarding },
      notifications: { ...emptySnapshot.notifications, ...parsed.notifications },
      tryOnCache: parsed.tryOnCache ?? {},
      wardrobe: parsed.wardrobe ?? [],
      looks: parsed.looks ?? [],
    };
  } catch {
    return cloneEmpty();
  }
}

export function saveSnapshot(next: AppSnapshot): void {
  if (typeof window === "undefined") return;
  const payload = { ...next, lastActiveAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* quota or private mode */
  }
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
