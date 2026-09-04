import type { OnboardingAnswers } from "./recommend";
import type { WardrobeVerdict } from "./storage";

/** What vision actually saw in the uploaded photo — never a canned label. */
export type GarmentSight = {
  label: string;
  type: string;
  fabric: string;
  fit: string;
  notes: string;
};

export function sightHaystack(sight: GarmentSight): string {
  return [sight.label, sight.type, sight.fabric, sight.fit, sight.notes]
    .filter((part) => part.trim().length > 0)
    .join(" ")
    .toLowerCase();
}

export function parseGarmentSight(raw: unknown): GarmentSight | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const nested = o.sight && typeof o.sight === "object" ? (o.sight as Record<string, unknown>) : o;
  const label = str(nested.label) || str(nested.garment) || str(nested.name);
  if (!label) return null;
  return {
    label,
    type: str(nested.type) || str(nested.category),
    fabric: str(nested.fabric) || str(nested.cloth),
    fit: str(nested.fit) || str(nested.silhouette),
    notes: str(nested.notes) || str(nested.signals) || str(nested.detail),
  };
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function wardrobeVerdict(
  sight: GarmentSight,
  profile: OnboardingAnswers,
): { verdict: WardrobeVerdict; reason: string } {
  const t = sightHaystack(sight);
  const fit = profile.fit ?? "soft";

  if (t.includes("stretch") && t.includes("logo")) {
    return {
      verdict: "toss",
      reason: "The logo fights your line — Fit first, then the cloth, never the brand mark.",
    };
  }
  if (t.includes("stiff") || t.includes("scratch") || t.includes("polyester shine")) {
    return {
      verdict: "toss",
      reason: "Fabric that fights the skin will never serve Feel, no matter the cut.",
    };
  }
  if (fit === "structured" && (t.includes("slouch") || t.includes("oversized hoodie"))) {
    return {
      verdict: "maybe",
      reason:
        "Soft volume against a structured Fit — keep only if the shoulder still reads as yours.",
    };
  }
  if (fit === "relaxed" && (t.includes("tight") || t.includes("skinny"))) {
    return {
      verdict: "toss",
      reason: "It grips. Your Fit asked for room — this doesn't give it.",
    };
  }
  if (t.includes("silk") || t.includes("wool") || t.includes("linen") || t.includes("cotton")) {
    return {
      verdict: "keep",
      reason: "Honest cloth. It can carry Fit and Feel without rewriting your body.",
    };
  }
  if (t.includes("evening") || t.includes("wrap")) {
    return {
      verdict: "keep",
      reason: "A waist you control. That matches Fit you set yourself.",
    };
  }
  return {
    verdict: "maybe",
    reason:
      "Hold it against your Fit/Feel/Fabric — if the cloth is honest and the line is yours, keep.",
  };
}
