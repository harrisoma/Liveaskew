export const BUZZ_PLATFORMS = [
  { id: "x", name: "X" },
  { id: "instagram", name: "Instagram" },
  { id: "facebook", name: "Facebook" },
  { id: "telegram", name: "Telegram" },
] as const;

export type BuzzPlatformId = (typeof BUZZ_PLATFORMS)[number]["id"];

const DAY_LINES = [
  (look: string) => `Wearing this today. ${look}`,
  (look: string) => `Same style, a new sentence. ${look}`,
  (look: string) => `Still this cloth. ${look}`,
  (look: string) => `Morning, dressed. ${look}`,
  (look: string) => `The look, said plainly. ${look}`,
  (look: string) => `Back in it. ${look}`,
  (look: string) => `Today's line, same style. ${look}`,
] as const;

const PLATFORM_TAIL: Record<BuzzPlatformId, string> = {
  x: "",
  instagram: " Saved to the grid.",
  facebook: " Posted for the people who know the week.",
  telegram: " Sent to the channel.",
};

export function cleanLook(instruction: string): string {
  const text = instruction.replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : "the style Bee dressed";
}

export function buzzMessage(instruction: string, day: number, platform: BuzzPlatformId): string {
  const look = cleanLook(instruction);
  const index = ((day % DAY_LINES.length) + DAY_LINES.length) % DAY_LINES.length;
  return `${DAY_LINES[index](look)}${PLATFORM_TAIL[platform]}`;
}

export function buzzWeek(instruction: string, platform: BuzzPlatformId = "instagram"): string[] {
  return DAY_LINES.map((_, day) => buzzMessage(instruction, day, platform));
}
