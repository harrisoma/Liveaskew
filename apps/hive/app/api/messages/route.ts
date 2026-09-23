import { addMessage, listMessages } from "@/lib/rooms";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const room = new URL(request.url).searchParams.get("room") ?? "motherhood";
  return NextResponse.json({ messages: listMessages(room) });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    roomId?: string;
    author?: string;
    text?: string;
  } | null;
  const message = addMessage({
    roomId: body?.roomId ?? "",
    author: body?.author ?? "You",
    text: body?.text ?? "",
  });
  if (!message)
    return NextResponse.json({ error: "Pick a room and write something." }, { status: 400 });
  return NextResponse.json(message, { status: 201 });
}
