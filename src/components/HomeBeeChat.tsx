import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUp, ArrowUpRight, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { BeeOrb, type BeeOrbState } from "@/components/BeeOrb";
import { supabase } from "@/integrations/supabase/client";
import { adoptGuestConversation } from "@/lib/guest-chat.functions";

type Msg = { role: "user" | "assistant"; content: string };

const GUEST_ID_KEY = "la_guest_id";
const GUEST_MSGS_KEY = "la_guest_messages";
// After this many of the visitor's own answers, Bee invites them to create an account.
const SIGNUP_AFTER_ANSWERS = 5;

const OPENERS = [
  "I don't know where to start with my wardrobe.",
  "Help me dress for a new job.",
  "What should I wear to a winter wedding?",
];

function readGuestMessages(): Msg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_MSGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Msg[]) : [];
    return Array.isArray(parsed) ? parsed.slice(-24) : [];
  } catch {
    return [];
  }
}

function ensureGuestId(): string {
  const existing = window.localStorage.getItem(GUEST_ID_KEY);
  if (existing) return existing;
  const id = `g_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  window.localStorage.setItem(GUEST_ID_KEY, id);
  return id;
}

export function HomeBeeChat() {
  const adopt = useServerFn(adoptGuestConversation);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);

  // Auth / signup state
  const [authed, setAuthed] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [trialStarted, setTrialStarted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore the guest transcript (client-safe, idempotent).
  useEffect(() => {
    if (typeof window === "undefined") return;
    ensureGuestId();
    setMessages(readGuestMessages());
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setAuthed(true);
    });
  }, []);

  // Persist the guest transcript as it grows.
  useEffect(() => {
    if (typeof window === "undefined" || authed) return;
    try {
      window.localStorage.setItem(GUEST_MSGS_KEY, JSON.stringify(messages.slice(-24)));
    } catch {
      /* storage full or blocked — chat still works for this session */
    }
  }, [messages, authed]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, streaming, showSignup]);

  const answerCount = messages.filter((m) => m.role === "user").length;
  const gated = !authed && answerCount >= SIGNUP_AFTER_ANSWERS;

  useEffect(() => {
    if (gated) setShowSignup(true);
  }, [gated]);

  const streamReply = useCallback(
    async (nextMessages: Msg[]) => {
      setStreaming(true);
      try {
        let res: Response;
        if (authed) {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;
          if (!token) throw new Error("signed_out");
          res = await fetch("/api/bee/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              conversationId,
              message: nextMessages[nextMessages.length - 1]?.content ?? "",
            }),
          });
        } else {
          res = await fetch("/api/public/bee/guest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              guestId: ensureGuestId(),
              messages: nextMessages.slice(-24),
            }),
          });
        }

        if (!res.ok || !res.body) throw new Error("bad_response");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const events = buf.split("\n\n");
          buf = events.pop() ?? "";
          for (const evt of events) {
            let name = "message";
            let data = "";
            for (const ln of evt.split("\n")) {
              if (ln.startsWith("event:")) name = ln.slice(6).trim();
              else if (ln.startsWith("data:")) data += ln.slice(5).trim();
            }
            if (!data) continue;
            let json: { t?: string; conversationId?: string } = {};
            try {
              json = JSON.parse(data);
            } catch {
              continue;
            }
            if (name === "meta" && json.conversationId) {
              setConversationId(json.conversationId);
            } else if (name === "delta" && typeof json.t === "string") {
              const t = json.t;
              setMessages((prev) => {
                const next = prev.slice();
                const last = next[next.length - 1];
                if (last && last.role === "assistant") {
                  next[next.length - 1] = { ...last, content: last.content + t };
                }
                return next;
              });
            } else if (name === "error") {
              throw new Error("stream");
            }
          }
        }
      } catch {
        setError("Something went wrong reaching Bee. Please try again.");
        setMessages((prev) => {
          const next = prev.slice();
          if (
            next.length &&
            next[next.length - 1].role === "assistant" &&
            !next[next.length - 1].content
          ) {
            next.pop();
          }
          return next;
        });
      } finally {
        setStreaming(false);
        setSending(false);
      }
    },
    [authed, conversationId],
  );

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || sending || gated) return;
      setError(null);
      setInput("");
      setSending(true);
      const next: Msg[] = [...messages, { role: "user", content: clean }];
      setMessages([...next, { role: "assistant", content: "" }]);
      await streamReply(next);
    },
    [messages, sending, gated, streamReply],
  );

  const orbState: BeeOrbState =
    inputFocused && input.trim().length > 0
      ? "listening"
      : streaming
        ? "speaking"
        : sending
          ? "thinking"
          : "idle";

  const onSignedIn = useCallback(
    async (hasSession: boolean) => {
      if (!hasSession) {
        setConfirmSent(true);
        return;
      }
      setAuthed(true);
      setShowSignup(false);
      setTrialStarted(true);
      const transcript = messages.filter((m) => m.content.trim().length > 0);
      if (transcript.length) {
        const result = await adopt({ data: { messages: transcript } });
        if ("conversationId" in result) {
          setConversationId(result.conversationId);
          try {
            window.localStorage.removeItem(GUEST_MSGS_KEY);
          } catch {
            /* ignore */
          }
        }
      }
    },
    [adopt, messages],
  );

  return (
    <section id="talk-to-bee" className="bg-cream px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow">The Conversation</p>
            <h2 className="font-display mt-6 text-5xl leading-[0.98] tracking-tight md:text-6xl">
              Talk to <em className="text-gold-deep">Bee</em>
              <br />
              right here.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <span className="block h-px w-12 bg-gold" />
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink/65">
              No account, no card. Start the interview now — when Bee has enough to build with,
              create your account in this same conversation and your 14-day free trial begins.
            </p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Orb column */}
          <div className="flex flex-col items-center justify-center gap-6 rounded-[2rem] px-8 py-12 neo-dark-raised lg:col-span-4">
            <BeeOrb
              state={orbState}
              size={260}
              surface="dark"
              showOuterGlow={false}
              ariaLabel={`Bee — ${orbState}`}
            />
            <div className="flex items-center gap-2 rounded-full neo-dark-raised px-4 py-2.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
              </span>
              <span className="text-[0.55rem] tracking-[0.28em] uppercase text-cream/65">
                {streaming ? "Bee is speaking" : sending ? "Bee is thinking" : "Bee is listening"}
              </span>
            </div>
          </div>

          {/* Chat column */}
          <div className="flex min-h-[520px] flex-col rounded-[2rem] bg-cream shadow-neo lg:col-span-8">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
              {messages.length === 0 ? (
                <div>
                  <p className="eyebrow text-gold-deep">Bee</p>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-ink/75">
                    Hello. I'm Bee. Before I dress you, I'd like to listen. Tell me what's on your
                    mind — or pick one of these to begin.
                  </p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {OPENERS.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => void send(o)}
                        className="rounded-2xl bg-cream px-4 py-3 text-left text-sm text-ink/70 shadow-neo-sm transition hover:shadow-neo"
                      >
                        "{o}"
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <ul className="space-y-7">
                  {messages.map((m, i) => (
                    <li key={i}>
                      {m.role === "user" ? (
                        <div className="flex justify-end">
                          <div className="neo-bubble-user max-w-[85%] px-5 py-3 text-sm">
                            {m.content}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="eyebrow mb-3 text-gold-deep">Bee</p>
                          {m.content ? (
                            <div className="prose prose-sm max-w-none text-ink/85 [&_p]:my-2 [&_strong]:text-ink [&_ul]:my-2">
                              <ReactMarkdown>{m.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 py-2">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink/40" />
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink/40 [animation-delay:150ms]" />
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink/40 [animation-delay:300ms]" />
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {showSignup && !authed && (
                <div className="mt-8">
                  <InlineSignup onDone={onSignedIn} confirmSent={confirmSent} />
                </div>
              )}

              {trialStarted && (
                <div className="mt-8 rounded-3xl bg-cream px-5 py-4 shadow-neo-inset">
                  <p className="font-display text-base leading-snug text-ink">
                    You're in. Your 14-day free trial is ready to activate — Bee keeps talking
                    either way.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <Link
                      to="/checkout/$tier"
                      params={{ tier: "gold" }}
                      className="neo-btn-ink !px-5 !py-3 text-[0.7rem]"
                    >
                      Activate 14-day trial
                      <ArrowUpRight
                        size={14}
                        className="transition-transform group-hover:-translate-y-0.5"
                      />
                    </Link>
                    <Link
                      to="/chat"
                      className="text-[0.65rem] tracking-[0.22em] uppercase text-ink/55 hover:text-gold-deep"
                    >
                      Continue in full chat
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-5 md:px-10">
              {error && (
                <p className="mb-3 rounded-2xl bg-cream px-4 py-3 text-sm text-ink/75 shadow-neo-inset">
                  {error}
                </p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
                className="relative"
              >
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (error) setError(null);
                  }}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  placeholder={
                    gated
                      ? "Create your account above to keep going…"
                      : "Tell Bee what you're dressing for…"
                  }
                  rows={2}
                  disabled={sending || gated}
                  className="w-full resize-none rounded-2xl border-0 bg-cream px-4 py-3 pr-14 text-sm text-ink shadow-neo-inset placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-gold-deep disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={sending || gated || !input.trim()}
                  aria-label="Send"
                  className="neo-icon absolute right-3 bottom-3 h-9 w-9 bg-ink text-cream disabled:opacity-40"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InlineSignup({
  onDone,
  confirmSent,
}: {
  onDone: (hasSession: boolean) => void | Promise<void>;
  confirmSent: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<"signup" | "signin">("signup");

  if (confirmSent) {
    return (
      <div className="rounded-3xl bg-cream px-5 py-5 shadow-neo-inset">
        <p className="eyebrow text-gold-deep">Almost</p>
        <p className="font-display mt-3 text-xl leading-snug">Check your email.</p>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/70">
          Confirm your address and Bee will pick this conversation up exactly where you left it —
          with your 14-day free trial waiting.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        await onDone(Boolean(data.session));
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        await onDone(Boolean(data.session));
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "That didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl bg-cream px-5 py-5 shadow-neo">
      <p className="eyebrow text-gold-deep">Keep going</p>
      <p className="font-display mt-3 text-xl leading-snug">
        {mode === "signup" ? "Create your account to continue." : "Welcome back."}
      </p>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink/70">
        Bee has enough to start building. Save this conversation and your 14-day free trial begins —
        no charge today.
      </p>
      <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-2xl border-0 bg-cream px-4 py-3 text-sm text-ink shadow-neo-inset placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-gold-deep"
        />
        <input
          type="password"
          required
          minLength={8}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="rounded-2xl border-0 bg-cream px-4 py-3 text-sm text-ink shadow-neo-inset placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-gold-deep"
        />
        <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy} className="neo-btn-ink !px-6 !py-3 text-[0.7rem]">
            {busy && <Loader2 size={14} className="animate-spin" />}
            {mode === "signup" ? "Create account · 14 days free" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setErr(null);
            }}
            className="text-[0.65rem] tracking-[0.22em] uppercase text-ink/55 hover:text-gold-deep"
          >
            {mode === "signup" ? "I already have an account" : "Create an account instead"}
          </button>
        </div>
      </form>
      {err && <p className="mt-3 text-sm text-ink/70">{err}</p>}
    </div>
  );
}
