import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isValidChallenge, parseAuthorizeRequest, redirectWith } from "@/lib/mcp/oauth";

export const Route = createFileRoute("/oauth/authorize")({
  head: () => ({
    meta: [{ title: "Connect LiveAskew" }, { name: "robots", content: "noindex" }],
  }),
  component: AuthorizePage,
});

type Client = { name: string; redirect_uris: string[] };
type Stage =
  | { kind: "loading" }
  | { kind: "fatal"; message: string }
  | { kind: "signin" }
  | { kind: "code"; email: string }
  | { kind: "consent"; email: string | null; token: string }
  | { kind: "leaving" };

async function supabaseClient() {
  const { isSupabaseConfigured, supabase } = await import("@/integrations/supabase/client");
  return isSupabaseConfigured() ? supabase : null;
}

/**
 * Where a member lets Claude, ChatGPT, or another assistant into her LiveAskew. She signs in
 * with the same account as the app, sees who is asking, and allows or declines.
 */
function AuthorizePage() {
  const [stage, setStage] = useState<Stage>({ kind: "loading" });
  const [client, setClient] = useState<Client | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [req] = useState(() =>
    typeof window === "undefined" ? null : parseAuthorizeRequest(window.location.search),
  );

  useEffect(() => {
    if (!req) return;
    let cancelled = false;
    (async () => {
      if (!req.clientId || !req.redirectUri) {
        setStage({ kind: "fatal", message: "This link is missing who is asking to connect." });
        return;
      }
      const res = await fetch(`/api/oauth/client?client_id=${encodeURIComponent(req.clientId)}`);
      const found = res.ok ? ((await res.json()) as Client) : null;
      // An unknown client or redirect is never sent anywhere — it stops here.
      if (!found || !found.redirect_uris.includes(req.redirectUri)) {
        if (!cancelled) {
          setStage({
            kind: "fatal",
            message:
              "We don't recognise the app asking to connect. Start again from your assistant.",
          });
        }
        return;
      }
      if (cancelled) return;
      setClient(found);
      if (
        req.responseType !== "code" ||
        req.codeChallengeMethod !== "S256" ||
        !isValidChallenge(req.codeChallenge)
      ) {
        window.location.replace(
          redirectWith(req.redirectUri, {
            error: req.responseType !== "code" ? "unsupported_response_type" : "invalid_request",
            error_description: "LiveAskew needs response_type=code with PKCE S256.",
            state: req.state,
          }),
        );
        setStage({ kind: "leaving" });
        return;
      }
      const supabase = await supabaseClient();
      if (!supabase) {
        setStage({ kind: "fatal", message: "Sign-in is not available right now." });
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const session = data.session;
      setStage(
        session
          ? { kind: "consent", email: session.user.email ?? null, token: session.access_token }
          : { kind: "signin" },
      );
    })().catch(() => {
      if (!cancelled) setStage({ kind: "fatal", message: "Something went wrong. Try again." });
    });
    return () => {
      cancelled = true;
    };
  }, [req]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    const supabase = await supabaseClient();
    if (!supabase || busy) return;
    setBusy(true);
    setNote(null);
    const dest = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithOtp({
      email: dest,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (error) {
      setNote("We couldn't send a code to that address. Use the email you use in LiveAskew.");
      return;
    }
    setStage({ kind: "code", email: dest });
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (stage.kind !== "code" || busy) return;
    const supabase = await supabaseClient();
    if (!supabase) return;
    setBusy(true);
    setNote(null);
    const { data, error } = await supabase.auth.verifyOtp({
      email: stage.email,
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error || !data.session) {
      setNote("That code didn't work. Check it, or send a new one.");
      return;
    }
    setStage({
      kind: "consent",
      email: data.session.user.email ?? stage.email,
      token: data.session.access_token,
    });
  }

  async function answer(approve: boolean) {
    if (!req || stage.kind !== "consent" || busy) return;
    setBusy(true);
    setNote(null);
    const res = await fetch("/api/oauth/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${stage.token}` },
      body: JSON.stringify({
        approve,
        client_id: req.clientId,
        redirect_uri: req.redirectUri,
        code_challenge: req.codeChallenge,
        code_challenge_method: req.codeChallengeMethod,
        state: req.state,
      }),
    });
    const out = (await res.json().catch(() => ({}))) as { redirect?: string };
    if (!out.redirect) {
      setBusy(false);
      setNote(
        res.status === 401
          ? "Your session has ended. Sign in again."
          : "We couldn't finish connecting. Try again.",
      );
      if (res.status === 401) setStage({ kind: "signin" });
      return;
    }
    setStage({ kind: "leaving" });
    window.location.assign(out.redirect);
  }

  async function switchAccount() {
    const supabase = await supabaseClient();
    await supabase?.auth.signOut();
    setStage({ kind: "signin" });
  }

  const asker = client?.name?.trim() || "An assistant";

  return (
    <div className="la-site flex min-h-screen items-center justify-center px-4 py-16">
      <main className="glass w-full max-w-[440px] rounded-[28px] p-8">
        <a href="/" className="flex items-center gap-2.5" aria-label="LiveAskew home">
          <img
            src="/liveaskew-signature.png"
            alt=""
            className="h-10 w-auto"
            style={{ aspectRatio: "866 / 1610" }}
          />
          <span className="font-display text-[1.35rem] font-semibold tracking-tight">
            Live<span className="text-[var(--gold)]">Askew</span>
          </span>
        </a>

        {stage.kind === "loading" && <p className="mt-8 text-black/60">One moment…</p>}

        {stage.kind === "leaving" && (
          <p className="mt-8 text-black/60">Taking you back to {asker}…</p>
        )}

        {stage.kind === "fatal" && (
          <>
            <h1 className="font-display mt-8 text-2xl font-semibold">Can't connect</h1>
            <p className="mt-3 text-black/65">{stage.message}</p>
          </>
        )}

        {stage.kind === "signin" && (
          <form onSubmit={sendCode}>
            <h1 className="font-display mt-8 text-2xl font-semibold">Sign in to connect</h1>
            <p className="mt-3 text-black/65">
              {asker} would like to connect to your LiveAskew. Sign in with the email you use in the
              app and we'll send you a code.
            </p>
            <label className="mt-6 block text-sm font-medium" htmlFor="la-email">
              Email
            </label>
            <input
              id="la-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/15 bg-white/80 px-4 py-3 text-base outline-none focus:border-black/40"
            />
            <button type="submit" className="glass-btn mt-6 w-full" disabled={busy}>
              {busy ? "Sending…" : "Send code"}
            </button>
          </form>
        )}

        {stage.kind === "code" && (
          <form onSubmit={verify}>
            <h1 className="font-display mt-8 text-2xl font-semibold">Check your email</h1>
            <p className="mt-3 text-black/65">We sent a code to {stage.email}.</p>
            <label className="mt-6 block text-sm font-medium" htmlFor="la-code">
              Code
            </label>
            <input
              id="la-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-black/15 bg-white/80 px-4 py-3 text-base tracking-[0.3em] outline-none focus:border-black/40"
            />
            <button type="submit" className="glass-btn mt-6 w-full" disabled={busy}>
              {busy ? "Checking…" : "Continue"}
            </button>
            <button
              type="button"
              className="mt-3 w-full text-sm text-black/60 underline"
              onClick={() => setStage({ kind: "signin" })}
            >
              Use a different email
            </button>
          </form>
        )}

        {stage.kind === "consent" && (
          <>
            <h1 className="font-display mt-8 text-2xl font-semibold">
              Connect {asker} to LiveAskew?
            </h1>
            <p className="mt-3 text-black/65">It will be able to:</p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-black/75">
              <li>See your style profile and the looks Bee made for you</li>
              <li>See what's on your Honey calendar</li>
              <li>Talk to Bee for you (counts toward your Bee use)</li>
            </ul>
            <p className="mt-4 text-sm text-black/55">
              It can't change your wardrobe, post to Buzz, or see your photos. You can disconnect it
              from {asker} at any time.
            </p>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-full border border-black/15 px-5 py-3 text-[0.95rem]"
                onClick={() => answer(false)}
                disabled={busy}
              >
                Decline
              </button>
              <button
                type="button"
                className="glass-btn flex-1"
                onClick={() => answer(true)}
                disabled={busy}
              >
                Allow
              </button>
            </div>
            {stage.email && (
              <p className="mt-6 text-center text-sm text-black/55">
                Signed in as {stage.email} ·{" "}
                <button type="button" className="underline" onClick={switchAccount}>
                  Not you?
                </button>
              </p>
            )}
          </>
        )}

        {note && (
          <p role="alert" className="mt-4 text-sm text-[#a33]">
            {note}
          </p>
        )}
      </main>
    </div>
  );
}
