import { recommendLook, type LookCard, type OnboardingAnswers } from "./recommend";

export const INTERVIEW = [
  {
    id: "life",
    pillar: "Feel",
    prompt:
      "I'm Bee. I style from Fit, Feel, and Fabric — never a type, never a retouched body. What does a typical week ask of your clothes?",
  },
  {
    id: "fit",
    pillar: "Fit",
    prompt:
      "How should clothes sit on you — structured, soft, relaxed, or a waist you set yourself?",
  },
  {
    id: "feel",
    pillar: "Feel",
    prompt: "How do you want to feel when you walk in? Quiet, decided, covered, easy — your words.",
  },
  {
    id: "fabric",
    pillar: "Fabric",
    prompt:
      "What should the cloth against your skin do — breathe, hold a line, drape, or carry weight?",
  },
  {
    id: "goal",
    pillar: "Feel",
    prompt: "What should I dress first — work, weekend, a specific occasion, or everyday?",
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
