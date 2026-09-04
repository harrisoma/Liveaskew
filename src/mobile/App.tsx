import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, MessageCircle, RefreshCw, Settings, Sparkles, WifiOff } from "lucide-react";
import { LookCard, WardrobeCard } from "./components/LookCard";
import { NeoButton, NeoField, Screen, Skeleton } from "./components/ui";
import { confirmVerifyCode, sendVerifyCode, signInWithProvider } from "./lib/auth";
import {
  answersFromInterview,
  interviewOpener,
  looksFromInterview,
  reflectOnAnswer,
} from "./lib/interview";
import { localBeeReply } from "./lib/recommend";
import {
  cacheKey,
  emptySnapshot,
  loadSnapshot,
  nid,
  saveSnapshot,
  type AppSnapshot,
  type AuthProvider,
  type ChatMsg,
  type GuideLook,
} from "./lib/storage";
import { TIER_ORDER, TIERS, type PlanSlug } from "./lib/tiers";
import { canGenerateLook, trialLabel } from "./lib/trial";
import { requestTryOn } from "./lib/tryon";
import { persistTrialStartedAt } from "./lib/account";
import { PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_UPDATED } from "@/lib/privacy-policy";
import { analyzeWardrobePhoto } from "./lib/wardrobe-analyze";
import {
  configureNativeChrome,
  haptic,
  isOnline,
  pickStylingPhoto,
  pickWardrobeBatch,
  setPushEnabled,
} from "./native/bridge";
import "./styles.css";

type Tab = "home" | "guide" | "reset" | "tier" | "you";

