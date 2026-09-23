import type { OnboardingAnswers } from "./recommend";
import { localBeeReply } from "./recommend";
import type { ChatMsg } from "./storage";
import { apiUrl } from "./api";

export async function askBee(opts: {
  messages: ChatMsg[];
  profile: OnboardingAnswers;
}): Promise<string> {
  const lastUser = [...opts.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  try {
    const res = await fetch(apiUrl("/api/bee/app"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
    if (res.ok) {
      const json = (await res.json()) as { text?: string };
      if (json.text?.trim()) return json.text.trim();
    }
  } catch {
    /* local voice */
  }
  return localBeeReply(lastUser, opts.profile);
}
