import { z } from "zod";
const size = z.string().trim().max(30).default("");
export const shoppingProfileSchema = z.object({
  department: z.enum(["women", "men", "unisex"]).default("women"),
  currency: z.enum(["USD", "CAD", "GBP", "EUR", "AUD"]).default("USD"),
  topSize: size,
  bottomSize: size,
  dressSize: size,
  shoeSize: size,
  shoeSystem: z.enum(["US-women", "US-men", "UK", "EU"]).default("US-women"),
  clothingMax: z.number().min(0).max(10000).default(0),
  shoeMax: z.number().min(0).max(10000).default(0),
  accessoryMax: z.number().min(0).max(10000).default(0),
  totalMax: z.number().min(0).max(100000).default(0),
});
export type ShoppingProfile = z.infer<typeof shoppingProfileSchema>;
export function readShoppingProfile(interview: Record<string, unknown>): ShoppingProfile | null {
  try {
    const raw = interview.shopping;
    if (typeof raw !== "string") return null;
    return shoppingProfileSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}
export function preferencesFromInterview(interview: Record<string, unknown>) {
  const text = (key: string) =>
    typeof interview[key] === "string" ? interview[key].slice(0, 500) : "";
  return {
    aesthetic: text("aesthetic"),
    presence: text("feel"),
    coloring: text("coloring"),
    colors: text("colors"),
    proportions: text("fit"),
    measurements: text("sizes"),
    occasions: text("life"),
    budget: readShoppingProfile(interview)
      ? JSON.stringify(readShoppingProfile(interview)).slice(0, 500)
      : text("budget"),
  };
}
export function normalizeSize(value: string) {
  const s = value
    .toLowerCase()
    .trim()
    .replace(/^(us|uk|eu)\s*/, "")
    .replace(/\s+/g, "");
  const aliases: Record<string, string> = {
    extrasmall: "xs",
    small: "s",
    medium: "m",
    large: "l",
    extralarge: "xl",
    xxlarge: "xxl",
    "2xl": "xxl",
    onesize: "one",
    "o/s": "one",
    os: "one",
    defaulttitle: "one",
  };
  return aliases[s] ?? s;
}
export type LiveProduct = {
  pieceId: string;
  retailer: string;
  title: string;
  color: string | null;
  size: string;
  price: number;
  currency: string;
  url: string;
  image: string | null;
  variantId: string;
  checkedAt: string;
};
export type ProductMatches = {
  items: LiveProduct[];
  checkedAt: string;
  total: number;
  currency: string;
  notice: string;
};
