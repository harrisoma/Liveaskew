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

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 6000);
    return () => clearTimeout(t);
  }, []);

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
        className="neo-btn-ink fixed right-5 bottom-5 z-50 !gap-2.5 !py-3 !pr-5 !pl-3 md:right-8 md:bottom-8"
      >
        <span className="relative grid h-8 w-8 place-items-center">
          {pulse && <span className="absolute inset-0 animate-ping rounded-full bg-gold/40" />}
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
          <aside className="absolute right-0 bottom-0 flex h-full w-full flex-col bg-cream text-ink shadow-neo-lg animate-slide-in-right sm:max-w-md">
            <header className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                <span
                  className="h-8 w-8 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--gold-soft), var(--gold), var(--gold-deep))",
                    boxShadow: "var(--neo-raised-sm)",
                  }}
                />
                <p className="font-display text-xl tracking-tight">
                  Bee<span className="text-gold-deep">.</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="neo-icon h-9 w-9"
              >
                <X size={16} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-8">
              <p className="eyebrow text-gold-deep">Your inclusive AI stylist</p>
              <h2 className="font-display mt-4 text-3xl leading-tight">Hello. I'm Bee.</h2>
              <span className="gold-rule mt-5 !mx-0" />
              <p className="mt-5 text-sm leading-relaxed text-ink/75">
                I don't recommend algorithms — I have conversations. Tell me what you're dressing
                for and I'll build it around your Fit, Feel and Fabric — for every body, heritage,
                and way of dressing.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Build me a five-outfit work week.",
                  "What should I wear to a winter wedding?",
                  "Help me edit my closet — start with denim.",
                ].map((p) => (
                  <p
                    key={p}
                    className="rounded-2xl bg-cream px-4 py-3 text-sm text-ink/70 shadow-neo-sm"
                  >
                    "{p}"
                  </p>
                ))}
              </div>
            </div>

            <footer className="px-6 py-5">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="neo-btn-ink w-full"
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
