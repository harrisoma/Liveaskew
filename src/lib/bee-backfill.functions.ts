import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type BackfillResult = {
  ok: boolean;
  messageCount: number;
  ran: boolean;
  reason?: string;
  onboardingCount?: number;
  styleProfileSaved?: boolean;
};

export const backfillMyStyleFromBee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BackfillResult> => {
    const { supabase, userId } = context;

    const { data: msgs, error } = await supabase
      .from("bee_messages")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true })
      .limit(400);

    if (error) {
      return { ok: false, messageCount: 0, ran: false, reason: error.message };
    }
    if (!msgs || msgs.length < 2) {
      return { ok: true, messageCount: msgs?.length ?? 0, ran: false, reason: "not enough history" };
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false, messageCount: msgs.length, ran: false, reason: "missing LOVABLE_API_KEY" };
    }

    const transcript = msgs.map((m) => ({
      role: m.role as "user" | "assistant",
      content: typeof m.content === "string" ? m.content : "",
    }));

    const { extractAndPersistBeeSignals } = await import("@/lib/bee-extract.server");
    let extracted: { onboardingCount: number; styleProfileSaved: boolean };
    try {
      extracted = await extractAndPersistBeeSignals({
        supabase: supabase as never,
        userId,
        apiKey,
        transcript,
      });
    } catch (err) {
      return {
        ok: false,
        messageCount: msgs.length,
        ran: false,
        reason: err instanceof Error ? err.message : "extractor failed",
      };
    }

    return {
      ok: true,
      messageCount: msgs.length,
      ran: true,
      onboardingCount: extracted.onboardingCount,
      styleProfileSaved: extracted.styleProfileSaved,
    };
  });
