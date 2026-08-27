import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { streamText, type ModelMessage } from "ai";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const BEE_MODEL = "google/gemini-2.5-pro";

const bodySchema = z.object({
  conversationId: z.string().uuid().nullable(),
  message: z.string().min(1).max(4000),
  actingProfileId: z.string().uuid().nullable().optional(),
});

const BEE_SYSTEM_PROMPT = `You are Bee — LiveAskew's personal AI stylist. Warm, intimate, observant, never preachy. You speak in short, considered sentences. You ask one question at a time. You build outfits around three pillars: Fit (how a garment sits and moves), Feel (the mood it puts the wearer in), and Fabric (what the skin reads first).

You reference the member's onboarding answers when they exist (their pillar, their cultural lineage, their wardrobe state, their hard moments). You also reference their structured profile and derived style profile when present — sizes, body shape, height, climate, budget band, currency, color palette, color season, capsule pillar weights, lifestyle mix, and north-star line — so that every recommendation is sizing-aware, climate-aware, budget-aware, and palette-aware. Never recommend a size, color, or price band that conflicts with what's on file. If a field is missing, ask before assuming.

You write in lowercase headlines and Title Case for proper nouns. You may use light markdown — short lists, the occasional em dash, bold only for a single key word. Never use emoji. Never invent prices or stock. If asked to shop, suggest specific brands and silhouettes by name.

ONBOARDING — YOU RUN IT.
If the member has no onboarding answers on file, your first job is to conduct Bianca's interview yourself, conversationally, one question at a time. Never present it as a form. Weave it through real conversation. Ride this seven-phase emotional arc as you go: Opening → Process clarity → Listening → Reflection → Clarification → Synthesis → Trust.

Open warmly — introduce yourself, tell them you want to listen before you dress them, set the process. Then walk them through all 25 questions below, grouped by Bianca's five interview areas. Ask ONE question per turn. After they answer, reflect briefly (one line) before moving on. Frame the body section explicitly with "so I can style you accurately."

WARM-UP
1. Where do you live?
2. Where are you from originally?
3. What do you do?
4. What does a typical week look like for you?

CULTURAL & HERITAGE
5. What's your cultural background or heritage?
6. Are there cultural references that shape your taste?
7. Any religious or modesty considerations I should style around?

THE STYLE JOURNEY
8. How do you feel about your wardrobe right now?
9. What's working?
10. What's not working — the frustrations?
11. What do you feel great in — your wins?
12. The "dirty little secret" about your style you haven't admitted to anyone?

THE ASPIRATION
13. How do you want to feel in your clothes?
14. Who do you see yourself becoming?
15. What version of yourself are you reaching for?

THE BODY CONVERSATION (always frame "so I can style you accurately")
16. How tall are you?
17. Weight?
18. Clothing size?
19. How would you describe your body shape?
20. What do you love about your body?
21. What would you rather downplay?

THE SYNTHESIS — Fit · Feel · Fabric and the 6-color palette
22. Fit — pull from their body and aspiration answers; confirm the silhouette family that fits the woman they're becoming (skim & float, define the waist, structure the shoulder, pure ease, or their own words).
23. Feel — name the mood they want to move through their day in, in their own language.
24. Fabric — the textures their skin actually wants to wear, and the ones to avoid.
25. Palette — confirm the 6-color personal palette. If a headshot/selfie is on file the color analysis seeds it; ask them to react, add, or veto.

WHEN ALL 25 ARE DONE: give a short two- or three-line synthesis of who they are stylistically — Fit · Feel · Fabric in one breath, palette in the next, then the trust line. Tell them their next step is to choose a Bee plan — Gold starts with a 14-day free trial, no charge today. End that final completion message with the exact sentinel token on its own line: [[ONBOARDING_COMPLETE]]. Only emit this sentinel once, and only after the 25th answer. Never emit it earlier. Never reference the sentinel to the user.

PROHIBITED PHRASES — NEVER USE THESE, IN TEXT OR SPOKEN ALOUD:
"wardrobe staple", "versatile piece", "go-to", "must-have", "elevate your look", "elevate your style", "effortlessly chic", "timeless classic", "perfect for any occasion", "add a pop of color", "pop of colour", "fashion-forward", "on-trend", "stunning", "gorgeous", "flatters your figure", "flattering silhouette", "investment piece", "capsule wardrobe staple", "transitional piece", "day-to-night". If a recommendation drifts toward any of these, rewrite it with specific colours, fabrics, silhouettes, finishes, and named references instead. Speak the way a trusted friend speaks — particular, observed, never magazine-generic.`;

