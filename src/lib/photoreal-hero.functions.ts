// Tier-aware photoreal HERO for the client Style Guide.
//
// Renders ONE full-length photoreal image of the client wearing their
// opening hero look, using their uploaded selfie as identity reference.
// Cached to the `style-illustrations` bucket at a deterministic path so
// repeat visits do not regenerate.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateIllustrationBytes } from "@/lib/generate-illustration.server";

const BUCKET = "style-illustrations";
const SIGNED_TTL = 60 * 60 * 24 * 7; // 7 days

function objectPath(userId: string, heroId: string): string {
  return `photoreal-hero/${userId}/${heroId}.png`;
}

async function trySignedUrl(
  supabase: Awaited<ReturnType<typeof getAdmin>>,
  path: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_TTL);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function objectExists(
  supabase: Awaited<ReturnType<typeof getAdmin>>,
  userId: string,
  heroId: string,
): Promise<boolean> {
  const { data } = await supabase.storage
    .from(BUCKET)
    .list(`photoreal-hero/${userId}`, { search: `${heroId}.png`, limit: 1 });
  return Boolean(data?.some((f) => f.name === `${heroId}.png`));
}

/** Return a signed URL for a cached photoreal hero, or null if none exists. */
export const getPhotorealHero = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { heroId: string }) => {
    if (!d?.heroId || typeof d.heroId !== "string") throw new Error("Missing heroId");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ url: string | null }> => {
    const admin = await getAdmin();
    const path = objectPath(context.userId, data.heroId);
    if (!(await objectExists(admin, context.userId, data.heroId))) {
      return { url: null };
    }
    return { url: await trySignedUrl(admin, path) };
  });

/**
 * Generate the photoreal hero (image-to-image against the user's selfie),
 * upload to storage, log to style_plate_generations, and return a signed URL.
 * Re-uses an existing cached image if one is already present.
 */
export const generatePhotorealHero = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { heroId: string; prompt: string }) => {
    if (!d?.heroId || !d?.prompt) throw new Error("Missing heroId/prompt");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ url: string; cached: boolean }> => {
    const admin = await getAdmin();
    const userId = context.userId;
    const path = objectPath(userId, data.heroId);

    // Reuse cache if present.
    if (await objectExists(admin, userId, data.heroId)) {
      const url = await trySignedUrl(admin, path);
      if (url) return { url, cached: true };
    }

    // Load selfie from storage.
    const { data: profile } = await admin
      .from("profiles")
      .select("selfie_photo_path")
      .eq("id", userId)
      .maybeSingle();
    const selfiePath = (profile?.selfie_photo_path as string | null) ?? null;
    if (!selfiePath) throw new Error("No selfie on file");

    const { data: selfieBlob, error: dlError } = await admin.storage
      .from("selfies")
      .download(selfiePath);
    if (dlError || !selfieBlob) {
      throw new Error(`Selfie download failed: ${dlError?.message ?? "no data"}`);
    }
    const refBytes = new Uint8Array(await selfieBlob.arrayBuffer());
    let refB64 = "";
    const chunk = 0x8000;
    for (let i = 0; i < refBytes.length; i += chunk) {
      refB64 += String.fromCharCode(...refBytes.subarray(i, i + chunk));
    }
    refB64 = btoa(refB64);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const startedAt = Date.now();
    const model = "openai/gpt-image-2";
    const kind = "photoreal_hero";

    const logAttempt = async (
      status: "completed" | "failed",
      extra: { error?: string },
    ) => {
      try {
        await admin.from("style_plate_generations").insert({
          user_id: userId,
          kind,
          model,
          prompt: data.prompt,
          status,
          attempts: 1,
          duration_ms: Date.now() - startedAt,
          error: extra.error ?? null,
        });
      } catch (e) {
        console.error("[photoreal-hero] db log failed", e);
      }
    };

    try {
      const result = await generateIllustrationBytes({
        prompt: data.prompt,
        apiKey,
        referenceImageB64: refB64,
        logPrefix: "[photoreal-hero]",
      });
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(path, result.bytes, {
          contentType: "image/png",
          upsert: true,
        });
      if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
      await logAttempt("completed", {});
      const url = await trySignedUrl(admin, path);
      if (!url) throw new Error("Signed URL failed");
      return { url, cached: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await logAttempt("failed", { error: msg });
      throw new Error(msg);
    }
  });
