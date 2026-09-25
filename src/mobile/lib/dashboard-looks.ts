import { BEE_LOOKS } from "@/lib/house";
import { recommendLook } from "./recommend";
import type { GuideLook } from "./storage";

export function serialNumber(index: number) {
  return String(index + 1).padStart(3, "0");
}

export function starterLooks(): GuideLook[] {
  const now = new Date().toISOString();
  return BEE_LOOKS.map((look) => ({
    id: look.id,
    title: look.title,
    occasion: "Week",
    formula: look.pieces.split(",").map((piece) => piece.trim()),
    fit: "Cut for the body in the selfie",
    feel: "Ready to wear",
    fabric: look.pieces,
    palette: ["#4a1c24", "#cfcfcf", "#b8860b"],
    saved: false,
    createdAt: now,
    garmentNote: look.pieces,
    tryOnUrl: null,
    tryOnKey: null,
  }));
}

export function anotherLook(existingTitles: string[]): GuideLook | null {
  const options = [
    recommendLook({ goal: "work", fit: "structured", budget: "elevated" }),
    recommendLook({ goal: "weekend", fit: "relaxed", budget: "mid" }),
    recommendLook({ goal: "event", fit: "defined", budget: "invest" }),
    recommendLook({ goal: "everyday", fit: "soft", budget: "value" }),
  ];
  const fresh = options.find((look) => !existingTitles.includes(look.title));
  if (!fresh) return null;
  return {
    ...fresh,
    saved: false,
    createdAt: new Date().toISOString(),
    garmentNote: fresh.formula[0] ?? fresh.title,
    tryOnUrl: null,
    tryOnKey: null,
  };
}
