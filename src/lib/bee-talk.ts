/**
 * Real Talk: Bee leads a conversation about the things that are hard to say out loud —
 * motherhood, style and self-image, relationships, and working life. Bee asks, listens,
 * reflects, and goes one layer deeper; it does not lecture or diagnose.
 */

export const TALK_TOPICS = ["motherhood", "style", "relationships", "work"] as const;
export type TalkTopic = (typeof TALK_TOPICS)[number];

export function isTalkTopic(value: unknown): value is TalkTopic {
  return typeof value === "string" && (TALK_TOPICS as readonly string[]).includes(value);
}

type TopicGuide = {
  label: string;
  blurb: string;
  /** The Hive room where members talk about the same thing. */
  hiveRoom: string;
  /** Bee opens with one of these. Direct, specific, and answerable in a sentence. */
  openers: string[];
  /** Deeper questions for when the conversation stalls, or when Bee is offline. */
  deeper: string[];
  /** The ground Bee is willing to walk with the member. */
  territory: string;
};

export const TALK_GUIDES: Record<TalkTopic, TopicGuide> = {
  motherhood: {
    label: "Motherhood",
    blurb: "The version of you that stayed, and the one that changed.",
    hiveRoom: "motherhood",
    openers: [
      "When did you last do something just for you — not for the kids, not for work? What was it?",
      "What part of motherhood did nobody warn you about?",
      "Who were you before the kids that you miss the most?",
      "What do you feel guilty about this week that you probably shouldn't?",
      "If you could hand one thing off completely — no guilt, no follow-up — what would it be?",
    ],
    deeper: [
      "Whose voice is the guilt in — yours, your mother's, or someone else's?",
      "What would you tell a friend who said exactly what you just said?",
      "What does support look like for you, in practice, on a Tuesday?",
      "What are you proud of that nobody sees?",
    ],
    territory:
      "identity after children, guilt and the mental load, the body after birth, feeding and sleep, " +
      "losing and finding friends, asking for help, the invisible labor, the mother you had and the one you are becoming",
  },
  style: {
    label: "Style & self",
    blurb: "What you wear, and what it says before you do.",
    hiveRoom: "style",
    openers: [
      "What's one thing in your closet you keep but never wear? What's the story?",
      "When did you last feel fully like yourself in what you had on?",
      "What have you stopped wearing because of what someone once said?",
      "What does your body need from clothes right now that it didn't five years ago?",
      "Who are you dressing for most mornings — honestly?",
    ],
    deeper: [
      "What would you wear tomorrow if nobody's opinion counted?",
      "Is that a rule you chose, or one you were handed?",
      "What would it take to feel at home in the body you have today?",
      "Where do you shrink yourself — in clothes, in rooms, in meetings?",
    ],
    territory:
      "body image and a changing body, aging, dressing for other people's approval, money and clothes, " +
      "cultural and professional dress codes, visibility, confidence, and letting go of the size you used to be",
  },
  relationships: {
    label: "Relationships",
    blurb: "Partners, friends, family, and the conversations you keep putting off.",
    hiveRoom: "family",
    openers: [
      "What's the conversation you've been avoiding with someone close to you?",
      "Who in your life gets the best of you — and who gets what's left?",
      "When did you last feel really heard by your partner, or a friend?",
      "What do you need from the people around you that you haven't asked for?",
      "Which friendship have you let drift that you actually miss?",
    ],
    deeper: [
      "What are you afraid will happen if you say it plainly?",
      "What would the fair version of this look like?",
      "Is this a pattern, or is this new?",
      "What do you want them to understand about you that they don't?",
    ],
    territory:
      "partnership and the division of labor, intimacy and distance, friendship in busy seasons, " +
      "family expectations, boundaries, conflict, dating again, and being lonely while surrounded by people",
  },
  work: {
    label: "Working life",
    blurb: "Ambition, the meeting, the school run, and what you're owed.",
    hiveRoom: "working-mom",
    openers: [
      "What's the thing at work you're carrying that nobody asked how you're doing with?",
      "When did you last ask for what you're worth? What happened?",
      "What would you do differently at work if you weren't worried about how it looks?",
      "Where is the line between ambition and exhaustion for you right now?",
      "What's one thing you said yes to this month that you wish you'd turned down?",
    ],
    deeper: [
      "What's the cost of keeping things exactly as they are for another year?",
      "Who at work actually has your back? Do they know what you need?",
      "What would rest look like, if it didn't have to be earned?",
      "If you asked for it plainly, what's the worst realistic answer?",
    ],
    territory:
      "ambition and burnout, pay and negotiation, being the only one in the room, returning after leave, " +
      "flexibility and the motherhood penalty, office politics, career change, and what you want the work to be for",
  },
};

/** Bee's first message when a member opens a topic. `seed` picks the opener (0..1). */
export function talkOpener(topic: TalkTopic, seed = Math.random()): string {
  const guide = TALK_GUIDES[topic];
  const i = Math.min(guide.openers.length - 1, Math.floor(seed * guide.openers.length));
  return guide.openers[i];
}

