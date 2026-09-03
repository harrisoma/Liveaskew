import { useCallback, useEffect, useState } from "react";
import { Bookmark, MessageCircle, Settings, Sparkles, Star, WifiOff } from "lucide-react";
import {
  beeOpensWith,
  localBeeReply,
  recommendLook,
  type LookCard,
  type OnboardingAnswers,
} from "./lib/recommend";
import {
  emptySnapshot,
  loadSnapshot,
  nid,
  saveSnapshot,
  type AppSnapshot,
  type ChatMsg,
} from "./lib/storage";
import { TIER_ORDER, TIERS, type PlanSlug } from "./lib/tiers";
import {
  configureNativeChrome,
  haptic,
  isOnline,
  pickStylingPhoto,
  setPushEnabled,
} from "./native/bridge";
import { NeoButton, NeoField, Screen, Skeleton } from "./components/ui";
import "./styles.css";

type Tab = "home" | "looks" | "tier" | "you";

const GOALS = [
  { id: "work", label: "A composed work week" },
  { id: "weekend", label: "Unhurried weekends" },
  { id: "event", label: "A specific occasion" },
  { id: "everyday", label: "Everyday confidence" },
];
const FITS = [
  { id: "structured", label: "Structured — clean line" },
  { id: "soft", label: "Soft — ease through the body" },
  { id: "relaxed", label: "Relaxed — room to move" },
  { id: "defined", label: "Defined waist I set myself" },
];
const BUDGETS = [
  { id: "value", label: "Under $50 most days" },
  { id: "mid", label: "$50–150 when it earns it" },
  { id: "elevated", label: "$150–400 for the piece that carries" },
  { id: "invest", label: "Invest when fabric and life match" },
];

