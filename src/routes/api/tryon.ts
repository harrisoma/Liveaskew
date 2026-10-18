import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/api-auth.server";
import { renderOwnedLook } from "@/lib/tryon-job.server";
const input = z.object({
  lookId: z.string().min(1).max(120),
  selfieDataUrl: z.string().max(3500000),
  retry: z.boolean().optional(),
});
export const Route = createFileRoute("/api/tryon")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await requireApiUser(request);
        if (user instanceof Response) return user;
        const body = input.safeParse(await request.json().catch(() => null));
        if (!body.success) return Response.json({ error: "invalid_request" }, { status: 400 });
        try {
          return await renderOwnedLook(user, body.data);
        } catch {
          return Response.json({ error: "tryon_unavailable" }, { status: 502 });
        }
      },
    },
  },
});
