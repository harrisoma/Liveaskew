import type { OnboardingAnswers } from "./recommend";
import type { WardrobeVerdict } from "./storage";
import { apiUrl } from "./api";

export type WardrobeAnalyzeOk = {
  label: string;
  type: string;
  fabric: string;
  fit: string;
  notes: string;
  verdict: WardrobeVerdict;
  reason: string;
};

export type WardrobeAnalyzeResult = WardrobeAnalyzeOk | { error: string };

export async function analyzeWardrobePhoto(opts: {
  photo: string;
  profile: OnboardingAnswers;
}): Promise<WardrobeAnalyzeResult> {
  try {
    const res = await fetch(apiUrl("/api/wardrobe/analyze"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photoDataUrl: opts.photo,
        profile: {
          goal: opts.profile.goal,
          fit: opts.profile.fit,
          budget: opts.profile.budget,
        },
      }),
    });
    const json = (await res.json().catch(() => ({}))) as WardrobeAnalyzeOk & { error?: string };
    if (!res.ok || json.error || !json.label || !json.verdict || !json.reason) {
      return {
        error:
          json.error === "vision_unavailable"
            ? "I couldn't see the cloth clearly. Try another photo in better light."
            : (json.error ?? "I couldn't see the cloth clearly. Try another photo in better light."),
      };
    }
    return {
      label: json.label,
      type: json.type ?? "",
      fabric: json.fabric ?? "",
      fit: json.fit ?? "",
      notes: json.notes ?? "",
      verdict: json.verdict,
      reason: json.reason,
    };
  } catch {
    return { error: "I couldn't see the cloth clearly. Try another photo in better light." };
  }
}
