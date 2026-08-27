// 30-Day Style Guide — looks generation pipeline.
//
// Generates content in small sequential text calls (one hero look at a time,
// then variations per hero, then a deterministic 30-day rotation) instead of
// one giant structured object. Each hero look is illustrated through the
// existing /api/generate-illustration pipeline with bounded retries.

import { createServerFn } from "@tanstack/react-start";

import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

export type LookIllustration = {
  status: "success" | "failed" | "pending";
  path?: string;
  url?: string;
  error?: string;
  attempts?: number;
};

export type LookPieces = {
  top?: string;
  bottom?: string;
  layer?: string;
  shoe?: string;
  accessory?: string;
};

export type HeroLook = {
  id: string; // "look-1" ... "look-8"
  index: number; // 1..8
  name: string;
  occasion: string;
  pieces: LookPieces;
  paletteColors: string[]; // color names used from her palette
  note: string; // Bee's editorial 1-2 line note
  illustration?: LookIllustration;
};

export type Variation = {
  heroId: string;
  name: string;
  swap: string; // e.g. "Day → Night"
  note: string;
};

export type RotationDay = { day: number; heroId: string };

export type LooksDoc = {
  generatedAt: string;
  heroes: HeroLook[];
  variations: Variation[];
  rotation: RotationDay[];
  cover?: LookIllustration;
};

export const HERO_COUNT = 8;
const TEXT_MODEL = "google/gemini-2.5-flash";
const IMAGE_MAX_ATTEMPTS = 3;

const WARM_CLIMATES = new Set(["tropical", "arid", "mediterranean"]);
function climateGuidance(climate: string) {
  const c = climate.toLowerCase();
  if (WARM_CLIMATES.has(c) || /tropic|miami|warm|hot|desert/.test(c)) {
    return {
      wardrobe:
        "lightweight, breathable warm-weather pieces — linen, cotton, silk; bare arms or short sleeves; open sandals or low slides; no layering",
      exclude:
        "NO heavy coats, NO wool overcoats, NO scarves, NO gloves, NO knit hats, NO boots, NO winter layers",
    };
  }
  if (/cold|winter|continental/.test(c)) {
    return {
      wardrobe: "cold-weather layering — wool, knits, structured coat, boots",
      exclude: "no bare arms, no sandals, no summer-only pieces",
    };
  }
  return {
    wardrobe: "transitional pieces appropriate to a temperate season",
    exclude: "avoid extreme winter parkas or beach-only resortwear",
  };
}
function currentSeason(climate: string): string {
  const m = new Date().getUTCMonth();
  const c = climate.toLowerCase();
  if (WARM_CLIMATES.has(c) || /tropic|miami|warm|hot|desert/.test(c)) {
    return m >= 4 && m <= 9 ? "the warm, humid season" : "the dry, breezy season";
  }
  if (m <= 1 || m === 11) return "winter";
  if (m <= 4) return "spring";
  if (m <= 7) return "summer";
  return "autumn";
}

type StyleCtx = {
  paletteLine: string;
  paletteNames: string[];
  silhouette: string;
  fabric: string;
  pillarLine: string;
  lifestyleLine: string;
  dominantContext: string;
  northStar: string;
  location: string;
  climate: string;
  season: string;
  budget: string;
  bodyShape: string;
  climateWardrobe: string;
  climateExclude: string;
};

