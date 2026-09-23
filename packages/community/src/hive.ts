import type { ProviderId } from "@liveaskew/auth";
import type { Platform } from "@liveaskew/api-client";

/** ActivityStreams 2.0 — the open model Mastodon and the rest of the fediverse use. */
export const ACTIVITY_CONTEXT = "https://www.w3.org/ns/activitystreams";

export type BeeInterview = {
  life: string;
  fit: string;
  feel: string;
  fabric: string;
  goal: string;
};

export type Subscriber = {
  id: string;
  type: "Person";
  name: string;
  plan: "silver" | "gold" | "platinum" | "live_bee";
  subscribed: boolean;
  signIn: {
    provider: ProviderId;
    handle: string;
    profileUrl: string;
  };
  interview: BeeInterview;
};

export type Topic = {
  type: "Note";
  id: string;
  attributedTo: string;
  name: string;
  content: string;
  published: string;
};

export type Reply = {
  type: "Note";
  id: string;
  attributedTo: string;
  inReplyTo: string;
  content: string;
  published: string;
};

export type HiveState = {
  "@context": typeof ACTIVITY_CONTEXT;
  actors: Subscriber[];
  topics: Topic[];
  replies: Reply[];
};

const PROVIDER_LABEL: Record<ProviderId, string> = {
  google: "Google",
  apple: "Apple",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

export function signInBadge(provider: ProviderId) {
  return `Signed in with ${PROVIDER_LABEL[provider]}`;
}

export function followLink(actor: Subscriber) {
  return {
    href: actor.signIn.profileUrl,
    label: `Follow on ${PROVIDER_LABEL[actor.signIn.provider]}`,
  };
}

export type PublicActor = {
  id: string;
  type: "Person";
  name: string;
  plan: Subscriber["plan"];
  badge: string;
  provider: ProviderId;
  follow: { href: string; label: string };
};

export function publicActors(state: HiveState): PublicActor[] {
  return state.actors
    .filter((actor) => actor.subscribed)
    .map((actor) => ({
      id: actor.id,
      type: "Person",
      name: actor.name,
      plan: actor.plan,
      badge: signInBadge(actor.signIn.provider),
      provider: actor.signIn.provider,
      follow: followLink(actor),
    }));
}

export function initialHive(): HiveState {
  return {
    "@context": ACTIVITY_CONTEXT,
    actors: [
      {
        id: "amina",
        type: "Person",
        name: "Amina Cole",
        plan: "gold",
        subscribed: true,
        signIn: {
          provider: "facebook",
          handle: "amina.cole",
          profileUrl: "https://www.facebook.com/amina.cole",
        },
        interview: {
          life: "School run, then a board meeting.",
          fit: "Soft through the waist, structured at the shoulder.",
          feel: "Decided, not loud.",
          fabric: "Wool that breathes and holds a line.",
          goal: "Dress the workday first.",
        },
      },
      {
        id: "june",
        type: "Person",
        name: "June Adler",
        plan: "platinum",
        subscribed: true,
        signIn: {
          provider: "instagram",
          handle: "juneadler",
          profileUrl: "https://www.instagram.com/juneadler",
        },
        interview: {
          life: "The baby is on me, and I still have a call at ten.",
          fit: "Nothing tight at the middle.",
          feel: "Quiet and covered.",
          fabric: "Washed cotton.",
          goal: "Everyday, then one meeting.",
        },
      },
    ],
    topics: [
      {
        type: "Note",
        id: "topic-boardroom",
        attributedTo: "amina",
        name: "The blazer after the school run",
        content: "Does anyone else change nothing but the shoe between the gate and the meeting?",
        published: "2026-09-23T14:00:00.000Z",
      },
    ],
    replies: [
      {
        type: "Note",
        id: "reply-june-1",
        attributedTo: "june",
        inReplyTo: "topic-boardroom",
        content: "I keep the cotton and add the earring. The call does not get a new outfit.",
        published: "2026-09-23T15:00:00.000Z",
      },
    ],
  };
}

export function postTopic(
  state: HiveState,
  input: { authorId: string; name: string; content: string; published?: string },
): { topic: Topic; state: HiveState } | { error: string } {
  const author = state.actors.find((actor) => actor.id === input.authorId && actor.subscribed);
  const name = input.name.trim();
  const content = input.content.trim();
  if (!author) return { error: "Only a Hive subscriber can start a topic." };
  if (!name || !content) return { error: "A topic needs a title and something to say." };
  const topic: Topic = {
    type: "Note",
    id: crypto.randomUUID(),
    attributedTo: author.id,
    name,
    content,
    published: input.published ?? new Date().toISOString(),
  };
  return { topic, state: { ...state, topics: [topic, ...state.topics] } };
}

export function replyToTopic(
  state: HiveState,
  input: { authorId: string; topicId: string; content: string; published?: string },
): { reply: Reply; state: HiveState } | { error: string } {
  const author = state.actors.find((actor) => actor.id === input.authorId && actor.subscribed);
  const topic = state.topics.find((item) => item.id === input.topicId);
  const content = input.content.trim();
  if (!author) return { error: "Only a Hive subscriber can join a conversation." };
  if (!topic) return { error: "That topic is not in the Hive." };
  if (!content) return { error: "Write the reply." };
  const reply: Reply = {
    type: "Note",
    id: crypto.randomUUID(),
    attributedTo: author.id,
    inReplyTo: topic.id,
    content,
    published: input.published ?? new Date().toISOString(),
  };
  return { reply, state: { ...state, replies: [...state.replies, reply] } };
}

export function interviewCaption(input: { name: string; interview: BeeInterview; look: string }) {
  const first = input.name.split(" ")[0] || input.name;
  return [
    `${first}: ${input.interview.life.trim()}`,
    input.look.trim(),
    input.interview.fit.trim(),
    input.interview.feel.trim(),
    input.interview.fabric.trim(),
  ]
    .filter((part) => part.length > 0)
    .join(" ");
}

export type PlatformCaption = { platform: Platform; text: string };

export function captionsForClient(input: {
  name: string;
  interview: BeeInterview;
  look: string;
  platforms: Platform[];
}): PlatformCaption[] {
  const full = interviewCaption(input);
  return input.platforms.map((platform) => ({
    platform,
    text: shapeCaption(platform, full, input.name),
  }));
}

function shapeCaption(platform: Platform, full: string, name: string) {
  if (platform === "tiktok") {
    const sentence = full.split(/(?<=\.)\s/)[0] ?? full;
    return sentence.slice(0, 140);
  }
  if (platform === "linkedin") {
    return `${full} Written from her Bee interview, for the workday.`;
  }
  if (platform === "pinterest") {
    const first = name.split(" ")[0] || name;
    return `${full} Saved for the week ${first} described.`;
  }
  if (platform === "facebook") {
    return `${full} Posted from Bee, for the people who already know her week.`;
  }
  return full;
}

export function captionPrompt(input: {
  name: string;
  interview: BeeInterview;
  look: string;
  platforms: Platform[];
}) {
  return [
    `Write one social caption per platform for ${input.name}, a working mother.`,
    "Use her Bee interview. Do not invent a body, a size, or a mood she did not say.",
    "Return JSON whose keys are the platform names and whose values are the captions.",
    `Platforms: ${input.platforms.join(", ")}`,
    `Look: ${input.look}`,
    `Week: ${input.interview.life}`,
    `Fit: ${input.interview.fit}`,
    `Feel: ${input.interview.feel}`,
    `Fabric: ${input.interview.fabric}`,
    `Goal: ${input.interview.goal}`,
  ].join("\n");
}

export function parseModelCaptions(raw: string, platforms: Platform[]): PlatformCaption[] | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    const captions = platforms.map((platform) => {
      const text = parsed[platform];
      return typeof text === "string" && text.trim() ? { platform, text: text.trim() } : null;
    });
    if (captions.some((caption) => caption === null)) return null;
    return captions as PlatformCaption[];
  } catch {
    return null;
  }
}

