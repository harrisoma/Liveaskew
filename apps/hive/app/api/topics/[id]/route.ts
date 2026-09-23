import { publicActors } from "@liveaskew/community";
import { addReply, readHive, topicThread } from "@/lib/directory";
import { NextResponse } from "next/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const thread = topicThread(id);
  if (!thread)
    return NextResponse.json({ error: "That topic is not in the Hive." }, { status: 404 });
  const actors = publicActors(readHive());
  const name = (authorId: string) => actors.find((actor) => actor.id === authorId);
  return NextResponse.json({
    topic: {
      ...thread.topic,
      author: name(thread.topic.attributedTo)?.name ?? "Hive member",
      badge: name(thread.topic.attributedTo)?.badge ?? "",
    },
    replies: thread.replies.map((reply) => ({
      ...reply,
      author: name(reply.attributedTo)?.name ?? "Hive member",
      badge: name(reply.attributedTo)?.badge ?? "",
    })),
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    authorId?: string;
    content?: string;
  } | null;
  const result = addReply({
    authorId: body?.authorId ?? "",
    topicId: id,
    content: body?.content ?? "",
  });
  if ("error" in result) return NextResponse.json(result, { status: 403 });
  return NextResponse.json(result.reply, { status: 201 });
}
