// Photoreal Style Guide looks for the client.
//
// Renders a full-length photoreal image of the client wearing each look Bee
// selected in the interview (keyed by that look's heroId), using the uploaded
// selfie as identity reference. Cached to the `style-illustrations` bucket at
// a deterministic per-user, per-heroId path so repeat visits do not regenerate.
// Identity constraint is enforced in generateIllustrationBytes — never slim,
// reshape, or beautify the body.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateIllustrationBytes } from "@/lib/generate-illustration.server";

const BUCKET = "style-illustrations";
const SIGNED_TTL = 60 * 60 * 24 * 7; // 7 days

export type PhotorealLookInput = { heroId: string; prompt: string };
export type PhotorealLookResult = { heroId: string; url: string; cached: boolean };

function objectPath(userId: string, heroId: string): string {
  return `photoreal-hero/${userId}/${heroId}.png`;
}

function parseLooks(d: { heroId?: string; prompt?: string; looks?: PhotorealLookInput[] }): {
  looks: PhotorealLookInput[];
} {
  const fromSet = (d.looks ?? []).filter(
    (look): look is PhotorealLookInput =>
      typeof look?.heroId === "string" &&
      look.heroId.length > 0 &&
      typeof look?.prompt === "string" &&
      look.prompt.length > 0,
  );
  if (fromSet.length > 0) return { looks: fromSet };
  if (typeof d.heroId === "string" && d.heroId && typeof d.prompt === "string" && d.prompt) {
    return { looks: [{ heroId: d.heroId, prompt: d.prompt }] };
  }
  throw new Error("Missing heroId/prompt");
}

async function trySignedUrl(
  supabase: Awaited<ReturnType<typeof getAdmin>>,
  path: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
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

async function loadSelfieB64(
  admin: Awaited<ReturnType<typeof getAdmin>>,
  userId: string,
): Promise<string> {
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
  return btoa(refB64);
}

async function renderLook(opts: {
  admin: Awaited<ReturnType<typeof getAdmin>>;
  userId: string;
  look: PhotorealLookInput;
  selfieB64: string | null;
}): Promise<PhotorealLookResult> {
  const { admin, userId, look } = opts;
  const path = objectPath(userId, look.heroId);

  if (await objectExists(admin, userId, look.heroId)) {
    const url = await trySignedUrl(admin, path);
    if (url) return { heroId: look.heroId, url, cached: true };
  }

  const selfieB64 = opts.selfieB64 ?? (await loadSelfieB64(admin, userId));
  const apiKey = process.env.ONIXUS_AI_API_KEY;
  if (!apiKey) throw new Error("Missing ONIXUS_AI_API_KEY");

  const startedAt = Date.now();
  const model = "openai/gpt-image-2";
  const kind = "photoreal_hero";

  const logAttempt = async (status: "completed" | "failed", extra: { error?: string }) => {
    try {
      await admin.from("style_plate_generations").insert({
        user_id: userId,
        kind,
        model,
        prompt: look.prompt,
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
      prompt: look.prompt,
      apiKey,
      referenceImageB64: selfieB64,
      logPrefix: `[photoreal-hero:${look.heroId}]`,
    });
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, result.bytes, {
      contentType: "image/png",
      upsert: true,
    });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
    await logAttempt("completed", {});
    const url = await trySignedUrl(admin, path);
    if (!url) throw new Error("Signed URL failed");
    return { heroId: look.heroId, url, cached: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logAttempt("failed", { error: msg });
    throw new Error(msg);
  }
}

/** Return a signed URL for a cached photoreal look, or null if none exists. */
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
 * Generate photoreal look(s) (image-to-image against the user's selfie).
 * Pass `{ heroId, prompt }` for one look, or `{ looks: [{ heroId, prompt }, ...] }`
 * for the full set Bee selected. Each look is cached at
 * `photoreal-hero/{userId}/{heroId}.png` and reused when present.
 */
export const generatePhotorealHero = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { heroId?: string; prompt?: string; looks?: PhotorealLookInput[] }) =>
    parseLooks(d),
  )
  .handler(
    async ({
      data,
      context,
    }): Promise<{ url: string; cached: boolean; results: PhotorealLookResult[] }> => {
      const admin = await getAdmin();
      const userId = context.userId;
      const needsSelfie = [];
      for (const look of data.looks) {
        if (!(await objectExists(admin, userId, look.heroId))) needsSelfie.push(look);
      }
      const selfieB64 = needsSelfie.length > 0 ? await loadSelfieB64(admin, userId) : null;

      const results: PhotorealLookResult[] = [];
      for (const look of data.looks) {
        results.push(await renderLook({ admin, userId, look, selfieB64 }));
      }
      const first = results[0];
      if (!first) throw new Error("Missing heroId/prompt");
      return { url: first.url, cached: first.cached, results };
    },
  );
