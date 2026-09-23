import { getLookStore } from "@liveaskew/api-client";
import { NextResponse } from "next/server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    scheduledFor?: string;
  } | null;
  const store = getLookStore();
  const look =
    body?.action === "posted"
      ? store.markPosted(id)
      : store.schedule(
          id,
          body?.scheduledFor || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        );
  if (!look) return NextResponse.json({ error: "That look is not in Buzz." }, { status: 404 });
  return NextResponse.json(look);
}
