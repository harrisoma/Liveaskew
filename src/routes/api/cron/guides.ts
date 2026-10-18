import { createFileRoute } from "@tanstack/react-router";
import { processWeeklyGuides } from "@/lib/weekly-guide.server";
async function run(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(await processWeeklyGuides(), { headers: { "Cache-Control": "no-store" } });
}
export const Route = createFileRoute("/api/cron/guides")({
  server: { handlers: { GET: ({ request }) => run(request) } },
});
