import { getOnixusAiConfig, getOnixusAiHeaders } from "@/lib/ai-gateway.server";
import { parseGarmentSight, type GarmentSight } from "@/mobile/lib/wardrobe-reset";

const IDENTIFY_PROMPT = `You are Bee, a senior stylist looking at ONE uploaded wardrobe item: clothing, a pair of shoes, a bag, jewellery, a belt, a scarf or a hat.
Identify only what the photograph actually shows. Do not guess from a fixed list. Do not invent a trendy name. Do not claim exact fibre composition, comfort or how an unworn item fits a person from the photo alone. If it is unclear say uncertain. Describe visible damage without guessing.

Return STRICT JSON only, no markdown:
{"label": string (short name of the actual piece, e.g. "navy wool trouser"),
 "type": string (garment type: shirt, trouser, jean, dress, knit, jacket, etc.),
 "fabric": string (what the cloth looks and likely feels like — wool, silk, linen, cotton, stretch jersey, polyester shine, stiff, scratchy…),
 "fit": string (fit signals you can see — skinny, tight, oversized, slouch, structured, wrap, tailored…),
 "notes": string (visible condition, logo, stretch, shine, evening, wrap, or other Fit/Feel/Fabric signals),
 "category": "clothing" | "footwear" | "accessory"}`;

function parseJsonObject(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const m = trimmed.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]) as unknown;
    } catch {
      return null;
    }
  }
}

async function identifyViaN8n(photoDataUrl: string): Promise<GarmentSight | null> {
  const webhook = process.env.N8N_WARDROBE_WEBHOOK_URL?.trim();
  if (!webhook) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22_000);
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ photoDataUrl, task: "identify_garment" }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as unknown;
    return parseGarmentSight(json);
  } catch (err) {
    console.error("[wardrobe] n8n webhook failed", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function identifyViaOnixus(photoDataUrl: string): Promise<GarmentSight | null> {
  const apiKey = process.env.ONIXUS_AI_API_KEY;
  if (!apiKey || !process.env.ONIXUS_AI_BASE_URL || !process.env.ONIXUS_AI_ORGANIZATION_ID) {
    return null;
  }
  const config = getOnixusAiConfig();
  const mediaUrl = config.baseURL.replace(/\/onixus-ai-gateway(?:\/v1)?$/, "/liveaskew-media");
  if (mediaUrl === config.baseURL) throw Error("media_not_configured");
  const response = await fetch(mediaUrl, {
    method: "POST",
    headers: { ...getOnixusAiHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: IDENTIFY_PROMPT, photoDataUrl }),
    redirect: "error",
    signal: AbortSignal.timeout(65000),
  });
  if (!response.ok) return null;
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string") return null;
  return parseGarmentSight(parseJsonObject(text));
}

/** Identify the garment in the photo. Returns null if vision is unavailable — never a fake label. */
export async function identifyGarmentFromPhoto(photoDataUrl: string): Promise<GarmentSight | null> {
  const fromN8n = await identifyViaN8n(photoDataUrl);
  if (fromN8n) return fromN8n;
  try {
    return await identifyViaOnixus(photoDataUrl);
  } catch (err) {
    console.error("[wardrobe] vision identify failed", err);
    return null;
  }
}
