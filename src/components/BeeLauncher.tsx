import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BeeOrb } from "./BeeOrb";

/**
 * Floating "Meet Bee" launcher fixed to bottom-right on every public page.
 * Opens a sheet introducing Bee with a CTA into the full conversation surface.
 * Hidden on /chat, /auth and authenticated app shells where it would conflict.
 */
export function BeeLauncher() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Settle the attention pulse after a few seconds.
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 6000);
    return () => clearTimeout(t);
  }, []);

  // Routes where the launcher should not appear.
  const path = location.pathname;
  const HIDDEN_PREFIXES = ["/chat", "/auth", "/onboarding", "/verify-email", "/checkout"];
  if (HIDDEN_PREFIXES.some((p) => path.startsWith(p))) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setPulse(false);
        }}
        aria-label="Meet Bee — open conversation"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-full border border-ink/10 bg-ink py-3 pl-3 pr-5 text-cream shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)] transition hover:bg-gold-deep md:bottom-8 md:right-8"
      >
        <span className="relative grid h-8 w-8 place-items-center">
          {pulse && (
            <span className="absolute inset-0 animate-ping rounded-full bg-gold/40" />
          )}
          <BeeOrb state="idle" size={32} minimal surface="dark" ariaLabel="Bee idle" />
        </span>
        <span className="font-sans text-[0.68rem] font-medium tracking-[0.22em] uppercase">
          Meet Bee
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Meet Bee">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
          />
          <aside
            className="absolute bottom-0 right-0 flex h-full w-full flex-col bg-cream text-ink shadow-2xl animate-slide-in-right sm:max-w-md sm:border-l sm:border-ink/10"
          >
            <header className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-gradient-to-br from-gold-soft via-gold to-gold-deep shadow-[0_0_10px_1px_rgba(212,175,55,0.5)]" />
                <p className="font-display text-xl tracking-tight">
                  Bee<span className="text-gold-deep">.</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center border border-ink/15 text-ink/60 transition hover:border-ink/40 hover:text-ink"
              >
                <X size={16} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-8">
              <p className="eyebrow text-gold-deep">Your AI stylist</p>
              <h2 className="font-display mt-4 text-3xl leading-tight">
                Hello. I'm Bee.
              </h2>
              <span className="mt-5 block h-px w-10 bg-gold" />
              <p className="mt-5 text-sm leading-relaxed text-ink/75">
                I don't recommend algorithms — I have conversations. Tell me what
                you're dressing for and I'll build it around your Fit, Feel and Fabric.
              </p>

              <div className="mt-8 space-y-2">
                {[
                  "Build me a five-outfit work week.",
                  "What should I wear to a winter wedding?",
                  "Help me edit my closet — start with denim.",
                ].map((p) => (
                  <p
                    key={p}
                    className="border border-ink/10 bg-bone px-4 py-3 text-sm text-ink/70"
                  >
                    "{p}"
                  </p>
                ))}
              </div>
            </div>

            <footer className="border-t border-ink/10 bg-cream px-6 py-5">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                onClick={() => setOpen(false)}
                className="block w-full bg-ink px-5 py-3.5 text-center font-sans text-[0.7rem] tracking-[0.22em] uppercase text-cream transition hover:bg-gold-deep"
              >
                Start a conversation
              </Link>
              <p className="mt-3 text-center text-[0.65rem] tracking-[0.18em] uppercase text-ink/45">
                14 days free · no card required
              </p>
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
