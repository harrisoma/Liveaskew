import type { Platform } from "@liveaskew/api-client";
import {
  interviewCaption,
  type BeeInterview,
  type BuzzDraft,
  type PlatformCaption,
  type Subscriber,
} from "./hive";

export type ClientVoice = {
  id: string;
  name: string;
  about: string;
  learned: string[];
  interview: BeeInterview | null;
};

export function voiceId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "buzz-member";
}

export function blankVoice(name: string, about = ""): ClientVoice {
  return {
    id: voiceId(name),
    name: name.trim() || "You",
    about: about.trim(),
    learned: [],
    interview: null,
  };
}

export function voiceFromSubscriber(actor: Subscriber, learned: string[] = []): ClientVoice {
  return {
    id: actor.id,
    name: actor.name,
    about: "",
    learned,
    interview: actor.interview,
  };
}

export function learnAbout(voice: ClientVoice, note: string): ClientVoice {
  const text = note.trim().slice(0, 280);
  if (!text || voice.learned.includes(text)) return voice;
  return { ...voice, learned: [...voice.learned, text].slice(-8) };
}

function portrait(voice: ClientVoice, look: string) {
  const known = [
    voice.interview
      ? interviewCaption({ name: voice.name, interview: voice.interview, look })
      : `${voice.name}: ${look.trim()}`,
    voice.about.trim(),
    voice.learned.length > 0 ? `Buzz learned: ${voice.learned.join(" | ")}` : "",
  ].filter((part) => part.length > 0);
  return known.join(" ");
}

function shape(platform: Platform, full: string, name: string) {
  if (platform === "tiktok") return (full.split(/(?<=\.)\s/)[0] ?? full).slice(0, 140);
  if (platform === "linkedin") return `${full} Written for ${name.split(" ")[0] || name}.`;
  if (platform === "pinterest") return `${full} Saved from Buzz.`;
  if (platform === "facebook") return `${full} Posted with Buzz.`;
  return full;
}

export function captionsFromVoice(input: {
  voice: ClientVoice;
  look: string;
  platforms: Platform[];
}): PlatformCaption[] {
  const full = portrait(input.voice, input.look);
  return input.platforms.map((platform) => ({
    platform,
    text: shape(platform, full, input.voice.name),
  }));
}

export function prepareOwnLook(input: {
  voice: ClientVoice;
  look: string;
  platforms: Platform[];
  signIn?: string;
}): BuzzDraft | { error: string } {
  if (!input.voice.name.trim()) return { error: "Buzz needs your name." };
  if (!input.look.trim()) return { error: "Tell Buzz what the look is." };
  if (input.platforms.length === 0) return { error: "Pick at least one platform." };
  const captions = captionsFromVoice(input);
  return {
    authorName: input.voice.name,
    signIn: input.signIn ?? "On Buzz",
    summary: captions[0]?.text ?? input.look,
    captions,
  };
}
