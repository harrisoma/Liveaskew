import { createFileRoute } from "@tanstack/react-router";
import { notifyBeeRecommendation, userIdFromAuthHeader } from "@/lib/push.server";

export const Route = createFileRoute("/api/push/recommend")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await userIdFromAuthHeader(request);
        if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });
        const result = await notifyBeeRecommendation(userId);
        return Response.json({ ok: true, ...result });
      },
    },
  },
});
