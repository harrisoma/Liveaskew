import { inviteToken, hiveInviteLink } from "../lib/hive-invites";
import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Users,
  Plus,
  Mail,
  LockKeyhole,
  Globe,
  ArrowUpRight,
  Send,
  ShieldCheck,
  Flag,
  Share2,
} from "lucide-react";
import crestHive from "@/assets/brand/crest-hive.webp";
import type { HiveRoom, HiveMessage } from "../lib/hive";
import { subscribeRoom, upsertMessage, reportMessage, blockMember } from "../lib/hive";
import { type HiveCommunityApi, type HiveGroup } from "../lib/hive-groups";
import "./hive-community.css";
export function HiveCommunity({
  userId,
  displayName,
  api,
  onOpenRoom,
  preview = false,
}: {
  userId: string;
  displayName: string;
  api: HiveCommunityApi;
  onOpenRoom: (room: HiveRoom) => void;
  preview?: boolean;
}) {
  const [tab, setTab] = useState<"feed" | "groups" | "invites">("feed");
  const [groups, setGroups] = useState<HiveGroup[]>([]);
  const [messages, setMessages] = useState<HiveMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privateGroup, setPrivateGroup] = useState(true);
  const [body, setBody] = useState("");
  const [invitation, setInvitation] = useState("");
  const [issued, setIssued] = useState("");
  async function reload() {
    setLoading(true);
    try {
      const [rooms, feed] = await Promise.all([api.list(), api.feed()]);
      setGroups(rooms);
      setMessages(feed);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The Hive couldn’t load.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    void Promise.all([api.list(), api.feed()])
      .then(([rooms, feed]) => {
        if (active) {
          setGroups(rooms);
          setMessages(feed);
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : "The Hive couldn’t load.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [api]);
  useEffect(() => {
    const token =
      inviteToken(location.href) ?? inviteToken(sessionStorage.getItem("la_hive_invite") ?? "");
    if (token) {
      setInvitation(token);
      setTab("invites");
      const url = new URL(location.href);
      url.searchParams.delete("hive_invite");
      history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  }, []);
  useEffect(() => {
    if (preview) return;
    return subscribeRoom("main", {
      onInsert: (m) => setMessages((current) => upsertMessage(current, m)),
      onDelete: (id) => setMessages((current) => current.filter((m) => m.id !== id)),
    });
  }, [preview]);
  async function act(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!creating) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const input = dialog?.querySelector<HTMLInputElement>("input");
    input?.focus();
    function trap(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCreating(false);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const elements = Array.from(
        dialog.querySelectorAll<HTMLElement>("button:not(:disabled),input,textarea"),
      );
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", trap);
    return () => {
      document.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, [creating]);
  const mine = groups.filter((g) => g.ownerId && g.joined);
  const publicGroups = groups.filter((g) => g.ownerId && g.visibility === "public" && !g.joined);
  return (
    <main className="hive-community">
      <header className="hive-heading">
        <div className="hive-title">
          <img src={crestHive} alt="" />
          <div>
            <h1>The Hive</h1>
            <p>One community. Your own circles.</p>
          </div>
        </div>
        <button className="hive-primary" onClick={() => setCreating(true)}>
          <Plus size={17} aria-hidden />
          Create group
        </button>
      </header>
      <div className="hive-layout">
        <nav className="hive-navigation" aria-label="Hive sections">
          {(
            [
              { id: "feed", label: "Main network", Icon: Globe },
              { id: "groups", label: "My groups", Icon: Users },
              { id: "invites", label: "Invitations", Icon: Mail },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
            >
              <Icon size={18} aria-hidden />
              {label}
              {id === "groups" && <span>{mine.length}</span>}
            </button>
          ))}
          <div className="hive-nav-groups">
            <strong>Your circles</strong>
            {mine.length ? (
              mine.map((g) => (
                <button key={g.id} onClick={() => onOpenRoom(g)}>
                  <LockKeyhole size={14} aria-hidden />
                  {g.name}
                </button>
              ))
            ) : (
              <p>Create a group or accept an invitation to start your first circle.</p>
            )}
          </div>
        </nav>
        <section
          className="hive-content"
          aria-label={tab === "feed" ? "Main network" : tab === "groups" ? "Groups" : "Invitations"}
        >
          {error && (
            <div className="hive-error" role="alert">
              {error}
              <button onClick={() => void reload()} disabled={loading}>
                Refresh
              </button>
            </div>
          )}
          {tab === "feed" && (
            <>
              <div className="hive-section-title">
                <h2>Main network</h2>
                <span>Visible to Hive members</span>
              </div>
              <form
                className="hive-compose"
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(async () => {
                    const message = await api.post(body.trim());
                    setMessages((current) => upsertMessage(current, message));
                    setBody("");
                  });
                }}
              >
                <div className="hive-compose-member">
                  <span className="hive-avatar" aria-hidden>
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <strong>{displayName}</strong>
                  <span>Posting to the main network</span>
                </div>
                <label className="sr-only" htmlFor="hive-post">
                  Start a conversation
                </label>
                <textarea
                  id="hive-post"
                  placeholder="What’s on your mind? Ask a question, share a moment, or start a conversation."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={2000}
                  rows={3}
                />
                <footer>
                  <small>Any topic. Keep it kind.</small>
                  <button className="hive-primary" disabled={busy || !body.trim() || loading}>
                    <Send size={15} aria-hidden />
                    {busy ? "Posting…" : "Post to Hive"}
                  </button>
                </footer>
              </form>
              {loading ? (
                <p role="status" className="hive-empty">
                  Loading your community…
                </p>
              ) : messages.length === 0 ? (
                <div className="hive-empty">
                  <MessageCircle size={30} aria-hidden />
                  <h3>Start the first conversation.</h3>
                  <p>
                    There’s room for everyday life, big questions, hobbies, and everything between.
                  </p>
                </div>
              ) : (
                <div className="hive-feed">
                  {[...messages].reverse().map((m) => (
                    <article key={m.id} className="hive-post">
                      <header>
                        <span className="hive-avatar" aria-hidden>
                          {m.author.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <strong>{m.author}</strong>
                          <small>
                            {new Date(m.createdAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </small>
                        </div>
                        <span className="hive-post-scope">Main network</span>
                      </header>
                      <p>{m.body}</p>
                      <button
                        className="hive-text-action"
                        onClick={() =>
                          onOpenRoom({ id: "main", name: "Main network", kind: "topic", blurb: "" })
                        }
                      >
                        <MessageCircle size={15} aria-hidden />
                        Join the conversation
                      </button>
                      {m.userId !== userId && (
                        <div className="hive-safety-actions">
                          <button
                            disabled={busy}
                            onClick={() =>
                              void act(async () => {
                                if (preview) {
                                  setError("Sample report: no real member was reported.");
                                  return;
                                }
                                if (!(await reportMessage(m.id, userId, "other")))
                                  throw new Error("The report couldn’t send.");
                                setError("Report sent to the moderation team.");
                              })
                            }
                          >
                            <Flag size={13} aria-hidden />
                            Report
                          </button>
                          <button
                            disabled={busy}
                            onClick={() =>
                              void act(async () => {
                                if (!preview && !(await blockMember(userId, m.userId)))
                                  throw new Error("The member couldn’t be blocked.");
                                setMessages((current) =>
                                  current.filter((post) => post.userId !== m.userId),
                                );
                              })
                            }
                          >
                            Block member
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
          {tab === "groups" && (
            <>
              <div className="hive-section-title">
                <h2>Your groups</h2>
                <span>Smaller circles inside the Hive</span>
              </div>
              {mine.length === 0 && (
                <div className="hive-empty">
                  <Users size={30} aria-hidden />
                  <h3>A space for your people.</h3>
                  <p>Create a group around any topic. Choose public or invite-only.</p>
                  <button className="hive-primary" onClick={() => setCreating(true)}>
                    Create your first group
                  </button>
                </div>
              )}
              <div className="hive-groups">
                {mine.map((g) => (
                  <GroupCard
                    key={g.id}
                    group={g}
                    onOpen={() => onOpenRoom(g)}
                    onInvite={
                      g.ownerId === userId
                        ? () =>
                            void act(async () => {
                              const token = await api.invite(g.id);
                              setIssued(
                                hiveInviteLink(
                                  token,
                                  location.origin,
                                  import.meta.env.VITE_API_BASE,
                                ),
                              );
                              setTab("invites");
                            })
                        : undefined
                    }
                    onLeave={
                      g.ownerId !== userId
                        ? () =>
                            void act(async () => {
                              await api.leave(g.id);
                              await reload();
                            })
                        : undefined
                    }
                    busy={busy}
                  />
                ))}
              </div>
              <h3 className="hive-discover-title">Discover public groups</h3>
              <div className="hive-groups">
                {publicGroups.map((g) => (
                  <GroupCard
                    key={g.id}
                    group={g}
                    onJoin={() =>
                      void act(async () => {
                        await api.join(g.id);
                        await reload();
                      })
                    }
                    busy={busy}
                  />
                ))}
              </div>
              {!publicGroups.length && (
                <p className="hive-muted">No other public groups to discover yet.</p>
              )}
            </>
          )}
          {tab === "invites" && (
            <>
              <div className="hive-section-title">
                <h2>Bring your people together</h2>
              </div>
              <section className="hive-invite-card">
                <Mail size={30} aria-hidden />
                <h3>Have an invitation?</h3>
                <p>
                  Paste a group invitation link or code. Private groups open only after you accept.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act(async () => {
                      const id = await api.accept(invitation);
                      await reload();
                      setInvitation("");
                      sessionStorage.removeItem("la_hive_invite");
                      setTab("groups");
                      setError("Invitation accepted. Your group is now in My groups.");
                      void id;
                    });
                  }}
                >
                  <label htmlFor="hive-invitation">Invitation link or code</label>
                  <input
                    id="hive-invitation"
                    value={invitation}
                    onChange={(e) => setInvitation(e.target.value)}
                    placeholder="Paste your invitation"
                  />
                  <button className="hive-primary" disabled={busy || !inviteToken(invitation)}>
                    Accept invitation
                  </button>
                </form>
              </section>
              {issued ? (
                <section className="hive-invite-card">
                  <h3>Your invitation is ready</h3>
                  <p>For one friend. Expires in seven days. A LiveAskew account is required.</p>
                  <label htmlFor="issued-invite">Invitation link</label>
                  <input id="issued-invite" value={issued} readOnly />
                  <button
                    className="hive-primary"
                    onClick={() =>
                      void act(async () => {
                        if (navigator.share)
                          await navigator.share({ title: "Join my Hive group", url: issued });
                        else await navigator.clipboard.writeText(issued);
                      })
                    }
                  >
                    <Share2 size={16} aria-hidden />
                    Share invitation
                  </button>
                </section>
              ) : (
                <p className="hive-muted">
                  To invite friends, open My groups and choose Invite friends on a group you own.
                </p>
              )}
            </>
          )}
        </section>
        <aside className="hive-about">
          <img src={crestHive} alt="" />
          <h2>A community within reach.</h2>
          <p>
            The main network is for everyone here. Groups give your friends, shared interests, and
            private conversations their own space.
          </p>
          <div>
            <Globe size={18} aria-hidden />
            <span>
              <strong>Main network</strong>All Hive members can read and post.
            </span>
          </div>
          <div>
            <LockKeyhole size={18} aria-hidden />
            <span>
              <strong>Private groups</strong>Only accepted members can read or participate.
            </span>
          </div>
          <div>
            <ShieldCheck size={18} aria-hidden />
            <span>
              <strong>Your boundaries matter</strong>Reporting, blocking, and moderation are always
              available.
            </span>
          </div>
        </aside>
      </div>
      {creating && (
        <div className="hive-dialog-backdrop">
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-group-title"
            className="hive-dialog"
          >
            <h2 id="create-group-title">Make a little space.</h2>
            <p>A group inside the Hive, for any topic or circle of friends.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act(async () => {
                  await api.create(name.trim(), description.trim(), privateGroup);
                  await reload();
                  setCreating(false);
                  setName("");
                  setDescription("");
                  setTab("groups");
                });
              }}
            >
              <label htmlFor="group-name">Group name</label>
              <input
                id="group-name"
                maxLength={60}
                minLength={2}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sunday catch-ups, Book club…"
              />
              <label htmlFor="group-description">What’s it about?</label>
              <textarea
                id="group-description"
                maxLength={240}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give your people a reason to join."
              />
              <fieldset>
                <legend>Who can join?</legend>
                <label>
                  <input
                    type="radio"
                    checked={privateGroup}
                    onChange={() => setPrivateGroup(true)}
                    name="privacy"
                  />
                  Private · invitation only
                </label>
                <label>
                  <input
                    type="radio"
                    checked={!privateGroup}
                    onChange={() => setPrivateGroup(false)}
                    name="privacy"
                  />
                  Public · any Hive member
                </label>
              </fieldset>
              {error && <p role="alert">{error}</p>}
              <footer>
                <button type="button" className="hive-secondary" onClick={() => setCreating(false)}>
                  Cancel
                </button>
                <button className="hive-primary" disabled={busy || name.trim().length < 2}>
                  {busy ? "Creating…" : "Create group"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
function GroupCard({
  group: g,
  onOpen,
  onInvite,
  onJoin,
  onLeave,
  busy,
}: {
  group: HiveGroup;
  onOpen?: () => void;
  onInvite?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
  busy: boolean;
}) {
  return (
    <article className="hive-group">
      <span className="hive-group-privacy">
        {g.visibility === "private" ? (
          <LockKeyhole size={14} aria-hidden />
        ) : (
          <Globe size={14} aria-hidden />
        )}
        {g.visibility === "private" ? "Invite-only" : "Public group"}
      </span>
      <h3>{g.name}</h3>
      <p>{g.blurb || "A space for your own conversations."}</p>
      <footer>
        {onOpen && (
          <button className="hive-text-action" onClick={onOpen}>
            Open group <ArrowUpRight size={15} aria-hidden />
          </button>
        )}
        {onJoin && (
          <button className="hive-primary" disabled={busy} onClick={onJoin}>
            Join group
          </button>
        )}
        {onInvite && (
          <button className="hive-text-action" disabled={busy} onClick={onInvite}>
            Invite friends
          </button>
        )}
        {onLeave && (
          <button className="hive-text-action" disabled={busy} onClick={onLeave}>
            Leave group
          </button>
        )}
      </footer>
    </article>
  );
}
