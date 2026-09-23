import { describe, expect, it } from "vitest";
import {
  captionsForClient,
  captionsStayWithClient,
  captionPrompt,
  initialHive,
  parseModelCaptions,
  postTopic,
  prepareBuzzPost,
  publicActors,
  replyToTopic,
  signInBadge,
} from "./hive";

describe("Hive subscribers", () => {
  it("shows the platform they used, and a follow link on that platform", () => {
    const actors = publicActors(initialHive());
    const amina = actors.find((actor) => actor.id === "amina");
    const june = actors.find((actor) => actor.id === "june");
    expect(amina?.badge).toBe("Signed in with Facebook");
    expect(amina?.follow.href).toBe("https://www.facebook.com/amina.cole");
    expect(june?.badge).toBe(signInBadge("instagram"));
    expect(june?.follow.label).toBe("Follow on Instagram");
    expect(JSON.stringify(actors)).not.toContain("credentials");
  });

  it("lets a subscriber open a topic and another subscriber answer", () => {
    const started = postTopic(initialHive(), {
      authorId: "june",
      name: "Calls with a baby on you",
      content: "The cotton stays. The meeting can wait one minute.",
    });
    if ("error" in started) throw new Error(started.error);
    const answered = replyToTopic(started.state, {
      authorId: "amina",
      topicId: started.topic.id,
      content: "I hear you from the car line.",
    });
    if ("error" in answered) throw new Error(answered.error);
    expect(answered.reply.inReplyTo).toBe(started.topic.id);
  });

  it("refuses a topic from someone who is not subscribed", () => {
    const result = postTopic(initialHive(), {
      authorId: "guest",
      name: "Hello",
      content: "Can I post?",
    });
    expect(result).toEqual({ error: "Only a Hive subscriber can start a topic." });
  });
});

describe("Buzz captions from the Bee interview", () => {
  const amina = initialHive().actors[0];

  it("writes each platform from that client's own words", () => {
    const captions = captionsForClient({
      name: amina.name,
      interview: amina.interview,
      look: "Stretch wool blazer",
      platforms: ["instagram", "tiktok", "linkedin"],
    });
    const instagram = captions.find((caption) => caption.platform === "instagram")?.text ?? "";
    const tiktok = captions.find((caption) => caption.platform === "tiktok")?.text ?? "";
    const linkedin = captions.find((caption) => caption.platform === "linkedin")?.text ?? "";
    expect(instagram).toContain("Decided, not loud.");
    expect(instagram).toContain("Soft through the waist");
    expect(tiktok.length).toBeLessThan(instagram.length);
    expect(linkedin).toContain("Bee interview");
    expect(captionsStayWithClient(captions, amina.interview)).toBe(true);
  });

  it("asks a model to stay inside the interview", () => {
    const prompt = captionPrompt({
      name: amina.name,
      interview: amina.interview,
      look: "Stretch wool blazer",
      platforms: ["instagram"],
    });
    expect(prompt).toContain("Decided, not loud.");
    expect(prompt).toContain("Do not invent a body");
  });

  it("keeps a model caption only when her words are still in it", () => {
    const parsed = parseModelCaptions(
      JSON.stringify({ instagram: "Decided, not loud. Stretch wool blazer." }),
      ["instagram"],
    );
    expect(parsed?.[0]?.text).toContain("Decided, not loud.");
    expect(parseModelCaptions("not json", ["instagram"])).toBeNull();
  });

  it("posts a subscriber's Bee look and refuses everyone else", () => {
    const posted = prepareBuzzPost(initialHive().actors, {
      userId: "amina",
      look: "Stretch wool blazer",
      platforms: ["facebook"],
    });
    if ("error" in posted) throw new Error(posted.error);
    expect(posted.signIn).toBe("Signed in with Facebook");
    expect(posted.captions[0]?.text).toContain("School run, then a board meeting.");
    expect(
      prepareBuzzPost(initialHive().actors, {
        userId: "guest",
        look: "A dress",
        platforms: ["instagram"],
      }),
    ).toEqual({ error: "Buzz posts Bee looks for Hive subscribers." });
  });
});
