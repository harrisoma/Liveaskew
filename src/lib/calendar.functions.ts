import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CreateEventSchema = z.object({
  title: z.string().trim().min(1).max(160),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().trim().max(2000).optional().nullable(),
});

const IdSchema = z.object({ id: z.string().uuid() });
const GenerateSchema = z.object({
  id: z.string().uuid(),
  acting_profile_id: z.string().uuid().nullable().optional(),
});

export const listCalendarEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("calendar_events")
      .select(
        "id, title, event_date, description, outfit_recommendation, recommendation_status, recommendation_error, created_at",
      )
      .eq("user_id", userId)
      .order("event_date", { ascending: true });
    if (error) throw error;
    return { events: data ?? [] };
  });

export const createCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateEventSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("calendar_events")
      .insert({
        user_id: userId,
        title: data.title,
        event_date: data.event_date,
        description: data.description ?? null,
        recommendation_status: "pending",
      })
      .select("id, title, event_date, description, outfit_recommendation, recommendation_status, recommendation_error, created_at")
      .single();
    if (error || !row) throw error ?? new Error("Failed to create event");
    return { event: row };
  });

export const deleteCalendarEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => IdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });

export const generateEventOutfit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => GenerateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: event, error: evErr } = await supabase
      .from("calendar_events")
      .select("id, title, event_date, description")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (evErr || !event) throw evErr ?? new Error("Event not found");

    // Optional acting profile (Platinum Plus household member)
    let familyBlock = "";
    if (data.acting_profile_id) {
      const { data: fam } = await supabase
        .from("family_profiles")
        .select("id, name, relationship, sizes, aesthetic_territory, notes")
        .eq("id", data.acting_profile_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (fam) {
        const { buildFamilyVoiceBlock } = await import("@/lib/family-context");
        familyBlock = buildFamilyVoiceBlock(fam);
      }
    }


    // Load styling context (Fit / Feel / Fabric profile)
    const [{ data: profile }, { data: styleProfile }, { data: onboarding }] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, size_top, size_bottom, size_shoe, height_cm, body_shape, location, climate, budget_band")
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

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { getStyleFeedbackSummary, buildFeedbackPromptBlock } = await import("@/lib/feedback.functions");
    const feedbackBlock = buildFeedbackPromptBlock(await getStyleFeedbackSummary(supabase, userId));

    const systemPrompt = `You are Bee — LiveAskew's personal AI stylist. Your voice is intimate, editorial, decisive, never generic.

STRICT VOICE RULES:
- Never use these prohibited phrases: "wardrobe staple", "versatile piece", "go-to", "must-have", "elevate your look", "effortlessly chic", "timeless classic", "perfect for any occasion".
- No bullet-point lists of generic advice. Speak in short, considered paragraphs as if dressing a friend.
- Be specific: name colours, fabrics, silhouettes, finishes. Reference the client's Fit / Feel / Fabric profile.
- Head-to-toe: outerwear (if needed), top, bottom (or dress), shoes, bag, one piece of jewellery, one finishing touch.
- 180–260 words. No headings. No emoji.${feedbackBlock}`;

    const userPrompt = `Review this event:
Title: ${event.title}
Date: ${event.event_date}
Context: ${event.description ?? "—"}

Client profile:
${JSON.stringify({ profile, styleProfile, onboarding }, null, 2)}

Provide a head-to-toe outfit recommendation using the client's saved Fit/Feel/Fabric profile.${familyBlock}`;

    let recommendation = "";
    let status: "ready" | "failed" = "ready";
    let errorMsg: string | null = null;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Lovable-API-Key": key,
          "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Gateway ${res.status}: ${body.slice(0, 200)}`);
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      recommendation = json.choices?.[0]?.message?.content?.trim() ?? "";
      if (!recommendation) throw new Error("Bee returned an empty recommendation.");
    } catch (err) {
      status = "failed";
      errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("[calendar] outfit generation failed", err);
    }

    const { data: updated, error: upErr } = await supabase
      .from("calendar_events")
      .update({
        outfit_recommendation: status === "ready" ? recommendation : null,
        recommendation_status: status,
        recommendation_error: errorMsg,
      })
      .eq("id", event.id)
      .eq("user_id", userId)
      .select("id, title, event_date, description, outfit_recommendation, recommendation_status, recommendation_error, created_at")
      .single();
    if (upErr) throw upErr;

    return { event: updated };
  });
