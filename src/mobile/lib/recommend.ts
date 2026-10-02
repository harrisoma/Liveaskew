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
      title: "The Golden Hour",
      occasion: "Work week",
      formula: [
        "Champagne silk wrap blouse",
        "Blush pleated midi skirt",
        "Nude strappy heeled sandal",
        "Layered fine gold necklaces",
      ],
      fit: "A wrap that sets your waist; a skirt that moves when you walk.",
      feel: "Soft and certain — you look decided before you speak.",
      fabric: "Silk against the skin; a pleat that holds its shape.",
      palette: ["#f1e3c8", "#e8c4c0", "#b8860b"],
    },
    "work-soft": {
      title: "Soft tailoring",
      occasion: "Work week",
      formula: [
        "Ivory silk blouse with a soft bow",
        "Camel A-line midi skirt",
        "Cropped bouclé jacket",
        "Pointed blush flat",
      ],
      fit: "Easy through the body; the bow and the jacket do the composing.",
      feel: "Warm, approachable, still precise.",
      fabric: "Silk and bouclé — movement and texture first.",
      palette: ["#f4efe6", "#c8a27a", "#e8c4c0"],
    },
    "weekend-relaxed": {
      title: "Saturday, softly",
      occasion: "Weekend",
      formula: [
        "Floral midi sundress",
        "Cropped cream cardigan",
        "Woven straw bag",
        "Strappy flat sandal",
      ],
      fit: "Relaxed through the hip; a dress that skims, never clings.",
      feel: "Off-duty and pretty, without trying.",
      fabric: "Washed cotton and a light knit.",
      palette: ["#e8c4c0", "#f4efe6", "#8a9a7b"],
    },
    "event-defined": {
      title: "Evening glow",
      occasion: "Event",
      formula: [
        "Satin wrap midi dress",
        "Defined waist tie",
        "Sheer sleeve or wrap option",
        "Gold heeled sandal",
      ],
      fit: "A waist you set yourself — wrap, tie, or seam.",
      feel: "Celebratory, never costume.",
      fabric: "Satin or crepe that moves with the body, not against it.",
      palette: ["#7a2e3a", "#e8c8a8", "#b8860b"],
    },
    everyday: {
      title: "Your everyday dress",
      occasion: "Everyday",
      formula: [
        "Jersey wrap dress",
        "Soft longline cardigan",
        "Delicate gold hoops",
        "Ballet flat or low heel",
      ],
      fit: "Clothes that follow how you already move.",
      feel: "At home in yourself — Fit, Feel, Fabric in that order.",
      fabric: "Cloth chosen for climate, not a trend cycle.",
      palette: ["#e8c4c0", "#f4efe6", "#b8860b"],
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
