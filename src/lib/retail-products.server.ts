import { z } from "zod";
import {
  normalizeSize,
  type ShoppingProfile,
  type LiveProduct,
  type ProductMatches,
} from "./shopping-profile";
import type { CapsulePiece } from "./style-blueprint";
// Only public, allowlisted retailer endpoints. No client URLs or account details leave this server.
export const RETAILERS = [
  { name: "tentree", origin: "https://www.tentree.com", kind: "clothing" },
  { name: "Kotn", origin: "https://shop.kotn.com", kind: "clothing" },
  { name: "Allbirds", origin: "https://www.allbirds.com", kind: "shoe" },
  { name: "Portland Leather", origin: "https://www.portlandleathergoods.com", kind: "accessory" },
] as const;
type Retailer = (typeof RETAILERS)[number];
const variantSchema = z.object({
  id: z.number().int().positive(),
  available: z.boolean(),
  price: z.number().int().nonnegative(),
  options: z.array(z.string()),
  featured_image: z.object({ src: z.string() }).nullish(),
});
const productSchema = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string().regex(/^[a-z0-9-]+$/),
  type: z.string().default(""),
  tags: z.array(z.string()).default([]),
  description: z.string().default(""),
  featured_image: z.string().nullish(),
  options: z.array(
    z.object({ name: z.string(), position: z.number(), values: z.array(z.string()).optional() }),
  ),
  variants: z.array(variantSchema),
});
export type RetailProduct = z.infer<typeof productSchema>;
const cache = new Map<string, { until: number; value: unknown }>();
async function json(url: string, cookie = "", ttl = 60_000): Promise<unknown> {
  const key = url + cookie;
  const cached = cache.get(key);
  if (cached && cached.until > Date.now()) return cached.value;
  const r = await fetch(url, {
    headers: { Accept: "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw Error(`retailer_http_${r.status}`);
  const length = Number(r.headers.get("content-length") || 0);
  if (length > 2_000_000) throw Error("retailer_response_too_large");
  const text = await r.text();
  if (text.length > 2_000_000) throw Error("retailer_response_too_large");
  const value = JSON.parse(text);
  if (cache.size > 180) cache.clear();
  cache.set(key, { until: Date.now() + ttl, value });
  return value;
}
const searchSchema = z.object({
  resources: z.object({
    results: z.object({
      products: z.array(z.object({ handle: z.string().optional(), url: z.string() })),
    }),
  }),
});
export function safeImage(raw: string | null | undefined): string | null {
  try {
    const u = new URL(raw?.startsWith("//") ? `https:${raw}` : raw || "");
    if (u.protocol !== "https:") return null;
    const h = u.hostname;
    if (
      !["shopify.com", "allbirds.com", "tentree.com", "kotn.com", "portlandleathergoods.com"].some(
        (d) => h === d || h.endsWith(`.${d}`),
      )
    )
      return null;
    return u.href;
  } catch {
    return null;
  }
}
function roleOf(p: RetailProduct): CapsulePiece["role"] | null {
  const t = [p.title, p.type, ...p.tags].join(" ").toLowerCase();
  if (/\b(baby|kid|kids|toddler|gift card|home|bedding)\b/.test(t)) return null;
  if (/\b(dress|dresses|jumpsuit)\b/.test(t)) return "dress";
  if (/\b(jacket|blazer|coat|cardigan|overshirt)\b/.test(t)) return "layer";
  if (/\b(pant|pants|trouser|trousers|jeans|skirt|shorts|jogger|joggers|leggings)\b/.test(t))
    return "bottom";
  if (/\b(shirt|t-shirt|tee|tank|blouse|top|sweater|sweatshirt|hoodie|crewneck)\b/.test(t))
    return "top";
  return null;
}
function isDepartment(p: RetailProduct, profile: ShoppingProfile) {
  const t = [p.title, p.type, ...p.tags].join(" ").toLowerCase();
  if (profile.department === "unisex") return /unisex|genderless/.test(t);
  if (profile.department === "women") return /\bwomen'?s?\b|female|unisex/.test(t);
  return /\bmen'?s?\b|male|unisex/.test(t) && !/\bwomen/.test(t);
}
export function eligibleVariant(
  p: RetailProduct,
  role: CapsulePiece["role"],
  profile: ShoppingProfile,
  retailer: Retailer,
  piece?: CapsulePiece,
) {
  const cap =
    role === "shoe"
      ? profile.shoeMax
      : role === "accessory"
        ? profile.accessoryMax
        : profile.clothingMax;
  if (!cap) return null;
  const sizeOption = p.options.find((o) => /size/i.test(o.name));
  const colorOption = p.options.find((o) => /colou?r/i.test(o.name));
  let requested =
    role === "shoe"
      ? profile.shoeSize
      : role === "bottom"
        ? profile.bottomSize
        : role === "dress"
          ? profile.dressSize
          : profile.topSize;
  if (role === "accessory") requested = profile.bagSize;
  if (role !== "accessory" && !requested) return null;
  if (role === "shoe") {
    if (
      retailer.name !== "Allbirds" ||
      profile.shoeSystem !== `US-${profile.department === "men" ? "men" : "women"}` ||
      profile.department === "unisex"
    )
      return null;
  }
  for (const v of p.variants) {
    if (!v.available || v.price <= 0 || v.price > Math.floor(cap * 100)) continue;
    if (sizeOption) {
      const size = v.options[sizeOption.position - 1] || "";
      if (
        (role !== "accessory" || (requested && !/^any$/i.test(requested))) &&
        normalizeSize(size) !== normalizeSize(requested)
      )
        continue;
    } else if (role !== "accessory") continue;
    const color = colorOption ? v.options[colorOption.position - 1] : null;
    if (piece && productScore(piece, p, color) < 0) continue;
    return {
      v,
      size: sizeOption ? v.options[sizeOption.position - 1] : "Not sized",
      color: colorOption ? v.options[colorOption.position - 1] : null,
    };
  }
  return null;
}
const colorFamily = (s: string) => {
  const t = s.toLowerCase();
  return [
    /black|onyx|\bink\b/,
    /navy|blue|indigo/,
    /white|ivory|cream|undyed|natural|ecru/,
    /brown|chocolate|cocoa|coffee|cognac/,
    /beige|tan|sand|camel|khaki|taupe/,
    /green|olive|moss|sage/,
    /grey|gray|charcoal|slate/,
    /red|burgundy|wine|rust/,
    /pink|rose/,
    /purple|plum/,
    /yellow|gold/,
  ].findIndex((re) => re.test(t));
};
export function productScore(piece: CapsulePiece, p: RetailProduct, color: string | null) {
  const wanted = colorFamily(piece.color);
  const got = colorFamily(color || p.title);
  if (wanted >= 0 && got !== wanted) return -1;
  const text = [p.title, p.type, ...p.tags, p.description.replace(/<[^>]*>/g, " ")]
    .join(" ")
    .toLowerCase();
  const direction = piece.name.toLowerCase();
  const subtypes = [
    [/loafers?/, /loafers?/],
    [/boots?/, /boots?/],
    [/sandals?/, /sandals?/],
    [/heels?/, /heels?/],
    [/sneakers?|trainers?|runners?/, /sneakers?|trainers?|runners?/],
    [/earrings?|hoops?/, /earrings?|hoops?/],
    [/necklace/, /necklace/],
    [/crossbody/, /crossbody|cross.body/],
    [/button.down|button.up/, /button.down|button.up/],
    [/wide.leg/, /wide.leg/],
    [/straight.leg/, /straight.leg/],
    [/midi/, /midi/],
    [/maxi/, /maxi/],
  ];
  if (subtypes.some(([wanted, actual]) => wanted.test(direction) && !actual.test(text))) return -1;
  const material =
    piece.name.toLowerCase().match(/\b(cotton|linen|silk|wool|denim|leather)\b/g) || [];
  if (material.some((m) => !text.includes(m))) return -1;
  const words = piece.name
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 3);
  return words.reduce((s, w) => s + (text.includes(w) ? 1 : 0), 0);
}
async function catalog(retailer: Retailer, profile: ShoppingProfile) {
  const currencyData = z
    .object({ currency: z.string() })
    .parse(await json(`${retailer.origin}/cart.js`, "", 120000));
  console.info("[retail-source] market", {
    retailer: retailer.name,
    currency: currencyData.currency,
  });
  if (currencyData.currency !== profile.currency) return [];
  const terms =
    retailer.kind === "clothing"
      ? ["shirt", "pants", "dress", "jacket"].map((t) => `${profile.department} ${t}`)
      : retailer.kind === "shoe"
        ? [`${profile.department} runners`, `${profile.department} loungers`]
        : ["bag"];
  const results = await Promise.allSettled(
    terms.map(async (term) => {
      const u = new URL("/search/suggest.json", retailer.origin);
      u.search = new URLSearchParams({
        q: term,
        "resources[type]": "product",
        "resources[limit]": "6",
        "resources[options][unavailable_products]": "hide",
      }).toString();
      return searchSchema.parse(await json(u.href, "", 120000)).resources.results.products;
    }),
  );
  const handles = [
    ...new Set(
      results
        .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
        .flatMap((p) => {
          try {
            const u = new URL(p.url, retailer.origin);
            if (u.origin !== retailer.origin) return [];
            const h = u.pathname.match(/^\/products\/([a-z0-9-]+)$/)?.[1];
            return h ? [h] : [];
          } catch {
            return [];
          }
        }),
    ),
  ].slice(0, 24);
  const all: RetailProduct[] = [];
  for (let i = 0; i < handles.length; i += 6) {
    const batch = await Promise.allSettled(
      handles
        .slice(i, i + 6)
        .map(async (h) => productSchema.parse(await json(`${retailer.origin}/products/${h}.js`))),
    );
    all.push(...batch.flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])));
  }
  console.info("[retail-source] catalog", { retailer: retailer.name, products: all.length });
  return all.map((p) => ({ retailer, p }));
}
export async function matchRetailProducts(
  capsule: CapsulePiece[],
  profile: ShoppingProfile | null,
): Promise<ProductMatches> {
  const checkedAt = new Date().toISOString();
  if (!profile)
    return {
      items: [],
      total: 0,
      currency: "USD",
      checkedAt,
      notice:
        "Your saved interview has no structured shopping sizes and limits. Your guide remains available; no size or budget matches have been assumed.",
    };
  const results = await Promise.allSettled(
    RETAILERS.filter((r) =>
      r.kind === "shoe"
        ? profile.shoeMax > 0 && Boolean(profile.shoeSize)
        : r.kind === "accessory"
          ? profile.accessoryMax > 0
          : profile.clothingMax > 0,
    ).map(async (r) => {
      try {
        return await catalog(r, profile);
      } catch (error) {
        console.warn("[retail-source] unavailable", {
          retailer: r.name,
          kind:
            error instanceof z.ZodError
              ? "schema"
              : error instanceof Error
                ? error.message.slice(0, 90)
                : "unknown",
        });
        return [];
      }
    }),
  );
  const products = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  const items: LiveProduct[] = [];
  const used = new Set<number>();
  let remaining = profile.totalMax > 0 ? Math.floor(profile.totalMax * 100) : Infinity;
  for (const [index, piece] of capsule.entries()) {
    const candidates = products
      .flatMap(({ retailer, p }) => {
        if (used.has(p.id)) return [];
        if (piece.role === "shoe") {
          if (retailer.kind !== "shoe" || !isDepartment(p, profile)) return [];
        } else if (piece.role === "accessory") {
          if (
            retailer.kind !== "accessory" ||
            !/bag|tote|purse|satchel|clutch|wallet/i.test(p.title) ||
            /gift.card|care.kit/i.test(p.title)
          )
            return [];
        } else if (
          retailer.kind !== "clothing" ||
          roleOf(p) !== piece.role ||
          !isDepartment(p, profile)
        )
          return [];
        const option = eligibleVariant(p, piece.role, profile, retailer, piece);
        if (!option || option.v.price > remaining) return [];
        const score = productScore(piece, p, option.color);
        return score < 0 ? [] : [{ retailer, p, option, score }];
      })
      .sort((a, b) => b.score - a.score || a.option.v.price - b.option.v.price);
    const chosen = candidates[0];
    if (!chosen) continue;
    const { retailer, p, option } = chosen;
    used.add(p.id);
    remaining -= option.v.price;
    const url = new URL(`/products/${p.handle}`, retailer.origin);
    url.searchParams.set("variant", String(option.v.id));
    items.push({
      pieceId: `piece-${index + 1}`,
      retailer: retailer.name,
      title: p.title,
      color: option.color,
      size: option.size,
      price: option.v.price / 100,
      currency: profile.currency,
      url: url.href,
      image: safeImage(
        option.v.featured_image?.src ||
          (!p.options.some((o) => /colou?r/i.test(o.name) && (o.values?.length ?? 2) > 1)
            ? p.featured_image
            : null),
      ),
      variantId: String(option.v.id),
      checkedAt,
    });
  }
  return {
    items,
    checkedAt,
    total: Math.round(items.reduce((sum, p) => sum + p.price, 0) * 100) / 100,
    currency: profile.currency,
    notice: items.length
      ? "These are the exact retailer items shown in your capsule. Clothing and shoes were listed as available in your saved size. Bag sizes are retailer options; all selected prices stay within your limits. Taxes, shipping, final stock and fit are confirmed at the retailer. Unmatched pieces remain styling directions, not purchasable products."
      : "No current variants matched your saved sizes, currency, colors and spending limits. Your guide is intact; Bee has not substituted a different size or exceeded your budget.",
  };
}
