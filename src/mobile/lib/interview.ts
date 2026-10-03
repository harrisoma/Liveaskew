import { recommendLook, type LookCard, type OnboardingAnswers } from "./recommend";

export const INTERVIEW = [
  {
    id: "life",
    pillar: "Feel",
    prompt:
      "Hi, I'm Bee! I'm going to be your stylist, and I start with you: how things fit, how you want to feel, and the fabrics you love. No body \"types\", no retouching. So tell me, what does a normal week look like for you?",
  },
  {
    id: "fit",
    pillar: "Fit",
    prompt:
      "Love that. Now, how do you like your clothes to fit? Sharp and structured, soft, relaxed, or nipped in at the waist?",
  },
  {
    id: "feel",
    pillar: "Feel",
    prompt:
      "When you walk into a room, how do you want to feel? Calm, unstoppable, covered, comfy… use your own words.",
  },
  {
    id: "fabric",
    pillar: "Fabric",
    prompt:
      "And the fabric against your skin: something that breathes, something crisp that holds its shape, something that drapes, or something with a bit of weight to it?",
  },
  {
    id: "goal",
    pillar: "Feel",
    prompt:
      "Last one! Where should I start dressing you: work, weekends, a special occasion, or just everyday life?",
  },
] as const;

export function interviewOpener(): string {
  return INTERVIEW[0].prompt;
}

export function nextInterviewPrompt(step: number): string | null {
  return INTERVIEW[step]?.prompt ?? null;
}

function mapFit(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("struct") || t.includes("tailor") || t.includes("sharp")) return "structured";
  if (t.includes("waist") || t.includes("defin") || t.includes("belt")) return "defined";
  if (t.includes("relax") || t.includes("room") || t.includes("loose")) return "relaxed";
  return "soft";
}

function mapGoal(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("work") || t.includes("office") || t.includes("week")) return "work";
  if (t.includes("weekend") || t.includes("saturday")) return "weekend";
  if (t.includes("event") || t.includes("wedding") || t.includes("party")) return "event";
  return "everyday";
}

function mapBudget(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("invest") || t.includes("heirloom")) return "invest";
  if (t.includes("150") || t.includes("elevat")) return "elevated";
  if (t.includes("under") || t.includes("value") || t.includes("cheap")) return "value";
  return "mid";
}

export function answersFromInterview(answers: Record<string, string>): OnboardingAnswers {
  return {
    fit: mapFit(answers.fit ?? answers.life ?? ""),
    goal: mapGoal(answers.goal ?? answers.life ?? ""),
    budget: mapBudget(answers.fabric ?? ""),
  };
}

export function reflectOnAnswer(step: number, text: string): string {
  const next = INTERVIEW[step + 1];
  const pillar = INTERVIEW[step]?.pillar ?? "Fit";
  const echo = text.trim().slice(0, 80);
  const line = `Noted — ${pillar.toLowerCase()} as you said it: “${echo}${text.trim().length > 80 ? "…" : ""}”.`;
  if (!next) {
    return `${line} I have enough to build your Style Guide. Next I need a selfie so the looks sit on you — not a retouched stand-in.`;
  }
  return `${line}\n\n${next.prompt}`;
}

export function looksFromInterview(answers: Record<string, string>): LookCard[] {
  const base = answersFromInterview(answers);
  const variants: OnboardingAnswers[] = [
    base,
    { ...base, fit: base.fit === "soft" ? "structured" : "soft" },
    { ...base, goal: base.goal === "work" ? "weekend" : "work" },
  ];
  const seen = new Set<string>();
  const looks: LookCard[] = [];
  for (const v of variants) {
    const look = recommendLook(v);
    if (seen.has(look.title)) continue;
    seen.add(look.title);
    looks.push(look);
  }
  return looks;
}
