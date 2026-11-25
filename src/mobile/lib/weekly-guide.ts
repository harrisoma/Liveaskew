import type { OutfitVisualReview } from "@/lib/style-guide-visual-review";
import { apiFetch } from "./api";
import type { GuideLook } from "./storage";
export type WeeklyGuideStatus = {
  id: string;
  status: string;
  completed: number;
  reviewed?: number;
  reviews?: Record<string, OutfitVisualReview>;
  total: number;
  images: Record<string, string>;
  keys: Record<string, string>;
  lookIds: string[];
  error: string | null;
};
export async function queueWeeklyGuide(
  looks: GuideLook[],
  photo: string,
  options: { reviewOnly?: boolean } = {},
) {
  const response = await apiFetch("/api/guide", {
    method: "POST",
    body: JSON.stringify({
      lookIds: [...looks].sort((a, b) => a.guideDay! - b.guideDay!).map((l) => l.id),
      selfieDataUrl: photo,
      ...(options.reviewOnly ? { reviewOnly: true } : {}),
    }),
  });
  if (!response.ok)
    throw Error(
      "Your guide is saved, but automatic previews could not be queued. Bee will reconnect automatically.",
    );
  return response.json();
}
export async function readWeeklyGuide(): Promise<WeeklyGuideStatus | null> {
  const response = await apiFetch("/api/guide", { cache: "no-store" });
  if (!response.ok) throw Error("guide_status_unavailable");
  return (await response.json()).guide ?? null;
}
