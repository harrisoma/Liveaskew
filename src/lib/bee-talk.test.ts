import { describe, expect, it } from "vitest";
import {
  CRISIS_RESOURCES,
  TALK_GUIDES,
  TALK_TOPICS,
  isTalkTopic,
  localTalkReply,
  needsCrisisCare,
  talkOpener,
  talkSystemPrompt,
  withCrisisResources,
} from "./bee-talk";

describe("Real Talk topics", () => {
  it("every topic opens with a single question and has somewhere deeper to go", () => {
    for (const t of TALK_TOPICS) {
      const guide = TALK_GUIDES[t];
      expect(guide.openers.length).toBeGreaterThan(0);
      expect(guide.deeper.length).toBeGreaterThan(0);
      for (const q of guide.openers) expect(q.trim().endsWith("?")).toBe(true);
    }
  });

  it("points each topic at a Hive room that exists", () => {
    const rooms = ["style", "motherhood", "working-mom", "family", "editorial", "challenge"];
    for (const t of TALK_TOPICS) expect(rooms).toContain(TALK_GUIDES[t].hiveRoom);
  });

  it("picks openers across the whole list", () => {
    const guide = TALK_GUIDES.motherhood;
    expect(talkOpener("motherhood", 0)).toBe(guide.openers[0]);
    expect(talkOpener("motherhood", 0.9999)).toBe(guide.openers.at(-1));
    expect(talkOpener("motherhood", 1)).toBe(guide.openers.at(-1));
  });

  it("offline replies rotate through the deeper questions", () => {
    const deeper = TALK_GUIDES.work.deeper;
    expect(localTalkReply("work", 0)).toContain(deeper[0]);
    expect(localTalkReply("work", deeper.length)).toContain(deeper[0]);
  });

  it("validates topics from the wire", () => {
    expect(isTalkTopic("relationships")).toBe(true);
    expect(isTalkTopic("politics")).toBe(false);
    expect(isTalkTopic(undefined)).toBe(false);
  });
});

describe("crisis care", () => {
  it.each([
    "some days I want to end it all",
    "I've been thinking about suicide",
    "honestly they'd be better off without me",
    "I don't want to wake up tomorrow",
    "he hits me when he drinks",
    "she hurt me again last night",
    "I keep wanting to hurt myself",
    "I'm scared I might hurt the baby",
  ])("recognises %j", (text) => {
    expect(needsCrisisCare(text)).toBe(true);
  });

  it.each([
    "this deadline is killing me",
    "my feet hurt in these heels",
    "I hit a wall at work today",
    "I want to end the meeting early",
    "it hurts me that she didn't call",
  ])("does not alarm on everyday talk: %j", (text) => {
    expect(needsCrisisCare(text)).toBe(false);
  });

  it("always carries the resources in a crisis reply", () => {
    expect(withCrisisResources("I'm so glad you told me.")).toContain(CRISIS_RESOURCES);
    const already = "Please call or text 988 now.";
    expect(withCrisisResources(already)).toBe(already);
  });

  it("switches the prompt to safety first", () => {
    const calm = talkSystemPrompt("motherhood", {}, false);
    const crisis = talkSystemPrompt("motherhood", {}, true);
    expect(calm).toContain("One question per reply");
    expect(crisis).toContain("SAFETY");
    expect(crisis).toContain("988");
  });
});
