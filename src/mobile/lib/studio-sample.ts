import type { StyleBlueprint } from "@/lib/style-blueprint";
const pieces = [
  ["top", "Ivory cotton shirt", "Ivory", "#e9e0ce"],
  ["top", "Navy linen shell", "Navy", "#243747"],
  ["top", "Soft blue cotton tee", "Blue", "#a5bdc8"],
  ["bottom", "Navy straight-leg trousers", "Navy", "#243747"],
  ["bottom", "Sand linen trousers", "Sand", "#c7b69d"],
  ["bottom", "Indigo relaxed jeans", "Indigo", "#435867"],
  ["dress", "Olive cotton midi dress", "Olive", "#737b61"],
  ["layer", "Sand unstructured jacket", "Sand", "#c7b69d"],
  ["shoe", "Chocolate leather loafers", "Chocolate", "#654b3d"],
  ["shoe", "Ivory everyday sneakers", "Ivory", "#e9e0ce"],
  ["accessory", "Chocolate crossbody bag", "Chocolate", "#654b3d"],
  ["accessory", "Small gold hoops", "Gold", "#b4995b"],
] as const;
export const studioSample: StyleBlueprint = {
  title: "Ease, with intention.",
  archetype: "Relaxed modern classics",
  intro:
    "A sample blueprint for a warm-weather week: composed at work, comfortable at the weekend, and unmistakably your own.",
  intent: [
    "Build around breathable layers and room to move.",
    "Repeat favorite pieces with considered shoes and accessories.",
  ],
  palette: {
    basis:
      "An illustrative palette based on stated preferences. This is not a verified seasonal color analysis.",
    neutrals: [
      { name: "Ink navy", hex: "#243747" },
      { name: "Soft ivory", hex: "#e9e0ce" },
      { name: "Warm sand", hex: "#c7b69d" },
    ],
    accents: [
      { name: "Quiet olive", hex: "#737b61" },
      { name: "Washed blue", hex: "#a5bdc8" },
    ],
    consider: [
      "Pair navy with ivory for a clear, composed contrast.",
      "Test olive and blue near your face in daylight; keep what feels right to you.",
    ],
  },
  silhouette: {
    basis:
      "This sample favors ease and a relaxed waist. Measurements and body proportions have not been assessed.",
    cuts: [
      "Try a straight leg with enough room to sit comfortably.",
      "Balance an untucked shirt with a clean shoulder and an open neckline.",
      "Choose a midi hem that allows an easy stride.",
    ],
    fabrics: [
      "Look for breathable cotton or linen; read the care label.",
      "Try softer jackets that move with your shoulders.",
    ],
    tailoring: [
      "Check trouser length with the shoes you will actually wear.",
      "Ask a tailor about sleeve length before replacing a favorite jacket.",
    ],
  },
  capsule: pieces.map(([role, name, color, hex]) => ({
    role,
    name,
    color,
    hex,
    reason:
      role === "shoe"
        ? "A comfortable foundation that works across the capsule."
        : role === "accessory"
          ? "A useful finishing detail to repeat through the week."
          : "A versatile piece to combine with the capsule palette.",
  })),
  gaps: [
    {
      item: "Comfortable navy straight-leg trousers",
      why: "Only if a similar comfortable pair is missing from your closet.",
      priority: "first",
    },
    {
      item: "Chocolate crossbody bag",
      why: "Consider later if your current bag does not serve your daily routine.",
      priority: "later",
    },
  ],
  finishing: {
    foundations: [
      "Choose comfortable underwear that sits smoothly beneath your clothes.",
      "Check opacity in daylight; an extra layer is optional.",
    ],
    shoes: [
      "Repeat loafers for office days and sneakers for longer walks.",
      "Check toe room and heel comfort before keeping a new pair.",
    ],
    accessories: [
      "Let a small pair of hoops finish a simple neckline.",
      "Keep your everyday bag practical for what you carry.",
    ],
    grooming: [
      "Air or steam pieces according to their care labels.",
      "Keep shoes clean and repair a loose button before your week begins.",
    ],
    shoppingChecklist: [
      "Check your closet before adding a duplicate.",
      "Stay within your own stated budget.",
      "Try each new item with at least three pieces you already own.",
    ],
  },
};
