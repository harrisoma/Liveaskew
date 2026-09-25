import { useEffect, useState, type FormEvent } from "react";
import { addComment, BEE_LOOKS, loadAlerts, saveAlerts, type HouseAlert } from "@/lib/house";
import { HIVE_ROOMS } from "@/lib/hive";

type Note = {
  id: string;
  roomId: string;
  author: string;
  text: string;
  lookId?: string | null;
  parentId?: string | null;
};

const KEY = "la_hive_room_v1";
const NAME_KEY = "la_hive_name";
const PLATFORM_KEY = "la_hive_platform";
const FOLLOW_KEY = "la_hive_following";

const PLATFORMS = ["Instagram", "Facebook", "TikTok", "Google", "Apple"] as const;
const MEMBERS = [
  { name: "June", platform: "Instagram" },
  { name: "Amina", platform: "TikTok" },
] as const;

const SEED: Note[] = [
  {
    id: "seed-motherhood",
    roomId: "motherhood",
    author: "June",
    text: "Pickup is at three. The coat from yesterday still works.",
  },
  {
    id: "seed-style",
    roomId: "style",
    author: "Amina",
    text: "Wool that holds, silk that breathes. That is the brief.",
  },
  {
    id: "seed-working",
    roomId: "working-mom",
    author: "June",
    text: "Board meeting at ten, school run at three. One closet.",
  },
  {
    id: "seed-family",
    roomId: "family",
    author: "Amina",
    text: "Sunday lunch is at her mother's. Nothing fussy.",
  },
];

