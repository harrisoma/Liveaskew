import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logoAsset from "@/assets/askew-logo.png.asset.json";

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Our Brands", href: "/#brands" },
  { label: "Bee", href: "/#bee" },
  { label: "Our Standard", href: "/#standard" },
  { label: "Studio", href: "/bianca" },
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
      className={`fixed inset-x-0 top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? "border-ink/10 bg-cream/75 backdrop-blur-xl"
          : "border-transparent bg-cream/40 backdrop-blur-md"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1400px] items-center justify-between px-6 transition-all duration-300 md:px-10 ${
          scrolled ? "py-3" : "py-5"
        }`}
      >
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt=""
            aria-hidden
            className={`w-auto transition-all duration-300 ${scrolled ? "h-7" : "h-9"}`}
          />
          <span
            className={`font-display tracking-tight text-ink transition-all duration-300 ${
              scrolled ? "text-xl" : "text-2xl"
            }`}
          >
            Live<em className="text-gold-deep">Askew</em>
          </span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map(({ label, href }) => {
            const isRoute = href.startsWith("/") && !href.includes("#");
            const isActive = isRoute ? location.pathname === href : false;
            const classes = `text-[0.7rem] font-medium tracking-[0.25em] uppercase transition ${
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

        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="bg-ink px-4 py-2.5 text-[0.62rem] font-medium tracking-[0.22em] uppercase text-cream transition hover:bg-gold-deep md:px-5 md:py-3 md:text-[0.65rem]"
          >
            Enter Bee
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="grid h-10 w-10 place-items-center border border-ink/15 bg-cream text-ink md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-ink/10 bg-cream/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-[1400px] flex-col px-6 py-4">
            {NAV_LINKS.map(({ label, href }) => {
              const isRoute = href.startsWith("/") && !href.includes("#");
              const classes =
                "py-3 text-[0.75rem] font-medium tracking-[0.25em] uppercase text-ink/80 hover:text-gold-deep border-b border-ink/5 last:border-b-0";
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
