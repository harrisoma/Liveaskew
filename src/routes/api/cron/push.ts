import { createFileRoute } from "@tanstack/react-router";
import { runTrialCountdownPushes } from "@/lib/push.server";

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

async function run(request: Request): Promise<Response> {
  if (!cronAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runTrialCountdownPushes();
  return Response.json({ ok: true, ...result });
}

export const Route = createFileRoute("/api/cron/push")({
  server: {
    handlers: {
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});
