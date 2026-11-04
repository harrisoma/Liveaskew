/** Optional starting points; the editable answer remains the source of truth. */
export const INTERVIEW_OPTIONS: Record<string, readonly string[]> = {
  life: [
    "Work from home",
    "Office days",
    "Caring for family",
    "Often on the go",
    "A mix of everything",
  ],
  fit: ["Relaxed", "Soft and flowing", "Sharp and structured", "Defined at the waist"],
  feel: ["Comfortable", "Confident", "Calm", "Bold", "Covered"],
  fabric: ["Light and breathable", "Soft and stretchy", "Crisp and structured", "Fluid and draped"],
  goal: ["Work", "Weekends", "Everyday life", "A special occasion"],
  aesthetic: ["Minimal", "Classic", "Romantic", "Sporty", "Bold and expressive"],
  colors: ["Neutrals", "Bright colors", "Soft pastels", "Deep jewel tones", "Still exploring"],
};

export function addInterviewOption(draft: string, option: string): string {
  if (draft.split(/[,;\n]/).some((part) => part.trim().toLowerCase() === option.toLowerCase()))
    return draft;
  return draft.trim() ? `${draft.trimEnd()}, ${option}` : option;
}
