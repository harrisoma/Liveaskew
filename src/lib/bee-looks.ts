import { z } from "zod";

/** Shape the Style Guide renders. Shared by the looks API and the app. */
export const lookSchema = z.object({
  title: z.string().trim().min(2).max(60),
  occasion: z.string().trim().min(2).max(40),
  formula: z.array(z.string().trim().min(2).max(80)).min(3).max(6),
  fit: z.string().trim().min(4).max(240),
  feel: z.string().trim().min(4).max(240),
  fabric: z.string().trim().min(4).max(240),
  palette: z
    .array(z.string().regex(/^#[0-9a-fA-F]{6}$/))
    .min(2)
    .max(4),
});

export type GeneratedLook = z.infer<typeof lookSchema>;

/** Pull the first JSON array/object out of a model reply and keep only valid looks. */
export function parseLooks(text: string, max: number): GeneratedLook[] {
  const start = text.search(/[[{]/);
  if (start < 0) return [];
  const end = Math.max(text.lastIndexOf("]"), text.lastIndexOf("}"));
  if (end <= start) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { looks?: unknown }).looks)
      ? (raw as { looks: unknown[] }).looks
      : [];
  const looks: GeneratedLook[] = [];
  for (const item of list) {
    const parsed = lookSchema.safeParse(item);
    if (parsed.success) looks.push(parsed.data);
    if (looks.length >= max) break;
  }
  return looks;
}
