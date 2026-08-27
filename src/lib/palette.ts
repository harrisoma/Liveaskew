// Normalize the client's Bee-derived color palette into safe CSS accents.
// The dashboard treats these as ACCENTS only — never repaint whole surfaces.

const NAMED: Record<string, string> = {
  black: "#111111",
  white: "#ffffff",
  cream: "#f5f1ea",
  bone: "#efe8dc",
  ivory: "#f4efe4",
  camel: "#b8895a",
  tan: "#c9a27a",
  taupe: "#8a7a68",
  navy: "#1b2a41",
  teal: "#11525c",
  sage: "#8aa08a",
  olive: "#6b6b3a",
  rust: "#a5533b",
  terracotta: "#c17457",
  burgundy: "#5c1f26",
  wine: "#5c1f26",
  mauve: "#a07683",
  blush: "#e3b7ae",
  gold: "#b08d3a",
  bronze: "#8a6d3b",
  charcoal: "#2b2b2b",
  ink: "#111111",
  ecru: "#e6ddc9",
  stone: "#a89f92",
};

function normHex(s: string): string | null {
  const raw = s.trim().toLowerCase();
  const hex = raw.startsWith("#") ? raw.slice(1) : raw;
  if (/^[0-9a-f]{6}$/.test(hex)) return `#${hex}`;
  if (/^[0-9a-f]{3}$/.test(hex)) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }
  return null;
}

function coerce(entry: unknown): string | null {
  if (!entry) return null;
  if (typeof entry === "string") {
    const h = normHex(entry);
    if (h) return h;
    const named = NAMED[entry.trim().toLowerCase()];
    return named ?? null;
  }
  if (typeof entry === "object") {
    const obj = entry as Record<string, unknown>;
    const hex = obj.hex;
    if (typeof hex === "string") {
      const h = normHex(hex);
      if (h) return h;
    }
    const name = obj.name;
    if (typeof name === "string") {
      const named = NAMED[name.trim().toLowerCase()];
      if (named) return named;
    }
  }
  return null;
}

export type PaletteAccents = {
  primary: string;
  soft: string;
  secondary: string;
  swatches: string[];
};

/**
 * Parse styleProfile.color_palette into usable accents. Returns null if the
 * palette is missing or contains no parseable colors.
 */
export function parsePalette(raw: unknown): PaletteAccents | null {
  if (!Array.isArray(raw)) return null;
  const parsed: string[] = [];
  for (const entry of raw) {
    const c = coerce(entry);
    if (c && !parsed.includes(c)) parsed.push(c);
  }
  if (parsed.length === 0) return null;

  // Prefer entries tagged accent/anchor for the hero color, if present.
  let primary: string | undefined;
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (entry && typeof entry === "object") {
        const role = (entry as Record<string, unknown>).role;
        if (role === "accent" || role === "anchor") {
          const c = coerce(entry);
          if (c) {
            primary = c;
            break;
          }
        }
      }
    }
  }
  primary = primary ?? parsed[0];
  const secondary = parsed.find((c) => c !== primary) ?? primary;
  // Softened version of primary for hairlines / subtle fills.
  const soft = `color-mix(in oklab, ${primary} 35%, transparent)`;

  return { primary, soft, secondary, swatches: parsed.slice(0, 6) };
}
