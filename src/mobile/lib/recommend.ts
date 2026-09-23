export type OnboardingAnswers = {
  goal: string | null;
  fit: string | null;
  budget: string | null;
};

export type LookCard = {
  id: string;
  title: string;
  occasion: string;
  formula: string[];
  fit: string;
  feel: string;
  fabric: string;
  palette: string[];
};

const GOALS = {
  work: "a composed work week",
  weekend: "unhurried weekends",
  event: "a specific occasion",
  everyday: "everyday confidence",
} as const;

const FITS = {
  structured: "clean structure through the shoulder and waist",
  soft: "ease through the body, nothing gripping",
  relaxed: "room to move without looking unfinished",
  defined: "a clear waist so the line reads as yours",
} as const;

const BUDGETS = {
  value: "pieces you can wear hard without worrying",
  mid: "considered mid-range cloth that holds its shape",
  elevated: "one stronger piece carrying the rest",
  invest: "invest when the fabric and the life match",
} as const;

export function lookId(seed: string): string {
  return `look_${seed.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_${Date.now().toString(36)}`;
}

export function recommendLook(answers: OnboardingAnswers): LookCard {
  const goal = answers.goal ?? "everyday";
  const fit = answers.fit ?? "soft";
  const budget = answers.budget ?? "mid";

  const catalog: Record<string, Omit<LookCard, "id">> = {
    "work-structured": {
      title: "The Monday column",
      occasion: "Work week",
      formula: [
        "Ivory silk shirt",
        "Charcoal high-waist trouser",
        "Slim leather belt",
        "Almond leather loafer",
      ],
      fit: "Structured shoulder, defined waist, full-length line.",
      feel: "Quiet authority — you look decided before you speak.",
      fabric: "Silk that breathes; wool that holds.",
      palette: ["#111111", "#f4efe6", "#b8860b"],
    },
    "work-soft": {
      title: "Soft tailoring",
      occasion: "Work week",
      formula: [
        "Fine-knit polo",
        "Easy pleated trouser",
        "Unlined blazer",
        "Leather sneaker, clean",
      ],
      fit: "Soft through the torso; the blazer does the composing.",
      feel: "Approachable, still precise.",
      fabric: "Fine knit and unlined wool — movement first.",
      palette: ["#2b2b2b", "#d8cfc0", "#b8860b"],
    },
    "weekend-relaxed": {
      title: "Saturday ease",
      occasion: "Weekend",
      formula: ["Washed overshirt", "Straight denim", "Soft tee", "Suede sneaker"],
      fit: "Relaxed through hip and shoulder; nothing clings.",
      feel: "Off-duty without looking unfinished.",
      fabric: "Washed cotton and broken-in denim.",
      palette: ["#3d4a3a", "#c4b8a4", "#111111"],
    },
    "event-defined": {
      title: "Evening line",
      occasion: "Event",
      formula: [
        "Wrap dress or long-line tunic",
        "Defined waist tie",
        "Covered sleeve option",
        "Pointed leather shoe",
      ],
      fit: "A waist you set yourself — wrap, belt, or seam.",
      feel: "Celebratory, never costume.",
      fabric: "Matte silk or crepe that doesn't fight the body.",
      palette: ["#5c1f26", "#e8c8a8", "#b8860b"],
    },
    everyday: {
      title: "Your weekday uniform",
      occasion: "Everyday",
      formula: [
        "Crew that sits clean at the neck",
        "Wide-leg trouser",
        "Light layer",
        "Leather flat or sneaker",
      ],
      fit: "Clothes that follow how you already move.",
      feel: "At home in yourself — Fit, Feel, Fabric in that order.",
      fabric: "Cloth chosen for climate, not a trend cycle.",
      palette: ["#111111", "#e0e5ec", "#b8860b"],
    },
  };

  const key = `${goal}-${fit}`;
  const base = catalog[key] ?? catalog[`${goal}-soft`] ?? catalog.everyday;

  const budgetNote =
    budget === "value"
      ? " Build it from what you already own first."
      : budget === "invest"
        ? " Spend on the cloth that touches skin."
        : "";

  return {
    id: lookId(`${goal}-${fit}-${budget}`),
    ...base,
    fabric: `${base.fabric}${budgetNote}`,
    feel: `${base.feel} Made for ${GOALS[goal as keyof typeof GOALS] ?? "the life you actually lead"}.`,
    fit: `${base.fit} ${FITS[fit as keyof typeof FITS] ?? ""}`.trim(),
  };
}

export function beeOpensWith(look: LookCard, answers: OnboardingAnswers): string {
  const goal = GOALS[(answers.goal ?? "everyday") as keyof typeof GOALS] ?? "how you dress now";
  const budget =
    BUDGETS[(answers.budget ?? "mid") as keyof typeof BUDGETS] ?? "a budget we can work with";
  return [
    `I'm Bee. I style from Fit, Feel, and Fabric — never a type, never a retouched body.`,
    `For ${goal}, I started you with **${look.title}**. ${look.feel}`,
    `Fit: ${look.fit}`,
    `Fabric: ${look.fabric} That sits with ${budget}.`,
    `Tell me what you're dressing for next, or save this look and we'll keep building.`,
  ].join("\n\n");
}

export function localBeeReply(userText: string, answers: OnboardingAnswers): string {
  const t = userText.toLowerCase();
  if (t.includes("wedding") || t.includes("event") || t.includes("party")) {
    return "For an occasion: start with the cloth against your skin, then the line. A covered sleeve if you want it. A waist you control. Color from your own palette — not a catalog's. What is the hour, and how covered do you want to be?";
  }
  if (t.includes("work") || t.includes("job") || t.includes("office")) {
    return "Work reads in the shoulder and the shoe. Keep the torso calm; let one metal or one texture speak. What climate are you dressing in this week?";
  }
  if (t.includes("hijab") || t.includes("modest") || t.includes("sari") || t.includes("kente")) {
    return "I dress heritage with you, never around it. Tell me the cloth and the covering you want held — I'll build the rest of the line from Fit and Fabric first.";
  }
  if (t.includes("budget") || t.includes("cheap") || t.includes("afford")) {
    return "We spend where the skin notices. One honest fabric can carry three cheaper shapes. What do you already own that still feels like you?";
  }
  return `I hear you. ${answers.fit ? "We'll keep the fit you asked for. " : ""}Give me the day, the weather, and how you want to feel when you walk in — I'll answer with pieces, not adjectives.`;
}
