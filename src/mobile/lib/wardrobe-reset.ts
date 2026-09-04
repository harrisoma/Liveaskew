import type { OnboardingAnswers } from "./recommend";
import type { WardrobeVerdict } from "./storage";

export function wardrobeVerdict(
  label: string,
  profile: OnboardingAnswers,
): { verdict: WardrobeVerdict; reason: string } {
  const t = label.toLowerCase();
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

export function guessLabel(index: number): string {
  const labels = [
    "Ivory silk shirt",
    "Stiff logo tee",
    "Navy wool trouser",
    "Oversized hoodie",
    "Linen wrap",
    "Tight stretch jean",
    "Charcoal knit",
    "Polyester shine blouse",
  ];
  return labels[index % labels.length] ?? `Piece ${index + 1}`;
}