async function loadStyleCtx(
  supabase: Awaited<ReturnType<typeof getAdmin>>,
  userId: string,
): Promise<{ ctx: StyleCtx } | { error: string }> {
  const [{ data: sp }, { data: profile }, { data: onboarding }] = await Promise.all([
    supabase
      .from("style_profiles")
      .select("color_palette, pillar_weights, lifestyle_mix, north_star")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("location, climate, budget_band, body_shape")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("bee_onboarding_responses").select("question_id, choice").eq("user_id", userId),
  ]);
  const palette = Array.isArray(sp?.color_palette)
    ? (sp!.color_palette as Array<{ name?: string; hex?: string; role?: string }>)
    : [];
  if (palette.length === 0) return { error: "No palette yet — talk to Bee first." };

  const byQ = new Map<string, string>();
  for (const o of onboarding ?? []) {
    if (o.question_id && o.choice) byQ.set(o.question_id as string, o.choice as string);
  }
  const lifestyleMix = (sp?.lifestyle_mix ?? {}) as Record<string, number>;
  const pillarWeights = (sp?.pillar_weights ?? {}) as Record<string, number>;
  const dominant =
    Object.entries(lifestyleMix).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] ??
    byQ.get("q8_lifestyle") ??
    "everyday life";
  const location = (profile?.location as string | null)?.trim() || "her city";
  const climate = (profile?.climate as string | null)?.trim() || "temperate";
  const season = currentSeason(climate);
  const guidance = climateGuidance(climate);
  const paletteNames = palette.slice(0, 6).map((p) => p.name ?? "tone");
  return {
    ctx: {
      paletteLine: palette
        .slice(0, 6)
        .map(
          (p) => `${p.name ?? "tone"}${p.hex ? ` (${p.hex})` : ""}${p.role ? ` — ${p.role}` : ""}`,
        )
        .join("; "),
      paletteNames,
      silhouette: byQ.get("q4_silhouette") ?? "easy, draped",
      fabric: byQ.get("q6_fabric_preference") ?? "soft naturals",
      pillarLine:
        Object.entries(pillarWeights)
          .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
          .map(([k, v]) => `${k} ${v}%`)
          .join(", ") || "balanced",
      lifestyleLine:
        Object.entries(lifestyleMix)
          .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
          .map(([k, v]) => `${k} ${v}%`)
          .join(", ") || dominant,
      dominantContext: dominant,
      northStar: ((sp?.north_star as string | null) ?? "show up as me").slice(0, 160),
      location,
      climate,
      season,
      budget: (profile?.budget_band as string | null) ?? "mid",
      bodyShape: (profile?.body_shape as string | null) ?? "unspecified",
      climateWardrobe: guidance.wardrobe,
      climateExclude: guidance.exclude,
    },
  };
}

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/* ────────────────── Text generation (per hero, per variation) ────────────────── */

const HERO_OCCASION_SLOTS = [
  "everyday errands and a coffee meeting",
  "work or work-from-anywhere",
  "dinner with friends",
  "travel day",
  "creative weekend",
  "date night",
  "outdoor activity or walk",
  "a slow Sunday at home",
];

const SYSTEM_VOICE = `You are Bee, a senior personal stylist writing for ONE member. Editorial, warm, declarative — no emoji, no exclamation marks, no marketing-speak. Each look must be wearable in her real climate and palette, in her silhouette and fabric preferences, within her budget.`;

function parseJsonLoose<T>(text: string): T | null {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // try grabbing the first { ... } block
    const m = trimmed.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as T;
    } catch {
      return null;
    }
  }
}

async function generateHeroText(
  ctx: StyleCtx,
  index: number,
  existing: HeroLook[],
): Promise<HeroLook> {
  const slot = HERO_OCCASION_SLOTS[(index - 1) % HERO_OCCASION_SLOTS.length];
  const existingNames = existing.map((h) => h.name).join(", ") || "(none yet)";
  const prompt = `Compose ONE hero look for this member — Look ${index} of 8.

OCCASION CUE for this look: ${slot}.
AVOID repeating these already-composed looks: ${existingNames}.

MEMBER PROFILE
- Location: ${ctx.location} · Climate: ${ctx.climate} · Season: ${ctx.season}
- Body shape: ${ctx.bodyShape} · Budget: ${ctx.budget}
- Silhouette pref: ${ctx.silhouette} · Fabric pref: ${ctx.fabric}
- Pillars: ${ctx.pillarLine}
- Lifestyle mix: ${ctx.lifestyleLine}
- North star: "${ctx.northStar}"
- Palette (use these names only): ${ctx.paletteLine}

CLIMATE WARDROBE: ${ctx.climateWardrobe}
${ctx.climateExclude}

Output STRICT JSON only, no markdown fences:
{"name": string (2–4 words, evocative),
 "occasion": string (one short phrase),
 "pieces": {"top": string|null, "bottom": string|null, "layer": string|null, "shoe": string, "accessory": string|null},
 "paletteColors": string[] (1–3 names drawn EXACTLY from the palette above),
 "note": string (1–2 short editorial sentences in Bee's voice — no emoji)}`;

  const gateway = createLovableAiGatewayProvider(process.env.LOVABLE_API_KEY!);
  const { text } = await generateText({
    model: gateway(TEXT_MODEL),
    system: SYSTEM_VOICE,
    prompt,
  });
  const parsed = parseJsonLoose<{
    name?: string;
    occasion?: string;
    pieces?: LookPieces;
    paletteColors?: string[];
    note?: string;
  }>(text);
  return {
    id: `look-${index}`,
    index,
    name: parsed?.name?.trim() || `Look ${index}`,
    occasion: parsed?.occasion?.trim() || slot,
    pieces: parsed?.pieces ?? {},
    paletteColors: Array.isArray(parsed?.paletteColors) ? parsed!.paletteColors!.slice(0, 3) : [],
    note: parsed?.note?.trim() || "",
  };
}

