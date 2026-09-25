export const BUZZ_PLATFORMS = [
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "pinterest", name: "Pinterest" },
  { id: "facebook", name: "Facebook" },
  { id: "linkedin", name: "LinkedIn" },
] as const;

export type BuzzPlatformId = (typeof BUZZ_PLATFORMS)[number]["id"];

const PLATFORM_LOGIN: Record<BuzzPlatformId, string> = {
  instagram: "https://www.instagram.com/accounts/login/",
  tiktok: "https://www.tiktok.com/login",
  pinterest: "https://www.pinterest.com/login/",
  facebook: "https://www.facebook.com/login/",
  linkedin: "https://www.linkedin.com/login",
};

export function platformLoginUrl(platform: BuzzPlatformId) {
  return PLATFORM_LOGIN[platform];
}

export function openPlatformLogin(platform: BuzzPlatformId) {
  if (typeof window === "undefined") return null;
  return window.open(
    platformLoginUrl(platform),
    `liveaskew-${platform}`,
    "popup=yes,width=480,height=720",
  );
}

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
  instagram: " On the grid.",
  tiktok: " For the evening scroll.",
  pinterest: " Saved to the board.",
  facebook: " For the people who know the week.",
  linkedin: " Before the first meeting.",
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
