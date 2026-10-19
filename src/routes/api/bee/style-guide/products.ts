import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import { supabaseAdmin as db } from "@/integrations/supabase/client.server";
import { blueprintSchema } from "@/lib/style-blueprint";
import { readShoppingProfile } from "@/lib/shopping-profile";
import { matchRetailProducts } from "@/lib/retail-products.server";
export const Route = createFileRoute("/api/bee/style-guide/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await requireApiUser(request);
        if (user instanceof Response) return user;
        const [guide, style] = await Promise.all([
          db.from("style_blueprints").select("document").eq("user_id", user).maybeSingle(),
          db.from("member_style").select("interview").eq("user_id", user).maybeSingle(),
        ]);
        if (guide.error || style.error)
          return Response.json({ error: "shopping_unavailable" }, { status: 503 });
        if (!guide.data) return Response.json({ error: "style_guide_required" }, { status: 409 });
        const document = blueprintSchema.safeParse(guide.data.document);
        if (!document.success)
          return Response.json({ error: "invalid_saved_guide" }, { status: 503 });
        const matches = await matchRetailProducts(
          document.data.capsule,
          readShoppingProfile((style.data?.interview ?? {}) as Record<string, unknown>),
        );
        return Response.json(matches, { headers: { "Cache-Control": "private, no-store" } });
      },
    },
  },
});
