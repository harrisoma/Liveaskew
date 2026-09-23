import { BEST_TIMES, getLookStore } from "@liveaskew/api-client";
import { NextResponse } from "next/server";

export async function GET() {
  const looks = getLookStore().list();
  return NextResponse.json({
    looks,
    bestTimes: BEST_TIMES,
    counts: {
      queued: looks.filter((look) => look.status === "queued").length,
      scheduled: looks.filter((look) => look.status === "scheduled").length,
      posted: looks.filter((look) => look.status === "posted").length,
    },
  });
}
