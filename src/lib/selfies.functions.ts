import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PathSchema = z.object({
  path: z.string().trim().min(1).max(512),
});

const FamilyPathSchema = z.object({
  id: z.string().uuid(),
  path: z.string().trim().min(1).max(512).nullable(),
});

const ClearFamilySchema = z.object({ id: z.string().uuid() });

const SignSchema = z.object({
  path: z.string().trim().min(1).max(512),
});

function assertOwnedPath(path: string, userId: string) {
  if (!path.startsWith(`${userId}/`)) {
    throw new Error("Forbidden: path is not owned by current user");
  }
}

export const getMySelfies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: family }] = await Promise.all([
      supabase.from("profiles").select("selfie_photo_path, tier").eq("id", userId).maybeSingle(),
      supabase
        .from("family_profiles")
        .select("id, selfie_photo_path")
        .eq("user_id", userId),
    ]);
    return {
      tier: (profile?.tier as string | null) ?? null,
      primaryPath: (profile?.selfie_photo_path as string | null) ?? null,
      family: (family ?? []) as Array<{ id: string; selfie_photo_path: string | null }>,
    };
  });

export const getSelfieSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SignSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    assertOwnedPath(data.path, userId);
    const { data: signed, error } = await supabase.storage
      .from("selfies")
      .createSignedUrl(data.path, 60 * 60);
    if (error || !signed) throw error ?? new Error("Could not sign selfie URL");
    return { url: signed.signedUrl };
  });

export const setPrimarySelfie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PathSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    assertOwnedPath(data.path, userId);
    const { data: prev } = await supabase
      .from("profiles")
      .select("selfie_photo_path")
      .eq("id", userId)
      .maybeSingle();
    const { error } = await supabase
      .from("profiles")
      .update({ selfie_photo_path: data.path })
      .eq("id", userId);
    if (error) throw error;
    if (prev?.selfie_photo_path && prev.selfie_photo_path !== data.path) {
      await supabase.storage.from("selfies").remove([prev.selfie_photo_path as string]);
    }
    return { ok: true, path: data.path };
  });

export const clearPrimarySelfie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: prev } = await supabase
      .from("profiles")
      .select("selfie_photo_path")
      .eq("id", userId)
      .maybeSingle();
    const { error } = await supabase
      .from("profiles")
      .update({ selfie_photo_path: null })
      .eq("id", userId);
    if (error) throw error;
    if (prev?.selfie_photo_path) {
      await supabase.storage.from("selfies").remove([prev.selfie_photo_path as string]);
    }
    return { ok: true };
  });

export const setFamilySelfie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FamilyPathSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.path) assertOwnedPath(data.path, userId);
    const { data: prev } = await supabase
      .from("family_profiles")
      .select("selfie_photo_path")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!prev) throw new Error("Family profile not found");
    const { error } = await supabase
      .from("family_profiles")
      .update({ selfie_photo_path: data.path })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    if (prev.selfie_photo_path && prev.selfie_photo_path !== data.path) {
      await supabase.storage.from("selfies").remove([prev.selfie_photo_path as string]);
    }
    return { ok: true, path: data.path };
  });

export const clearFamilySelfie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ClearFamilySchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: prev } = await supabase
      .from("family_profiles")
      .select("selfie_photo_path")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!prev) throw new Error("Family profile not found");
    const { error } = await supabase
      .from("family_profiles")
      .update({ selfie_photo_path: null })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    if (prev.selfie_photo_path) {
      await supabase.storage.from("selfies").remove([prev.selfie_photo_path as string]);
    }
    return { ok: true };
  });
