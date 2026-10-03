import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TALK_TOPICS } from "@/lib/bee-talk";
import { beeReply } from "@/lib/bee-chat.server";
import { requireApiUser } from "@/lib/api-auth.server";
import { guardAi } from "@/lib/entitlement.server";

const bodySchema = z.object({
  /** Real Talk topic; absent means the usual styling chat. */
  topic: z.enum(TALK_TOPICS).optional(),
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

const STATUS = { not_configured: 503, empty: 502, bee_unavailable: 503 } as const;

export const Route = createFileRoute("/api/bee/app")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        const denied = await guardAi(caller, "chat");
        if (denied) return denied;
        if (!process.env.ONIXUS_AI_API_KEY) {
          return Response.json({ error: "not_configured" }, { status: 503 });
        }

        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return Response.json({ error: "invalid_body" }, { status: 400 });
        }

        const result = await beeReply({
          profile: parsed.profile ?? {},
          messages: parsed.messages,
          topic: parsed.topic,
        });
        if ("error" in result) {
          return Response.json({ error: result.error }, { status: STATUS[result.error] });
        }
        return Response.json({ text: result.text });
      },
    },
  },
});
