import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  blankVoice,
  learnAbout,
  voiceFromSubscriber,
  voiceId,
  type ClientVoice,
  type Subscriber,
} from "@liveaskew/community";

const file = path.join(process.cwd(), "data", "voices.json");

function read(): ClientVoice[] {
  if (!existsSync(file)) return [];
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as ClientVoice[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(voices: ClientVoice[]) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(voices, null, 2));
}

export function rememberVoice(input: {
  name: string;
  about: string;
  lesson?: string;
  subscriber?: Subscriber | null;
}) {
  const id = input.subscriber?.id ?? voiceId(input.name);
  const voices = read();
  const existing = voices.find((voice) => voice.id === id);
  const base =
    existing ??
    (input.subscriber
      ? voiceFromSubscriber(input.subscriber)
      : blankVoice(input.name, input.about));
  const withAbout = input.about.trim()
    ? { ...base, about: input.about.trim(), name: input.name.trim() || base.name }
    : base;
  const next = input.lesson ? learnAbout(withAbout, input.lesson) : withAbout;
  write([next, ...voices.filter((voice) => voice.id !== id)]);
  return next;
}

export function readVoice(id: string) {
  return read().find((voice) => voice.id === id) ?? null;
}
