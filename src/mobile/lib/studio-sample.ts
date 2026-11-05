import type { StyleBlueprint } from "@/lib/style-blueprint";
const pieces = [
  ["top", "Ivory linen shirt", "Ivory", "#e9e0ce"],
  ["top", "Navy linen shell", "Navy", "#243747"],
  ["top", "Soft blue cotton tee", "Blue", "#a5bdc8"],
  ["bottom", "Navy fluid midi skirt", "Navy", "#243747"],
  ["dress", "Blue cotton midi shirtdress", "Blue", "#a5bdc8"],
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
      (
        {
          "Ivory linen shirt":
            "Roll the sleeves for a warm commute; tuck loosely into the navy skirt for a meeting.",
          "Navy linen shell":
            "A sleeveless alternative to the shirt when the afternoon gets warmer.",
          "Soft blue cotton tee":
            "An easy, washable top for errands with your existing jeans or the midi skirt.",
          "Navy fluid midi skirt":
            "Brings movement to the meeting look without the structure of tailored trousers.",
          "Blue cotton midi shirtdress":
            "One-piece dressing for a busy morning; the tie waist lets you adjust the fit.",
          "Indigo relaxed jeans":
            "A familiar repeat piece for cooler evenings; use a pair you already enjoy wearing.",
          "Olive cotton midi dress":
            "A second dress for easy afternoons, with room through the skirt and a different neckline.",
          "Sand unstructured jacket":
            "An optional light layer for air-conditioned rooms; leave it off outdoors.",
          "Chocolate leather loafers":
            "Give the shirt-and-skirt look a composed finish without relying on a heel.",
          "Ivory everyday sneakers": "Repeat with both dresses for days that involve more walking.",
          "Chocolate crossbody bag":
            "Keeps the sample errand-day look hands-free and ties in with the brown shoes.",
          "Small gold hoops":
            "A small finishing detail for the linen shirt, without adding another layer in the heat.",
        } as Record<string, string>
      )[name] ?? "Try this piece with the looks above and keep what feels comfortable.",
  })),
  gaps: [
    {
      item: "A fluid navy midi skirt",
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

export const sampleGuideLooks: import("./storage").GuideLook[] = [
  {
    title: "One dress. Your whole morning.",
    occasion: "Errands & coffee",
    formula: ["Blue cotton midi shirtdress", "Ivory sneakers", "Chocolate crossbody bag"],
    fit: "A relaxed skirt gives you room to walk and sit; the tie waist adjusts without a rigid waistband.",
    feel: "For a sample morning of errands and coffee: one easy outfit, hands free, comfortable on foot.",
    fabric:
      "Suggested cotton keeps the outfit light. Check the actual garment’s care label before buying.",
  },
  {
    title: "A softer take on put-together.",
    occasion: "Meetings & lunch",
    formula: [
      "Ivory linen shirt",
      "Navy fluid midi skirt",
      "Chocolate loafers",
      "Small gold hoops",
    ],
    fit: "A loosely tucked shirt and fluid skirt create definition without a close fit through the hips.",
    feel: "For a sample meeting-to-lunch day: polished enough to arrive confidently, relaxed enough to stay comfortable.",
    fabric:
      "Suggested linen and a fluid skirt bring movement to a warm day; exact fabric depends on the piece you choose.",
  },
  {
    title: "Room to move. Nothing to fuss with.",
    occasion: "An easy afternoon",
    formula: ["Olive cotton midi dress", "Ivory sneakers", "Chocolate crossbody bag"],
    fit: "A gathered midi skirt gives sitting and walking room. Check the armholes for your preferred coverage.",
    feel: "For a sample afternoon outside: an uncomplicated dress, walkable shoes, and a bag that leaves your hands free.",
    fabric:
      "Suggested breathable cotton suits warm weather. Test opacity in daylight and choose what feels comfortable.",
  },
].map((look, i) => ({
  ...look,
  id: `sample-look-${i + 1}`,
  guideDay: i + 1,
  palette: [],
  saved: false,
  createdAt: "2026-11-05T12:00:00Z",
  garmentNote: look.formula.join(", "),
  tryOnUrl: null,
  tryOnKey: null,
}));