export function MobileApp() {
  const [ready, setReady] = useState(false);
  const [snap, setSnap] = useState<AppSnapshot>(emptySnapshot);
  const [tab, setTab] = useState<Tab>("guide");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(true);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyErr, setVerifyErr] = useState<string | null>(null);
  const [previewOtp, setPreviewOtp] = useState(false);
  const [youView, setYouView] = useState<"profile" | "privacy">("profile");
  const [emailDraft, setEmailDraft] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");
  const [renderingId, setRenderingId] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

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

  useEffect(() => {
    if (snap.phase === "app" && snap.notifications.beeReady) {
      void setPushEnabled(true);
    }
  }, [snap.phase, snap.notifications.beeReady]);

  const patch = useCallback((fn: (s: AppSnapshot) => AppSnapshot) => {
    setSnap((s) => fn(s));
  }, []);

  const trialText = useMemo(
    () => trialLabel(snap.trialStartedAt),
    [snap.trialStartedAt, snap.lastActiveAt],
  );
  const looksUnlocked = canGenerateLook({
    trialStartedAt: snap.trialStartedAt,
    membershipActive: snap.membershipActive,
  });

  const startTrial = (looks: GuideLook[]) => {
    const startedAt = snap.trialStartedAt ?? new Date().toISOString();
    patch((s) => ({
      ...s,
      phase: "app",
      looks,
      trialStartedAt: s.trialStartedAt ?? startedAt,
      messages: [
        {
          id: nid("m"),
          role: "assistant",
          content:
            "Your Style Guide is ready. I dressed the looks on you — same body, same proportions. Fourteen days, unlimited looks.",
        },
      ],
    }));
    setTab("guide");
    void haptic("success");
    void persistTrialStartedAt(startedAt);
  };

  if (!ready) {
    return (
      <div className="la-app flex flex-col px-5 pt-8">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-4 h-10 w-3/4" />
        <Skeleton className="mt-6 h-44" />
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
      {snap.phase === "app" && trialText && (
        <p className="mx-5 mt-3 neo-inset px-3 py-2 text-sm" role="status">
          {trialText}
        </p>
      )}

      {snap.phase === "auth" && (
        <AuthScreen
          onGoogle={async () => {
            const result = await signInWithProvider("google");
            if (result.redirected) return;
            patch((s) => ({
              ...s,
              authProvider: "google",
              email: result.email,
              phase: "verify",
            }));
            setEmailDraft(result.email ?? "");
            void haptic("impact");
          }}
          onApple={async () => {
            const result = await signInWithProvider("apple");
            if (result.redirected) return;
            patch((s) => ({
              ...s,
              authProvider: "apple",
              phase: "verify",
            }));
            void haptic("impact");
          }}
        />
      )}

      {snap.phase === "verify" && snap.authProvider && (
        <VerifyScreen
          provider={snap.authProvider}
          email={emailDraft || snap.email || ""}
          phone={phoneDraft || snap.phone || ""}
          code={verifyCode}
          busy={verifyBusy}
          error={verifyErr}
          preview={previewOtp}
          onEmail={setEmailDraft}
          onPhone={setPhoneDraft}
          onCode={setVerifyCode}
          onSend={async () => {
            setVerifyErr(null);
            setVerifyBusy(true);
            const channel = snap.authProvider === "apple" ? "sms" : "email";
            const dest = channel === "sms" ? phoneDraft : emailDraft;
            const res = await sendVerifyCode(channel, dest);
            setVerifyBusy(false);
            setPreviewOtp(res.preview);
            if (!res.ok) setVerifyErr(res.error ?? "Could not send a code.");
            else {
              patch((s) => ({
                ...s,
                email: channel === "email" ? dest : s.email,
                phone: channel === "sms" ? dest : s.phone,
              }));
              void haptic("impact");
            }
          }}
          onConfirm={async () => {
            setVerifyBusy(true);
            const channel = snap.authProvider === "apple" ? "sms" : "email";
            const dest =
              channel === "sms" ? phoneDraft || snap.phone || "" : emailDraft || snap.email || "";
            const ok = await confirmVerifyCode(channel, dest, verifyCode);
            setVerifyBusy(false);
            if (!ok) {
              setVerifyErr("That code did not match.");
              return;
            }
            void haptic("success");
            patch((s) => ({
              ...s,
              verified: true,
              email: dest.includes("@") ? dest : s.email,
              phone: channel === "sms" ? dest : s.phone,
              phase: "interview",
              messages: [{ id: nid("m"), role: "assistant", content: interviewOpener() }],
            }));
          }}
        />
      )}

      {snap.phase === "interview" && (
        <InterviewScreen
          messages={snap.messages}
          sending={sending}
          input={input}
          setInput={setInput}
          onSend={async () => {
            const value = input.trim();
            if (!value || sending) return;
            setInput("");
            const step = snap.interview.step;
            const key = ["life", "fit", "feel", "fabric", "goal"][step] ?? `q${step}`;
            patch((s) => ({
              ...s,
              messages: [...s.messages, { id: nid("m"), role: "user", content: value }],
              interview: {
                ...s.interview,
                step: step + 1,
                answers: { ...s.interview.answers, [key]: value },
              },
            }));
            setSending(true);
            await new Promise((r) => setTimeout(r, 400));
            const reply = reflectOnAnswer(step, value);
            const done = step >= 4;
            patch((s) => ({
              ...s,
              messages: [...s.messages, { id: nid("m"), role: "assistant", content: reply }],
              interview: { ...s.interview, completed: done },
              onboarding: done
                ? { ...answersFromInterview(s.interview.answers), completed: true }
                : s.onboarding,
              phase: done ? "selfie" : "interview",
            }));
            setSending(false);
            void haptic("impact");
          }}
        />
      )}

      {snap.phase === "selfie" && (
        <SelfieScreen
          selfie={snap.selfie}
          onPick={async () => {
            const data = await pickStylingPhoto();
            if (data) {
              patch((s) => ({ ...s, selfie: data }));
              void haptic("impact");
            }
          }}
          onContinue={() => {
            if (!snap.selfie) return;
            const cards = looksFromInterview(snap.interview.answers).map((look) => ({
              ...look,
              saved: false,
              createdAt: new Date().toISOString(),
              garmentNote: look.formula[0] ?? look.title,
              tryOnUrl: null,
              tryOnKey: null,
            }));
            startTrial(cards);
          }}
        />
      )}

      {snap.phase === "app" && (
        <>
          {tab === "home" && (
            <HomeChat
              messages={snap.messages}
              sending={sending}
              input={input}
              setInput={setInput}
              onSend={() => {
                const value = input.trim();
                if (!value || sending) return;
                setInput("");
                const user: ChatMsg = { id: nid("m"), role: "user", content: value };
                patch((s) => ({ ...s, messages: [...s.messages, user] }));
                setSending(true);
                window.setTimeout(() => {
                  const reply = localBeeReply(value, snap.onboarding);
                  patch((s) => ({
                    ...s,
                    messages: [...s.messages, { id: nid("m"), role: "assistant", content: reply }],
                  }));
                  setSending(false);
                  void haptic("impact");
                }, 400);
              }}
            />
          )}
          {tab === "guide" && (
            <StyleGuide
              looks={snap.looks}
              selfie={snap.selfie}
              renderingId={renderingId}
              locked={!looksUnlocked}
              onSelect={async (look) => {
                if (!snap.selfie) return;
                const key = cacheKey(snap.selfie, look.id);
                if (look.tryOnUrl && look.tryOnKey === key) return;
                if (!looksUnlocked) {
                  setGateOpen(true);
                  setTab("tier");
                  return;
                }
                setRenderingId(look.id);
                void haptic("impact");
                const result = await requestTryOn({
                  look,
                  selfie: snap.selfie,
                  cache: snap.tryOnCache,
                });
                patch((s) => ({
                  ...s,
                  tryOnCache: { ...s.tryOnCache, [key]: result.url },
                  looks: s.looks.map((l) =>
                    l.id === look.id ? { ...l, tryOnUrl: result.url, tryOnKey: key } : l,
                  ),
                }));
                setRenderingId(null);
                void haptic("success");
              }}
              onSave={(look) => {
                void haptic("success");
                patch((s) => ({
                  ...s,
                  looks: s.looks.map((l) => (l.id === look.id ? { ...l, saved: true } : l)),
                }));
              }}
            />
          )}
          {tab === "reset" && (
            <WardrobeReset
              items={snap.wardrobe}
              onUpload={async () => {
                const photos = await pickWardrobeBatch();
                if (photos.length === 0) return;
                const profile = snap.onboarding;
                const items: AppSnapshot["wardrobe"] = photos.map((photo) => ({
                  id: nid("w"),
                  photo,
                  label: "Looking at the cloth",
                  verdict: null,
                  reason: null,
                  error: null,
                }));
                patch((s) => ({ ...s, wardrobe: [...items, ...s.wardrobe] }));
                for (const item of items) {
                  const result = await analyzeWardrobePhoto({ photo: item.photo, profile });
                  patch((s) => ({
                    ...s,
                    wardrobe: s.wardrobe.map((row) => {
                      if (row.id !== item.id) return row;
                      if ("error" in result) {
                        return {
                          ...row,
                          label: "Could not read this piece",
                          error: result.error,
                          reason: null,
                          verdict: null,
                        };
                      }
                      return {
                        ...row,
                        label: result.label,
                        verdict: result.verdict,
                        reason: result.reason,
                        error: null,
                      };
                    }),
                  }));
                }
                void haptic(items.length > 0 ? "success" : "impact");
              }}
            />
          )}
          {tab === "tier" && (
            <Tiers
              current={snap.tier}
              gated={gateOpen && !looksUnlocked}
              onSelect={(tier) => {
                void haptic("success");
                patch((s) => ({
                  ...s,
                  tier,
                  membershipActive: true,
                }));
                setGateOpen(false);
              }}
            />
          )}
          {tab === "you" && youView === "privacy" && (
            <PrivacyPolicy onBack={() => setYouView("profile")} />
          )}
          {tab === "you" && youView === "profile" && (
            <Profile
              snap={snap}
              onSelfie={async () => {
                const data = await pickStylingPhoto();
                if (data) {
                  patch((s) => ({ ...s, selfie: data }));
                  void haptic("impact");
                }
              }}
              onNotify={async (key, value) => {
                if (key === "beeReady" && value) await setPushEnabled(true);
                patch((s) => ({ ...s, notifications: { ...s.notifications, [key]: value } }));
              }}
              onPrivacy={() => setYouView("privacy")}
              onReset={() => {
                window.localStorage.removeItem("la_mobile_v2");
                setSnap({ ...emptySnapshot, lastActiveAt: new Date().toISOString() });
                setTab("guide");
                setYouView("profile");
              }}
            />
          )}
          <TabBar
            tab={tab}
            onChange={(next) => {
              setTab(next);
              if (next !== "you") setYouView("profile");
            }}
          />
        </>
      )}
    </div>
  );
}