async function generateVariationsText(ctx: StyleCtx, hero: HeroLook): Promise<Variation[]> {
  const prompt = `Hero look "${hero.name}" — ${hero.occasion}.
Pieces: ${JSON.stringify(hero.pieces)}.
Palette colors used: ${hero.paletteColors.join(", ") || "—"}.

Compose TWO variations of this look — small swaps that take it somewhere new (e.g. day → night, indoors → outdoors, warmer → cooler). Stay within her palette, silhouette, climate (${ctx.climate}), and ${ctx.climateExclude}.

Output STRICT JSON only, no markdown:
{"variations": [
  {"name": string (2–4 words), "swap": string (short phrase like "Day → Night"), "note": string (1 short editorial sentence)},
  {"name": string, "swap": string, "note": string}
]}`;
  const gateway = createLovableAiGatewayProvider(process.env.LOVABLE_API_KEY!);
  const { text } = await generateText({
    model: gateway(TEXT_MODEL),
    system: SYSTEM_VOICE,
    prompt,
  });
  const parsed = parseJsonLoose<{
    variations?: Array<{ name?: string; swap?: string; note?: string }>;
  }>(text);
  const arr = Array.isArray(parsed?.variations) ? parsed!.variations! : [];
  return arr.slice(0, 2).map((v) => ({
    heroId: hero.id,
    name: v.name?.trim() || "Variation",
    swap: v.swap?.trim() || "",
    note: v.note?.trim() || "",
  }));
}

function deterministicRotation(heroCount: number): RotationDay[] {
  const out: RotationDay[] = [];
  for (let d = 1; d <= 30; d += 1) {
    const i = (d - 1) % heroCount;
    out.push({ day: d, heroId: `look-${i + 1}` });
  }
  return out;
}

/* ────────────────── Image generation (per hero + cover) ────────────────── */


type GenResult = { ok: true; bytes: Uint8Array } | { ok: false; status: number; error: string };

function responseSnippet(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 220);
}

function extractB64FromResponseText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const json = JSON.parse(trimmed) as { b64_json?: string; data?: Array<{ b64_json?: string }> };
    return json.b64_json ?? json.data?.[0]?.b64_json ?? null;
  } catch {
    const events = trimmed.split(/\n\n+/);
    let latest: string | null = null;
    for (const event of events) {
      const data = event
        .split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.replace(/^data:\s?/, ""))
        .join("\n")
        .trim();
      if (!data || data === "[DONE]") continue;
      try {
        const payload = JSON.parse(data) as {
          b64_json?: string;
          data?: Array<{ b64_json?: string }>;
        };
        const b64 = payload.b64_json ?? payload.data?.[0]?.b64_json;
        if (b64) latest = b64;
      } catch {
        // Ignore non-JSON SSE comments/heartbeat frames.
      }
    }
    return latest;
  }
}

async function callImageRoute(apiKey: string, prompt: string): Promise<GenResult> {
  try {
    const { generateIllustrationBytes } = await import("@/lib/generate-illustration.server");
    const result = await generateIllustrationBytes({
      prompt,
      apiKey,
      logPrefix: "[generate-look-illustration]",
    });
    return { ok: true, bytes: result.bytes };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 502, error: responseSnippet(message) };
  }
}

const isRetryable = (s: number) => s !== 402 && s !== 401 && s !== 403;

function heroImagePrompt(ctx: StyleCtx, hero: HeroLook): string {
  const pieces = [
    hero.pieces.layer,
    hero.pieces.top,
    hero.pieces.bottom,
    hero.pieces.shoe,
    hero.pieces.accessory,
  ]
    .filter(Boolean)
    .join("; ");
  return `Vertical 3:4 portrait. ONE single centered full-length figure that fills the frame head-to-toe with comfortable margin — no cropping at top/bottom/sides, no duplicate or partial second figure, no large empty background void. She is in ${ctx.location}, a ${ctx.climate} climate during ${ctx.season}.

OUTFIT — "${hero.name}" for ${hero.occasion}: ${pieces || "an editorial outfit"}. Cut in ${ctx.silhouette}, fabrics ${ctx.fabric}. Use these palette colors as the actual garments: ${hero.paletteColors.join(", ") || ctx.paletteNames.slice(0, 3).join(", ")}. ${ctx.climateWardrobe}. ${ctx.climateExclude}.

Handwritten script label naming one garment beside (not on) the figure.`;
}

