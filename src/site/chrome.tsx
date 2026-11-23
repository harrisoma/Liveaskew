import type { ReactNode } from "react";
import "./company.css";

/** Top-level pages of the LiveAskew company site. */
export const NAV = [
  { href: "/", label: "Home", short: "Home" },
  { href: "/apps", label: "Apps", short: "Apps" },
  { href: "/design-studio", label: "Design Studio", short: "Studio" },
  { href: "/consulting", label: "Business Consulting", short: "Consulting" },
  { href: "/pricing", label: "Pricing", short: "Pricing" },
] as const;

export type NavHref = (typeof NAV)[number]["href"] | "/book" | "/privacy" | "/start";

export const CONTACT_EMAIL = "hello@liveaskew.co";

function Wordmark() {
  return (
    <a href="/" className="flex min-h-11 items-center gap-3" aria-label="LiveAskew home">
      <img
        src="/liveaskew-signature.png"
        alt=""
        className="h-11 w-auto"
        style={{ aspectRatio: "866 / 1610" }}
      />
      <span className="text-[0.95rem] font-semibold tracking-[0.28em]">LIVEASKEW</span>
    </a>
  );
}

/** The LiveAskew company site: floating glass nav, page, footer. */
export function SiteFrame({ current, children }: { current: NavHref; children: ReactNode }) {
  return (
    <div className="la-site la-company min-h-screen">
      <a href="#main" className="la-skip">
        Skip to content
      </a>
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-8">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4">
          <Wordmark />
          <nav className="la-nav glass hidden lg:flex" aria-label="Main">
            {NAV.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={current === link.href ? "page" : undefined}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <a
            href="/start"
            className="la-cta"
            aria-current={current === "/start" ? "page" : undefined}
          >
            Get Started <span aria-hidden>→</span>
          </a>
        </div>
        <nav className="la-nav la-nav-mobile glass mx-auto mt-2 lg:hidden" aria-label="Main">
          {NAV.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={current === link.href ? "page" : undefined}
            >
              {link.short}
            </a>
          ))}
        </nav>
      </header>
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="la-footer px-5 py-12 text-sm md:px-8">
      <div className="glass mx-auto max-w-[1320px] rounded-[2rem] p-7 md:p-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-sm text-base leading-relaxed text-black/70">
              A professional styling company. We style people and brands, then back it with apps,
              consulting, and a design studio.
            </p>
            <a href="/start" className="glass-btn mt-6">
              Get Started
            </a>
          </div>
          <nav aria-label="Explore LiveAskew">
            <h2 className="font-semibold text-black">Explore</h2>
            <ul className="mt-3 space-y-1 text-black/70">
              {NAV.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/app"
                  className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                >
                  Open the Bee app
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Help and contact">
            <h2 className="font-semibold text-black">Let's connect</h2>
            <ul className="mt-3 space-y-1 text-black/70">
              <li>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex min-h-11 items-center break-all underline-offset-4 hover:underline"
                >
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href="/book"
                  className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                >
                  Book a consultation
                </a>
              </li>
              <li>
                <a
                  href="/apps#faq"
                  className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                >
                  App questions &amp; answers
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="inline-flex min-h-11 items-center underline-offset-4 hover:underline"
                >
                  Privacy policy
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mt-9 border-t border-black/10 pt-6 text-xs leading-relaxed text-black/60">
          <p>
            © {new Date().getFullYear()} LiveAskew. Clothes follow your body. We never alter it.
          </p>
          <p className="mt-3 max-w-3xl">
            Bee is a styling companion, not medical, legal, or mental-health advice. In the US, if
            you are in crisis, call or text 988.
          </p>
        </div>
      </div>
    </footer>
  );
}
