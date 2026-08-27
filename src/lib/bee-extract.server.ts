// Server-only extractor: reads the rolling Bee conversation and pulls out
// structured signals (onboarding answers, profile basics, derived style
// profile) so /my-style-guide renders styling content instead of blanks.
//
// Strategy: instead of one giant generateObject call (which gets truncated
// or rejected by Gemini's constrained-decoding state machine), we run THREE
// smaller, sequential extractions with relaxed schemas, low temperature,
// generous token budgets, one retry, and raw-response logging on failure.
// Each section persists independently so a later failure never wipes earlier
// work.

import { generateObject, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const EXTRACT_MODEL = "google/gemini-2.5-flash";
const EXTRACT_TEMPERATURE = 0.4;
const EXTRACT_MAX_TOKENS = 4096;

// The 10 onboarding questions, mapped to a pillar allowed by the DB
// CHECK constraint (fit/feel/fabric/meta). Kept as string sets so the model
// schema stays loose — we validate against these AFTER extraction.
const QUESTION_IDS = new Set([
  "q1_pillar_priority",
  "q2_cultural_lineage",
  "q3_journey_stage",
  "q4_silhouette",
  "q5_palette",
  "q6_fabric_preference",
  "q7_closet_state",
  "q8_lifestyle",
  "q9_hardest_moments",
  "q10_keep_line",
]);
const PILLARS = new Set(["fit", "feel", "fabric", "meta"]);

// --- Relaxed schemas: strings only, all non-essentials optional, no enums,
// no deep nesting. We post-process for validity.

const OnboardingSchema = z.object({
  answers: z
    .array(
      z.object({
        question_id: z.string(),
        pillar: z.string().optional(),
        choice: z.string(),
        note: z.string().optional(),
      }),
    )
    .optional(),
});

const ProfileSchema = z.object({
  body_shape: z.string().optional(),
  location: z.string().optional(),
  climate: z.string().optional(),
  budget_band: z.string().optional(),
});

const StyleProfileSchema = z.object({
  color_palette: z
    .array(
      z.object({
        name: z.string(),
        hex: z.string().optional(),
        role: z.string().optional(),
      }),
    )
    .optional(),
  color_season: z.string().optional(),
  pillar_weights: z
    .object({
      fit: z.number().optional(),
      feel: z.number().optional(),
      fabric: z.number().optional(),
    })
    .optional(),
  lifestyle_mix: z
    .object({
      office: z.number().optional(),
      creative: z.number().optional(),
      home: z.number().optional(),
      events: z.number().optional(),
      travel: z.number().optional(),
    })
    .optional(),
  north_star: z.string().optional(),
});

const ONBOARDING_SYSTEM = `Silent extractor. Read the full Bee styling transcript and emit ONLY answers directly supported by the member's own words. Never invent.

Return { "answers": [...] }. Each answer = { question_id, pillar, choice, note? }.

Allowed question_id (use these EXACT strings):
- q1_pillar_priority — Fit / Feel / Fabric (pillar: meta)
- q2_cultural_lineage — Western contemporary / heritage-forward / fusion / modest by intention (pillar: meta)
- q3_journey_stage — finding / refining / reinventing / honouring (pillar: meta)
- q4_silhouette — skim & float / define the waist / structure the shoulder / pure ease (pillar: fit)
- q5_palette — warm neutrals / deep jewels / earth pigments / soft cool (pillar: feel)
- q6_fabric_preference — soft naturals / fluid drape / structured weave / soft knits (pillar: fabric)
- q7_closet_state — curated / full but unsure / in transition / starting over (pillar: meta)
- q8_lifestyle — office / creative hybrid / home-led / high visibility (pillar: meta)
- q9_hardest_moments — mornings / events / travel / in-between days (pillar: meta)
- q10_keep_line — protect / stretch / edit / celebrate (pillar: meta)

pillar must be exactly one of: fit, feel, fabric, meta.
choice = short label, lowercased. note = verbatim sentence they added (optional).
Be generous matching typos (e.g. "skin and float" → "skim & float").`;

const PROFILE_SYSTEM = `Silent extractor. From the Bee transcript, emit profile basics ONLY where the member stated them. Never invent.

Return an object with any of these optional keys:
- body_shape: one of hourglass, pear, apple, rectangle, inverted_triangle
- location: short city/region string
- climate: one of tropical, temperate, cold, arid, mediterranean, continental
- budget_band: one of value, mid, premium, luxury

Omit any key you cannot directly support.`;

const STYLE_SYSTEM = `Silent extractor. From the Bee transcript, synthesize the member's style profile. Emit only what is supported.

Return an object with any of:
- color_palette: EXACTLY 6 swatches, each { name, hex, role }. role in {anchor, neutral, accent, wildcard}. hex MUST be a real "#RRGGBB" hex matching the color name (e.g. "warm camel" → "#B8895A", "deep teal" → "#11525C"). Never omit hex. Never use #CCCCCC or other greys unless the color is literally grey.
- color_season: one of deep_winter, cool_winter, clear_winter, light_spring, warm_spring, clear_spring, light_summer, cool_summer, soft_summer, soft_autumn, warm_autumn, deep_autumn. ONLY emit if the transcript clearly describes the member's coloring (hair/skin/eye tone). Otherwise OMIT — a separate headshot pipeline will fill it.
- pillar_weights: { fit, feel, fabric } INTEGER PERCENTAGES summing to 100, reflecting q1 priority. The chosen priority gets the largest share (e.g. fabric priority → { fabric: 50, feel: 30, fit: 20 }).
- lifestyle_mix: { office, creative, home, events, travel } INTEGER PERCENTAGES summing to 100, derived from q8 + q9. The dominant contexts get the largest shares (e.g. creative-hybrid + office lifestyle → { creative: 35, office: 30, home: 15, events: 10, travel: 10 }).
- north_star: one sentence in their voice from q10.

Only fill once palette (q5) and fabric preference (q6) are answered. Omit anything you can't support.`;

async function extractSection<T>(opts: {
  apiKey: string;
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  label: string;
}): Promise<T | null> {
  const { apiKey, schema, system, prompt, label } = opts;
  const gateway = createLovableAiGatewayProvider(apiKey);

  const attempt = async (tryNum: number): Promise<T> => {
    try {
      const result = await generateObject({
        model: gateway(EXTRACT_MODEL),
        schema,
        system,
        prompt,
        temperature: EXTRACT_TEMPERATURE,
        maxOutputTokens: EXTRACT_MAX_TOKENS,
      });
      return result.object;
    } catch (err) {
      // Log the raw model output so we can see exactly which field broke.
      if (NoObjectGeneratedError.isInstance(err)) {
        console.error(
          `bee-extract[${label}] attempt ${tryNum} no-object error.`,
          {
            cause: err.cause,
            text: err.text,
            usage: err.usage,
            finishReason: err.finishReason,
          },
        );
      } else {
        console.error(`bee-extract[${label}] attempt ${tryNum} failed`, err);
      }
      throw err;
    }
  };

  try {
    return await attempt(1);
  } catch {
    try {
      return await attempt(2);
    } catch (err2) {
      console.error(
        `bee-extract[${label}] gave up after retry; skipping section.`,
        err2,
      );
      return null;
    }
  }
}

export async function extractAndPersistBeeSignals(opts: {
  supabase: SupabaseClient<Database>;
  userId: string;
  apiKey: string;
  transcript: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<{ onboardingCount: number; styleProfileSaved: boolean }> {
  const { supabase, userId, apiKey, transcript } = opts;
  if (!transcript.length) return { onboardingCount: 0, styleProfileSaved: false };

  const conversation = transcript
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");
  const transcriptBlock = `Bee conversation transcript:\n\n${conversation}`;

  let onboardingCount = 0;
  let styleProfileSaved = false;

  // ===== 1. Onboarding answers =====
  const onboarding = await extractSection({
    apiKey,
    schema: OnboardingSchema,
    system: ONBOARDING_SYSTEM,
    prompt: `${transcriptBlock}\n\nExtract the onboarding answers now.`,
    label: "onboarding",
  });

  if (onboarding?.answers?.length) {
    const rows = onboarding.answers
      .map((a) => {
        const qid = a.question_id?.trim();
        const pillar = (a.pillar ?? "meta").trim().toLowerCase();
        const choice = a.choice?.trim();
        if (!qid || !QUESTION_IDS.has(qid)) return null;
        if (!choice) return null;
        return {
          user_id: userId,
          question_id: qid,
          pillar: PILLARS.has(pillar) ? pillar : "meta",
          choice: choice.slice(0, 120),
          note: a.note?.trim() ? a.note.trim().slice(0, 800) : null,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (rows.length) {
      const { error } = await supabase
        .from("bee_onboarding_responses")
        .upsert(rows, { onConflict: "user_id,question_id" });
      if (error) console.error("bee-extract: onboarding upsert", error);
      else onboardingCount = rows.length;
    }
  }

  // ===== 2. Profile basics =====
  const profile = await extractSection({
    apiKey,
    schema: ProfileSchema,
    system: PROFILE_SYSTEM,
    prompt: `${transcriptBlock}\n\nExtract profile basics now.`,
    label: "profile",
  });

  if (profile) {
    const profilePatch: {
      body_shape?: string;
      location?: string;
      climate?: string;
      budget_band?: string;
    } = {};
    if (profile.body_shape) profilePatch.body_shape = profile.body_shape;
    if (profile.location) profilePatch.location = profile.location;
    if (profile.climate) profilePatch.climate = profile.climate;
    if (profile.budget_band) profilePatch.budget_band = profile.budget_band;
    if (Object.keys(profilePatch).length) {
      const { error } = await supabase
        .from("profiles")
        .update(profilePatch)
        .eq("id", userId);
      if (error) console.error("bee-extract: profile update", error);
    }
  }

  // ===== 3. Style profile =====
  const sp = await extractSection({
    apiKey,
    schema: StyleProfileSchema,
    system: STYLE_SYSTEM,
    prompt: `${transcriptBlock}\n\nExtract the style profile now.`,
    label: "style_profile",
  });

  if (sp) {
    const hasStyle =
      (sp.color_palette && sp.color_palette.length) ||
      sp.color_season ||
      (sp.pillar_weights && Object.keys(sp.pillar_weights).length) ||
      (sp.lifestyle_mix && Object.keys(sp.lifestyle_mix).length) ||
      sp.north_star;

    if (hasStyle) {
      const palette = sp.color_palette?.map((p) => ({
        name: p.name,
        hex: ensureHex(p.hex, p.name),
        role: p.role,
      }));

      const payload: Database["public"]["Tables"]["style_profiles"]["Insert"] = {
        user_id: userId,
      };
      if (palette && palette.length) payload.color_palette = palette;
      // Always populate color_season — a real season requires the headshot
      // colour-analysis pipeline (not built yet), so fall back to a marker
      // the UI renders gracefully instead of leaving the field empty.
      payload.color_season = sp.color_season?.trim() || "pending photo";
      if (sp.pillar_weights)
        payload.pillar_weights = normalizePercents(sp.pillar_weights, [
          "fit",
          "feel",
          "fabric",
        ]);
      if (sp.lifestyle_mix)
        payload.lifestyle_mix = normalizePercents(sp.lifestyle_mix, [
          "office",
          "creative",
          "home",
          "events",
          "travel",
        ]);
      if (sp.north_star) payload.north_star = sp.north_star;

      const { error } = await supabase
        .from("style_profiles")
        .upsert(payload, { onConflict: "user_id" });
      if (error) console.error("bee-extract: style_profile upsert", error);
      else styleProfileSaved = true;
    }
  }

  return { onboardingCount, styleProfileSaved };
}

// --- helpers ---------------------------------------------------------------

// Map common colour-name words to a usable hex so swatches never fall back to
// the grey #CCCCCC placeholder when the model omits the hex.
const NAMED_COLORS: Array<[RegExp, string]> = [
  [/black|onyx|jet|charcoal/i, "#1A1A1A"],
  [/white|ivory|cream|chalk|alabaster/i, "#F5EFE2"],
  [/camel|caramel|tan|wheat|sand|beige|biscuit/i, "#B8895A"],
  [/brown|chocolate|espresso|coffee|mocha|cocoa/i, "#5A3A24"],
  [/rust|terracotta|brick|clay|sienna/i, "#A64B2A"],
  [/burgundy|wine|oxblood|merlot|bordeaux/i, "#5A1A2B"],
  [/red|crimson|scarlet|cherry/i, "#B22234"],
  [/coral|salmon|peach/i, "#E58D74"],
  [/pink|rose|blush|petal/i, "#D89BA6"],
  [/plum|aubergine|eggplant|mulberry/i, "#5C2A4D"],
  [/lavender|lilac|orchid/i, "#9D89B8"],
  [/purple|violet/i, "#5E3A87"],
  [/navy|midnight|indigo|ink/i, "#1E2A4A"],
  [/teal|peacock|cerulean/i, "#11525C"],
  [/blue|sapphire|cobalt|denim/i, "#2C4E80"],
  [/sky|powder|periwinkle/i, "#A8C5DE"],
  [/mint|sage|eucalyptus/i, "#9CB5A1"],
  [/olive|moss|fern|forest|hunter/i, "#4A5A2E"],
  [/emerald|jade|kelly/i, "#2E6F4E"],
  [/green/i, "#3F6B43"],
  [/mustard|ochre|saffron|amber/i, "#C8932B"],
  [/gold|brass|bronze/i, "#A4853A"],
  [/yellow|butter|lemon/i, "#E4C24B"],
  [/grey|gray|smoke|dove|pewter|stone|slate/i, "#7A7A78"],
  [/taupe|mushroom|fawn/i, "#8C7762"],
  [/nude|skin|bone/i, "#D9C0A6"],
];

function ensureHex(hex: string | undefined, name: string): string {
  const raw = (hex ?? "").trim();
  if (raw && /^#?[0-9a-fA-F]{6}$/.test(raw)) {
    return (raw.startsWith("#") ? raw : `#${raw}`).toUpperCase();
  }
  const n = name ?? "";
  for (const [re, h] of NAMED_COLORS) if (re.test(n)) return h;
  // Last resort: deterministic, name-derived muted tone (never #CCCCCC).
  let hash = 0;
  for (let i = 0; i < n.length; i++) hash = (hash * 31 + n.charCodeAt(i)) | 0;
  const h = ((hash >>> 0) % 360);
  return hslToHex(h, 38, 48);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

// Normalise pillar/lifestyle values to integer percentages summing to 100.
// Handles both fractional (0..1) and percent (0..100) inputs from the model.
function normalizePercents(
  obj: Record<string, unknown>,
  keys: string[],
): Record<string, number> {
  const vals: Record<string, number> = {};
  let total = 0;
  for (const k of keys) {
    const v = Number((obj as Record<string, unknown>)[k]);
    const n = Number.isFinite(v) && v > 0 ? v : 0;
    vals[k] = n;
    total += n;
  }
  if (total <= 0) {
    // No signal — return equal split so the UI still renders something.
    const even = Math.floor(100 / keys.length);
    const out: Record<string, number> = {};
    for (const k of keys) out[k] = even;
    out[keys[0]] += 100 - even * keys.length;
    return out;
  }
  const scaled: Record<string, number> = {};
  let rounded = 0;
  for (const k of keys) {
    scaled[k] = Math.round((vals[k] / total) * 100);
    rounded += scaled[k];
  }
  // Drift correction so the set sums to exactly 100.
  if (rounded !== 100) {
    const topKey = keys.reduce((a, b) => (scaled[a] >= scaled[b] ? a : b));
    scaled[topKey] += 100 - rounded;
  }
  return scaled;
}