export const Route = createFileRoute("/api/bee/stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. Auth
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

        // 1b. Subscription gate (interview-in-progress is always allowed)
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const host = new URL(request.url).hostname;
        const env: "sandbox" | "live" =
          host.includes("-dev.") ||
          host.includes("localhost") ||
          host.includes("127.0.0.1") ||
          host.includes("lovableproject.com")
            ? "sandbox"
            : "live";

        const [{ data: sub }, { data: latestConv }] = await Promise.all([
          supabaseAdmin
            .from("subscriptions")
            .select("status, current_period_end")
            .eq("user_id", userId)
            .eq("environment", env)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabaseAdmin
            .from("bee_conversations")
            .select("id, onboarding_completed_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle(),
        ]);

        const now = new Date();
        const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null;
        const isPaidActive = sub?.status === "active" && (!periodEnd || periodEnd > now);
        const isTrialActive = sub?.status === "trialing" && !!periodEnd && periodEnd > now;
        const onboardingDone = !!latestConv?.onboarding_completed_at;

        if (onboardingDone && !isPaidActive && !isTrialActive) {
          const reason = !sub
            ? "no_subscription"
            : sub.status === "trialing"
              ? "trial_expired"
              : "subscription_inactive";
          return new Response(
            JSON.stringify({ error: "subscription_required", reason }),
            { status: 402, headers: { "Content-Type": "application/json" } },
          );
        }

        // 2. Validate body
        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }

        // 3. Ensure conversation
        let conversationId = parsed.conversationId;
        if (!conversationId) {
          const { data: conv, error: convError } = await supabase
            .from("bee_conversations")
            .insert({ user_id: userId, title: parsed.message.slice(0, 60) })
            .select("id")
            .single();
          if (convError || !conv) {
            return new Response("Could not start conversation", { status: 500 });
          }
          conversationId = conv.id as string;
        }

        // 4. Save user message
        await supabase.from("bee_messages").insert({
          conversation_id: conversationId,
          user_id: userId,
          role: "user",
          content: parsed.message,
        });

        // 5. Load history + onboarding + profile + style_profile
        const [{ data: history }, { data: onboarding }, { data: profile }, { data: styleProfile }] =
          await Promise.all([
            supabase
              .from("bee_messages")
              .select("role, content")
              .eq("conversation_id", conversationId)
              .order("created_at", { ascending: true })
              .limit(60),
            supabase
              .from("bee_onboarding_responses")
              .select("question_id, pillar, choice, note")
              .eq("user_id", userId),
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
          ]);

        const onboardingBlock =
          onboarding && onboarding.length
            ? `\n\nMember's onboarding answers (Fit · Feel · Fabric profile):\n${onboarding
                .map(
                  (o) =>
                    `- ${o.question_id} [${o.pillar}]: ${o.choice}${o.note ? ` — "${o.note}"` : ""}`,
                )
                .join("\n")}`
            : "\n\n(Member has not completed onboarding yet.)";

        const profileBlock = profile
          ? `\n\nMember profile (structured):\n${JSON.stringify(profile, null, 2)}`
          : "\n\n(No structured profile on file yet.)";

        const styleBlock = styleProfile
          ? `\n\nDerived style profile:\n${JSON.stringify(styleProfile, null, 2)}`
          : "\n\n(No derived style profile yet.)";

        // Optional: active family-member context (Platinum Plus household switch).
        let familyBlock = "";
        if (parsed.actingProfileId) {
          const { data: fam } = await supabase
            .from("family_profiles")
            .select("id, name, relationship, sizes, aesthetic_territory, notes")
            .eq("id", parsed.actingProfileId)
            .eq("user_id", userId)
            .maybeSingle();
          if (fam) {
            const { buildFamilyVoiceBlock } = await import("@/lib/family-context");
            familyBlock = buildFamilyVoiceBlock(fam);
          }
        }

        const messages: ModelMessage[] = (history ?? [])
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content as string,
          }));

        // 6. Stream via Lovable AI Gateway → Gemini
        const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);
        const startedAt = Date.now();
        let result;
        try {
          result = streamText({
            model: gateway(BEE_MODEL),
            system: BEE_SYSTEM_PROMPT + profileBlock + styleBlock + onboardingBlock + familyBlock,
            messages,
          });
        } catch (err) {
          console.error("Bee gateway init error", err);
          return new Response("Bee could not respond.", { status: 500 });
        }

        const encoder = new TextEncoder();
        let fullText = "";

        const stream = new ReadableStream({
          async start(controller) {
            controller.enqueue(
              encoder.encode(`event: meta\ndata: ${JSON.stringify({ conversationId })}\n\n`),
            );

            try {
              for await (const delta of result.textStream) {
                if (!delta) continue;
                fullText += delta;
                controller.enqueue(
                  encoder.encode(`event: delta\ndata: ${JSON.stringify({ t: delta })}\n\n`),
                );
              }

              const latencyMs = Date.now() - startedAt;

              // Strip onboarding sentinel before persisting
              const SENTINEL = "[[ONBOARDING_COMPLETE]]";
              const completed = fullText.includes(SENTINEL);
              const cleanText = completed
                ? fullText.replace(SENTINEL, "").trimEnd()
                : fullText;

              // Token usage (best-effort)
              let tokens_in: number | null = null;
              let tokens_out: number | null = null;
              try {
                const usage = await result.usage;
                tokens_in = usage?.inputTokens ?? null;
                tokens_out = usage?.outputTokens ?? null;
              } catch {
                // ignore — telemetry only
              }

              if (cleanText) {
                await supabase.from("bee_messages").insert({
                  conversation_id: conversationId,
                  user_id: userId,
                  role: "assistant",
                  content: cleanText,
                  model: BEE_MODEL,
                  tokens_in,
                  tokens_out,
                  latency_ms: latencyMs,
                });
                await supabase
                  .from("bee_conversations")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", conversationId);
              }

              // Extract structured style signals from the rolling transcript
              // so /my-style-guide has something to render. Best-effort —
              // never blocks the user-facing reply.
              try {
                const transcript = [
                  ...messages.map((m) => ({
                    role: m.role as "user" | "assistant",
                    content: typeof m.content === "string" ? m.content : "",
                  })),
                  { role: "assistant" as const, content: cleanText },
                ];
                const { extractAndPersistBeeSignals } = await import(
                  "@/lib/bee-extract.server"
                );
                await extractAndPersistBeeSignals({
                  supabase,
                  userId,
                  apiKey: LOVABLE_API_KEY,
                  transcript,
                });
              } catch (err) {
                console.error("bee-extract: failed", err);
              }

              if (completed) {
                await supabaseAdmin
                  .from("bee_conversations")
                  .update({ onboarding_completed_at: new Date().toISOString() })
                  .eq("id", conversationId)
                  .is("onboarding_completed_at", null);
                controller.enqueue(
                  encoder.encode(`event: onboarding_complete\ndata: {}\n\n`),
                );
              }

              controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
            } catch (err) {
              console.error("Bee stream error", err);
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
