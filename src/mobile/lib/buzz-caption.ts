import type { AppSnapshot, GuideLook } from "./storage";
import type { HoneyNetwork } from "@/lib/honey";
import { apiFetch } from "./api";
import { captionPrompt } from "./buzz-caption-context";
export async function writeBeeCaption(
  snapshot: Pick<AppSnapshot, "interview" | "looks">,
  look: GuideLook,
  network: HoneyNetwork,
) {
  const response = await apiFetch("/api/bee/app", {
    method: "POST",
    body: JSON.stringify({
      profile: { goal: null, fit: null, budget: null },
      messages: [{ role: "user", content: captionPrompt(snapshot, look, network) }],
    }),
  });
  if (!response.ok)
    throw new Error(
      response.status === 402
        ? "Your membership needs attention before Bee can write a caption."
        : response.status === 429
          ? "Bee is busy. Please try again shortly."
          : "Bee couldn’t write this caption. Try again or write your own.",
    );
  const data = await response.json();
  if (typeof data.text !== "string" || !data.text.trim())
    throw new Error("Bee returned an empty caption. Please try again.");
  return data.text.trim();
}
