import { usesSignalPublisher } from "@/lib/buzz/signal.server";
import { createFileRoute } from "@tanstack/react-router";
import {
  claimPost,
  publishClaimed,
  releaseStuckPosts,
  reconcileSignalPosts,
} from "@/lib/buzz/store.server";

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
  const reconciled = await reconcileSignalPosts();
  const released = usesSignalPublisher() ? 0 : await releaseStuckPosts();
  const due = await claimPost({ dueBefore: new Date().toISOString(), limit: 25 });
  let posted = 0;
  let failed = 0;
  let pending = 0;
  for (const post of due) {
    const result = await publishClaimed(post);
    if (result.ok) posted++;
    else if (result.pending) pending++;
    else failed++;
  }
  return Response.json({
    ok: true,
    claimed: due.length,
    posted,
    failed,
    pending,
    reconciled,
    released,
  });
}

export const Route = createFileRoute("/api/cron/buzz")({
  server: {
    handlers: {
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});