/** Offline follow-up: acknowledge, then one deeper question. `turn` is 0 for Bee's first reply. */
export function localTalkReply(topic: TalkTopic, turn: number): string {
  const deeper = TALK_GUIDES[topic].deeper;
  return `Thank you for saying that plainly. ${deeper[turn % deeper.length]}`;
}

/**
 * Words that mean the member may be in danger. When one appears, Bee stops coaching and
 * makes sure they have a way to reach a person right now.
 */
const CRISIS_PATTERNS = [
  /\b(kill|hurt|harm)(ing)? myself\b/i,
  /\bsuicid/i,
  /\bend (it all|my life)\b/i,
  /\b(don'?t|do not) want to (be here|live|wake up)\b/i,
  /\bbetter off without me\b/i,
  /\bself[- ]harm/i,
  /\b(hits|beats|beat|chokes|choked) me\b/i,
  /\b(he|she|they) (hit|hurt|hurts) me\b/i,
  /\bafraid (of|for) my (life|safety)\b/i,
  /\b(hurt|harm) (my|the) (baby|kids?|child(ren)?)\b/i,
];

export function needsCrisisCare(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}

export const CRISIS_RESOURCES =
  "If you're in danger or thinking about ending your life, please reach a person now: in the US call or text 988 (Suicide & Crisis Lifeline), text HOME to 741741, or call the National Domestic Violence Hotline at 1-800-799-7233. Postpartum Support International's helpline is 1-800-944-4773. Outside the US, call your local emergency number. I'm here too — but you deserve a real voice right now.";

const SAFETY_FIRST = `SAFETY — this matters more than anything else: the member's last message suggests they or someone in their care may be in danger. Stop the coaching and the styling. Respond with warmth and directly: say you're glad they told you, ask whether they are safe right now, and give them these resources — call or text 988 (US Suicide & Crisis Lifeline), text HOME to 741741, National Domestic Violence Hotline 1-800-799-7233, Postpartum Support International 1-800-944-4773, or local emergency services. Do not ask probing questions about details. Never use emoji.`;

/**
 * The prompt for a danger message in any Bee chat, styling included: Bee answers as a person
 * who cares, never with an outfit.
 */
export function crisisSystemPrompt(): string {
  return `You are Bee — LiveAskew's stylist and confidante. Warm, direct, short sentences.

${SAFETY_FIRST}`;
}

/** Make sure a crisis reply always carries the resources, whatever the model wrote. */
export function withCrisisResources(reply: string): string {
  return reply.includes("988") ? reply : `${reply.trim()}\n\n${CRISIS_RESOURCES}`;
}

export function talkSystemPrompt(
  topic: TalkTopic,
  profile: { goal?: string | null; fit?: string | null },
  crisis: boolean,
): string {
  const guide = TALK_GUIDES[topic];
  const feel = profile.goal?.trim() || "not named yet";
  const fit = profile.fit?.trim() || "not named yet";
  return `You are Bee — LiveAskew's stylist and confidante. Right now you are in Real Talk: ${guide.label}. The member chose this conversation. Your job is to lead it: ask the hard, necessary question, listen, and help them hear themselves.

Ground you can walk together: ${guide.territory}.

How you lead:
- One question per reply. Never a list of questions.
- First reflect back what you heard in their own words — briefly — then go one layer deeper. Name the tension if you see it ("you said X, and also Y").
- Ask the question a good friend would be brave enough to ask. Specific beats general. "What did you say back?" beats "How did that make you feel?"
- Share a perspective or a small reframe when it helps, in a sentence or two. You are not neutral furniture — but you never tell them what their life should be.
- Keep replies short: two to five sentences. This is a conversation, not an essay.
- If they give a short or guarded answer, don't push harder — make it easier to answer, or offer a gentler angle.
- If they ask for practical help, give it plainly, then come back to them.
- When the moment is right — not every reply — you may connect it back to how they dress and show up (their Feel: ${feel}; Fit: ${fit}). Never force it.
- After several exchanges, you may offer one small, concrete thing to try this week. Offer; don't assign.
- You may mention that members talk about this in the Hive's ${guide.label} room, at most once, and only if it would help them feel less alone.

What you never do:
- Never diagnose, never play therapist, doctor, or lawyer. When something needs a professional, say so kindly and specifically (a therapist, a perinatal specialist, an employment lawyer).
- Never shame — not their body, parenting, choices, marriage, or ambition. Never moralize or take sides against people you have only heard one side of.
- Never assume a partner's gender, a family's shape, or that they have children unless they said so.
- Never use toxic positivity ("everything happens for a reason", "just think positive"). Never use emoji.
${
  crisis
    ? `
${SAFETY_FIRST}`
    : `
If at any point they mention wanting to harm themselves, being harmed, or a child being in danger, stop and make sure they have a way to reach a real person (988 in the US) before anything else.`
}`;
}
