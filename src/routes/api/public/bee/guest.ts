import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { BEE_GUEST_SYSTEM_PROMPT } from "@/lib/bee-guest-prompt";

const BEE_MODEL = "google/gemini-2.5-pro";

// Public, unauthenticated endpoint: keep the surface small.
// - transcript capped at 24 turns
// - each message capped at 2000 chars
const bodySchema = z.object({
  guestId: z.string().min(6).max(80),
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

export const Route = createFileRoute("/api/public/bee/guest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
        if (!LOVABLE_API_KEY) {
          return new Response("Server not configured", { status: 500 });
        }

        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }

        const messages: ModelMessage[] = parsed.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);
        let result;
        try {
          result = streamText({
            model: gateway(BEE_MODEL),
            system: BEE_GUEST_SYSTEM_PROMPT,
            messages,
          });
        } catch (err) {
          console.error("Bee guest gateway init error", err);
          return new Response("Bee could not respond.", { status: 500 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            try {
              for await (const delta of result.textStream) {
                if (!delta) continue;
                controller.enqueue(
                  encoder.encode(`event: delta\ndata: ${JSON.stringify({ t: delta })}\n\n`),
                );
              }
              controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
            } catch (err) {
              console.error("Bee guest stream error", err);
              controller.enqueue(
                encoder.encode(
                  `event: error\ndata: ${JSON.stringify({ error: "Bee stream interrupted." })}\n\n`,
                ),
              );
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
