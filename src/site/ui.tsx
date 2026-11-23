import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

/** Shared building blocks for the LiveAskew company pages. */

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`la-eyebrow ${className}`}>{children}</p>;
}

/** Title block for the inner pages (Apps, Design Studio, Consulting, Book). */
export function PageHero({
  eyebrow,
  title,
  intro,
  actions,
  aside,
}: {
  eyebrow: string;
  title: ReactNode;
  intro: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="lac-hero px-5 pt-40 pb-20 md:px-8 md:pt-48 md:pb-28">
      <div
        className={`relative mx-auto grid max-w-[1320px] items-center gap-12 ${aside ? "lg:grid-cols-[1.1fr_1fr]" : ""}`}
      >
        <div className="max-w-2xl">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="la-serif mt-5 text-[2.9rem] leading-[1.04] md:text-[4.5rem]">{title}</h1>
          <div className="mt-6 max-w-xl text-[1.125rem] leading-relaxed text-black/75">{intro}</div>
          {actions ? <div className="mt-9 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {aside}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  center = false,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="la-serif mt-4 text-[2.4rem] leading-[1.06] md:text-[3.4rem]">{title}</h2>
      {intro ? <p className="mt-5 text-[1.0625rem] leading-relaxed opacity-75">{intro}</p> : null}
    </div>
  );
}

/** Card with a chip label, serif title and a round arrow — the screenshot's service cards. */
export function ServiceCard({
  href,
  chip,
  title,
  text,
  icon,
  featured = false,
  className = "",
}: {
  href: string;
  chip: string;
  title: string;
  text: string;
  icon?: ReactNode;
  featured?: boolean;
  className?: string;
}) {
  return (
    <a href={href} className={`la-card ${featured ? "is-featured" : ""} ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-3">
          {icon}
          <span className="lac-chip">{chip}</span>
        </span>
        <span className="la-arrow" aria-hidden>
          <ArrowUpRight size={20} />
        </span>
      </div>
      <h3 className="la-serif mt-4 text-[1.6rem] leading-[1.1] md:text-[1.85rem]">{title}</h3>
      <p className="mt-2 max-w-md text-[1rem] leading-relaxed text-black/70">{text}</p>
    </a>
  );
}

export type Item = { title: string; text: string };

export function ItemGrid({ items, columns = 3 }: { items: Item[]; columns?: 2 | 3 | 4 }) {
  const cols = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[
    columns
  ];
  return (
    <ul className={`mt-10 grid gap-3 ${cols}`}>
      {items.map((item) => (
        <li key={item.title} className="la-card">
          <h3 className="la-serif text-[1.35rem] leading-tight">{item.title}</h3>
          <p className="mt-2 text-[0.98rem] leading-relaxed text-black/70">{item.text}</p>
        </li>
      ))}
    </ul>
  );
}

export function Steps({ steps }: { steps: Item[] }) {
  return (
    <ol className="mt-10 grid gap-3 md:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title} className="la-card">
          <span className="la-serif text-[2rem] leading-none text-[#b8860b]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-3 text-[1.25rem]">{step.title}</h3>
          <p className="mt-2 text-[1rem] leading-relaxed text-black/70">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}

/** Closing call to book a consultation, used at the bottom of every page. */
export function BookingBand({
  title = "Let's get you styled.",
  text = "Tell us what you need. We'll follow up to set a time for your consultation.",
  service,
}: {
  title?: string;
  text?: string;
  service?: string;
}) {
  const href = service ? `/book?service=${encodeURIComponent(service)}` : "/book";
  return (
    <section className="la-section">
      <div className="la-dark mx-auto flex max-w-[1320px] flex-col items-start justify-between gap-8 rounded-[2.5rem] px-8 py-14 md:flex-row md:items-center md:px-14 md:py-16">
        <div className="max-w-2xl">
          <Eyebrow>Book a consultation</Eyebrow>
          <h2 className="la-serif mt-4 text-[2.4rem] leading-[1.06] md:text-[3.2rem]">{title}</h2>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-white/75">{text}</p>
        </div>
        <a href={href} className="la-btn la-btn-light shrink-0">
          Book a Consultation <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}
