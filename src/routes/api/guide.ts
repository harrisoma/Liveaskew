import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/api-auth.server";
import { startWeeklyGuide, weeklyGuideStatus } from "@/lib/weekly-guide.server";
const input = z.object({
  lookIds: z.array(z.string().min(1).max(120)).length(7),
  selfieDataUrl: z.string().max(3500000),
});
export const Route = createFileRoute("/api/guide")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await requireApiUser(request);
        if (user instanceof Response) return user;
        const id = new URL(request.url).searchParams.get("id") ?? undefined;
        if (id && !z.string().uuid().safeParse(id).success)
          return Response.json({ error: "invalid_guide" }, { status: 400 });
        try {
          const guide = await weeklyGuideStatus(user, id);
          return Response.json(
            { guide },
            { status: id && !guide ? 404 : 200, headers: { "Cache-Control": "no-store" } },
          );
        } catch {
          return Response.json({ error: "guide_queue_unavailable" }, { status: 503 });
        }
      },
      POST: async ({ request }) => {
        const user = await requireApiUser(request);
        if (user instanceof Response) return user;
        const body = input.safeParse(await request.json().catch(() => null));
        if (!body.success) return Response.json({ error: "invalid_guide" }, { status: 400 });
        try {
          const guide = await startWeeklyGuide(user, body.data.lookIds, body.data.selfieDataUrl);
          return Response.json(
            { guide: { id: guide.id, status: guide.status } },
            { status: 202, headers: { "Cache-Control": "no-store" } },
          );
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "guide_queue_unavailable" },
            {
              status: e instanceof Error && e.message === "seven_owned_looks_required" ? 404 : 503,
            },
          );
        }
      },
    },
  },
});
