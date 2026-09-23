import { getLookStore, isDue, publishLook } from "@liveaskew/api-client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const store = getLookStore();
  const due = store.list().filter((look) => isDue(look));
  const results = [];

  for (const look of due) {
    const published = [];
    for (const platform of look.platforms) {
      const caption =
        look.captions.find((item) => item.platform === platform)?.text ?? look.caption;
      published.push(
        await publishLook({
          platform,
          imageUrl: look.imageUrl,
          caption,
        }),
      );
    }
    if (published.every((item) => item.status === "posted")) {
      store.markPosted(look.id);
    } else {
      store.setPublishNote(
        look.id,
        published.map((item) => `${item.platform}: ${item.detail}`).join(" "),
      );
    }
    results.push({ id: look.id, published });
  }

  return NextResponse.json({ count: due.length, results });
}
