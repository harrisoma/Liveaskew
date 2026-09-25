import { BUZZ_PLATFORMS, buzzMessage, type BuzzPlatformId } from "@/lib/buzz";
import { loadHoney, postHasHit, saveHoney, type HoneyItem } from "@/lib/honey";

export const BEE_LOOKS = [
  {
    id: "boardroom",
    title: "The boardroom look",
    pieces: "Burgundy sweater, grey trousers, gold mules",
  },
  {
    id: "evening",
    title: "Evening line",
    pieces: "Camel turtleneck, black satin skirt, gold pointed mules",
  },
] as const;

export type BeeLookId = (typeof BEE_LOOKS)[number]["id"];

export type ConnectedAccount = {
  platform: BuzzPlatformId;
  handle: string;
};

const ACCOUNTS_KEY = "la_buzz_accounts_v1";
const AUTO_KEY = "la_buzz_autonomous_v1";

export function loadAccounts(): ConnectedAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(ACCOUNTS_KEY) ?? "[]",
    ) as ConnectedAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: ConnectedAccount[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function attachAccount(account: ConnectedAccount) {
  const handle = account.handle.trim();
  if (!handle) return loadAccounts();
  const next = [
    ...loadAccounts().filter((item) => item.platform !== account.platform),
    { platform: account.platform, handle },
  ];
  saveAccounts(next);
  return next;
}

export function detachAccount(platform: BuzzPlatformId) {
  const next = loadAccounts().filter((item) => item.platform !== platform);
  saveAccounts(next);
  return next;
}

export function loadAutonomous(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(AUTO_KEY) === "on";
}

export function saveAutonomous(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTO_KEY, on ? "on" : "off");
}

export function writeBeeCaptions(pieces: string, platforms: BuzzPlatformId[], pass = 0) {
  return platforms.map((platform) => ({
    platform,
    caption: buzzMessage(pieces, pass, platform),
  }));
}

export type HiveComment = {
  id: string;
  roomId: string;
  author: string;
  text: string;
  lookId: string | null;
  parentId: string | null;
};

export type HouseAlert = {
  id: string;
  text: string;
  read: boolean;
};

const NOTES_KEY = "la_hive_room_v1";
const ALERTS_KEY = "la_hive_alerts_v1";

export function loadComments(): HiveComment[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(NOTES_KEY) ?? "[]") as HiveComment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveComments(comments: HiveComment[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTES_KEY, JSON.stringify(comments));
}

export function loadAlerts(): HouseAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ALERTS_KEY) ?? "[]") as HouseAlert[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAlerts(alerts: HouseAlert[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

export function addComment(input: Omit<HiveComment, "id">) {
  const comment: HiveComment = { ...input, id: `c_${Date.now().toString(36)}` };
  saveComments([...loadComments(), comment]);
  if (input.parentId) {
    const alerts = loadAlerts();
    saveAlerts([
      { id: `a_${comment.id}`, text: `${input.author} replied in the Hive.`, read: false },
      ...alerts,
    ]);
  }
  return comment;
}

export function scheduleLookOnHoney(input: {
  lookId: BeeLookId;
  platforms: BuzzPlatformId[];
  date: string;
  time: string;
  captions?: Partial<Record<BuzzPlatformId, string>>;
}): HoneyItem[] {
  const look = BEE_LOOKS.find((item) => item.id === input.lookId) ?? BEE_LOOKS[0];
  const existing = loadHoney(input.date);
  const posts: HoneyItem[] = input.platforms.map((platform) => {
    const name = BUZZ_PLATFORMS.find((item) => item.id === platform)?.name ?? platform;
    return {
      id: `post_${look.id}_${platform}_${input.date}_${input.time}`,
      title: look.title,
      date: input.date,
      time: input.time,
      kind: "post",
      network: name,
      lookId: look.id,
      caption: input.captions?.[platform] ?? buzzMessage(look.pieces, 0, platform),
      posted: false,
    };
  });
  const ids = new Set(posts.map((post) => post.id));
  saveHoney([...existing.filter((item) => !ids.has(item.id)), ...posts]);
  const names = posts
    .map((post) => post.network)
    .filter(Boolean)
    .join(", ");
  addComment({
    roomId: "style",
    author: "Buzz",
    text: `${look.title} is scheduled: ${names} at ${input.time}. ${look.pieces}`,
    lookId: look.id,
    parentId: null,
  });
  const alerts = loadAlerts();
  saveAlerts([
    {
      id: `a_sched_${look.id}_${input.date}`,
      text: `${look.title} is on Honey for ${names}.`,
      read: false,
    },
    ...alerts,
  ]);
  return posts;
}

export function runAutonomousPosts(now: Date): string[] {
  if (!loadAutonomous()) return [];
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  const stamp = `${now.getFullYear()}-${month}-${day}`;
  const items = loadHoney(stamp);
  const posted: string[] = [];
  const next = items.map((item) => {
    if (item.kind === "post" && !item.posted && postHasHit(item, now)) {
      posted.push(item.network ?? item.title);
      return { ...item, posted: true };
    }
    return item;
  });
  if (posted.length === 0) return [];
  saveHoney(next);
  saveAlerts([
    {
      id: `a_auto_${now.getTime()}`,
      text: `Autonomous posting sent ${posted.join(", ")}.`,
      read: false,
    },
    ...loadAlerts(),
  ]);
  return posted;
}
