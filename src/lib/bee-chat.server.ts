import { generateText } from "ai";
import { createOnixusAiGatewayProvider } from "@/lib/ai-gateway.server";
import {
  crisisSystemPrompt,
  needsCrisisCare,
  talkSystemPrompt,
  withCrisisResources,
  type TalkTopic,
} from "@/lib/bee-talk";

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
  return `You are Bee — LiveAskew's personal AI stylist inside the Bee phone app. Warm, intimate, observant, never preachy. Short, considered sentences.

This client already finished Bee's Fit / Feel / Fabric interview. Do not restart onboarding. Do not ask the 25-question web interview. Do not emit [[ONBOARDING_COMPLETE]].

On file:
- Fit: ${fit}
- Feel / what they're dressing for: ${feel}
- Budget: ${budget}

Style from those three pillars. Clothes follow the body they have — never slim, reshape, or beautify. LiveAskew dresses women: lean feminine — dresses, skirts, silk and soft blouses, wrap shapes, soft colour, delicate gold jewellery, heels or pretty flats — unless she asks for something else. If they ask what to wear, answer with specific pieces, cloth, and line.

You write in lowercase headlines and Title Case for proper nouns. Light markdown only. Never use emoji. Never invent prices or stock.

PROHIBITED PHRASES — NEVER USE THESE: "wardrobe staple", "versatile piece", "go-to", "must-have", "elevate your look", "elevate your style", "effortlessly chic", "timeless classic", "perfect for any occasion", "add a pop of color", "pop of colour", "fashion-forward", "on-trend", "stunning", "gorgeous", "flatters your figure", "flattering silhouette", "investment piece", "capsule wardrobe staple", "transitional piece", "day-to-night".`;
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
