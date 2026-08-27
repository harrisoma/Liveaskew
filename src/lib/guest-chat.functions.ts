import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const migrateSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
});

type MigrateResult = { conversationId: string } | { error: string };

/**
 * Adopt a guest (pre-signup) transcript into the newly authenticated member's
 * own Bee conversation so the interview continues without a break.
 */
export const adoptGuestConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => migrateSchema.parse(data))
  .handler(async ({ data, context }): Promise<MigrateResult> => {
    const { supabase, userId } = context;

    const firstUser = data.messages.find((m) => m.role === "user");

    const { data: conv, error: convError } = await supabase
      .from("bee_conversations")
      .insert({ user_id: userId, title: (firstUser?.content ?? "First conversation").slice(0, 60) })
      .select("id")
      .single();

    if (convError || !conv) return { error: "Could not start your conversation." };

    const conversationId = conv.id as string;

    const { error: msgError } = await supabase.from("bee_messages").insert(
      data.messages.map((m) => ({
        conversation_id: conversationId,
        user_id: userId,
        role: m.role,
        content: m.content,
      })),
    );

    if (msgError) return { error: "Could not save your conversation." };

    return { conversationId };
  });
