import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { z } from "zod";
import { createOnixusAiGatewayProvider } from "@/lib/ai-gateway.server";
import { requireApiUser } from "@/lib/api-auth.server";
import { guardAi } from "@/lib/entitlement.server";
import { parseLooks } from "@/lib/bee-looks";

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
  count: z.number().int().min(1).max(4).default(3),
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

Return ONLY a JSON array of ${body.count} looks. Each look:
{"title": short name, "occasion": 1-3 words, "formula": 3-6 specific garments with cloth and colour, "fit": how it sits on their body, "feel": how they will feel, "fabric": what the cloth does, "palette": 2-4 hex colours like "#1a1a1a"}`;
}

const SYSTEM = `You are Bee, LiveAskew's personal stylist. You style from Fit, Feel, and Fabric. Clothes follow the body the person has — never slim, reshape, or suggest changing their body. Respect covering, heritage, climate, and budget exactly as they state them. LiveAskew dresses women: lean feminine — dresses, skirts, silk and soft blouses, wrap shapes, soft colour, delicate gold jewellery, heels or pretty flats — unless she asks for something else. Name real garment types and cloth; never invent brands, prices, or stock. Plain, considered language. Never use: "wardrobe staple", "versatile piece", "must-have", "elevate", "effortlessly chic", "timeless classic", "flattering", "stunning", "on-trend". No emoji.`;

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
            prompt: prompt(body),
          });
          const looks = parseLooks(text, body.count);
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