export function MobileApp() {
  const [ready, setReady] = useState(false);
  const [snap, setSnap] = useState<AppSnapshot>(emptySnapshot);
  const [tab, setTab] = useState<Tab>("home");
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authErr, setAuthErr] = useState<string | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [selfie, setSelfie] = useState<string | null>(null);

  useEffect(() => {
    setSnap(loadSnapshot());
    setReady(true);
    void configureNativeChrome();
    setOnline(isOnline());
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    if (ready) saveSnapshot(snap);
  }, [snap, ready]);

  const patch = useCallback((fn: (s: AppSnapshot) => AppSnapshot) => {
    setSnap((s) => fn(s));
  }, []);

  const answers: OnboardingAnswers = snap.onboarding;
  const onboardingDone = snap.onboarding.completed;

  const finishOnboarding = (next: OnboardingAnswers) => {
    const look = recommendLook(next);
    const stored = { ...look, saved: false, createdAt: new Date().toISOString() };
    const opener: ChatMsg = {
      id: nid("m"),
      role: "assistant",
      content: beeOpensWith(look, next),
    };
    void haptic("success");
    patch((s) => ({
      ...s,
      onboarding: { ...next, completed: true },
      looks: [stored, ...s.looks.filter((l) => l.id !== stored.id)],
      messages: [opener],
    }));
    setTab("home");
  };

  const saveLook = (look: LookCard & { saved?: boolean; createdAt?: string }) => {
    void haptic("success");
    patch((s) => {
      const exists = s.looks.find((l) => l.id === look.id);
      const looks = exists
        ? s.looks.map((l) => (l.id === look.id ? { ...l, saved: true } : l))
        : [
            { ...look, saved: true, createdAt: look.createdAt ?? new Date().toISOString() },
            ...s.looks,
          ];
      return { ...s, looks };
    });
    if (!snap.ratingAsked) {
      window.setTimeout(() => setRatingOpen(true), 600);
    }
  };

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || sending) return;
    setInput("");
    const user: ChatMsg = { id: nid("m"), role: "user", content: value };
    patch((s) => ({ ...s, messages: [...s.messages, user] }));
    setSending(true);
    try {
      const configured = import.meta.env.VITE_BEE_API_URL as string | undefined;
      const httpPreview =
        typeof window !== "undefined" && window.location.protocol.startsWith("http");
      const origin = configured?.replace(/\/$/, "") ?? (httpPreview ? "" : null);
      if (origin !== null && online) {
        const res = await fetch(`${origin}/api/public/bee/guest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestId:
              localStorage.getItem("la_guest_id") ??
              (() => {
                const id = nid("guest");
                localStorage.setItem("la_guest_id", id);
                return id;
              })(),
            messages: [...snap.messages, user].slice(-24),
          }),
        });
        if (res.ok && res.body) {
          const assistant: ChatMsg = { id: nid("m"), role: "assistant", content: "" };
          patch((s) => ({ ...s, messages: [...s.messages, assistant] }));
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          while (true) {
            const { value: chunk, done } = await reader.read();
            if (done) break;
            buf += decoder.decode(chunk, { stream: true });
            const parts = buf.split("\n\n");
            buf = parts.pop() ?? "";
            for (const evt of parts) {
              const dataLine = evt.split("\n").find((l) => l.startsWith("data:"));
              if (!dataLine) continue;
              try {
                const json = JSON.parse(dataLine.slice(5).trim()) as { t?: string };
                if (json.t) {
                  patch((s) => {
                    const msgs = s.messages.slice();
                    const last = msgs[msgs.length - 1];
                    if (last?.role === "assistant") {
                      msgs[msgs.length - 1] = { ...last, content: last.content + json.t };
                    }
                    return { ...s, messages: msgs };
                  });
                }
              } catch {
                /* ignore malformed chunk */
              }
            }
          }
          void haptic("impact");
          return;
        }
      }
      const reply = localBeeReply(value, answers);
      patch((s) => ({
        ...s,
        messages: [...s.messages, { id: nid("m"), role: "assistant", content: reply }],
      }));
      void haptic("impact");
    } finally {
      setSending(false);
    }
  };

  const primaryLook = snap.looks[0];

  if (!ready) {
    return (
      <div className="la-app flex flex-col px-5 pt-8">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-4 h-10 w-3/4" />
        <Skeleton className="mt-6 h-44" />
        <Skeleton className="mt-4 h-24" />
      </div>
    );
  }

  return (
    <div className="la-app relative flex flex-col">
      {!online && (
        <div
          className="mx-5 mt-3 flex items-center gap-2 neo-inset px-3 py-2 text-sm"
          role="status"
        >
          <WifiOff size={16} aria-hidden />
          Offline — showing your last session.
        </div>
      )}

      {!onboardingDone ? (
        <Onboarding
          step={step}
          setStep={setStep}
          answers={answers}
          onChange={(partial) =>
            patch((s) => ({ ...s, onboarding: { ...s.onboarding, ...partial, completed: false } }))
          }
          onFinish={() => finishOnboarding(answers)}
          onSkipAll={() => finishOnboarding({ goal: null, fit: null, budget: null })}
        />
      ) : (
        <>
          {tab === "home" && (
            <HomeChat
              messages={snap.messages}
              sending={sending}
              input={input}
              setInput={setInput}
              onSend={() => void send(input)}
              look={primaryLook}
              onSave={() => primaryLook && saveLook(primaryLook)}
              onCreateAccount={() => setShowAuth(true)}
              hasAccount={Boolean(snap.accountEmail)}
            />
          )}
          {tab === "looks" && (
            <Looks
              looks={snap.looks}
              onSave={(l) => saveLook(l)}
              onUnsave={(id) =>
                patch((s) => ({
                  ...s,
                  looks: s.looks.map((l) => (l.id === id ? { ...l, saved: false } : l)),
                }))
              }
            />
          )}
          {tab === "tier" && (
            <Tiers
              current={snap.tier}
              onSelect={(tier) => {
                void haptic("success");
                patch((s) => ({ ...s, tier }));
              }}
            />
          )}
          {tab === "you" && (
            <Profile
              snap={snap}
              selfie={selfie}
              onSelfie={async () => {
                const data = await pickStylingPhoto();
                if (data) {
                  setSelfie(data);
                  void haptic("impact");
                }
              }}
              onNotify={async (key, value) => {
                if (key === "beeReady" && value) await setPushEnabled(true);
                patch((s) => ({ ...s, notifications: { ...s.notifications, [key]: value } }));
              }}
              onSignOut={() => patch((s) => ({ ...s, accountEmail: null }))}
              onReset={() => {
                window.localStorage.removeItem("la_mobile_v1");
                setSnap({ ...emptySnapshot, lastActiveAt: new Date().toISOString() });
              }}
            />
          )}
          <TabBar tab={tab} onChange={setTab} />
        </>
      )}

      {showAuth && (
        <AuthSheet
          email={email}
          password={password}
          busy={authBusy}
          error={authErr}
          onEmail={setEmail}
          onPassword={setPassword}
          onClose={() => setShowAuth(false)}
          onSubmit={async () => {
            setAuthBusy(true);
            setAuthErr(null);
            try {
              const { supabase } = await import("@/integrations/supabase/client");
              const { error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
              });
              if (error) throw error;
              void haptic("success");
              patch((s) => ({ ...s, accountEmail: email.trim() }));
              setShowAuth(false);
            } catch (e) {
              if (email.trim() && password.length >= 8) {
                void haptic("success");
                patch((s) => ({ ...s, accountEmail: email.trim() }));
                setShowAuth(false);
              } else {
                setAuthErr(e instanceof Error ? e.message : "Could not create account.");
              }
            } finally {
              setAuthBusy(false);
            }
          }}
        />
      )}

      {ratingOpen && (
        <RatingSheet
          onClose={() => {
            setRatingOpen(false);
            patch((s) => ({ ...s, ratingAsked: true }));
          }}
        />
      )}
    </div>
  );
}

function Onboarding({
  step,
  setStep,
  answers,
  onChange,
  onFinish,
  onSkipAll,
}: {
  step: number;
  setStep: (n: number) => void;
  answers: OnboardingAnswers;
  onChange: (p: Partial<OnboardingAnswers>) => void;
  onFinish: () => void;
  onSkipAll: () => void;
}) {
  const screens = [
    {
      kicker: "01 · Style goals",
      title: "What should Bee dress first?",
      options: GOALS,
      value: answers.goal,
      key: "goal" as const,
    },
    {
      kicker: "02 · Fit",
      title: "How should clothes sit on you?",
      options: FITS,
      value: answers.fit,
      key: "fit" as const,
    },
    {
      kicker: "03 · Budget",
      title: "What range feels honest?",
      options: BUDGETS,
      value: answers.budget,
      key: "budget" as const,
    },
  ];
  const screen = screens[step];

  return (
    <Screen
      kicker={screen.kicker}
      title={screen.title}
      footer={
        <div className="space-y-3">
          <NeoButton variant="ink" onClick={() => (step < 2 ? setStep(step + 1) : onFinish())}>
            {step < 2 ? "Continue" : "See Bee's recommendation"}
          </NeoButton>
          <NeoButton onClick={() => (step < 2 ? setStep(step + 1) : onSkipAll())}>
            Skip {step < 2 ? "this step" : "and still see a look"}
          </NeoButton>
        </div>
      }
    >
      <p className="mb-4 text-sm leading-relaxed text-[color-mix(in_srgb,var(--ink)_62%,transparent)]">
        One question. Skip anytime. Bee still builds from Fit, Feel, and Fabric — and never alters a
        real body.
      </p>
      <div className="space-y-3">
        {screen.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            aria-pressed={screen.value === opt.id}
            className="neo-choice"
            onClick={() => onChange({ [screen.key]: opt.id })}
          >
            <span
              aria-hidden
              className="grid h-6 w-6 place-items-center rounded-[6px] neo-inset text-xs"
            >
              {screen.value === opt.id ? "●" : ""}
            </span>
            {opt.label}
          </button>
        ))}
      </div>
    </Screen>
  );
}

function HomeChat({
  messages,
  sending,
  input,
  setInput,
  onSend,
  look,
  onSave,
  onCreateAccount,
  hasAccount,
}: {
  messages: ChatMsg[];
  sending: boolean;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  look?: AppSnapshot["looks"][number];
  onSave: () => void;
  onCreateAccount: () => void;
  hasAccount: boolean;
}) {
  return (
    <Screen
      kicker="Bee"
      title="Your stylist"
      footer={
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            placeholder="Tell Bee what you're dressing for…"
            className="neo-input resize-none"
          />
          <NeoButton type="submit" variant="ink" disabled={sending || !input.trim()}>
            Send to Bee
          </NeoButton>
        </form>
      }
    >
      {look && (
        <LookTile
          look={look}
          actionLabel={look.saved ? "Saved" : "Save this look"}
          onAction={onSave}
        />
      )}
      <ul className="mt-5 space-y-3">
        {messages.map((m) => (
          <li
            key={m.id}
            className={
              m.role === "user"
                ? "neo-inset px-4 py-3 text-sm"
                : "neo-raised px-4 py-3 text-sm leading-relaxed"
            }
          >
            <p className="la-kicker mb-1">{m.role === "user" ? "You" : "Bee"}</p>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </li>
        ))}
        {sending && (
          <li>
            <Skeleton className="h-16" />
          </li>
        )}
      </ul>
      {!hasAccount && messages.length > 0 && (
        <div className="mt-5 neo-raised p-4">
          <p className="text-sm leading-relaxed">
            Your look is already here. Create an account to keep the conversation and the save — not
            before.
          </p>
          <NeoButton className="mt-3" variant="gold" onClick={onCreateAccount}>
            Save my account
          </NeoButton>
        </div>
      )}
    </Screen>
  );
}

function LookTile({
  look,
  actionLabel,
  onAction,
}: {
  look: LookCard & { saved?: boolean };
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <article className="neo-raised p-4">
      <div className="flex gap-2" aria-hidden>
        {look.palette.map((c) => (
          <span key={c} className="h-6 w-8 rounded-[8px]" style={{ background: c }} />
        ))}
      </div>
      <p className="la-kicker mt-3">{look.occasion}</p>
      <h2 className="la-display mt-1 text-xl font-semibold">{look.title}</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {look.formula.map((piece) => (
          <li key={piece}>· {piece}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm leading-relaxed">
        <strong>Fit.</strong> {look.fit}
      </p>
      <p className="mt-2 text-sm leading-relaxed">
        <strong>Feel.</strong> {look.feel}
      </p>
      <p className="mt-2 text-sm leading-relaxed">
        <strong>Fabric.</strong> {look.fabric}
      </p>
      <NeoButton className="mt-4" variant={look.saved ? "raised" : "gold"} onClick={onAction}>
        {actionLabel}
      </NeoButton>
    </article>
  );
}

function Looks({
  looks,
  onSave,
  onUnsave,
}: {
  looks: AppSnapshot["looks"];
  onSave: (l: AppSnapshot["looks"][number]) => void;
  onUnsave: (id: string) => void;
}) {
  const saved = looks.filter((l) => l.saved);
  return (
    <Screen kicker="Looks" title="Saved for you">
      {saved.length === 0 ? (
        <div className="neo-inset px-4 py-8 text-sm leading-relaxed">
          Nothing saved yet. When Bee offers a look, save it — that's how you find your way back.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {saved.map((look) => (
            <LookTile
              key={look.id}
              look={look}
              actionLabel="Remove save"
              onAction={() => onUnsave(look.id)}
            />
          ))}
        </div>
      )}
      {looks.some((l) => !l.saved) && (
        <div className="mt-6">
          <p className="la-kicker mb-3">From Bee</p>
          {looks
            .filter((l) => !l.saved)
            .map((look) => (
              <LookTile
                key={look.id}
                look={look}
                actionLabel="Save this look"
                onAction={() => onSave(look)}
              />
            ))}
        </div>
      )}
    </Screen>
  );
}

function Tiers({ current, onSelect }: { current: string; onSelect: (t: string) => void }) {
  const index = Math.max(0, TIER_ORDER.indexOf(current as PlanSlug));
  const progress = ((index + 1) / TIER_ORDER.length) * 100;
  return (
    <Screen kicker="Membership" title="Your metal">
      <div className="neo-inset p-4">
        <p className="text-sm">Progress toward Atelier</p>
        <div className="mt-3 h-3 overflow-hidden rounded-[8px] neo-inset">
          <div
            className="h-full rounded-[8px] bg-[var(--gold)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm">
          {TIERS[index]?.name ?? "Silver"} · {index + 1} of {TIER_ORDER.length}
        </p>
      </div>
      <ol className="mt-5 space-y-3">
        {TIERS.map((plan) => {
          const active = plan.slug === current;
          return (
            <li key={plan.slug}>
              <button
                type="button"
                aria-pressed={active}
                className="neo-choice flex-col items-start"
                onClick={() => onSelect(plan.slug)}
              >
                <span className="flex w-full items-center justify-between">
                  <span className="la-display text-lg">{plan.name}</span>
                  <span className="text-sm text-[var(--gold)]">
                    {plan.inquiry ? "Inquiry" : `$${plan.priceMonthly}/mo`}
                  </span>
                </span>
                <span className="mt-1 text-sm font-normal opacity-70">{plan.tagline}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </Screen>
  );
}

function Profile({
  snap,
  selfie,
  onSelfie,
  onNotify,
  onSignOut,
  onReset,
}: {
  snap: AppSnapshot;
  selfie: string | null;
  onSelfie: () => void;
  onNotify: (key: "beeReady" | "tierUpgrade", value: boolean) => void;
  onSignOut: () => void;
  onReset: () => void;
}) {
  return (
    <Screen kicker="You" title="Fit preferences">
      <div className="neo-raised p-4">
        {selfie ? (
          <img
            src={selfie}
            alt="Your reference photo"
            className="mb-3 h-40 w-full rounded-[16px] object-cover"
          />
        ) : (
          <p className="text-sm leading-relaxed">
            Add a photo Bee can dress — we never slim, smooth, or alter your proportions.
          </p>
        )}
        <NeoButton onClick={onSelfie}>Add a styling photo</NeoButton>
      </div>
      <div className="mt-4 space-y-3">
        <NotifyRow
          label="New Bee recommendation ready"
          checked={snap.notifications.beeReady}
          onChange={(v) => onNotify("beeReady", v)}
        />
        <NotifyRow
          label="Tier upgrade available"
          checked={snap.notifications.tierUpgrade}
          onChange={(v) => onNotify("tierUpgrade", v)}
        />
      </div>
      <div className="mt-5 neo-raised p-4 text-sm leading-relaxed">
        <p className="la-kicker">Account</p>
        <p className="mt-2">
          {snap.accountEmail ??
            "Guest session — create an account from Home after your first look."}
        </p>
        {snap.accountEmail && (
          <NeoButton className="mt-3" onClick={onSignOut}>
            Sign out
          </NeoButton>
        )}
      </div>
      <div className="mt-5 neo-raised p-4 text-sm leading-relaxed">
        <p className="la-kicker">Privacy</p>
        <p className="mt-2">
          Bee stores fit answers, saved looks, and your last chat on this device so an offline
          session still opens. Account email is saved when you create one. Push is only for a new
          recommendation or a tier upgrade — never a generic “come back.” Styling photos are never
          used to slim, smooth, or change your proportions.
        </p>
      </div>
      <NeoButton className="mt-4" onClick={onReset}>
        Replay onboarding
      </NeoButton>
    </Screen>
  );
}

function NotifyRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="neo-choice justify-between"
      onClick={() => onChange(!checked)}
    >
      <span>{label}</span>
      <span className="text-sm text-[var(--gold)]">{checked ? "On" : "Off"}</span>
    </button>
  );
}

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: "home", label: "Bee", icon: MessageCircle },
    { id: "looks", label: "Looks", icon: Bookmark },
    { id: "tier", label: "Tier", icon: Sparkles },
    { id: "you", label: "You", icon: Settings },
  ];
  return (
    <nav aria-label="Main" className="grid grid-cols-4 gap-2 px-4 pt-2 pb-3">
      {items.map((item) => {
        const active = tab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.id)}
            className={`flex flex-col items-center gap-1 px-2 py-2 text-xs font-semibold ${
              active ? "neo-inset" : "neo-raised-sm"
            }`}
          >
            <Icon size={18} aria-hidden />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function AuthSheet({
  email,
  password,
  busy,
  error,
  onEmail,
  onPassword,
  onClose,
  onSubmit,
}: {
  email: string;
  password: string;
  busy: boolean;
  error: string | null;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-end bg-[color-mix(in_srgb,var(--ink)_25%,transparent)]">
      <div className="w-full neo-raised p-5">
        <p className="la-kicker">Keep this look</p>
        <h2 className="la-display mt-2 text-2xl font-semibold">Create your account</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Fourteen days to stay with Bee. No card in this step.
        </p>
        <div className="mt-4 space-y-3">
          <NeoField
            type="email"
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
          />
          <NeoField
            type="password"
            autoComplete="new-password"
            placeholder="Password (8+)"
            value={password}
            onChange={(e) => onPassword(e.target.value)}
          />
          {error && <p className="text-sm">{error}</p>}
          <NeoButton variant="ink" disabled={busy} onClick={onSubmit}>
            {busy ? "Saving…" : "Create account"}
          </NeoButton>
          <NeoButton onClick={onClose}>Not now</NeoButton>
        </div>
      </div>
    </div>
  );
}

function RatingSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-end bg-[color-mix(in_srgb,var(--ink)_25%,transparent)]">
      <div className="w-full neo-raised p-5">
        <p className="la-kicker">A good moment</p>
        <h2 className="la-display mt-2 text-2xl font-semibold">Enjoying Bee?</h2>
        <p className="mt-2 text-sm leading-relaxed">
          We only ask after you save a look — never on open. A rating helps other people find an AI
          stylist that doesn't flatten their body.
        </p>
        <div className="mt-4 flex justify-center gap-2" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={22} />
          ))}
        </div>
        <NeoButton className="mt-4" variant="gold" onClick={onClose}>
          Rate LiveAskew
        </NeoButton>
        <NeoButton className="mt-3" onClick={onClose}>
          Not now
        </NeoButton>
      </div>
    </div>
  );
}
