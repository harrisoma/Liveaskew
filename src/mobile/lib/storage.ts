import type { LookCard, OnboardingAnswers } from "./recommend";

export type ChatMsg = { id: string; role: "user" | "assistant"; content: string };

export type AppSnapshot = {
  onboarding: OnboardingAnswers & { completed: boolean };
  messages: ChatMsg[];
  looks: Array<LookCard & { saved: boolean; createdAt: string }>;
  tier: string;
  notifications: { beeReady: boolean; tierUpgrade: boolean };
  accountEmail: string | null;
  ratingAsked: boolean;
  lastActiveAt: string;
};

const KEY = "la_mobile_v1";

export const emptySnapshot: AppSnapshot = {
  onboarding: { goal: null, fit: null, budget: null, completed: false },
  messages: [],
  looks: [],
  tier: "silver",
  notifications: { beeReady: true, tierUpgrade: true },
  accountEmail: null,
  ratingAsked: false,
  lastActiveAt: new Date().toISOString(),
};

export function loadSnapshot(): AppSnapshot {
  if (typeof window === "undefined") return { ...emptySnapshot };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...emptySnapshot };
    const parsed = JSON.parse(raw) as AppSnapshot;
    return {
      ...emptySnapshot,
      ...parsed,
      onboarding: { ...emptySnapshot.onboarding, ...parsed.onboarding },
    };
  } catch {
    return { ...emptySnapshot };
  }
}

export function saveSnapshot(next: AppSnapshot): void {
  if (typeof window === "undefined") return;
  const payload = { ...next, lastActiveAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* quota or private mode — session still works */
  }
}

export function nid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
