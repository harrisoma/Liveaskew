import { BEE_VOICE } from "@/lib/bee-voice";
import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { z } from "zod";
import { createOnixusAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireApiUser } from "@/lib/api-auth.server";
import { guardAi } from "@/lib/entitlement.server";
import { completeWeeklyGuide, parseLooks } from "@/lib/bee-looks";

const BEE_MODEL = "google/gemini-2.5-flash";

const bodySchema = z.object({
  interview: z.record(z.string().max(600)).default({}),
  occasion: z
    .object({
      title: z.string().trim().min(1).max(160),
      date: z.string().max(20).optional(),
      kind: z.string().max(20).optional(),
    })
    .optional(),
  count: z.number().int().min(1).max(7).default(3),
});

function prompt(body: z.infer<typeof bodySchema>): string {
  const answers = Object.entries(body.interview)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
  const occasion = body.occasion
    ? `Dress them for this calendar item: "${body.occasion.title}"${body.occasion.date ? ` on ${body.occasion.date}` : ""}. Every look must suit it.`
    : "Build a first Style Guide: distinct looks across the life they described.";
  return `Their Fit / Feel / Fabric interview, in their words:
${answers || "- (no answers yet)"}

${occasion}

Return ONLY valid JSON in this exact structure:
{"looks":[{"title":"Ivory workday","occasion":"Work","formula":["Ivory cotton blouse","Navy straight trousers","Black leather loafers","Tan tote bag"],"fit":"Room through your waist and hips.","feel":"Comfortable and composed.","fabric":"Breathable cotton with a soft drape.","palette":["#f4efe6","#18213b"]}]}

The looks array must contain exactly ${body.count} complete objects, never fewer. ${body.count === 7 ? "One different outfit for Day 1 through Day 7, in order. Use seven unique titles and seven different complete outfit formulas. Match the normal week and occasions described." : "Every outfit must suit the occasion."}
Each formula MUST be an array of 4 to 6 short strings: clothing, a specific pair of shoes, and at least one appropriate bag, jewellery, belt, scarf or hat. Give cloth and colour. Keep every formula piece under 8 words. Keep title under 8 words, occasion under 4 words, and EACH fit/feel/fabric note under 14 words. Use exactly 2 hex palette colours. No extra fields, markdown, comments, explanations or ellipses. Reuse individual pieces sensibly; never repeat an entire outfit.`;
}

const SYSTEM = `You are Bee, LiveAskew's personal stylist. You style from Fit, Feel, and Fabric. Clothes follow the body the person has — never slim, reshape, or suggest changing their body. Respect covering, heritage, climate, and budget exactly as they state them. LiveAskew dresses women: lean feminine — dresses, skirts, silk and soft blouses, wrap shapes, soft colour, delicate gold jewellery, heels or pretty flats — unless she asks for something else. Name real garment types and cloth; never invent brands, prices, or stock. Write every look note to her as "you", like a friend with great taste: warm, specific, a little playful.

${BEE_VOICE}`;

export const Route = createFileRoute("/api/bee/looks")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        const denied = await guardAi(caller, "looks");
        if (denied) return denied;

        const key = process.env.ONIXUS_AI_API_KEY;
        if (!key) return Response.json({ error: "not_configured" }, { status: 503 });

        let body: z.infer<typeof bodySchema>;
        try {
          body = bodySchema.parse(await request.json());
        } catch {
          return Response.json({ error: "invalid_body" }, { status: 400 });
        }

        try {
          const gateway = createOnixusAiGatewayProvider(key);
          const { text } = await generateText({
            model: gateway(BEE_MODEL),
            system: SYSTEM,
            maxOutputTokens: 4000,
            temperature: 0.2,
            prompt: prompt(body),
          });
          const looks = parseLooks(text, body.count);
          if (body.count === 7 && !completeWeeklyGuide(looks)) {
            console.warn("[bee/looks] incomplete guide", {
              validLooks: looks.length,
              responseCharacters: text.length,
            });
            return Response.json({ error: "incomplete_weekly_guide" }, { status: 502 });
          }
          if (looks.length === 0) return Response.json({ error: "no_looks" }, { status: 502 });
          return Response.json({ looks });
        } catch (err) {
          console.error("[bee/looks] generate failed", err);
          return Response.json({ error: "bee_unavailable" }, { status: 503 });
        }
      },
    },
  },
});
