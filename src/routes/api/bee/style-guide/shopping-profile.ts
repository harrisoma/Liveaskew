import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import { supabaseAdmin as db } from "@/integrations/supabase/client.server";
import { shoppingProfileSchema, readShoppingProfile } from "@/lib/shopping-profile";
export const Route = createFileRoute("/api/bee/style-guide/shopping-profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await requireApiUser(request);
        if (user instanceof Response) return user;
        const { data, error } = await db
          .from("member_style")
          .select("interview")
          .eq("user_id", user)
          .maybeSingle();
        if (error) return Response.json({ error: "interview_unavailable" }, { status: 503 });
        return Response.json(
          { profile: readShoppingProfile((data?.interview ?? {}) as Record<string, unknown>) },
          { headers: { "Cache-Control": "private, no-store" } },
        );
      },
      POST: async ({ request }) => {
        const user = await requireApiUser(request);
        if (user instanceof Response) return user;
        const parsed = shoppingProfileSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success)
          return Response.json({ error: "invalid_shopping_details" }, { status: 400 });
        const existing = await db
          .from("member_style")
          .select("interview")
          .eq("user_id", user)
          .maybeSingle();
        if (existing.error)
          return Response.json({ error: "interview_unavailable" }, { status: 503 });
        if (!existing.data) return Response.json({ error: "interview_required" }, { status: 409 });
        const saved = await db
          .from("member_style")
          .update({
            interview: {
              ...(existing.data.interview as Record<string, string>),
              shopping: JSON.stringify(parsed.data),
            },
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user);
        return saved.error
          ? Response.json({ error: "interview_save_failed" }, { status: 503 })
          : Response.json({ saved: true }, { headers: { "Cache-Control": "private, no-store" } });
      },
    },
  },
});
