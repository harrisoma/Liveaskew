import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Mail, RefreshCw, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import heroImage from "@/assets/hero-editorial.jpg";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { track, getHeroVariant, trackSignupCompletedOnce } from "@/lib/analytics";
import { resolvePostAuthDestination } from "@/lib/post-auth-destination";

const authSearchSchema = z.object({
  mode: z.enum(["signup", "login"]).catch("signup"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  head: () => ({
    meta: [
      { title: "Begin your LiveAskew membership" },
      {
        name: "description",
        content:
          "Create your LiveAskew account or sign in. Personal AI styling, free for fourteen days.",
      },
      { property: "og:title", content: "Join LiveAskew" },
      {
        property: "og:description",
        content: "Create your account and meet your AI stylist.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const isSignup = mode === "signup";

  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  // If already signed in, leave the auth page. Bee runs the onboarding interview inside chat.
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const to = await resolvePostAuthDestination();
      navigate({ to });
    });
  }, [navigate, mode]);

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    if (isSignup) {
      track({ event: "signup_started", variant: getHeroVariant(), method: "google" });
    }
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) {
        // Browser will redirect to Google — just return
        return;
      }
      // Tokens received and session is already set
      trackSignupCompletedOnce("google");
      const to = await resolvePostAuthDestination();
      navigate({ to });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        track({ event: "signup_started", variant: getHeroVariant(), method: "email" });
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/verify-email`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const to = await resolvePostAuthDestination();
        navigate({ to });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-2">
      {/* Editorial panel */}
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col">
        <img
          src={heroImage}
          alt=""
          width={1080}
          height={1440}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-ink/40" />
        <div className="relative z-10 flex h-full flex-col justify-between p-14 text-cream">
          <Link to="/" className="font-display text-2xl tracking-tight">
            Live<em className="text-gold-soft">Askew</em>
          </Link>
          <figure className="max-w-sm">
            <span className="mb-5 block h-px w-12 bg-gold" />
            <blockquote className="font-display text-3xl leading-tight">
              "Style is a way to say who you are without having to speak."
            </blockquote>
            <figcaption className="mt-6 text-[0.65rem] tracking-[0.3em] uppercase text-gold-soft">
              — Rachel Zoe
            </figcaption>
          </figure>
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex flex-col bg-cream px-6 py-10 md:px-12 lg:px-20 lg:py-16">
        <div className="flex items-center justify-between lg:hidden">
          <Link to="/" className="font-display text-xl tracking-tight text-ink">
            Live<em className="text-gold-deep">Askew</em>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-[0.65rem] tracking-[0.25em] uppercase text-ink/55 hover:text-gold-deep"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </Link>
        </div>

        <Link
          to="/"
          className="mt-2 hidden items-center gap-2 text-[0.65rem] tracking-[0.25em] uppercase text-ink/55 hover:text-gold-deep lg:inline-flex"
        >
          <ArrowLeft size={14} />
          <span>Back to home</span>
        </Link>

        <div className="my-auto w-full max-w-md self-center pt-14 lg:pt-0">
          {sent ? (
            <CheckInbox
              email={email}
              onChangeEmail={() => {
                setSent(false);
                setError("");
              }}
            />
          ) : (
            <>
              <p className="eyebrow">
                {isSignup ? "Begin your journey" : "Welcome back"}
              </p>
              <h1 className="font-display mt-5 text-4xl leading-tight md:text-5xl">
                {isSignup ? "Create your account." : "Sign in to LiveAskew."}
              </h1>
              <p className="mt-4 text-sm text-ink/65">
                {isSignup
                  ? "Fourteen days free. No card required to meet Bee."
                  : "Your personal style awaits."}
              </p>
              <span className="mt-7 block h-px w-12 bg-gold" />

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="mt-10 flex w-full items-center justify-center gap-3 border border-ink/20 bg-cream py-3.5 text-sm font-medium text-ink transition hover:border-ink/40 hover:bg-bone disabled:opacity-60"
              >
                {googleLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border border-ink/30 border-t-ink" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <div className="mt-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-ink/10" />
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-ink/40">
                  or
                </span>
                <div className="h-px flex-1 bg-ink/10" />
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-7">
                {isSignup && (
                  <Field label="Full name">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      className={inputCls}
                    />
                  </Field>
                )}

                <Field label="Email address">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={inputCls}
                  />
                </Field>

                <Field label="Password">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputCls} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 px-3 text-ink/55 transition hover:text-gold-deep"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>

                {error && (
                  <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-3 bg-ink py-4 text-[0.7rem] font-medium tracking-[0.25em] uppercase text-cream transition hover:bg-gold-deep disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border border-cream/30 border-t-cream" />
                      <span>{isSignup ? "Creating account" : "Signing in"}</span>
                    </>
                  ) : (
                    <span>{isSignup ? "Create account" : "Sign in"}</span>
                  )}
                </button>
              </form>

              <p className="mt-10 text-center text-sm text-ink/60">
                {isSignup ? "Already a member?" : "Don't have an account?"}{" "}
                <Link
                  to="/auth"
                  search={{ mode: isSignup ? "login" : "signup" }}
                  className="font-medium text-gold-deep underline-offset-4 hover:underline"
                >
                  {isSignup ? "Sign in" : "Sign up"}
                </Link>
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function CheckInbox({
  email,
  onChangeEmail,
}: {
  email: string;
  onChangeEmail: () => void;
}) {
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    setError("");
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });
      if (error) throw error;
      setResent(true);
      setCooldown(45);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend");
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center bg-gold/15 text-gold-deep">
        <Mail size={20} />
      </div>
      <p className="eyebrow">Light friction filter</p>
      <h1 className="font-display mt-5 text-4xl leading-tight md:text-5xl">
        Check your inbox.
      </h1>
      <p className="mt-5 text-sm leading-relaxed text-ink/70">
        We've sent a verification link to{" "}
        <span className="font-medium text-ink">{email}</span>. Open it on this
        device and Bee will be waiting on the other side.
      </p>
      <span className="mt-7 block h-px w-12 bg-gold" />

      <ul className="mt-8 space-y-3 text-sm text-ink/65">
        {[
          "The link expires in 24 hours.",
          "Look in spam or promotions if you don't see it.",
          "It must be opened in this browser to complete sign-in.",
        ].map((t) => (
          <li key={t} className="flex items-start gap-3">
            <Check size={14} className="mt-1 shrink-0 text-gold-deep" strokeWidth={2.5} />
            <span>{t}</span>
          </li>
        ))}
      </ul>

      {error && (
        <p className="mt-6 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {resent && !error && (
        <p className="mt-6 border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-ink/75">
          Sent again — give it a moment.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={resend}
          disabled={resending || cooldown > 0}
          className="group inline-flex items-center justify-center gap-3 border border-ink/20 py-4 text-[0.7rem] font-medium tracking-[0.25em] uppercase text-ink transition hover:border-gold hover:text-gold-deep disabled:opacity-50"
        >
          <RefreshCw
            size={14}
            className={resending ? "animate-spin" : ""}
          />
          <span>
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : resending
                ? "Sending"
                : "Resend the link"}
          </span>
        </button>
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-[0.65rem] tracking-[0.25em] uppercase text-ink/55 hover:text-gold-deep"
        >
          Use a different email
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full border border-ink/15 bg-bone px-4 py-3 text-sm text-ink placeholder:text-ink/35 transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[0.65rem] tracking-[0.25em] uppercase text-ink/55">
        {label}
      </label>
      {children}
      {hint && <p className="mt-2 text-xs text-ink/45">{hint}</p>}
    </div>
  );
}
