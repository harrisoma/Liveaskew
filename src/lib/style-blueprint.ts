import { z } from "zod";
const line = z.string().trim().min(2).max(300);
const lines = z.array(line).min(2).max(5);
const color = z.object({ name: line, hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) });
export const blueprintPreferences = z.object({
  aesthetic: z.string().max(500).default(""),
  presence: z.string().max(500).default(""),
  coloring: z.string().max(500).default(""),
  colors: z.string().max(500).default(""),
  proportions: z.string().max(500).default(""),
  measurements: z.string().max(500).default(""),
  occasions: z.string().max(500).default(""),
  budget: z.string().max(500).default(""),
});
export type BlueprintPreferences = z.infer<typeof blueprintPreferences>;
export const emptyBlueprintPreferences = (): BlueprintPreferences => blueprintPreferences.parse({});
export const capsulePiece = z.object({
  role: z.enum(["top", "bottom", "dress", "layer", "shoe", "accessory"]),
  name: line,
  color: line,
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  reason: line,
});
export const blueprintSchema = z.object({
  title: line,
  archetype: line,
  intro: line,
  intent: lines,
  palette: z.object({
    basis: line,
    neutrals: z.array(color).min(2).max(4),
    accents: z.array(color).min(2).max(4),
    consider: lines,
  }),
  silhouette: z.object({ basis: line, cuts: lines, fabrics: lines, tailoring: lines }),
  capsule: z.array(capsulePiece).length(12),
  gaps: z
    .array(z.object({ item: line, why: line, priority: z.enum(["first", "later"]) }))
    .min(2)
    .max(5),
  finishing: z.object({
    foundations: lines,
    shoes: lines,
    accessories: lines,
    grooming: lines,
    shoppingChecklist: lines,
  }),
});
export type StyleBlueprint = z.infer<typeof blueprintSchema>;
export type CapsulePiece = z.infer<typeof capsulePiece>;
export function parseBlueprint(text: string): StyleBlueprint {
  const start = text.indexOf("{"),
    end = text.lastIndexOf("}");
  const document = blueprintSchema.parse(JSON.parse(text.slice(start, end + 1)));
  const counts = (role: CapsulePiece["role"]) =>
    document.capsule.filter((p) => p.role === role).length;
  if (
    counts("top") !== 3 ||
    counts("bottom") !== 3 ||
    counts("dress") !== 1 ||
    counts("layer") !== 1 ||
    counts("shoe") !== 2 ||
    counts("accessory") !== 2
  )
    throw Error("incomplete_capsule");
  return document;
}
export function capsuleFormulas(capsule: CapsulePiece[]) {
  const by = (role: CapsulePiece["role"]) =>
    capsule.map((p, index) => ({ ...p, id: `piece-${index + 1}` })).filter((p) => p.role === role);
  const accessories = by("accessory"),
    layer = by("layer")[0];
  const formulas: {
    id: string;
    pieces: { id: string; name: string; color: string; hex: string }[];
  }[] = [];
  for (const top of by("top"))
    for (const bottom of by("bottom"))
      for (const shoe of by("shoe"))
        formulas.push({
          id: `formula-${formulas.length + 1}`,
          pieces: [top, bottom, shoe, accessories[formulas.length % 2]].filter(Boolean),
        });
  for (const dress of by("dress"))
    for (const shoe of by("shoe"))
      formulas.push({
        id: `formula-${formulas.length + 1}`,
        pieces: [dress, shoe, layer, accessories[formulas.length % 2]].filter(Boolean),
      });
  return formulas;
}
export function retailerSearch(item: string) {
  return `https://www.nordstrom.com/sr?keyword=${encodeURIComponent(item.slice(0, 150))}`;
}
