import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ArrowLeft, Loader2, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { loadBeeConversation } from "@/lib/bee-conversation.functions";
import { supabase } from "@/integrations/supabase/client";
import { hasEntitlement, loadResolvedTier } from "@/lib/plans";
import { ActingProfileSwitcher, getActingProfileId } from "@/components/ActingProfileSwitcher";
import { BeeOrb, type BeeOrbState } from "@/components/BeeOrb";

// Minimal Web Speech API typing — these aren't in lib.dom.d.ts everywhere.
type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: { transcript: string };
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

// Strip markdown + sentinels so Bee speaks cleanly.
function cleanForSpeech(text: string): string {
  return text
    .replace(/\[\[ONBOARDING_COMPLETE\]\]/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_#>~]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}


export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Talk to Bee — LiveAskew" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatPage,
});

type Msg = { id?: string; role: "user" | "assistant"; content: string };
type BannerReason = "trial_expired" | "no_subscription" | "credits_exhausted" | "rate_limit" | "generic";
type Banner = { reason: BannerReason; message: string; cta: string; link: string | null };

function buildBanner(reason: BannerReason): Banner {
  switch (reason) {
    case "trial_expired":
      return {
        reason,
        message: "Your trial has ended. Subscribe to continue your relationship with Bee.",
        cta: "Choose a Plan",
        link: "/pricing",
      };
    case "no_subscription":
      return {
        reason,
        message: "Start your 14-day free trial to meet Bee.",
        cta: "Start Free Trial",
        link: "/pricing",
      };
    case "credits_exhausted":
      return {
        reason,
        message: "You have reached your conversation limit for this month.",
        cta: "Upgrade Plan",
        link: "/pricing",
      };
    case "rate_limit":
      return {
        reason,
        message: "Bee is being asked a lot right now. Give her a moment and try again.",
        cta: "Retry",
        link: null,
      };
    default:
      return {
        reason,
        message: "Something went wrong reaching Bee. Please try again.",
        cta: "Retry",
        link: null,
      };
  }
}

