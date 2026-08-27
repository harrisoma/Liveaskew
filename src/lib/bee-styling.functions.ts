import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type DB = SupabaseClient<Database>;



async function loadStylingContext(supabase: DB, userId: string) {
  const [{ data: profile }, { data: styleProfile }, { data: onboarding }] = await Promise.all([
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
    supabase
      .from("bee_onboarding_responses")
      .select("question_id, pillar, choice, note")
      .eq("user_id", userId),
  ]);
  return { profile, styleProfile, onboarding };
}

// ──────────────────────────────────────────────────────────────────────────────
// Streaming context — the magazine page hits /api/bee/magazine-stream which
// streams raw JSON text from Gemini. After the client finishes accumulating
// + parsing, it calls persistMagazineLooks below with the structured payload.
// ──────────────────────────────────────────────────────────────────────────────

export const getMagazineStylingContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    return await loadStylingContext(supabase, userId);
  });

const ClientLookItemSchema = z.object({
  name: z.string().min(1).max(160),
  category: z.string().min(1).max(40).nullable().optional(),
  color: z.string().max(120).nullable().optional(),
  recommended_fit: z.string().max(40).nullable().optional(),
});

const ClientLookSchema = z.object({
  name: z.string().min(1).max(160),
  occasion: z.string().max(200).nullable().optional(),
  season: z.string().max(40).nullable().optional(),
  style_prompt: z.string().min(10).max(4000),
  notes: z.string().max(2000).nullable().optional(),
  items: z.array(ClientLookItemSchema).max(12).default([]),
});

const PersistMagazineInputSchema = z.object({
  edition_title: z.string().max(200).nullable().optional(),
  north_star: z.string().max(400).nullable().optional(),
  looks: z.array(ClientLookSchema).min(1).max(8),
});

export const persistMagazineLooks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => PersistMagazineInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const createdLookIds: string[] = [];

    for (const look of data.looks) {
      const { data: lookRow, error: lookErr } = await supabase
        .from("looks")
        .insert({
          user_id: userId,
          name: look.name,
          occasion: look.occasion ?? null,
          season: look.season ?? null,
          notes: `${look.notes ?? ""}\n\nStyle prompt: ${look.style_prompt}`.trim(),
        })
        .select("id")
        .single();
      if (lookErr || !lookRow) {
        console.error("Failed to persist look", lookErr);
        continue;
      }
      const lookId = lookRow.id as string;
      createdLookIds.push(lookId);

      if (look.items.length) {
        const itemRows = look.items.map((it, idx) => ({
          user_id: userId,
          look_id: lookId,
          position: idx,
          name: it.name,
          category: it.category ?? null,
          color: it.color ?? null,
          recommended_fit: it.recommended_fit ?? null,
        }));
        await supabase.from("look_items").insert(itemRows);
      }
    }

    return {
      error: null as string | null,
      edition_title: data.edition_title ?? null,
      north_star: data.north_star ?? null,
      look_count: createdLookIds.length,
      look_ids: createdLookIds,
    };
  });


// ──────────────────────────────────────────────────────────────────────────────
// generateLookCover — render + persist a cover for a single look. Called
// sequentially from the client (one look at a time) so the serverless queue
// never holds more than one image generation open per user.
// ──────────────────────────────────────────────────────────────────────────────

const generateLookCoverSchema = z.object({
  lookId: z.string().uuid(),
  prompt: z.string().min(20).max(2000).optional(),
});

export const generateLookCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => generateLookCoverSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { data: own } = await supabase
      .from("looks")
      .select("id, notes, cover_photo_path")
      .eq("id", data.lookId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!own) throw new Error("Look not found");

    // If a cover already exists, return it without regenerating.
    if (own.cover_photo_path) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: signed } = await supabaseAdmin.storage
        .from("look-images")
        .createSignedUrl(own.cover_photo_path as string, 60 * 60);
      return {
        cover_photo_path: own.cover_photo_path as string,
        cover_url: signed?.signedUrl ?? null,
      };
    }

    let prompt = data.prompt;
    if (!prompt && own.notes) {
      const marker = "Style prompt:";
      const idx = (own.notes as string).indexOf(marker);
      if (idx >= 0) prompt = (own.notes as string).slice(idx + marker.length).trim();
    }
    if (!prompt || prompt.length < 20) throw new Error("Missing style prompt for look");

    const path = await renderAndStoreLookCover({
      userId,
      lookId: data.lookId,
      prompt,
    });
    if (!path) return { cover_photo_path: null, cover_url: null };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin.storage
      .from("look-images")
      .createSignedUrl(path, 60 * 60);
    return { cover_photo_path: path, cover_url: signed?.signedUrl ?? null };
  });

async function renderAndStoreLookCover(args: {
  userId: string;
  lookId: string;
  prompt: string;
}): Promise<string | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  // Non-streaming image generation via Lovable AI Gateway → Gemini image model.
  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{ role: "user", content: args.prompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Image gen failed", res.status, text);
    return null;
  }

  const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) {
    console.error("Image gen returned no b64_json");
    return null;
  }

  // Convert base64 → Uint8Array for the storage upload
  const binary = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  const path = `${args.userId}/${args.lookId}-${Date.now()}.png`;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error: upErr } = await supabaseAdmin.storage
    .from("look-images")
    .upload(path, binary, { contentType: "image/png", upsert: true });
  if (upErr) {
    console.error("Storage upload failed", upErr);
    return null;
  }

  await supabaseAdmin
    .from("looks")
    .update({ cover_photo_path: path })
    .eq("id", args.lookId)
    .eq("user_id", args.userId);

  return path;
}

// ──────────────────────────────────────────────────────────────────────────────
// listMagazineLooks — returns the user's looks + a short-lived signed URL
// for each cover image. Used by the /magazine route loader.
// ──────────────────────────────────────────────────────────────────────────────

export const listMagazineLooks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: looks } = await supabase
      .from("looks")
      .select("id, name, occasion, season, notes, cover_photo_path, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    const lookIds = (looks ?? []).map((l) => l.id as string);
    const { data: items } = lookIds.length
      ? await supabase
          .from("look_items")
          .select("look_id, name, category, color, recommended_fit, position")
          .in("look_id", lookIds)
          .order("position", { ascending: true })
      : { data: [] as Array<{ look_id: string; name: string | null; category: string | null; color: string | null; recommended_fit: string | null; position: number | null }> };

    // Signed URLs for private bucket covers
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const withUrls = await Promise.all(
      (looks ?? []).map(async (l) => {
        let cover_url: string | null = null;
        if (l.cover_photo_path) {
          const { data: signed } = await supabaseAdmin.storage
            .from("look-images")
            .createSignedUrl(l.cover_photo_path as string, 60 * 60); // 1h
          cover_url = signed?.signedUrl ?? null;
        }
        return {
          id: l.id as string,
          name: l.name as string | null,
          occasion: l.occasion as string | null,
          season: l.season as string | null,
          notes: l.notes as string | null,
          created_at: l.created_at as string,
          cover_url,
          items: (items ?? [])
            .filter((it) => it.look_id === l.id)
            .map((it) => ({
              name: it.name,
              category: it.category,
              color: it.color,
              recommended_fit: it.recommended_fit,
            })),
        };
      }),
    );

    return { looks: withUrls };
  });
