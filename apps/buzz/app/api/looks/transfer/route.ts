import { describeGarment, getLookStore, parseLookTransfer } from "@liveaskew/api-client";
import {
  captionPrompt,
  captionsStayWithClient,
  completeCaptions,
  initialHive,
  parseModelCaptions,
  prepareBuzzPost,
  type Subscriber,
} from "@liveaskew/community";
import { NextResponse } from "next/server";

async function subscribers(): Promise<Subscriber[]> {
  const hive = process.env.HIVE_URL;
  if (!hive) return initialHive().actors;
  try {
    const response = await fetch(new URL("/api/subscribers", hive), {
      headers: process.env.HIVE_SERVICE_TOKEN
        ? { authorization: `Bearer ${process.env.HIVE_SERVICE_TOKEN}` }
        : {},
      cache: "no-store",
    });
    if (!response.ok) return initialHive().actors;
    const payload = (await response.json()) as { actors?: Subscriber[] };
    return payload.actors?.length ? payload.actors : initialHive().actors;
  } catch {
    return initialHive().actors;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseLookTransfer(body);
  if ("error" in parsed) return NextResponse.json(parsed, { status: 400 });

  const actors = await subscribers();
  const draft = prepareBuzzPost(actors, {
    userId: parsed.userId,
    look: parsed.caption,
    platforms: parsed.platforms,
  });
  if ("error" in draft) return NextResponse.json(draft, { status: 403 });

  const actor = actors.find((item) => item.id === parsed.userId);
  let captions = draft.captions;
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && actor) {
    try {
      const raw = await completeCaptions({
        apiKey,
        baseUrl: process.env.OPENAI_BASE_URL,
        model: process.env.CAPTION_MODEL,
        prompt: captionPrompt({
          name: actor.name,
          interview: actor.interview,
          look: parsed.caption,
          platforms: parsed.platforms,
        }),
      });
      const fromModel = parseModelCaptions(raw, parsed.platforms);
      if (fromModel && captionsStayWithClient(fromModel, actor.interview)) captions = fromModel;
    } catch {
      captions = draft.captions;
    }
  }

  let description: string | null = null;
  if (apiKey) {
    try {
      description = await describeGarment({
        apiKey,
        imageUrl: parsed.imageUrl,
        baseUrl: process.env.OPENAI_BASE_URL,
      });
    } catch {
      description = null;
    }
  }

  return NextResponse.json(
    getLookStore().transfer(
      { ...parsed, caption: captions[0]?.text ?? draft.summary },
      description,
      {
        captions,
        signIn: draft.signIn,
        authorName: draft.authorName,
      },
    ),
    { status: 201 },
  );
}
