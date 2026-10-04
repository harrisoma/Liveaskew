import type { ReactNode } from "react";

const LINKS = [
  { href: "/#bee", label: "Bee" },
  { href: "/#honey", label: "Honey" },
  { href: "/#buzz", label: "Buzz" },
  { href: "/#hive", label: "The Hive" },
  { href: "/#pricing", label: "Pricing" },
] as const;

/** The LiveAskew house site: floating glass nav, page, footer. */
export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="la-site min-h-screen">
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-8">
        <div className="glass mx-auto flex max-w-[1180px] items-center justify-between gap-4 rounded-full py-2 pr-2 pl-4 md:pl-5">
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
          <nav className="hidden items-center gap-7 md:flex" aria-label="Sections">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[0.875rem] text-black/80 transition-colors hover:text-black"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <a href="/app" className="glass-btn glass-btn-sm">
            Open the app
          </a>
        </div>
        <nav
          className="glass mx-auto mt-2 flex max-w-[1180px] justify-center gap-5 overflow-x-auto rounded-full px-4 py-2 md:hidden"
          aria-label="Sections"
        >
          {LINKS.map((link) => (
            <a key={link.label} href={link.href} className="shrink-0 text-[0.8rem] text-black">
              {link.label}
            </a>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-[#f5f5f7] px-6 py-10 text-[0.8rem] text-black/60">
      <div className="mx-auto max-w-[1180px]">
        <p>
          Bee is a styling companion, not medical, legal, or mental-health advice. In the US, if you
          are in crisis, call or text 988.
        </p>
        <div className="mt-6 flex flex-col justify-between gap-4 border-t border-black/10 pt-6 md:flex-row">
          <p>© 2026 LiveAskew. Clothes follow your body. We never alter it.</p>
          <ul className="flex gap-6">
            <li>
              <a href="/app" className="hover:text-black">
                Open the app
              </a>
            </li>
            <li>
              <a href="/privacy" className="hover:text-black">
                Privacy
              </a>
            </li>
            <li>
              <a href="mailto:hello@liveaskew.co" className="hover:text-black">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
