import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";

const LINKS = [
  { href: "/#bee", label: "Bee" },
  { href: "/hive", label: "The Hive" },
  { href: "/buzz", label: "Buzz" },
] as const;

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="px-4 pt-4 md:px-8 md:pt-6">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 rounded-full bg-cream px-4 py-3 shadow-neo md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src="/bee-logo-192.png" alt="" className="h-11 w-11 rounded-full" />
            <span className="font-display text-2xl tracking-tight">
              Live<em className="text-gold-deep">Askew</em>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Products">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[0.68rem] font-medium tracking-[0.22em] uppercase text-ink/70 hover:text-gold-deep"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <Link to="/app" className="neo-btn-ink !px-4 !py-2.5 text-[0.62rem]">
            Open Bee
          </Link>
        </div>
        <nav className="mx-auto mt-3 flex max-w-[1100px] justify-center gap-6 md:hidden" aria-label="Products">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[0.68rem] font-medium tracking-[0.18em] uppercase text-ink/70"
              >
                {link.label}
              </a>
            ))}
        </nav>
      </header>
      <main>{children}</main>
      <Footer />
    </div>
  );
}
