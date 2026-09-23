import { readHive } from "@/lib/directory";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const expected = process.env.HIVE_SERVICE_TOKEN;
  if (expected && request.headers.get("authorization") !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Buzz needs the Hive service token." }, { status: 401 });
  }
  const state = readHive();
  return NextResponse.json({
    "@context": state["@context"],
    actors: state.actors.filter((actor) => actor.subscribed),
  });
}