function coverImagePrompt(ctx: StyleCtx): string {
  return `Vertical 3:4 portrait. ONE single centered full-length figure, editorial cover plate. She is in ${ctx.location}, a ${ctx.climate} climate during ${ctx.season}. Outfit in her signature palette (${ctx.paletteNames.slice(0, 4).join(", ")}), cut in ${ctx.silhouette}, fabrics ${ctx.fabric}. ${ctx.climateWardrobe}. ${ctx.climateExclude}. Confident, magazine-cover stance. Small handwritten note "${ctx.northStar.slice(0, 50)}" beside her, never on the body.`;
}

async function runImage(
  supabase: Awaited<ReturnType<typeof getAdmin>>,
  userId: string,
  storagePath: string,
  prompt: string,
  apiKey: string,
): Promise<LookIllustration> {
  let attempts = 0;
  let lastError = "unknown error";
  let lastStatus = 0;
  let bytes: Uint8Array | null = null;
  while (attempts < IMAGE_MAX_ATTEMPTS) {
    attempts += 1;
    const r = await callImageRoute(apiKey, prompt);
    if (r.ok) {
      bytes = r.bytes;
      break;
    }
    lastError = r.error;
    lastStatus = r.status;
    if (!isRetryable(r.status) || attempts >= IMAGE_MAX_ATTEMPTS) break;
    await new Promise((res) => setTimeout(res, attempts === 1 ? 600 : 1500));
  }
  if (!bytes) {
    return { status: "failed", attempts, error: lastError };
  }
  const { error: upErr } = await supabase.storage
    .from("style-illustrations")
    .upload(storagePath, bytes, { contentType: "image/png", upsert: true });
  if (upErr) {
    return { status: "failed", attempts, error: `upload ${upErr.message}` };
  }
  return { status: "success", path: storagePath, attempts };
}

/* ────────────────── Persistence helpers ────────────────── */

async function loadDoc(
  supabase: Awaited<ReturnType<typeof getAdmin>>,
  userId: string,
): Promise<LooksDoc | null> {
  const { data } = await supabase
    .from("style_profiles")
    .select("looks")
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.looks as LooksDoc | null) ?? null;
}

async function saveDoc(
  supabase: Awaited<ReturnType<typeof getAdmin>>,
  userId: string,
  doc: LooksDoc,
): Promise<void> {
  await supabase
    .from("style_profiles")
    .upsert({ user_id: userId, looks: doc as unknown as never }, { onConflict: "user_id" });
}

function emptyDoc(): LooksDoc {
  return {
    generatedAt: new Date().toISOString(),
    heroes: [],
    variations: [],
    rotation: [],
  };
}

/* ────────────────── Server functions ────────────────── */

// Status — what's done and what's missing. Used by the client to orchestrate
// sequential generation and to render progress.
export const getLooksStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const doc = (await loadDoc(context.supabase as never, context.userId)) ?? emptyDoc();
    const heroIndexes = new Set(doc.heroes.map((h) => h.index));
    const missingHeroes: number[] = [];
    for (let i = 1; i <= HERO_COUNT; i += 1) if (!heroIndexes.has(i)) missingHeroes.push(i);
    const heroesWithVariations = new Set(doc.variations.map((v) => v.heroId));
    const missingVariations = doc.heroes
      .map((h) => h.id)
      .filter((id) => !heroesWithVariations.has(id));
    const missingIllustrations = doc.heroes
      .filter((h) => h.illustration?.status !== "success")
      .map((h) => h.id);
    const hasRotation = doc.rotation.length === 30;
    const hasCover = doc.cover?.status === "success";
    return {
      heroCount: doc.heroes.length,
      missingHeroes,
      missingVariations,
      missingIllustrations,
      hasRotation,
      hasCover,
    };
  });

