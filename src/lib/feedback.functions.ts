import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SubmitFeedbackSchema = z.object({
  look_id: z.string().uuid().nullable().optional(),
  profile_id: z.string().uuid().nullable().optional(),
  image_url: z.string().max(2000).nullable().optional(),
  status: z.enum(["approved", "rejected"]),
  style_metadata: z.record(z.string(), z.unknown()).default({}),
});

export const submitLookFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SubmitFeedbackSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("user_look_feedback").upsert(
      {
        user_id: userId,
        profile_id: data.profile_id ?? null,
        look_id: data.look_id ?? null,
        image_url: data.image_url ?? null,
        status: data.status,
        // Drizzle of JSON — cast through unknown to satisfy generated Json type
        style_metadata: data.style_metadata as unknown as Database["public"]["Tables"]["user_look_feedback"]["Insert"]["style_metadata"],
      },
      { onConflict: "user_id,profile_id,look_id,status" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Server-only helper (no createServerFn export — invoked from other server fns / routes)
export async function getStyleFeedbackSummary(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const [{ data: approved }, { data: rejected }] = await Promise.all([
    supabase
      .from("user_look_feedback")
      .select("style_metadata, created_at")
      .eq("user_id", userId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("user_look_feedback")
      .select("style_metadata, created_at")
      .eq("user_id", userId)
      .eq("status", "rejected")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  return {
    approved: (approved ?? []).map((r) => r.style_metadata),
    rejected: (rejected ?? []).map((r) => r.style_metadata),
  };
}

export function buildFeedbackPromptBlock(summary: {
  approved: unknown[];
  rejected: unknown[];
}): string {
  if (!summary.approved.length && !summary.rejected.length) return "";
  return `\n\n[Member Feedback Signal — adapt your styling accordingly]
Top approved style patterns (favour these traits — colors, silhouettes, brands, cuts):
${JSON.stringify(summary.approved, null, 2)}

Top rejected style patterns (BLACKLIST — never propose garments matching these archetypes):
${JSON.stringify(summary.rejected, null, 2)}

Honour this signal strictly: amplify approved traits and refuse to recommend anything matching rejected archetypes.`;
}
