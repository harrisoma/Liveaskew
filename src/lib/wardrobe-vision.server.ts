import { generateText } from "ai";
import { createOnixusAiGatewayProvider } from "@/lib/ai-gateway.server";
import {
  parseGarmentSight,
  type GarmentSight,
} from "@/mobile/lib/wardrobe-reset";

const VISION_MODEL = "google/gemini-2.5-flash";

const IDENTIFY_PROMPT = `You are Bee, a senior stylist looking at ONE uploaded garment photo.
Identify only what the photograph actually shows. Do not guess from a fixed list. Do not invent a trendy name.

Return STRICT JSON only, no markdown:
{"label": string (short name of the actual piece, e.g. "navy wool trouser"),
 "type": string (garment type: shirt, trouser, jean, dress, knit, jacket, etc.),
 "fabric": string (what the cloth looks and likely feels like — wool, silk, linen, cotton, stretch jersey, polyester shine, stiff, scratchy…),
 "fit": string (fit signals you can see — skinny, tight, oversized, slouch, structured, wrap, tailored…),
 "notes": string (any logo, stretch, shine, evening, wrap, or other Fit/Feel/Fabric signals)}`;

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
  const gateway = createOnixusAiGatewayProvider(apiKey);
  const { text } = await generateText({
    model: gateway(VISION_MODEL),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: IDENTIFY_PROMPT },
          { type: "image", image: photoDataUrl },
        ],
      },
    ],
  });
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
