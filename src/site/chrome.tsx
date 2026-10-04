import type { ReactNode } from "react";
import "./editorial.css";

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
      <header className="ed-site-header">
        <div className="ed-site-nav">
          <a href="/" className="ed-site-logo" aria-label="LiveAskew home">
            <img src="/liveaskew-signature.png" alt="" width={18} height={34} />
            <span>
              Live<span>Askew</span>
            </span>
          </a>
          <nav aria-label="Sections">
            {LINKS.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <a href="/app" className="ed-site-open">
            Open the app
          </a>
        </div>
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
