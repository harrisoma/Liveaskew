import type { OnboardingAnswers } from "./recommend";
import { localBeeReply } from "./recommend";
import type { ChatMsg } from "./storage";
import { apiFetch } from "./api";
import { CRISIS_RESOURCES, localTalkReply, needsCrisisCare, type TalkTopic } from "@/lib/bee-talk";

export async function askBee(opts: {
  messages: ChatMsg[];
  profile: OnboardingAnswers;
  /** Real Talk topic; omit for the styling chat. */
  topic?: TalkTopic | null;
}): Promise<string> {
  const lastUser = [...opts.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  // Someone who may be in danger always gets a way to reach a person — paywall, limit, or offline.
  const crisis = needsCrisisCare(lastUser);
  try {
    const res = await apiFetch("/api/bee/app", {
      method: "POST",
      body: JSON.stringify({
        ...(opts.topic ? { topic: opts.topic } : {}),
        profile: {
          goal: opts.profile.goal,
          fit: opts.profile.fit,
          budget: opts.profile.budget,
        },
        messages: opts.messages.slice(-24).map((m) => ({
          role: m.role,
          content: m.content.slice(0, 2000),
        })),
      }),
    });
    if (crisis && (res.status === 402 || res.status === 429)) return CRISIS_RESOURCES;
    if (res.status === 402) {
      return "Your fourteen days with Bee have ended. Choose a tier under You and we'll pick up right here.";
    }
    if (res.status === 429) {
      return "We've covered a lot this hour. Give me a few minutes, then tell me what's next.";
    }
    if (res.ok) {
      const json = (await res.json()) as { text?: string };
      if (json.text?.trim()) return json.text.trim();
    }
  } catch {
    /* local voice */
  }
  if (crisis) return CRISIS_RESOURCES;
  if (opts.topic) {
    const turns = opts.messages.filter((m) => m.role === "user").length;
    return localTalkReply(opts.topic, turns);
  }
  return localBeeReply(lastUser, opts.profile);
}
