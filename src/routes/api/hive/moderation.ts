import { createFileRoute } from "@tanstack/react-router";
import { requireApiUser } from "@/lib/api-auth.server";
import { isHiveModerator, moderate, moderationQueue } from "@/lib/hive-moderation.server";

async function moderator(request: Request): Promise<string | Response> {
  const caller = await requireApiUser(request);
  if (caller instanceof Response) return caller;
  if (caller === "preview" || !(await isHiveModerator(caller))) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  return caller;
}

/** Admin-only review of reported Hive messages. */
export const Route = createFileRoute("/api/hive/moderation")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const userId = await moderator(request);
        if (userId instanceof Response) return userId;
        return Response.json({ items: await moderationQueue() });
      },
      POST: async ({ request }) => {
        const userId = await moderator(request);
        if (userId instanceof Response) return userId;
        const body = (await request.json().catch(() => ({}))) as { id?: string; action?: string };
        const action = body.action;
        if (!body.id || (action !== "keep" && action !== "remove" && action !== "ban")) {
          return Response.json({ error: "invalid_body" }, { status: 400 });
        }
        const result = await moderate(userId, body.id, action);
        return Response.json(result, { status: result.ok ? 200 : 400 });
      },
    },
  },
});
