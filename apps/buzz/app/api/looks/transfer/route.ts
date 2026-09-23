import { describeGarment, getLookStore, parseLookTransfer } from "@liveaskew/api-client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseLookTransfer(body);
  if ("error" in parsed) return NextResponse.json(parsed, { status: 400 });

  let description: string | null = null;
  const apiKey = process.env.OPENAI_API_KEY;
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

  return NextResponse.json(getLookStore().transfer(parsed, description), { status: 201 });
}
