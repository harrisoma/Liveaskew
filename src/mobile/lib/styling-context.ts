import type { StylingContext } from "@/lib/bee-context";
import type { GuideLook, WardrobeItem } from "./storage";
export function buildStylingContext(wardrobe: WardrobeItem[], looks: GuideLook[]): StylingContext {
  return {
    wardrobe: wardrobe
      .filter((p) => p.verdict === "keep" && !p.error)
      .slice(0, 12)
      .map((p, i) => ({
        id: p.id.slice(0, 120),
        label: p.label.slice(0, 160),
        reason: (p.reason ?? "").slice(0, 600),
        ...(i < 3 &&
        p.photo.length <= 250000 &&
        /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.photo)
          ? { photo: p.photo }
          : {}),
      })),
    feedback: looks
      .filter((l) => l.feedback)
      .sort((a, b) => (b.feedback?.updatedAt ?? "").localeCompare(a.feedback?.updatedAt ?? ""))
      .slice(0, 12)
      .map((l) => ({
        title: l.title.slice(0, 160),
        formula: l.formula.slice(0, 8).map((p) => p.slice(0, 160)),
        choice: l.feedback!.choice,
        note: l.feedback!.note.slice(0, 300),
      })),
  };
}
