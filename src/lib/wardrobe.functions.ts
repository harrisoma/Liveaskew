import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listWardrobeItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { category?: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let query = supabase
      .from("wardrobe_items")
      .select("id, name, brand, category, subcategory, color, pattern, season, tags, photo_path, notes, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data.category && data.category !== "All") {
      query = query.eq("category", data.category);
    }
    const { data: items, error } = await query;
    if (error) throw error;
    return { items: items ?? [] };
  });