function ChatPage() {
  const load = useServerFn(loadBeeConversation);
  const navigate = useNavigate();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [inputFocused, setInputFocused] = useState(false);

  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const resolved = await loadResolvedTier();
      if (active) setTier(resolved);
    })();
    return () => { active = false; };
  }, []);

  // Voice: Speech-to-Text + Text-to-Speech state.
  const [voiceSupported, setVoiceSupported] = useState({ stt: false, tts: false });
  const [listening, setListening] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const inputBaseRef = useRef<string>("");
  const spokenIndexRef = useRef<number>(-1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const tts = typeof window.speechSynthesis !== "undefined";
    setVoiceSupported({ stt: Boolean(Ctor), tts });
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {}
      if (tts) window.speechSynthesis.cancel();
    };
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;
    // Cancel any current TTS so Bee's voice doesn't echo into the mic.
    if (typeof window.speechSynthesis !== "undefined") window.speechSynthesis.cancel();

    const rec = new Ctor();
    rec.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    inputBaseRef.current = input ? input.trimEnd() + " " : "";

    rec.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const chunk = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += chunk;
        else interim += chunk;
      }
      if (finalText) inputBaseRef.current += finalText;
      setInput((inputBaseRef.current + interim).replace(/\s+/g, " ").trimStart());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [input]);

  const toggleListening = useCallback(() => {
    if (listening) stopListening();
    else startListening();
  }, [listening, startListening, stopListening]);

  const toggleSpeak = useCallback(() => {
    setSpeakEnabled((prev) => {
      const next = !prev;
      if (!next && typeof window !== "undefined") window.speechSynthesis?.cancel();
      // Mark all current messages as already-spoken so toggling on later only voices new replies.
      spokenIndexRef.current = messages.length - 1;
      return next;
    });
  }, [messages.length]);

  // Speak Bee's latest completed assistant message — rate 0.9, deliberate.
  useEffect(() => {
    if (!speakEnabled || streaming || sending) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const lastIdx = messages.length - 1;
    if (lastIdx <= spokenIndexRef.current) return;
    const last = messages[lastIdx];
    if (!last || last.role !== "assistant" || !last.content) return;

    const clean = cleanForSpeech(last.content);
    if (!clean) {
      spokenIndexRef.current = lastIdx;
      return;
    }

    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 0.9;
    utter.pitch = 1;
    utter.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => /Samantha|Victoria|Serena|Karen|Google UK English Female/i.test(v.name)) ??
      voices.find((v) => v.lang?.toLowerCase().startsWith("en"));
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    spokenIndexRef.current = lastIdx;
  }, [messages, streaming, sending, speakEnabled]);


  useEffect(() => {
    let active = true;
    load({ data: { conversationId: null } })
      .then((res) => {
        if (!active) return;
        setConversationId(res.conversationId);
        setMessages(res.messages as Msg[]);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [load]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, streaming]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    inputBaseRef.current = "";
    if (listening) stopListening();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setBanner(null);
    setSending(true);


    setMessages((prev) => [...prev, { role: "user", content: text }, { role: "assistant", content: "" }]);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("You're signed out — please sign in again.");

      const res = await fetch("/api/bee/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ conversationId, message: text, actingProfileId: getActingProfileId() }),
      });

      if (!res.ok || !res.body) {
        if (res.status === 429) {
          setBanner(buildBanner("rate_limit"));
          throw new Error("rate_limit");
        }
        if (res.status === 402) {
          const body = await res.json().catch(() => ({}));
          const reason = (body?.reason ?? "no_subscription") as BannerReason;
          setBanner(buildBanner(reason));
          navigate({ to: "/pricing" });
          throw new Error("subscription_required");
        }
        const body = await res.text().catch(() => "");
        setBanner(buildBanner("generic"));
        throw new Error(body || "Bee could not respond.");
      }


      setStreaming(true);
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
          const lines = evt.split("\n");
          let name = "message";
          let data = "";
          for (const ln of lines) {
            if (ln.startsWith("event:")) name = ln.slice(6).trim();
            else if (ln.startsWith("data:")) data += ln.slice(5).trim();
          }
          if (!data) continue;
          try {
            const json = JSON.parse(data);
            if (name === "meta" && json.conversationId) {
              setConversationId(json.conversationId);
            } else if (name === "delta" && typeof json.t === "string") {
              setMessages((prev) => {
                const next = prev.slice();
                const last = next[next.length - 1];
                if (last && last.role === "assistant") {
                  next[next.length - 1] = { ...last, content: last.content + json.t };
                }
                return next;
              });
            } else if (name === "onboarding_complete") {
              // Bee finished the interview. Route by subscription:
              // active or trial → dashboard; otherwise → pricing.
              const resolved = await loadResolvedTier();
              const dest = resolved ? "/dashboard" : "/pricing";
              setTimeout(() => {
                navigate({ to: dest });
              }, 1200);
            } else if (name === "error") {
              throw new Error(json.error || "Bee stream interrupted.");
            }
          } catch (err) {
            if (name === "error") throw err;
          }
        }
      }
    } catch (err) {
      // Banner is set inline above for known statuses; fall back for unknown errors.
      if (err instanceof Error && !["rate_limit", "subscription_required"].includes(err.message)) {
        setBanner(buildBanner("generic"));
      }
      setMessages((prev) => {
        const next = prev.slice();
        if (next.length && next[next.length - 1].role === "assistant" && !next[next.length - 1].content) {
          next.pop();
        }
        if (next.length && next[next.length - 1].role === "user" && next[next.length - 1].content === text) {
          next.pop();
        }
        return next;
      });
      setInput(text);

    } finally {
      setSending(false);
      setStreaming(false);
    }
  }

  const orbState: BeeOrbState = inputFocused && input.trim().length > 0
    ? "listening"
    : streaming
      ? "speaking"
      : sending
        ? "thinking"
        : listening
          ? "listening"
          : speaking
            ? "speaking"
            : "idle";

  return (
    <main className="flex h-screen flex-col bg-cream text-ink">
      <header className="mx-4 mt-4 flex items-center justify-between rounded-full bg-cream px-6 py-3 shadow-neo md:mx-8 md:px-8">
        <Link to="/" className="flex items-center gap-2 text-[0.65rem] tracking-[0.25em] uppercase text-ink/55 hover:text-gold-deep">
          <ArrowLeft size={14} />
          <span>Home</span>
        </Link>
        <div className="flex items-center gap-3">
          <BeeOrb state={orbState} size={44} surface="light" ariaLabel={`Bee — ${orbState}`} />
          <div className="font-display text-lg tracking-tight">
            Bee<span className="text-gold-deep">.</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ActingProfileSwitcher tier={tier} />
          {voiceSupported.tts && hasEntitlement(tier, "beeVoice") && (
            <button
              type="button"
              onClick={toggleSpeak}
              aria-pressed={speakEnabled}
              aria-label={speakEnabled ? "Mute Bee's voice" : "Let Bee speak"}
              title={speakEnabled ? "Mute Bee's voice" : "Let Bee speak"}
              className={`neo-icon h-8 w-8 ${
                speakEnabled ? "bg-gold-deep text-cream" : "text-ink/55"
              }`}
            >
              {speakEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
          )}
          <Link
            to="/profile"
            className="text-[0.65rem] tracking-[0.25em] uppercase text-ink/55 hover:text-gold-deep"
          >
            Profile
          </Link>
          <Link
            to="/dashboard"
            className="text-[0.65rem] tracking-[0.25em] uppercase text-ink/55 hover:text-gold-deep"
          >
            Dashboard
          </Link>
        </div>

      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-10 md:px-10">
          {loading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="animate-spin text-ink/40" size={24} />
            </div>
          ) : messages.length === 0 ? (
            <Welcome />
          ) : (
            <ul className="space-y-8">
              {messages.map((m, i) => (
                <li key={m.id ?? i}>
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
        </div>
      </div>

      <div className="bg-cream px-4 pb-5 md:px-8">
        <div className="mx-auto max-w-2xl rounded-[1.75rem] bg-cream px-6 py-5 shadow-neo">
          {banner && (
            <div className="mb-3 flex flex-col gap-3 rounded-3xl bg-cream px-5 py-4 shadow-neo-inset sm:flex-row sm:items-center sm:justify-between">
              <p className="font-display text-base leading-snug text-ink">
                {banner.message}
              </p>
              {banner.link ? (
                <Link
                  to={banner.link}
                  className="neo-btn-ink !px-4 !py-2 text-[0.7rem]"
                >
                  {banner.cta}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setBanner(null)}
                  className="neo-btn !px-4 !py-2 text-[0.7rem]"
                >
                  {banner.cta}
                </button>
              )}
            </div>
          )}
          <form onSubmit={handleSend} className="relative">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                inputBaseRef.current = e.target.value;
                if (banner) setBanner(null);
              }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder={listening ? "Listening… speak naturally." : "Tell Bee what you're dressing for…"}
              rows={2}
              className="w-full resize-none rounded-2xl border-0 bg-cream px-4 py-3 pr-24 text-sm text-ink shadow-neo-inset placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-gold-deep"
              disabled={sending}
            />
            {voiceSupported.stt && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={sending}
                aria-pressed={listening}
                aria-label={listening ? "Stop dictation" : "Dictate to Bee"}
                title={listening ? "Stop dictation — voice typing is free on every plan" : "Dictate to Bee — voice typing, free on every plan"}
                className={`absolute right-14 bottom-3 flex h-9 w-9 items-center justify-center rounded-full shadow-neo-sm transition disabled:opacity-40 ${
                  listening
                    ? "animate-pulse bg-gold-deep text-cream"
                    : "bg-cream text-ink hover:text-gold-deep"
                }`}
              >
                {listening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
            )}
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="neo-icon absolute right-3 bottom-3 h-9 w-9 bg-ink text-cream disabled:opacity-40"
              aria-label="Send"
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
            </button>

          </form>
        </div>
      </div>
    </main>
  );
}

function Welcome() {
  return (
    <div className="py-10">
      <div className="mb-8 flex justify-center">
        <BeeOrb state="idle" size={220} surface="light" ariaLabel="Bee" />
      </div>
      <p className="eyebrow text-center">Welcome back</p>
      <h1 className="font-display mt-5 text-4xl leading-tight md:text-5xl">
        Hello, you.
      </h1>
      <p className="mt-5 max-w-md text-base leading-relaxed text-ink/70">
        I'm Bee. Tell me what you're dressing for — a week, a wedding, a Wednesday morning — and I'll
        build it around your Fit, Feel, and Fabric.
      </p>
      <span className="mt-7 block h-px w-12 bg-gold" />
      <div className="mt-8 grid gap-3 text-sm text-ink/70 sm:grid-cols-2">
        {[
          "Build me a five-outfit work week.",
          "What should I wear to a winter wedding?",
          "Help me edit my closet — start with denim.",
          "Suggest a palette for spring.",
        ].map((p) => (
          <p key={p} className="rounded-2xl bg-cream px-4 py-3 shadow-neo-sm">
            "{p}"
          </p>
        ))}
      </div>
    </div>
  );
}
