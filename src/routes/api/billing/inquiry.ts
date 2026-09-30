import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";

type Body = { note?: string; phone?: string };

/** The Private Atelier is by inquiry: record it for the styling team to follow up. */
export const Route = createFileRoute("/api/billing/inquiry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        if (caller === "preview") {
          return Response.json({ error: "sign_in_required" }, { status: 401 });
        }
        const body = (await request.json().catch(() => ({}))) as Body;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(caller);
        const email = userData?.user?.email ?? "";
        const phone = body.phone?.trim() || userData?.user?.phone || "";
        const { error } = await supabaseAdmin.from("personal_styling_inquiries").insert({
          email,
          full_name: email || phone || caller,
          phone,
          preferred_contact: email ? "email" : "phone",
          what_she_needs: (body.note?.trim() || "Private Atelier inquiry from the Bee app").slice(
            0,
            2000,
          ),
        });
        if (error) return Response.json({ error: "inquiry_failed" }, { status: 503 });
        return Response.json({ ok: true });
      },
    },
  },
});