// Generate ONE hero look (text only). Idempotent on index — overwrites.
export const generateOneHero = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { index: number }) => {
    if (!Number.isInteger(d?.index) || d.index < 1 || d.index > HERO_COUNT) {
      throw new Error("Invalid hero index");
    }
    return d;
  })
  .handler(async ({ data, context }) => {
    if (!process.env.LOVABLE_API_KEY)
      return { ok: false as const, error: "Missing LOVABLE_API_KEY" };
    const ctxRes = await loadStyleCtx(context.supabase as never, context.userId);
    if ("error" in ctxRes) return { ok: false as const, error: ctxRes.error };
    const doc = (await loadDoc(context.supabase as never, context.userId)) ?? emptyDoc();
    const hero = await generateHeroText(ctxRes.ctx, data.index, doc.heroes);
    const next: LooksDoc = {
      ...doc,
      heroes: [...doc.heroes.filter((h) => h.index !== data.index), hero].sort(
        (a, b) => a.index - b.index,
      ),
    };
    await saveDoc(context.supabase as never, context.userId, next);
    return { ok: true as const, hero };
  });

// Generate the two variations for ONE hero (text only).
export const generateHeroVariations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { heroId: string }) => {
    if (!d?.heroId || typeof d.heroId !== "string") throw new Error("Invalid heroId");
    return d;
  })
  .handler(async ({ data, context }) => {
    if (!process.env.LOVABLE_API_KEY)
      return { ok: false as const, error: "Missing LOVABLE_API_KEY" };
    const ctxRes = await loadStyleCtx(context.supabase as never, context.userId);
    if ("error" in ctxRes) return { ok: false as const, error: ctxRes.error };
    const doc = (await loadDoc(context.supabase as never, context.userId)) ?? emptyDoc();
    const hero = doc.heroes.find((h) => h.id === data.heroId);
    if (!hero) return { ok: false as const, error: "Hero not generated yet" };
    const variations = await generateVariationsText(ctxRes.ctx, hero);
    const next: LooksDoc = {
      ...doc,
      variations: [...doc.variations.filter((v) => v.heroId !== data.heroId), ...variations],
    };
    await saveDoc(context.supabase as never, context.userId, next);
    return { ok: true as const, variations };
  });

// Build the 30-day rotation (deterministic — no LLM call needed).
export const generateRotation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const doc = (await loadDoc(context.supabase as never, context.userId)) ?? emptyDoc();
    if (doc.heroes.length === 0) return { ok: false as const, error: "No hero looks yet" };
    const rotation = deterministicRotation(doc.heroes.length);
    await saveDoc(context.supabase as never, context.userId, { ...doc, rotation });
    return { ok: true as const, rotation };
  });

// Illustrate one hero look (or the cover) via /api/generate-illustration.
export const generateLookIllustration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { target: string }) => {
    if (!d?.target || typeof d.target !== "string") throw new Error("Invalid target");
    return d;
  })
  .handler(async ({ data, context }) => {
    if (!process.env.LOVABLE_API_KEY)
      return { ok: false as const, error: "Missing LOVABLE_API_KEY" };
    const ctxRes = await loadStyleCtx(context.supabase as never, context.userId);
    if ("error" in ctxRes) return { ok: false as const, error: ctxRes.error };
    const doc = (await loadDoc(context.supabase as never, context.userId)) ?? emptyDoc();

    if (data.target === "cover") {
      const path = `${context.userId}/guide-cover.png`;
      const entry = await runImage(
        context.supabase as never,
        context.userId,
        path,
        coverImagePrompt(ctxRes.ctx),
        process.env.LOVABLE_API_KEY,
      );
      await saveDoc(context.supabase as never, context.userId, { ...doc, cover: entry });
      return { ok: entry.status === "success", entry };
    }

    const hero = doc.heroes.find((h) => h.id === data.target);
    if (!hero) return { ok: false as const, error: "Hero not generated yet" };
    const path = `${context.userId}/guide-${hero.id}.png`;
    const entry = await runImage(
      context.supabase as never,
      context.userId,
      path,
      heroImagePrompt(ctxRes.ctx, hero),
      process.env.LOVABLE_API_KEY,
    );
    const next: LooksDoc = {
      ...doc,
      heroes: doc.heroes.map((h) => (h.id === hero.id ? { ...h, illustration: entry } : h)),
    };
    await saveDoc(context.supabase as never, context.userId, next);
    return { ok: entry.status === "success", entry };
  });

// Reset everything (used by "regenerate guide").
export const resetLooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await saveDoc(context.supabase as never, context.userId, emptyDoc());
    return { ok: true as const };
  });
