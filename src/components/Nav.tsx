import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BeeMark } from "@/components/BeeMark";

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Meet Bee", href: "/#bee" },
  { label: "Pricing", href: "/pricing" },
  { label: "Work with Bianca", href: "/bianca" },
];

export function Nav() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled ? "bg-cream/80 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1400px] items-center justify-between px-6 transition-all duration-300 md:px-10 ${
          scrolled ? "py-3" : "py-5"
        }`}
      >
        <Link to="/" className="flex items-center gap-2">
          <BeeMark className={`shrink-0 ${scrolled ? "text-ink" : "text-cream"} ${scrolled ? "h-6 w-6" : "h-7 w-7"}`} />
          <div className="leading-tight">
            <p className={`font-display font-semibold transition-colors duration-300 ${scrolled ? "text-ink" : "text-cream"} ${scrolled ? "text-base" : "text-lg"}`}>
              Bee
            </p>
            <p className={`text-[0.5rem] font-semibold tracking-[0.14em] uppercase transition-colors duration-300 ${scrolled ? "text-ink/45" : "text-cream/55"}`}>
              by LiveAskew
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(({ label, href }) => {
            const isRoute = href.startsWith("/") && !href.includes("#");
            const isActive = isRoute ? location.pathname === href : false;
            const classes = `text-sm font-medium transition ${
              isActive
                ? "text-gold"
                : scrolled
                  ? "text-ink/70 hover:text-gold-deep"
                  : "text-cream/75 hover:text-gold"
            }`;
            return isRoute ? (
              <Link key={label} to={href} className={classes}>
                {label}
              </Link>
            ) : (
              <a key={label} href={href} className={classes}>
                {label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-full bg-gradient-to-br from-gold to-gold-deep px-5 py-2.5 text-sm font-semibold text-ink shadow-md shadow-gold/25 transition hover:brightness-105"
          >
            Start Free Trial
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`grid h-10 w-10 place-items-center rounded-full transition md:hidden ${
              scrolled ? "neu-raised text-ink" : "bg-cream/15 text-cream backdrop-blur-md"
            }`}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="bg-cream/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-[1400px] flex-col gap-1 px-6 py-4">
            {NAV_LINKS.map(({ label, href }) => {
              const isRoute = href.startsWith("/") && !href.includes("#");
              const classes = "rounded-2xl px-4 py-3 text-sm font-medium text-ink/80 hover:bg-cream hover:text-gold-deep";
              return isRoute ? (
                <Link key={label} to={href} className={classes} onClick={() => setOpen(false)}>
                  {label}
                </Link>
              ) : (
                <a key={label} href={href} className={classes} onClick={() => setOpen(false)}>
                  {label}
                </a>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
