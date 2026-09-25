export type HoneyKind = "event" | "meeting" | "post";

export type HoneyItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  kind: HoneyKind;
  network: string | null;
  lookId?: string;
  caption?: string;
};

const NETWORK_ICON: Record<string, "instagram" | "tiktok" | "pinterest" | "facebook" | "linkedin"> =
  {
    Instagram: "instagram",
    TikTok: "tiktok",
    Pinterest: "pinterest",
    Facebook: "facebook",
    LinkedIn: "linkedin",
  };

export function honeyIcon(network: string | null) {
  if (!network) return null;
  return NETWORK_ICON[network] ?? null;
}

export const HONEY_KEY = "la_honey_v1";

export const HONEY_NETWORKS = ["Instagram", "TikTok", "Pinterest", "Facebook", "LinkedIn"] as const;

export function postHasHit(item: HoneyItem, now: Date): boolean {
  if (item.kind !== "post") return false;
  const when = new Date(`${item.date}T${item.time}:00`);
  return !Number.isNaN(when.getTime()) && when.getTime() <= now.getTime();
}

export function seedHoney(today: string): HoneyItem[] {
  return [
    {
      id: "seed-pickup",
      title: "School pickup",
      date: today,
      time: "15:00",
      kind: "event",
      network: null,
    },
    {
      id: "seed-meeting",
      title: "Stylist meeting",
      date: today,
      time: "11:00",
      kind: "meeting",
      network: null,
    },
    {
      id: "seed-post",
      title: "The boardroom look",
      date: today,
      time: "09:00",
      kind: "post",
      network: "Instagram",
    },
  ];
}

export function loadHoney(today: string): HoneyItem[] {
  if (typeof window === "undefined") return seedHoney(today);
  try {
    const raw = window.localStorage.getItem(HONEY_KEY);
    if (!raw) return seedHoney(today);
    const parsed = JSON.parse(raw) as HoneyItem[];
    return Array.isArray(parsed) ? parsed : seedHoney(today);
  } catch {
    return seedHoney(today);
  }
}

export function saveHoney(items: HoneyItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HONEY_KEY, JSON.stringify(items));
}
