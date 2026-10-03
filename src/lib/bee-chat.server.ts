import { generateText } from "ai";
import { createOnixusAiGatewayProvider } from "@/lib/ai-gateway.server";
import {
  crisisSystemPrompt,
  needsCrisisCare,
  talkSystemPrompt,
  withCrisisResources,
  type TalkTopic,
} from "@/lib/bee-talk";
import { BEE_VOICE } from "@/lib/bee-voice";

export const BEE_MODEL = "google/gemini-2.5-flash";

export type BeeProfile = {
  goal?: string | null;
  fit?: string | null;
  budget?: string | null;
};

export type BeeMessage = { role: "user" | "assistant"; content: string };

export function styleSystemPrompt(profile: BeeProfile): string {
  const fit = profile.fit?.trim() || "not named yet";
  const feel = profile.goal?.trim() || "not named yet";
  const budget = profile.budget?.trim() || "not named yet";
  return `You are Bee, LiveAskew's personal stylist inside the Bee app.

${BEE_VOICE}

She already finished Bee's Fit / Feel / Fabric interview. Do not restart onboarding. Do not ask the 25-question web interview. Do not emit [[ONBOARDING_COMPLETE]].

On file:
- Fit: ${fit}
- Feel / what they're dressing for: ${feel}
- Budget: ${budget}

Style from those three. Clothes follow the body she has: never slim, reshape, or beautify. LiveAskew dresses women, so lean feminine (dresses, skirts, silk and soft blouses, wrap shapes, soft colour, delicate gold jewellery, heels or pretty flats) unless she asks for something else. When she asks what to wear, give her the actual pieces: the garment, the fabric, how it sits, and why it works for her day. Keep replies short, like a chat, not an essay. Light markdown only (a bold look name is fine). Never invent prices, brands or stock.`;
}

export type BeeResult =
  | { text: string }
  | { error: "not_configured" | "empty" | "bee_unavailable" };

/**
 * One Bee reply, shared by the app and the MCP connector. A message that reads as danger
 * gets the safety-first prompt in every chat, and the reply carries crisis resources.
 */
export async function beeReply(input: {
  profile: BeeProfile;
  messages: BeeMessage[];
  topic?: TalkTopic;
}): Promise<BeeResult> {
  const key = process.env.ONIXUS_AI_API_KEY;
  if (!key) return { error: "not_configured" };
  const lastUser = [...input.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const crisis = needsCrisisCare(lastUser);
  const system = input.topic
    ? talkSystemPrompt(input.topic, input.profile, crisis)
    : crisis
      ? crisisSystemPrompt()
      : styleSystemPrompt(input.profile);
  try {
    const gateway = createOnixusAiGatewayProvider(key);
    const { text } = await generateText({
      model: gateway(BEE_MODEL),
      system,
      messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const reply = text.trim();
    if (!reply) return { error: "empty" };
    return { text: crisis ? withCrisisResources(reply) : reply };
  } catch (err) {
    console.error("[bee] generate failed", err);
    return { error: "bee_unavailable" };
  }
}