export function HiveRoom({ lookId = "" }: { lookId?: string }) {
  const subject = BEE_LOOKS.find((item) => item.id === lookId) ?? null;
  const [roomId, setRoomId] = useState<(typeof HIVE_ROOMS)[number]["id"]>(
    subject ? "style" : "motherhood",
  );
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("Instagram");
  const [signedIn, setSignedIn] = useState(false);
  const [following, setFollowing] = useState<string[]>([]);
  const [notes, setNotes] = useState<Note[]>(SEED);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<HouseAlert[]>([]);

  useEffect(() => {
    if (BEE_LOOKS.some((item) => item.id === lookId)) setRoomId("style");
  }, [lookId]);

  useEffect(() => {
    const savedName = window.localStorage.getItem(NAME_KEY) ?? "";
    const savedPlatform = window.localStorage.getItem(PLATFORM_KEY);
    setName(savedName);
    if (PLATFORMS.includes(savedPlatform as (typeof PLATFORMS)[number])) {
      setPlatform(savedPlatform as (typeof PLATFORMS)[number]);
    }
    setSignedIn(savedName.trim().length > 0);
    setAlerts(loadAlerts());
    try {
      const savedFollows = JSON.parse(window.localStorage.getItem(FOLLOW_KEY) ?? "[]") as string[];
      if (Array.isArray(savedFollows)) setFollowing(savedFollows);
    } catch {
      /* no follows yet */
    }
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Note[];
        if (Array.isArray(parsed) && parsed.length > 0) setNotes(parsed);
      }
    } catch {
      /* keep the seed */
    }
  }, []);

  function signIn(event: FormEvent) {
    event.preventDefault();
    const next = name.trim();
    if (!next) return;
    window.localStorage.setItem(NAME_KEY, next);
    window.localStorage.setItem(PLATFORM_KEY, platform);
    setName(next);
    setSignedIn(true);
  }

  function toggleFollow(member: string) {
    const next = following.includes(member)
      ? following.filter((item) => item !== member)
      : [...following, member];
    setFollowing(next);
    window.localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
  }

  function send(event: FormEvent) {
    event.preventDefault();
    const line = text.trim();
    if (!line || !signedIn) return;
    const comment = addComment({
      roomId,
      author: name,
      text: line.slice(0, 500),
      lookId: roomId === "style" ? (subject?.id ?? null) : null,
      parentId: replyTo,
    });
    setNotes([...notes, comment]);
    setAlerts(loadAlerts());
    setText("");
    setReplyTo(null);
  }

  function markAlertsRead() {
    const next = alerts.map((alert) => ({ ...alert, read: true }));
    setAlerts(next);
    saveAlerts(next);
  }

  const room = HIVE_ROOMS.find((item) => item.id === roomId) ?? HIVE_ROOMS[0];
  const visible = notes
    .filter((note) => note.roomId === roomId && !note.parentId)
    .sort((a, b) => {
      if (!subject) return 0;
      return Number(b.lookId === subject.id) - Number(a.lookId === subject.id);
    });
  const unread = alerts.filter((alert) => !alert.read);

  return (
    <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
      <div className="grid gap-2">
        {HIVE_ROOMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setRoomId(item.id)}
            className={`rounded-2xl px-4 py-3 text-left text-sm ${item.id === roomId ? "bg-black text-white" : "glass text-black"}`}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="glass rounded-[2rem] p-5 text-black">
        <p className="text-[0.62rem] tracking-[0.18em] uppercase text-[#b8860b]">{room.name}</p>
        <p className="mt-2 text-sm leading-relaxed">{room.line}</p>
        {subject && (
          <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3">
            <p className="text-[0.62rem] tracking-[0.18em] uppercase text-[#b8860b]">This look</p>
            <p className="mt-1 font-display text-2xl">{subject.title}</p>
            <p className="mt-1 text-sm leading-relaxed">{subject.pieces}</p>
            <p className="mt-2 text-sm leading-relaxed">
              Bee handed this look to Buzz. Talk about it here.
            </p>
          </div>
        )}
        {unread.length > 0 && (
          <button
            type="button"
            onClick={markAlertsRead}
            className="mt-4 w-full rounded-2xl bg-black px-4 py-3 text-left text-sm text-white"
          >
            {unread.length} new {unread.length === 1 ? "alert" : "alerts"}. {unread[0]?.text} Tap to
            clear.
          </button>
        )}
        <ul className="mt-4 space-y-3">
          {visible.map((note) => {
            const replies = notes.filter((item) => item.parentId === note.id);
            return (
              <li key={note.id} className="rounded-2xl bg-white/70 px-4 py-3">
                <p className="text-[0.62rem] tracking-[0.16em] uppercase text-[#b8860b]">
                  {note.author}
                  {note.lookId
                    ? ` · ${BEE_LOOKS.find((item) => item.id === note.lookId)?.title ?? "Bee look"}`
                    : ""}
                </p>
                <p className="mt-1 text-sm leading-relaxed">{note.text}</p>
                {replies.map((reply) => (
                  <div key={reply.id} className="mt-2 ml-4 border-l border-[#b8860b] pl-3">
                    <p className="text-[0.62rem] tracking-[0.16em] uppercase text-[#b8860b]">
                      {reply.author}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{reply.text}</p>
                  </div>
                ))}
                {signedIn && (
                  <button
                    type="button"
                    className="mt-2 text-sm text-[#b8860b]"
                    onClick={() => setReplyTo(note.id)}
                  >
                    Reply
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {replyTo && <p className="mt-3 text-sm">Replying in this thread.</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {MEMBERS.map((member) => (
            <button
              key={member.name}
              type="button"
              onClick={() => toggleFollow(member.name)}
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-sm"
            >
              {following.includes(member.name) ? "Following" : "Follow"} {member.name}
              <span className="text-black/50"> · {member.platform}</span>
            </button>
          ))}
        </div>
        {signedIn ? (
          <form onSubmit={send} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={`Write as ${name}`}
              aria-label="Message"
              className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-3 text-sm"
            />
            <button type="submit" className="glass-btn">
              Send
            </button>
          </form>
        ) : (
          <form onSubmit={signIn} className="mt-4 grid gap-3">
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((door) => (
                <button
                  key={door}
                  type="button"
                  onClick={() => setPlatform(door)}
                  className={`rounded-full px-3 py-2 text-sm ${platform === door ? "bg-black text-white" : "bg-white text-black"}`}
                  aria-pressed={platform === door}
                >
                  {door}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                aria-label="Your name"
                className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-3 text-sm"
              />
              <button type="submit" className="glass-btn">
                Sign in with {platform}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
