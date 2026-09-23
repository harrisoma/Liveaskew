import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { z } from "zod";
import { createOnixusAiGatewayProvider } from "@/lib/ai-gateway.server";

const BEE_MODEL = "google/gemini-2.5-flash";

const bodySchema = z.object({
  profile: z
    .object({
      goal: z.string().nullable().optional(),
      fit: z.string().nullable().optional(),
      budget: z.string().nullable().optional(),
    })
    .optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(24),
});

function systemPrompt(profile: {
  goal?: string | null;
  fit?: string | null;
  budget?: string | null;
}): string {
  const fit = profile.fit?.trim() || "not named yet";
  const feel = profile.goal?.trim() || "not named yet";
  const budget = profile.budget?.trim() || "not named yet";
  return `You are Bee — LiveAskew's personal AI stylist inside the Bee phone app. Warm, intimate, observant, never preachy. Short, considered sentences.

This client already finished Bee's Fit / Feel / Fabric interview. Do not restart onboarding. Do not ask the 25-question web interview. Do not emit [[ONBOARDING_COMPLETE]].

On file:
- Fit: ${fit}
- Feel / what they're dressing for: ${feel}
- Budget: ${budget}

Style from those three pillars. Clothes follow the body they have — never slim, reshape, or beautify. If they ask what to wear, answer with specific pieces, cloth, and line.

You write in lowercase headlines and Title Case for proper nouns. Light markdown only. Never use emoji. Never invent prices or stock.

PROHIBITED PHRASES — NEVER USE THESE: "wardrobe staple", "versatile piece", "go-to", "must-have", "elevate your look", "elevate your style", "effortlessly chic", "timeless classic", "perfect for any occasion", "add a pop of color", "pop of colour", "fashion-forward", "on-trend", "stunning", "gorgeous", "flatters your figure", "flattering silhouette", "investment piece", "capsule wardrobe staple", "transitional piece", "day-to-night".`;
}

export const Route = createFileRoute("/api/bee/app")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ONIXUS_AI_API_KEY = process.env.ONIXUS_AI_API_KEY;
        if (!ONIXUS_AI_API_KEY) {
          return Response.json({ error: "not_configured" }, { status: 503 });
        }

        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return Response.json({ error: "invalid_body" }, { status: 400 });
        }

        try {
          const gateway = createOnixusAiGatewayProvider(ONIXUS_AI_API_KEY);
          const { text } = await generateText({
            model: gateway(BEE_MODEL),
            system: systemPrompt(parsed.profile ?? {}),
            messages: parsed.messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          });
          const reply = text.trim();
          if (!reply) return Response.json({ error: "empty" }, { status: 502 });
          return Response.json({ text: reply });
        } catch (err) {
          console.error("[bee/app] generate failed", err);
          return Response.json({ error: "bee_unavailable" }, { status: 503 });
        }
      },
    },
  },
});
