import { getLookStore, parseLookTransfer } from "@liveaskew/api-client";
import { initialHive, prepareOwnLook, signInBadge } from "@liveaskew/community";
import { NextResponse } from "next/server";
import { rememberVoice } from "@/lib/voices";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    about?: string;
    lesson?: string;
    look?: string;
    imageUrl?: string;
    platforms?: string[];
    beeId?: string;
  } | null;

  const subscriber = initialHive().actors.find((actor) => actor.id === body?.beeId) ?? null;
  const name = body?.name?.trim() || subscriber?.name || "";
  const voice = rememberVoice({
    name,
    about: body?.about ?? "",
    lesson: body?.lesson,
    subscriber,
  });
  const parsed = parseLookTransfer({
    lookId: crypto.randomUUID(),
    userId: voice.id,
    imageUrl: body?.imageUrl ?? "",
    caption: body?.look ?? "",
    platforms: body?.platforms ?? [],
    source: "buzz",
  });
  if ("error" in parsed) return NextResponse.json(parsed, { status: 400 });

  const draft = prepareOwnLook({
    voice,
    look: parsed.caption,
    platforms: parsed.platforms,
    signIn: subscriber ? signInBadge(subscriber.signIn.provider) : "On Buzz",
  });
  if ("error" in draft) return NextResponse.json(draft, { status: 400 });

  const look = getLookStore().transfer({ ...parsed, caption: draft.summary }, null, {
    captions: draft.captions,
    signIn: draft.signIn,
    authorName: draft.authorName,
  });
  return NextResponse.json({ look, learned: voice.learned }, { status: 201 });
}
