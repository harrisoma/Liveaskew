import { publicActors, type PublicActor } from "@liveaskew/community";
import { readHive, startTopic } from "@/lib/directory";
import { NextResponse } from "next/server";

function authorName(actors: PublicActor[], id: string) {
  return actors.find((actor) => actor.id === id)?.name ?? "Hive member";
}

export async function GET() {
  const state = readHive();
  const actors = publicActors(state);
  return NextResponse.json({
    "@context": state["@context"],
    actors,
    topics: state.topics.map((topic) => ({
      ...topic,
      author: authorName(actors, topic.attributedTo),
      badge: actors.find((actor) => actor.id === topic.attributedTo)?.badge ?? "",
    })),
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    authorId?: string;
    name?: string;
    content?: string;
  } | null;
  const result = startTopic({
    authorId: body?.authorId ?? "",
    name: body?.name ?? "",
    content: body?.content ?? "",
  });
  if ("error" in result) return NextResponse.json(result, { status: 403 });
  return NextResponse.json(result.topic, { status: 201 });
}