export function captionsStayWithClient(captions: PlatformCaption[], interview: BeeInterview) {
  const blob = captions
    .map((caption) => caption.text)
    .join(" ")
    .toLowerCase();
  return [interview.feel, interview.fit, interview.life].some((line) => {
    const anchor = line.trim().toLowerCase().slice(0, 24);
    return anchor.length > 8 && blob.includes(anchor);
  });
}

export async function completeCaptions(options: {
  apiKey: string;
  prompt: string;
  baseUrl?: string;
  model?: string;
}) {
  const base = (options.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${options.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: options.model ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You write captions for LiveAskew. Reply with JSON only. Keep the client's own words from the Bee interview.",
        },
        { role: "user", content: options.prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Caption model failed (${response.status})`);
  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

export type BuzzDraft = {
  authorName: string;
  signIn: string;
  summary: string;
  captions: PlatformCaption[];
};

export function prepareBuzzPost(
  actors: Subscriber[],
  input: { userId: string; look: string; platforms: Platform[] },
): BuzzDraft | { error: string } {
  const actor = actors.find((item) => item.id === input.userId);
  if (!actor?.subscribed) return { error: "Buzz posts Bee looks for Hive subscribers." };
  if (input.platforms.length === 0) return { error: "Pick at least one platform." };
  const captions = captionsForClient({
    name: actor.name,
    interview: actor.interview,
    look: input.look,
    platforms: input.platforms,
  });
  return {
    authorName: actor.name,
    signIn: signInBadge(actor.signIn.provider),
    summary: captions[0]?.text ?? input.look,
    captions,
  };
}
