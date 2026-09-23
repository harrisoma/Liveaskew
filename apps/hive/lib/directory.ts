import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  initialHive,
  postTopic,
  replyToTopic,
  type HiveState,
  type Reply,
  type Topic,
} from "@liveaskew/community";

const file = path.join(process.cwd(), "data", "community.json");

export function readHive(): HiveState {
  if (!existsSync(file)) return initialHive();
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as HiveState;
    if (!Array.isArray(parsed.actors) || !Array.isArray(parsed.topics)) return initialHive();
    return parsed;
  } catch {
    return initialHive();
  }
}

export function writeHive(state: HiveState) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2));
}

export function startTopic(input: { authorId: string; name: string; content: string }) {
  const result = postTopic(readHive(), input);
  if ("error" in result) return result;
  writeHive(result.state);
  return result;
}

export function addReply(input: { authorId: string; topicId: string; content: string }) {
  const result = replyToTopic(readHive(), input);
  if ("error" in result) return result;
  writeHive(result.state);
  return result;
}

export function topicThread(topicId: string): { topic: Topic; replies: Reply[] } | null {
  const state = readHive();
  const topic = state.topics.find((item) => item.id === topicId);
  if (!topic) return null;
  return {
    topic,
    replies: state.replies.filter((reply) => reply.inReplyTo === topicId),
  };
}
