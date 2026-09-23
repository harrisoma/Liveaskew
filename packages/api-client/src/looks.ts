import { PLATFORMS, suggestHashtags, type Platform } from "./hashtags";

export type LookTransfer = {
  lookId: string;
  userId: string;
  imageUrl: string;
  caption: string;
  platforms: Platform[];
  source: "bee";
};

export type LookRecord = LookTransfer & {
  id: string;
  status: "queued" | "scheduled" | "posted";
  scheduledFor: string | null;
  createdAt: string;
  hashtags: string[];
  description: string | null;
};

type Store = { looks: LookRecord[] };

const globalStore = globalThis as typeof globalThis & { __liveaskewLooks?: Store };

function store(): Store {
  if (!globalStore.__liveaskewLooks) globalStore.__liveaskewLooks = { looks: [] };
  return globalStore.__liveaskewLooks;
}

export function clearLooks() {
  store().looks = [];
}

export function parseLookTransfer(body: unknown): LookTransfer | { error: string } {
  if (!body || typeof body !== "object") return { error: "Send a look from Bee." };
  const value = body as Record<string, unknown>;
  const platforms = Array.isArray(value.platforms)
    ? value.platforms.filter((item): item is Platform => PLATFORMS.includes(item as Platform))
    : [];
  if (value.source !== "bee") return { error: "Looks transfer only from Bee." };
  if (typeof value.lookId !== "string" || value.lookId.trim() === "") {
    return { error: "A look id is required." };
  }
  if (typeof value.userId !== "string" || value.userId.trim() === "") {
    return { error: "A member id is required." };
  }
  if (typeof value.imageUrl !== "string" || value.imageUrl.trim() === "") {
    return { error: "An image is required." };
  }
  if (typeof value.caption !== "string" || value.caption.trim() === "") {
    return { error: "Tell Buzz what this look is." };
  }
  if (platforms.length === 0) return { error: "Pick at least one platform." };
  return {
    lookId: value.lookId.trim(),
    userId: value.userId.trim(),
    imageUrl: value.imageUrl.trim(),
    caption: value.caption.trim(),
    platforms,
    source: "bee",
  };
}

export function getLookStore() {
  return {
    list() {
      return [...store().looks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    transfer(input: LookTransfer, description: string | null = null): LookRecord {
      const record: LookRecord = {
        ...input,
        id: crypto.randomUUID(),
        status: "queued",
        scheduledFor: null,
        createdAt: new Date().toISOString(),
        hashtags: suggestHashtags(input.caption),
        description,
      };
      store().looks.push(record);
      return record;
    },
    schedule(id: string, scheduledFor: string) {
      const look = store().looks.find((item) => item.id === id);
      if (!look) return null;
      look.scheduledFor = scheduledFor;
      look.status = "scheduled";
      return look;
    },
    markPosted(id: string) {
      const look = store().looks.find((item) => item.id === id);
      if (!look) return null;
      look.status = "posted";
      return look;
    },
  };
}

export async function transferLook(buzzBaseUrl: string, look: LookTransfer, token?: string) {
  const response = await fetch(new URL("/api/looks/transfer", buzzBaseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(look),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(payload.error || `Transfer failed (${response.status})`);
  return payload;
}