function AuthScreen({ onGoogle, onApple }: { onGoogle: () => void; onApple: () => void }) {
  return (
    <Screen kicker="Bee" title="Sign in to begin">
      <p className="mb-5 text-sm leading-relaxed">
        Google or Apple only. After this, a short verification — then Bee interviews you in Fit,
        Feel, and Fabric. No email-and-password wall.
      </p>
      <NeoButton variant="ink" onClick={onGoogle}>
        Continue with Google
      </NeoButton>
      <NeoButton className="mt-3" onClick={onApple}>
        Continue with Apple
      </NeoButton>
    </Screen>
  );
}

function VerifyScreen({
  provider,
  email,
  phone,
  code,
  busy,
  error,
  preview,
  onEmail,
  onPhone,
  onCode,
  onSend,
  onConfirm,
}: {
  provider: AuthProvider;
  email: string;
  phone: string;
  code: string;
  busy: boolean;
  error: string | null;
  preview: boolean;
  onEmail: (v: string) => void;
  onPhone: (v: string) => void;
  onCode: (v: string) => void;
  onSend: () => void;
  onConfirm: () => void;
}) {
  const apple = provider === "apple";
  return (
    <Screen
      kicker="Verify"
      title={apple ? "A code to your phone" : "A code to your email"}
      footer={
        <div className="space-y-3">
          <NeoButton variant="ink" disabled={busy} onClick={onSend}>
            Send 6-digit code
          </NeoButton>
          <NeoButton variant="gold" disabled={busy || code.length < 6} onClick={onConfirm}>
            Confirm
          </NeoButton>
        </div>
      }
    >
      <p className="mb-4 text-sm leading-relaxed">
        {apple
          ? "Apple's private relay can hide the real inbox. We collect a phone number and send SMS."
          : "Google path: we confirm the email with a one-time code before Bee starts."}
      </p>
      {apple ? (
        <NeoField
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Mobile number"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
        />
      ) : (
        <NeoField
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
        />
      )}
      <NeoField
        className="mt-3"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="6-digit code"
        maxLength={6}
        value={code}
        onChange={(e) => onCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
      />
      {preview && (
        <p className="mt-3 text-sm">
          Preview: enter 000000 until SMS/email is wired in this environment.
        </p>
      )}
      {error && <p className="mt-3 text-sm">{error}</p>}
    </Screen>
  );
}

function InterviewScreen({
  messages,
  sending,
  input,
  setInput,
  onSend,
}: {
  messages: ChatMsg[];
  sending: boolean;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
}) {
  return (
    <Screen
      kicker="Bee"
      title="Fit, Feel, Fabric"
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
            placeholder="Answer Bee…"
            className="neo-input resize-none"
          />
          <NeoButton type="submit" variant="ink" disabled={sending || !input.trim()}>
            Send to Bee
          </NeoButton>
        </form>
      }
    >
      <ul className="space-y-3">
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
    </Screen>
  );
}

