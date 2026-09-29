import type { HoneyNetwork } from "../honey";

export type NetworkId = "instagram" | "facebook" | "linkedin" | "x" | "threads";

export type NetworkSpec = {
  id: NetworkId;
  label: HoneyNetwork;
  /** Longest caption the network accepts. */
  maxChars: number;
  requiresImage: boolean;
};

export const NETWORKS: NetworkSpec[] = [
  { id: "instagram", label: "Instagram", maxChars: 2200, requiresImage: true },
  { id: "facebook", label: "Facebook", maxChars: 5000, requiresImage: false },
  { id: "linkedin", label: "LinkedIn", maxChars: 3000, requiresImage: false },
  { id: "x", label: "X", maxChars: 280, requiresImage: false },
  { id: "threads", label: "Threads", maxChars: 500, requiresImage: false },
];

export function networkById(id: string | null | undefined): NetworkSpec | null {
  return NETWORKS.find((n) => n.id === id) ?? null;
}

export function networkByLabel(label: string | null | undefined): NetworkSpec | null {
  return NETWORKS.find((n) => n.label === label) ?? null;
}

/** Why a post cannot go out as written, or null when it can. */
export function postProblem(
  network: NetworkSpec,
  caption: string,
  mediaUrl: string | null | undefined,
): string | null {
  const text = caption.trim();
  if (!text && !mediaUrl) return "Write a caption first.";
  if ([...text].length > network.maxChars) {
    return `${network.label} allows ${network.maxChars} characters — this is ${[...text].length}.`;
  }
  if (network.requiresImage && !mediaUrl) return `${network.label} needs a photo with the post.`;
  return null;
}

/** Local date + time on this device → the exact instant to publish. */
export function scheduledInstant(date: string, time: string): string | null {
  const when = new Date(`${date}T${time || "09:00"}:00`);
  return Number.isNaN(when.getTime()) ? null : when.toISOString();
}

export type ConnectionSummary = {
  network: NetworkId;
  accountName: string;
  expiresAt: string | null;
};
