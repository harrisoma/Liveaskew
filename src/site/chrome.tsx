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
    <footer className="border-t border-black/10 bg-[#f5f5f7] px-5 py-12 text-sm text-black/70 md:px-8">
      <div className="glass mx-auto max-w-[1180px] rounded-[2rem] p-7 md:p-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <a href="/" className="inline-flex min-h-11 items-center gap-3" aria-label="LiveAskew home">
              <img src="/liveaskew-signature.png" alt="" className="h-12 w-auto" width="26" height="48" />
              <span className="font-display text-2xl font-semibold tracking-tight text-black">Live<span className="text-[var(--gold)]">Askew</span></span>
            </a>
            <p className="mt-4 max-w-sm text-base leading-relaxed">Miami-born. Styling for women. Your wardrobe, your plans, your own way of getting dressed.</p>
            <a href="/app" className="glass-btn mt-6">Meet Bee</a>
          </div>
          <nav aria-label="Explore LiveAskew">
            <h2 className="font-semibold text-black">Explore</h2>
            <ul className="mt-3 space-y-1">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Help and contact">
            <h2 className="font-semibold text-black">Let's connect</h2>
            <ul className="mt-3 space-y-1">
              <li><a href="mailto:hello@liveaskew.co" className="inline-flex min-h-11 items-center break-all underline-offset-4 hover:underline">hello@liveaskew.co</a></li>
              <li><a href="/#faq" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">Questions &amp; answers</a></li>
              <li><a href="/privacy" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">Privacy policy</a></li>
              <li><a href="mailto:hello@liveaskew.co?subject=Private%20Atelier%20inquiry" className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">Private styling inquiries</a></li>
            </ul>
          </nav>
        </div>
        <div className="mt-9 border-t border-black/10 pt-6 text-xs leading-relaxed text-black/60">
          <p>© {new Date().getFullYear()} LiveAskew. Clothes follow your body. We never alter it.</p>
          <p className="mt-3 max-w-3xl">Bee is a styling companion, not medical, legal, or mental-health advice. In the US, if you are in crisis, call or text 988.</p>
        </div>
      </div>
    </footer>
  );
}
