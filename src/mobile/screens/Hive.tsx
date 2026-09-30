import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Flag, MoreHorizontal, Paperclip, ShieldOff, Trash2, X } from "lucide-react";
import { NeoButton, NeoField, Screen, Skeleton } from "../components/ui";
import {
  blockMember,
  deleteMessage,
  hiveSession,
  listBlocked,
  listMessages,
  listRooms,
  lookForHive,
  reportMessage,
  saveDisplayName,
  sendMessage,
  subscribeRoom,
  upsertMessage,
  type HiveMessage,
  type HiveRoom,
  type HiveSession,
  type ReportReason,
} from "../lib/hive";
import type { GuideLook } from "../lib/storage";

const REASONS: { id: ReportReason; label: string }[] = [
  { id: "body_shaming", label: "Comments on someone's body" },
  { id: "harassment", label: "Harassment" },
  { id: "spam", label: "Spam" },
  { id: "other", label: "Something else" },
];

export function HiveScreen({
  looks,
  shareLook,
  onShared,
  onDiscussWithBee,
  openRoomId = null,
  onRoomOpened,
}: {
  looks: GuideLook[];
  /** A look sent from the Style Guide, waiting for a room. */
  shareLook: GuideLook | null;
  onShared: () => void;
  onDiscussWithBee: (look: GuideLook) => void;
  /** A room to open straight away, e.g. from Bee's Real Talk. */
  openRoomId?: string | null;
  onRoomOpened?: () => void;
}) {
  const [session, setSession] = useState<HiveSession | null>(null);
  const [rooms, setRooms] = useState<HiveRoom[]>([]);
  const [room, setRoom] = useState<HiveRoom | null>(null);

  useEffect(() => {
    let live = true;
    void hiveSession().then(async (s) => {
      if (!live) return;
      setSession(s);
      if (s.state === "ready") setRooms(await listRooms());
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!openRoomId) return;
    const target = rooms.find((r) => r.id === openRoomId);
    if (!target) return;
    setRoom(target);
    onRoomOpened?.();
  }, [openRoomId, rooms, onRoomOpened]);

  if (!session) {
    return (
      <Screen kicker="The Hive" title="Talk about your looks">
        <Skeleton className="h-20" />
        <Skeleton className="mt-3 h-20" />
      </Screen>
    );
  }

  if (session.state !== "ready") {
    const saved = looks.filter((l) => l.saved);
    return (
      <Screen kicker="The Hive" title="Talk about your looks">
        <div className="neo-inset px-4 py-4 text-sm leading-relaxed">
          {session.state === "offline"
            ? "The Hive is where members talk through their looks together. It opens once this app is connected to your LiveAskew account."
            : "Sign in with Google or Apple to join the Hive rooms."}
        </div>
        {saved.length > 0 && (
          <>
            <p className="la-kicker mt-5">Meanwhile, with Bee</p>
            <ul className="mt-2 space-y-3">
              {saved.map((l) => (
                <li key={l.id} className="neo-raised p-4 text-sm">
                  <p className="font-semibold">{l.title}</p>
                  <NeoButton className="mt-3" onClick={() => onDiscussWithBee(l)}>
                    Talk it through with Bee
                  </NeoButton>
                </li>
              ))}
            </ul>
          </>
        )}
      </Screen>
    );
  }

  if (!session.displayName) {
    return (
      <NameStep
        userId={session.userId}
        onSaved={async (name) => {
          setSession({ ...session, displayName: name });
          setRooms(await listRooms());
        }}
      />
    );
  }

  if (room) {
    return (
      <RoomView
        room={room}
        userId={session.userId}
        looks={looks.filter((l) => l.saved)}
        shareLook={shareLook}
        onShared={onShared}
        onBack={() => setRoom(null)}
      />
    );
  }

  return (
    <Screen kicker="The Hive" title="Rooms">
      {shareLook && (
        <p className="mb-4 neo-inset px-3 py-2 text-sm" role="status">
          Pick a room to share “{shareLook.title}”.
        </p>
      )}
      <p className="mb-4 text-sm leading-relaxed">
        You're here as <strong>{session.displayName}</strong>. Talk about the clothes and the day —
        never anyone's body.
      </p>
      {rooms.length === 0 ? (
        <div className="neo-inset px-4 py-8 text-sm">No rooms open yet.</div>
      ) : (
        <ul className="space-y-3">
          {rooms.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="neo-choice flex-col items-start"
                onClick={() => setRoom(r)}
              >
                <span className="la-display text-lg">{r.name}</span>
                <span className="mt-1 text-sm font-normal opacity-70">{r.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}

function NameStep({ userId, onSaved }: { userId: string; onSaved: (name: string) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Screen kicker="The Hive" title="Your Hive name">
      <p className="mb-4 text-sm leading-relaxed">
        This is the name other members see next to what you post. Your email and phone stay private.
      </p>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const err = await saveDisplayName(userId, name);
          setBusy(false);
          if (err) setError(err);
          else onSaved(name.trim().replace(/\s+/g, " "));
        }}
      >
        <NeoField
          placeholder="First name or a nickname"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && <p className="text-sm">{error}</p>}
        <NeoButton type="submit" variant="ink" disabled={busy || name.trim().length < 2}>
          Enter the Hive
        </NeoButton>
      </form>
    </Screen>
  );
}

function RoomView({
  room,
  userId,
  looks,
  shareLook,
  onShared,
  onBack,
}: {
  room: HiveRoom;
  userId: string;
  looks: GuideLook[];
  shareLook: GuideLook | null;
  onShared: () => void;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<HiveMessage[] | null>(null);
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [body, setBody] = useState("");
  const [attached, setAttached] = useState<GuideLook | null>(shareLook);
  const [picking, setPicking] = useState(false);
  const [sending, setSending] = useState(false);
  const [menuFor, setMenuFor] = useState<HiveMessage | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    void Promise.all([listMessages(room.id), listBlocked(userId)]).then(([list, blocks]) => {
      if (!live) return;
      setMessages(list);
      setBlocked(new Set(blocks));
    });
    const stop = subscribeRoom(room.id, {
      onInsert: (m) => setMessages((prev) => upsertMessage(prev ?? [], m)),
      onDelete: (id) => setMessages((prev) => (prev ?? []).filter((m) => m.id !== id)),
    });
    return () => {
      live = false;
      stop();
    };
  }, [room.id, userId]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const visible = (messages ?? []).filter((m) => !blocked.has(m.userId));

  return (
    <Screen
      kicker="The Hive"
      title={room.name}
      footer={
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (sending) return;
            setSending(true);
            setNotice(null);
            const result = await sendMessage({
              roomId: room.id,
              userId,
              body,
              look: attached ? lookForHive(attached) : null,
            });
            setSending(false);
            if ("error" in result) {
              setNotice(result.error);
              return;
            }
            setMessages((prev) => upsertMessage(prev ?? [], result));
            setBody("");
            if (attached) {
              setAttached(null);
              onShared();
            }
          }}
        >
          {attached && (
            <div className="neo-inset flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="truncate">Sharing: {attached.title}</span>
              <button
                type="button"
                aria-label="Remove attached look"
                onClick={() => setAttached(null)}
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          )}
          {picking && (
            <ul className="neo-inset max-h-40 space-y-1 overflow-y-auto p-2 text-sm">
              {looks.length === 0 && <li className="px-2 py-1">Save a look in Bee first.</li>}
              {looks.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    className="w-full rounded-[10px] px-2 py-2 text-left hover:opacity-80"
                    onClick={() => {
                      setAttached(l);
                      setPicking(false);
                    }}
                  >
                    {l.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-end gap-2">
            <button
              type="button"
              className="neo-icon-btn shrink-0"
              aria-label="Attach a saved look"
              aria-expanded={picking}
              onClick={() => setPicking((v) => !v)}
            >
              <Paperclip size={16} aria-hidden />
            </button>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              maxLength={2000}
              placeholder={attached ? "Say something about this look…" : `Talk in ${room.name}…`}
              className="neo-input resize-none"
            />
          </div>
          <NeoButton type="submit" variant="ink" disabled={sending || !body.trim()}>
            {sending ? "Sending…" : "Send"}
          </NeoButton>
        </form>
      }
    >
      <button type="button" className="mb-3 flex items-center gap-1 text-sm" onClick={onBack}>
        <ArrowLeft size={14} aria-hidden /> All rooms
      </button>
      <p className="mb-4 text-sm opacity-70">{room.blurb}</p>
      {notice && (
        <p className="mb-3 neo-inset px-3 py-2 text-sm" role="status">
          {notice}
        </p>
      )}
      {messages === null ? (
        <Skeleton className="h-24" />
      ) : visible.length === 0 ? (
        <div className="neo-inset px-4 py-8 text-sm leading-relaxed">
          Nobody has spoken yet. Share a look and start it.
        </div>
      ) : (
        <ul className="space-y-3" aria-live="polite">
          {visible.map((m) => {
            const mine = m.userId === userId;
            return (
              <li
                key={m.id}
                className={mine ? "neo-inset px-4 py-3 text-sm" : "neo-raised px-4 py-3 text-sm"}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="la-kicker">
                    {mine ? "You" : m.author}
                    {m.hidden && " · hidden after reports"}
                  </p>
                  <button
                    type="button"
                    aria-label={`Options for ${mine ? "your" : `${m.author}'s`} message`}
                    onClick={() => setMenuFor(menuFor?.id === m.id ? null : m)}
                  >
                    <MoreHorizontal size={16} aria-hidden />
                  </button>
                </div>
                {m.look && (
                  <div className="mt-2 neo-inset p-3">
                    <div className="mb-2 flex gap-1" aria-hidden>
                      {m.look.palette.map((c) => (
                        <span
                          key={c}
                          className="h-4 flex-1 rounded-[6px]"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                    <p className="font-semibold">{m.look.title}</p>
                    <p className="mt-1 opacity-80">{m.look.formula.join(", ")}</p>
                  </div>
                )}
                <p className="mt-2 whitespace-pre-wrap leading-relaxed">{m.body}</p>
                {menuFor?.id === m.id && (
                  <MessageMenu
                    mine={mine}
                    onDelete={async () => {
                      setMenuFor(null);
                      if (await deleteMessage(m.id)) {
                        setMessages((prev) => (prev ?? []).filter((x) => x.id !== m.id));
                      }
                    }}
                    onReport={async (reason) => {
                      setMenuFor(null);
                      const ok = await reportMessage(m.id, userId, reason);
                      setNotice(
                        ok
                          ? "Thank you. The team will look at it, and it hides if others report it too."
                          : "That report did not go through. Try again.",
                      );
                    }}
                    onBlock={async () => {
                      setMenuFor(null);
                      if (await blockMember(userId, m.userId)) {
                        setBlocked((prev) => new Set(prev).add(m.userId));
                        setNotice(`You won't see ${m.author} in the Hive anymore.`);
                      }
                    }}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
      <div ref={end} />
    </Screen>
  );
}

function MessageMenu({
  mine,
  onDelete,
  onReport,
  onBlock,
}: {
  mine: boolean;
  onDelete: () => void;
  onReport: (reason: ReportReason) => void;
  onBlock: () => void;
}) {
  const [reporting, setReporting] = useState(false);
  if (mine) {
    return (
      <div className="mt-3">
        <NeoButton onClick={onDelete}>
          <Trash2 size={14} aria-hidden className="mr-1 inline" /> Delete my message
        </NeoButton>
      </div>
    );
  }
  if (reporting) {
    return (
      <div className="mt-3 space-y-2">
        <p className="la-kicker">Why are you reporting this?</p>
        {REASONS.map((r) => (
          <NeoButton key={r.id} onClick={() => onReport(r.id)}>
            {r.label}
          </NeoButton>
        ))}
      </div>
    );
  }
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <NeoButton onClick={() => setReporting(true)}>
        <Flag size={14} aria-hidden className="mr-1 inline" /> Report
      </NeoButton>
      <NeoButton onClick={onBlock}>
        <ShieldOff size={14} aria-hidden className="mr-1 inline" /> Block
      </NeoButton>
    </div>
  );
}
