import { useEffect, useState, type FormEvent } from "react";
import { HIVE_ROOMS } from "@/lib/hive";

type Note = { id: string; roomId: string; author: string; text: string };

const KEY = "la_hive_room_v1";
const NAME_KEY = "la_hive_name";

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

export function HiveRoom() {
  const [roomId, setRoomId] = useState<(typeof HIVE_ROOMS)[number]["id"]>("motherhood");
  const [name, setName] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [notes, setNotes] = useState<Note[]>(SEED);
  const [text, setText] = useState("");

  useEffect(() => {
    const savedName = window.localStorage.getItem(NAME_KEY) ?? "";
    setName(savedName);
    setSignedIn(savedName.trim().length > 0);
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
    setName(next);
    setSignedIn(true);
  }

  function send(event: FormEvent) {
    event.preventDefault();
    const line = text.trim();
    if (!line || !signedIn) return;
    const next = [
      ...notes,
      { id: crypto.randomUUID(), roomId, author: name, text: line.slice(0, 500) },
    ];
    setNotes(next);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    setText("");
  }

  const room = HIVE_ROOMS.find((item) => item.id === roomId) ?? HIVE_ROOMS[0];
  const visible = notes.filter((note) => note.roomId === roomId);

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
        <ul className="mt-4 space-y-3">
          {visible.map((note) => (
            <li key={note.id} className="rounded-2xl bg-white/70 px-4 py-3">
              <p className="text-[0.62rem] tracking-[0.16em] uppercase text-[#b8860b]">
                {note.author}
              </p>
              <p className="mt-1 text-sm leading-relaxed">{note.text}</p>
            </li>
          ))}
        </ul>
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
          <form onSubmit={signIn} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              aria-label="Your name"
              className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-3 text-sm"
            />
            <button type="submit" className="glass-btn">
              Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
