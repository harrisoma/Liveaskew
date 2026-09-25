import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type Room = {
  id: string;
  name: string;
  kind: "topic" | "group" | "dm" | "challenge";
  blurb: string;
};

export type HiveMessage = {
  id: string;
  roomId: string;
  author: string;
  text: string;
  createdAt: string;
};

const file = path.join(process.cwd(), "data", "rooms.json");

const SEED: { rooms: Room[]; messages: HiveMessage[] } = {
  rooms: [
    {
      id: "motherhood",
      name: "Motherhood",
      kind: "topic",
      blurb: "The school run, the night feed, the version of you that stayed.",
    },
    {
      id: "style",
      name: "Style",
      kind: "topic",
      blurb: "Maternity to the boardroom, said out loud.",
    },
    {
      id: "working-mom",
      name: "Working mom",
      kind: "topic",
      blurb: "The school run and the meeting, in the same afternoon.",
    },
    {
      id: "family",
      name: "Family",
      kind: "topic",
      blurb: "The people at the table, and what the day is actually for.",
    },
    {
      id: "editorial",
      name: "Editorial",
      kind: "topic",
      blurb: "The image, the credit, the cut.",
    },
    {
      id: "circle",
      name: "Wednesday circle",
      kind: "group",
      blurb: "A small group. Eight mothers. One brief a week.",
    },
    {
      id: "dm-june",
      name: "June",
      kind: "dm",
      blurb: "A direct message.",
    },
    {
      id: "challenge",
      name: "Style challenge",
      kind: "challenge",
      blurb: "Boardroom on a Wednesday. One sentence with the look.",
    },
  ],
  messages: [
    {
      id: "seed-1",
      roomId: "motherhood",
      author: "June",
      text: "The blazer still buttons. I stopped waiting to feel like the old size.",
      createdAt: "2026-09-23T12:00:00.000Z",
    },
  ],
};

function read() {
  if (!existsSync(file)) return structuredClone(SEED);
  try {
    return JSON.parse(readFileSync(file, "utf8")) as typeof SEED;
  } catch {
    return structuredClone(SEED);
  }
}

function write(data: typeof SEED) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2));
}

export function listRooms() {
  return read().rooms;
}

export function listMessages(roomId: string) {
  return read().messages.filter((message) => message.roomId === roomId);
}

export function addMessage(input: { roomId: string; author: string; text: string }) {
  const data = read();
  if (!data.rooms.some((room) => room.id === input.roomId)) return null;
  const text = input.text.trim();
  if (!text) return null;
  const message: HiveMessage = {
    id: crypto.randomUUID(),
    roomId: input.roomId,
    author: input.author.trim() || "You",
    text: text.slice(0, 500),
    createdAt: new Date().toISOString(),
  };
  data.messages.push(message);
  write(data);
  return message;
}

export function listEntries() {
  return read().messages.filter((message) => message.roomId === "challenge");
}
