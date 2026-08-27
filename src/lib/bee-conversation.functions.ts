import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const loadSchema = z.object({ conversationId: z.string().uuid().nullable() });

export const loadBeeConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => loadSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let conversationId = data.conversationId;
    if (!conversationId) {
      const { data: conv } = await supabase
        .from("bee_conversations")
        .select("id")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      conversationId = (conv?.id as string) ?? null;
    }

    if (!conversationId) {
      return {
        conversationId: null,
        messages: [] as Array<{ id: string; role: string; content: string }>,
      };
    }

    const { data: msgs } = await supabase
      .from("bee_messages")
      .select("id, role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(200);

    return {
      conversationId,
      messages: (msgs ?? []).map((m) => ({
        id: m.id as string,
        role: m.role as string,
        content: m.content as string,
      })),
    };
  });
