import { createFileRoute } from "@tanstack/react-router";
import { claimPost, publishClaimed, releaseStuckPosts } from "@/lib/buzz/store.server";

function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

/** Publish every Buzz post whose time has come. Runs every few minutes from Vercel Cron. */
async function run(request: Request): Promise<Response> {
  if (!cronAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const released = await releaseStuckPosts();
  const due = await claimPost({ dueBefore: new Date().toISOString(), limit: 25 });
  let posted = 0;
  let failed = 0;
  for (const post of due) {
    const result = await publishClaimed(post);
    if (result.ok) posted++;
    else failed++;
  }
  return Response.json({ ok: true, claimed: due.length, posted, failed, released });
}

export const Route = createFileRoute("/api/cron/buzz")({
  server: {
    handlers: {
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});