function SelfieScreen({
  selfie,
  onPick,
  onContinue,
}: {
  selfie: string | null;
  onPick: () => void;
  onContinue: () => void;
}) {
  return (
    <Screen
      kicker="Likeness"
      title="A photo of you"
      footer={
        <NeoButton variant="ink" disabled={!selfie} onClick={onContinue}>
          Build my Style Guide
        </NeoButton>
      }
    >
      <p className="mb-4 text-sm leading-relaxed">
        Bee dresses this body. We never slim, smooth, or change proportions. The Style Guide will
        not render without it.
      </p>
      {selfie ? (
        <img
          src={selfie}
          alt="Your reference photo"
          className="mb-4 h-64 w-full rounded-[16px] object-cover"
        />
      ) : (
        <div className="mb-4 neo-inset px-4 py-16 text-sm">No photo yet.</div>
      )}
      <NeoButton onClick={onPick}>{selfie ? "Replace photo" : "Upload a selfie"}</NeoButton>
    </Screen>
  );
}

function HomeChat({
  messages,
  sending,
  input,
  setInput,
  onSend,
}: {
  messages: ChatMsg[];
  sending: boolean;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
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
      <ul className="space-y-3">
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
    </Screen>
  );
}

function StyleGuide({
  looks,
  selfie,
  renderingId,
  locked,
  onSelect,
  onSave,
}: {
  looks: GuideLook[];
  selfie: string | null;
  renderingId: string | null;
  locked: boolean;
  onSelect: (look: GuideLook) => void;
  onSave: (look: GuideLook) => void;
}) {
  if (!selfie) {
    return (
      <Screen kicker="Style Guide" title="Needs your likeness">
        <div className="neo-inset px-4 py-8 text-sm leading-relaxed">
          Upload a selfie in You before Bee can dress you. Looks sit on your body — never a
          retouched one.
        </div>
      </Screen>
    );
  }
  return (
    <Screen kicker="Style Guide" title="Looks on you">
      {locked && (
        <p className="mb-4 text-sm leading-relaxed neo-inset px-3 py-2">
          Trial ended. Choose a metal tier to render further looks. Saved try-ons stay.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4">
        {looks.map((look) => (
          <LookCard
            key={look.id}
            look={look}
            rendering={renderingId === look.id}
            actionLabel={look.saved ? "Saved" : "Save this look"}
            onAction={() => onSave(look)}
            footer={
              <NeoButton className="mt-3" variant="ink" onClick={() => onSelect(look)}>
                {look.tryOnUrl ? "View try-on" : "See this on me"}
              </NeoButton>
            }
          />
        ))}
      </div>
    </Screen>
  );
}

function WardrobeReset({
  items,
  onUpload,
}: {
  items: AppSnapshot["wardrobe"];
  onUpload: () => void;
}) {
  return (
    <Screen
      kicker="Wardrobe Reset"
      title="Keep, toss, maybe"
      footer={
        <NeoButton variant="ink" onClick={onUpload}>
          Upload wardrobe photos
        </NeoButton>
      }
    >
      <p className="mb-4 text-sm leading-relaxed">
        Batch your closet. Bee reads each piece against your Fit/Feel/Fabric — not a trend list.
      </p>
      {items.length === 0 ? (
        <div className="neo-inset px-4 py-8 text-sm leading-relaxed">Nothing uploaded yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <WardrobeCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </Screen>
  );
}

function Tiers({
  current,
  gated,
  onSelect,
}: {
  current: string;
  gated: boolean;
  onSelect: (t: string) => void;
}) {
  const index = Math.max(0, TIER_ORDER.indexOf(current as PlanSlug));
  const progress = ((index + 1) / TIER_ORDER.length) * 100;
  return (
    <Screen kicker="Membership" title="Your metal">
      {gated && (
        <p className="mb-4 text-sm leading-relaxed neo-inset px-3 py-2">
          Your 14-day window is done. Pick a tier to keep generating looks.
        </p>
      )}
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
  onSelfie,
  onNotify,
  onPrivacy,
  onReset,
}: {
  snap: AppSnapshot;
  onSelfie: () => void;
  onNotify: (key: "beeReady" | "tierUpgrade", value: boolean) => void;
  onPrivacy: () => void;
  onReset: () => void;
}) {
  return (
    <Screen kicker="You" title="Fit preferences">
      <div className="neo-raised p-4">
        {snap.selfie ? (
          <img
            src={snap.selfie}
            alt="Your reference photo"
            className="mb-3 h-40 w-full rounded-[16px] object-cover"
          />
        ) : (
          <p className="text-sm leading-relaxed">
            Add a photo Bee can dress — proportions stay yours.
          </p>
        )}
        <NeoButton onClick={onSelfie}>
          {snap.selfie ? "Replace selfie" : "Add a styling photo"}
        </NeoButton>
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
          {snap.authProvider === "apple" ? "Apple" : "Google"}
          {snap.email ? ` · ${snap.email}` : ""}
          {snap.phone ? ` · ${snap.phone}` : ""}
        </p>
      </div>
      <NeoButton className="mt-4" onClick={onPrivacy}>
        Privacy policy
      </NeoButton>
      <NeoButton className="mt-3" onClick={onReset}>
        Sign out
      </NeoButton>
    </Screen>
  );
}

function PrivacyPolicy({ onBack }: { onBack: () => void }) {
  return (
    <Screen
      kicker="Legal"
      title="Privacy policy"
      footer={
        <NeoButton onClick={onBack} variant="ink">
          Back to You
        </NeoButton>
      }
    >
      <p className="mb-4 text-sm leading-relaxed">{PRIVACY_INTRO}</p>
      {PRIVACY_SECTIONS.map((section) => (
        <div key={section.title} className="mb-4 neo-raised p-4 text-sm leading-relaxed">
          <p className="la-kicker">{section.title}</p>
          {section.paragraphs.map((p) => (
            <p key={p} className="mt-2">
              {p}
            </p>
          ))}
        </div>
      ))}
      <p className="text-sm opacity-70">Last updated {PRIVACY_UPDATED}. Public URL: /privacy</p>
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
  const items: { id: Tab; label: string; icon: typeof MessageCircle }[] = [
    { id: "home", label: "Bee", icon: MessageCircle },
    { id: "guide", label: "Guide", icon: Bookmark },
    { id: "reset", label: "Reset", icon: RefreshCw },
    { id: "tier", label: "Tier", icon: Sparkles },
    { id: "you", label: "You", icon: Settings },
  ];
  return (
    <nav aria-label="Main" className="grid grid-cols-5 gap-1 px-3 pt-2 pb-3">
      {items.map((item) => {
        const active = tab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.id)}
            className={`flex flex-col items-center gap-1 px-1 py-2 text-[0.65rem] font-semibold ${
              active ? "neo-inset" : "neo-raised-sm"
            }`}
          >
            <Icon size={16} aria-hidden />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
