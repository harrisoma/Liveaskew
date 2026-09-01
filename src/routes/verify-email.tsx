import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, AlertCircle, Mail, RefreshCw } from "lucide-react";
import { BeeMark } from "@/components/BeeMark";
import { supabase } from "@/integrations/supabase/client";
import { trackSignupCompletedOnce } from "@/lib/analytics";

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Verify your email — LiveAskew" },
      { name: "description", content: "Confirming your LiveAskew account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  ssr: false,
  component: VerifyEmail,
});

type Status = "verifying" | "success" | "expired" | "error";

function VerifyEmail() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [authMethod, setAuthMethod] = useState<"email" | "google" | "apple">("email");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  useEffect(() => {
    if (status === "success") trackSignupCompletedOnce(authMethod);
  }, [status, authMethod]);


  useEffect(() => {
    async function verify() {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      // Surface explicit provider errors first
      const errCode = url.searchParams.get("error_code") ?? hash.get("error_code");
      const errDescription =
        url.searchParams.get("error_description") ?? hash.get("error_description");
      if (errCode || errDescription) {
        setStatus(errCode === "otp_expired" ? "expired" : "error");
        setMessage(errDescription?.replace(/\+/g, " ") ?? "Verification failed.");
        return;
      }

      // PKCE flow — single use ?code=...
      const code = url.searchParams.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus(error.message.toLowerCase().includes("expired") ? "expired" : "error");
          setMessage(error.message);
          return;
        }
        setEmail(data.user?.email ?? "");
        const provider = data.user?.app_metadata?.provider;
        const isOAuth = provider === "google" || provider === "apple";
        setAuthMethod(isOAuth ? provider : "email");
        setStatus("success");
        window.history.replaceState({}, "", "/verify-email");

        // Only capture as a lead if: (1) this was a Google/Apple sign-in, not email/password
        // (email path is already captured at signUp() time in auth.tsx — Part 1), and
        // (2) the account was created moments ago, not a returning OAuth login.
        const createdAt = data.user?.created_at ? new Date(data.user.created_at).getTime() : 0;
        const isFreshSignup = createdAt > 0 && Date.now() - createdAt < 2 * 60 * 1000; // 2 min window

        if (isOAuth && isFreshSignup) {
          fetch("https://n8n-production-abf9f.up.railway.app/webhook/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: data.user?.user_metadata?.full_name ?? data.user?.user_metadata?.name ?? "",
              email: data.user?.email ?? "",
              service_needed: "AI personal styling",
              source: "website",
              product_key: "liveaskew",
            }),
          }).catch(() => {
            // Silently ignore — must never surface to the user or block verification.
          });
        }

        return;
      }

      // Legacy token_hash flow
      const tokenHash =
        url.searchParams.get("token_hash") ?? hash.get("token_hash");
      const type = (url.searchParams.get("type") ?? hash.get("type") ?? "signup") as
        | "signup"
        | "email"
        | "email_change"
        | "recovery"
        | "invite"
        | "magiclink";
      if (tokenHash) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (error) {
          setStatus(error.message.toLowerCase().includes("expired") ? "expired" : "error");
          setMessage(error.message);
          return;
        }
        setEmail(data.user?.email ?? "");
        setStatus("success");
        window.history.replaceState({}, "", "/verify-email");
        return;
      }

      // Implicit flow — session already in the URL hash
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setEmail(data.user.email ?? "");
        setStatus("success");
        return;
      }

      setStatus("error");
      setMessage("This link is missing its verification token.");
    }

    verify();
  }, []);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: `${window.location.origin}/verify-email` },
      });
      if (error) throw error;
      setResent(true);
      setCooldown(45);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not resend");
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6 py-16">
      <div className="w-full max-w-md text-center">
        <Link to="/auth" className="inline-flex items-center gap-2">
          <BeeMark className="h-6 w-6 text-gold-deep" />
          <span className="font-display text-lg font-semibold text-ink">Bee</span>
          <span className="text-[0.55rem] font-semibold tracking-[0.14em] uppercase text-ink/40">
            by LiveAskew
          </span>
        </Link>

        <div
          className="neu-raised mt-10 rounded-[30px] px-8 py-12 sm:px-10"
          style={{ boxShadow: "0 0 60px -18px color-mix(in oklab, var(--gold) 45%, transparent), 8px 8px 18px var(--border), -8px -8px 18px var(--bone)" }}
        >
          {status === "verifying" && <VerifyingCard />}
          {status === "success" && (
            <SuccessCard email={email} onContinue={() => navigate({ to: "/chat" })} />
          )}
          {(status === "expired" || status === "error") && (
            <FailureCard
              status={status}
              message={message}
              email={email}
              setEmail={setEmail}
              onResend={handleResend}
              resending={resending}
              resent={resent}
              cooldown={cooldown}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function VerifyingCard() {
  return (
    <div>
      <div className="neu-raised mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-gold-deep/25 border-t-gold-deep" />
      </div>
      <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-ink/45">One quiet moment</p>
      <h1 className="font-display mt-3 text-3xl leading-tight text-ink">
        Verifying your link…
      </h1>
      <p className="mt-4 text-sm text-ink/65">
        We're confirming your email with the door already open.
      </p>
    </div>
  );
}

function SuccessCard({
  email,
  onContinue,
}: {
  email: string;
  onContinue: () => void;
}) {
  return (
    <div>
      <div className="neu-raised mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full text-gold-deep">
        <CheckCircle2 size={26} strokeWidth={1.75} />
      </div>
      <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">Verified</p>
      <h1 className="font-display mt-3 text-3xl leading-tight text-ink md:text-4xl">
        You're in.
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ink/70">
        {email ? (
          <>
            <span className="font-medium text-ink">{email}</span> is confirmed.
            Bee is waiting on the other side of this door.
          </>
        ) : (
          <>Your email is confirmed. Bee is waiting on the other side.</>
        )}
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="group mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-br from-gold to-gold-deep px-8 py-4 text-sm font-semibold text-ink shadow-lg shadow-gold/30 transition hover:brightness-105"
      >
        Meet Bee
        <ArrowUpRight
          size={14}
          className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        />
      </button>
    </div>
  );
}

function FailureCard({
  status,
  message,
  email,
  setEmail,
  onResend,
  resending,
  resent,
  cooldown,
}: {
  status: "expired" | "error";
  message: string;
  email: string;
  setEmail: (v: string) => void;
  onResend: () => void;
  resending: boolean;
  resent: boolean;
  cooldown: number;
}) {
  return (
    <div className="text-left">
      <div className="mx-auto mb-8 inline-flex h-14 w-14 items-center justify-center bg-destructive/10 text-destructive">
        <AlertCircle size={26} strokeWidth={1.5} />
      </div>
      <p className="eyebrow text-center">
        {status === "expired" ? "Link expired" : "Verification failed"}
      </p>
      <h1 className="font-display mt-5 text-center text-4xl leading-tight">
        {status === "expired" ? "This link has expired." : "Something didn't fit."}
      </h1>
      <p className="mt-5 text-center text-sm text-ink/65">
        {message ||
          "Don't worry — enter your email and we'll send a fresh one."}
      </p>
      <span className="mx-auto mt-7 block h-px w-12 bg-gold" />

      <div className="mt-8">
        <label className="mb-2 block text-[0.65rem] tracking-[0.25em] uppercase text-ink/55">
          Your email
        </label>
        <div className="relative">
          <Mail
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full border border-ink/15 bg-bone py-3 pl-9 pr-3 text-sm text-ink placeholder:text-ink/35 transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>
      </div>

      {resent && (
        <p className="mt-5 border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink/75">
          A fresh link is on its way.
        </p>
      )}

      <button
        type="button"
        onClick={onResend}
        disabled={resending || cooldown > 0 || !email}
        className="group mt-6 flex w-full items-center justify-center gap-3 bg-ink py-4 text-[0.7rem] font-medium tracking-[0.25em] uppercase text-cream transition hover:bg-gold-deep disabled:opacity-50"
      >
        <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
        <span>
          {cooldown > 0
            ? `Resend in ${cooldown}s`
            : resending
              ? "Sending"
              : "Send a new link"}
        </span>
      </button>

      <p className="mt-8 text-center text-sm text-ink/60">
        Want to start over?{" "}
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="font-medium text-gold-deep underline-offset-4 hover:underline"
        >
          Back to sign up
        </Link>
      </p>
    </div>
  );
}
