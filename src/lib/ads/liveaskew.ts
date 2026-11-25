/** Shared creative contract for previews and future Signal render adapters. */
export const LIVEASKEW_AD_BRAND = {
  version: "liveaskew-editorial-ads-v1",
  colors: { black: "#0D0D0D", ivory: "#FAFAFA", gold: "#D4AF37", silver: "#C0C0C0" },
  displayFont: "LiveAskew Ad Bodoni",
  bodyFont: "Arial, sans-serif",
  fps: 30,
  durationSeconds: 15,
  width: 1080,
  height: 1920,
  // Conservative design margins, not a guarantee of every platform's overlay placement.
  safeArea: { top: 240, right: 90, bottom: 360, left: 90 },
} as const;
export const LIVEASKEW_AD_FORMATS = [
  {
    id: "lookbook",
    name: "Kinetic lookbook",
    hook: "Style that moves with you.",
    detail: "Discover your personal style with Bee.",
    cta: "Explore your style",
    shots: [0, 3, 6],
  },
  {
    id: "variations",
    name: "One piece, three moods",
    hook: "One wardrobe. More possibilities.",
    detail: "See how complete looks come together.",
    cta: "Build your Style Guide",
    shots: [1, 4, 7],
  },
  {
    id: "guide",
    name: "Personal guide reveal",
    hook: "Eight looks. Entirely your own.",
    detail: "Your interview. Your preferences. Your personal guide.",
    cta: "Meet Bee",
    shots: [2, 5, 0],
  },
  {
    id: "occasion",
    name: "Occasion edit",
    hook: "Dress for the day you actually have.",
    detail: "From everyday plans to a different kind of evening.",
    cta: "Find your next look",
    shots: [3, 6, 7],
  },
] as const;
export type AdFormat = (typeof LIVEASKEW_AD_FORMATS)[number];
/** Frame-derived state: no random values, wall-clock animations or infinite loops. */
export function adFrame(frame: number) {
  const last = LIVEASKEW_AD_BRAND.durationSeconds * LIVEASKEW_AD_BRAND.fps - 1;
  const f = Math.max(0, Math.min(last, Number.isFinite(frame) ? Math.floor(frame) : 0));
  const seconds = f / LIVEASKEW_AD_BRAND.fps;
  return {
    frame: f,
    seconds,
    phase: seconds < 3 ? "hook" : seconds < 11 ? "fashion" : "cta",
    shot: seconds < 6 ? 0 : seconds < 9 ? 1 : 2,
    scale: 1 + (f / last) * 0.035,
    reveal: Math.min(1, f / 15),
  } as const;
}
