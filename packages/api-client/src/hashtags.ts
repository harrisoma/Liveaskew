export const PLATFORMS = ["instagram", "tiktok", "pinterest", "facebook", "linkedin"] as const;

export type Platform = (typeof PLATFORMS)[number];

export const BEST_TIMES: Record<Platform, { hour: number; label: string }> = {
  instagram: { hour: 11, label: "11:00, after the school drop" },
  tiktok: { hour: 19, label: "19:00, the evening scroll" },
  pinterest: { hour: 20, label: "20:00, the planning hour" },
  facebook: { hour: 13, label: "13:00, lunch" },
  linkedin: { hour: 8, label: "08:00, before the first meeting" },
};

const RULES: { test: RegExp; tags: string[] }[] = [
  { test: /boardroom|meeting|work|office/i, tags: ["#WorkingMomStyle", "#BoardroomLook"] },
  { test: /maternity|pregnant|bump|nursing/i, tags: ["#MaternityStyle", "#BumpToBoardroom"] },
  { test: /school/i, tags: ["#SchoolRunStyle"] },
  { test: /silk|tailor|blazer/i, tags: ["#QuietLuxury"] },
];

export function suggestHashtags(caption: string) {
  const tags = new Set<string>(["#LiveAskew", "#BeeStyle"]);
  for (const rule of RULES) {
    if (rule.test.test(caption)) rule.tags.forEach((tag) => tags.add(tag));
  }
  return [...tags].slice(0, 8);
}
