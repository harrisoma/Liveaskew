import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import { confirmAccounts } from "@/lib/buzz/confirm.server";

/** Second half of Buzz connect: the signed-in app confirms the account it just approved. */
export const Route = createFileRoute("/api/buzz/finish")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const caller = await requireApiUser(request);
        if (caller instanceof Response) return caller;
        if (caller === "preview") {
          return Response.json({ error: "sign_in_required" }, { status: 401 });
        }
        const body = (await request.json().catch(() => ({}))) as { token?: string };
        const token = body.token?.trim();
        if (!token) return Response.json({ error: "missing_token" }, { status: 400 });
        const result = await confirmAccounts(token, caller);
        if (!result.ok) {
          return Response.json(
            { error: result.error },
            { status: result.error === "wrong_account" ? 403 : 410 },
          );
        }
        return Response.json({ ok: true, networks: result.networks });
      },
    },
  },
});
