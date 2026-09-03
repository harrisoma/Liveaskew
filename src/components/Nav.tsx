import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logoAsset from "@/assets/askew-logo.png.asset.json";

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Meet Bee", href: "/#bee" },
  { label: "How It Works", href: "/#process" },
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
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-6 md:pt-4">
      <div
        className={`mx-auto flex max-w-[1400px] items-center justify-between rounded-full bg-cream px-4 transition-all duration-300 md:px-6 ${
          scrolled ? "py-2 shadow-neo" : "py-3 shadow-neo-lg"
        }`}
      >
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt=""
            aria-hidden
            className={`w-auto transition-all duration-300 ${scrolled ? "h-7" : "h-8"}`}
          />
          <span
            className={`font-display tracking-tight text-ink transition-all duration-300 ${
              scrolled ? "text-xl" : "text-2xl"
            }`}
          >
            Live<em className="text-gold-deep">Askew</em>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV_LINKS.map(({ label, href }) => {
            const isRoute = href.startsWith("/") && !href.includes("#");
            const isActive = isRoute ? location.pathname === href : false;
            const classes = `text-[0.68rem] font-medium tracking-[0.22em] uppercase transition ${
              isActive ? "text-gold-deep" : "text-ink/70 hover:text-gold-deep"
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

        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="neo-btn-ink !px-4 !py-2.5 text-[0.62rem] md:!px-5 md:!py-3 md:text-[0.65rem]"
          >
            Start Free Trial
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="neo-icon md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="mx-auto mt-3 max-w-[1400px] rounded-[1.75rem] bg-cream px-6 py-4 shadow-neo md:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col">
            {NAV_LINKS.map(({ label, href }) => {
              const isRoute = href.startsWith("/") && !href.includes("#");
              const classes =
                "py-3 text-[0.75rem] font-medium tracking-[0.25em] uppercase text-ink/80 hover:text-gold-deep";
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
