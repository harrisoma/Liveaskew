import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SizesSchema = z
  .object({
    top: z.string().trim().max(40).optional(),
    bottom: z.string().trim().max(40).optional(),
    shoe: z.string().trim().max(40).optional(),
    dress: z.string().trim().max(40).optional(),
    notes: z.string().trim().max(200).optional(),
  })
  .partial();

const Relationship = z.enum(["husband", "wife", "partner", "child"]);

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  relationship: Relationship,
  sizes: SizesSchema.default({}),
  aesthetic_territory: z.string().trim().max(280).optional().nullable(),
  notes: z.string().trim().max(600).optional().nullable(),
});

const UpdateSchema = CreateSchema.partial().extend({
  id: z.string().uuid(),
});

const IdSchema = z.object({ id: z.string().uuid() });

export const listFamilyProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("family_profiles")
      .select("id, name, relationship, sizes, aesthetic_territory, notes, sort_order, created_at")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return { profiles: data ?? [] };
  });

export const createFamilyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => CreateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("family_profiles")
      .insert({
        user_id: userId,
        name: data.name,
        relationship: data.relationship,
        sizes: data.sizes ?? {},
        aesthetic_territory: data.aesthetic_territory ?? null,
        notes: data.notes ?? null,
      })
      .select("id, name, relationship, sizes, aesthetic_territory, notes, sort_order, created_at")
      .single();
    if (error || !row) throw error ?? new Error("Could not add family profile");
    return { profile: row };
  });

export const updateFamilyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => UpdateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, ...patch } = data;
    const { data: row, error } = await supabase
      .from("family_profiles")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId)
      .select("id, name, relationship, sizes, aesthetic_territory, notes, sort_order, created_at")
      .single();
    if (error || !row) throw error ?? new Error("Could not update family profile");
    return { profile: row };
  });

export const deleteFamilyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => IdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("family_profiles")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw error;
    return { ok: true };
  });
