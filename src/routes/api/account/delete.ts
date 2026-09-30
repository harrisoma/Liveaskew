import { createFileRoute } from "@tanstack/react-router";
import { deleteAccount } from "@/lib/account-delete.server";
import { requireApiUser } from "@/lib/api-auth.server";

/** In-app account deletion (App Store 5.1.1(v), Google Play account deletion policy). */
export const Route = createFileRoute("/api/account/delete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        if (caller === "preview") return Response.json({ ok: true, preview: true });
        const body = (await request.json().catch(() => ({}))) as { confirm?: string };
        if (body.confirm !== "DELETE") {
          return Response.json({ error: "confirmation_required" }, { status: 400 });
        }
        try {
          await deleteAccount(caller);
          return Response.json({ ok: true });
        } catch (err) {
          console.error("[account] delete failed", err);
          const message = err instanceof Error ? err.message : "";
          return Response.json(
            {
              error:
                message === "subscription_cancel_failed"
                  ? "subscription_cancel_failed"
                  : "delete_failed",
            },
            { status: 502 },
          );
        }
      },
    },
  },
});
