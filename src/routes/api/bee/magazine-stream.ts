import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { streamText } from "ai";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { getStyleFeedbackSummary, buildFeedbackPromptBlock } from "@/lib/feedback.functions";

const MAGAZINE_MODEL = "google/gemini-2.5-pro";

const SYSTEM_PROMPT = `You are Bee, a senior personal stylist composing a monthly style magazine for ONE member.

OUTPUT CONTRACT (strict):
- You must output a single, minified, valid JSON object.
- Do not wrap the JSON in markdown code fences (no \`\`\`json).
- Do not include any conversational filler text, preamble, or trailing commentary.
- Start with { and end with }.

Shape:
{"edition_title":string,"north_star":string,"looks":[ exactly 4 look objects ]}

Each look object:
{
 "name": string,
 "occasion": string,
 "season": "spring"|"summer"|"fall"|"winter"|"transitional",
 "style_prompt": string (vivid prompt for an image model: single model, full body, neutral studio, soft natural light),
 "notes": string (1-2 short editorial sentences),
 "items": [ 3-7 garment objects: { "name": string, "category": "top"|"bottom"|"dress"|"outerwear"|"shoes"|"bag"|"accessory"|"jewelry"|"layer", "color": string, "recommended_fit": "fitted"|"tailored"|"skim"|"relaxed"|"oversized"|"structured"|"fluid" } ]
}

Rules: respect the member's sizing, climate, palette, and budget band. Never invent prices. Never use emoji.`;

export const Route = createFileRoute("/api/bee/magazine-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length);

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !LOVABLE_API_KEY) {
          return new Response("Server not configured", { status: 500 });
        }

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
        if (claimsError || !claimsData?.claims?.sub) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = claimsData.claims.sub as string;

        const [{ data: profile }, { data: styleProfile }, { data: onboarding }] =
          await Promise.all([
            supabase
              .from("profiles")
              .select(
                "display_name, size_top, size_bottom, size_shoe, size_bra, height_cm, body_shape, location, climate, budget_band, preferred_currency, time_zone",
              )
              .eq("id", userId)
              .maybeSingle(),
            supabase
              .from("style_profiles")
              .select("color_palette, color_season, pillar_weights, lifestyle_mix, north_star")
              .eq("user_id", userId)
              .maybeSingle(),
            supabase
              .from("bee_onboarding_responses")
              .select("question_id, pillar, choice, note")
              .eq("user_id", userId),
          ]);

        const userPrompt = `Member profile (sizing-aware, climate-aware, budget-aware):
${JSON.stringify(profile ?? {}, null, 2)}

Derived style profile (palette + pillars + north star):
${JSON.stringify(styleProfile ?? {}, null, 2)}

Onboarding answers (Fit · Feel · Fabric):
${JSON.stringify(onboarding ?? [], null, 2)}

Generate this month's magazine for this member now. Output only the JSON object.`;

        const feedbackSummary = await getStyleFeedbackSummary(supabase, userId);
        const feedbackBlock = buildFeedbackPromptBlock(feedbackSummary);
        const systemPrompt = SYSTEM_PROMPT + feedbackBlock;

        const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);

        let result;
        try {
          result = streamText({
            model: gateway(MAGAZINE_MODEL),
            system: systemPrompt,
            prompt: userPrompt,
          });
        } catch (err) {
          console.error("magazine stream init error", err);
          return new Response("Magazine stream failed to start", { status: 500 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const delta of result.textStream) {
                if (!delta) continue;
                controller.enqueue(encoder.encode(delta));
              }
            } catch (err) {
              console.error("magazine stream error", err);
              controller.error(err);
              return;
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      },
    },
  },
});
