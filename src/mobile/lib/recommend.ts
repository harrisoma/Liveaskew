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
    `Okay, I've got you! I've put together your Fit, Feel and Fabric, and for ${goal}, let's start with **${look.title}**. ${look.feel}`,
    `How it fits: ${look.fit}`,
    `The fabric: ${look.fabric} And it works with ${budget}.`,
    `What are you getting dressed for next? Or save this one and we'll keep going.`,
  ].join("\n\n");
}

export function localBeeReply(userText: string, answers: OnboardingAnswers): string {
  const t = userText.toLowerCase();
  if (t.includes("wedding") || t.includes("event") || t.includes("party")) {
    return "Ooh, an occasion! Let's start with a fabric that feels good on your skin, then the shape: a sleeve if you want one, a waist you choose. Colours from your palette, not some catalogue's. What time is it, and how covered do you want to be?";
  }
  if (t.includes("work") || t.includes("job") || t.includes("office")) {
    return "For work, it's all in the shoulder and the shoe. Keep the middle simple and let one gold piece or one great texture do the talking. What's the weather doing this week?";
  }
  if (t.includes("hijab") || t.includes("modest") || t.includes("sari") || t.includes("kente")) {
    return "I'll style your heritage with you, never around it. Tell me the fabric and the covering you want to keep, and I'll build everything else around how you like things to fit.";
  }
  if (t.includes("budget") || t.includes("cheap") || t.includes("afford")) {
    return "Let's spend where your skin notices. One really good fabric can carry three cheaper pieces. What do you already own that still feels like you?";
  }
  return `Got it. ${answers.fit ? "I'll keep the fit you like. " : ""}Tell me the day, the weather and how you want to feel when you walk in, and I'll give you actual pieces, not fluffy adjectives.`;
}
