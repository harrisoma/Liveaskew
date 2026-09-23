import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";

const LINKS = [
  { href: "/#bee", label: "Bee" },
  { href: "/#hive", label: "The Hive" },
  { href: "/#buzz", label: "Buzz" },
] as const;

export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="la-site min-h-screen bg-white text-black">
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-8">
        <div className="glass mx-auto flex max-w-[1180px] items-center justify-between gap-4 rounded-full px-4 py-2.5 md:px-5">
          <Link to="/" className="flex items-center gap-3" aria-label="LiveAskew">
            <img
              src="/liveaskew-signature.png"
              alt=""
              className="h-14 w-auto"
              style={{ aspectRatio: "788 / 1570" }}
            />
            <span className="font-display text-[1.65rem] leading-none tracking-tight">
              Live<em className="text-gold-deep">Askew</em>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="House">
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[0.68rem] font-medium tracking-[0.2em] uppercase text-black hover:text-gold-deep"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <Link to="/app" className="glass-btn !min-h-10 !px-4 !py-2">
            Enter the app
          </Link>
        </div>
        <nav
          className="glass mx-auto mt-3 flex max-w-[1180px] justify-center gap-6 rounded-full px-4 py-2.5 md:hidden"
          aria-label="House"
        >
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[0.68rem] font-medium tracking-[0.16em] uppercase text-black"
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
