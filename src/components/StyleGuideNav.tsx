import { Link } from "@tanstack/react-router";

const SECTIONS = [
  { to: "/style-guide", label: "Index", num: "00", exact: true },
  { to: "/style-guide/color", label: "Color", num: "01" },
  { to: "/style-guide/typography", label: "Typography", num: "02" },
  { to: "/style-guide/logo", label: "Logo", num: "03" },
  { to: "/style-guide/illustration", label: "Illustration", num: "04" },
  { to: "/style-guide/photography", label: "Photography", num: "05" },
  { to: "/style-guide/components", label: "Components", num: "06" },
  { to: "/style-guide/voice", label: "Voice", num: "07" },
] as const;

export function StyleGuideBanner() {
  return (
    <div className="bg-ink text-cream/80 text-xs tracking-[0.28em] uppercase py-2 px-6 text-center">
      Internal · Style Guide · Not Indexed
    </div>
  );
}

export function StyleGuideNav({ current }: { current: string }) {
  return (
    <nav className="border-b hairline bg-cream/80 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex flex-wrap gap-x-6 gap-y-2 items-baseline">
        <Link to="/" className="eyebrow hover:text-ink transition-colors">
          ← LiveAskew
        </Link>
        <span className="text-ink/30">/</span>
        {SECTIONS.map((s) => {
          const active = s.to === current;
          return (
            <Link
              key={s.to}
              to={s.to}
              className={`text-xs tracking-[0.18em] uppercase transition-colors ${
                active ? "text-ink font-medium" : "text-ink/45 hover:text-ink"
              }`}
            >
              <span className="text-ink/30 mr-1.5 font-mono">{s.num}</span>
              {s.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function StyleGuideShell({
  current,
  children,
}: {
  current: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <StyleGuideBanner />
      <StyleGuideNav current={current} />
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24">{children}</div>
      <footer className="max-w-6xl mx-auto px-6 md:px-10 pb-12 pt-8 border-t hairline flex items-baseline justify-between text-xs tracking-[0.22em] uppercase text-ink/50">
        <span>LiveAskew Style Guide</span>
        <span>v1 · Internal</span>
      </footer>
    </div>
  );
}

export function PageTitle({
  num,
  eyebrow,
  title,
  italic,
  intro,
}: {
  num: string;
  eyebrow: string;
  title: string;
  italic?: string;
  intro: string;
}) {
  return (
    <div className="mb-20">
      <p className="eyebrow mb-4" style={{ color: "var(--illus-jewel)" }}>
        Style Guide / {num}
      </p>
      <h1 className="font-display text-6xl md:text-8xl leading-[0.95] tracking-tight">
        {title}
        {italic && (
          <>
            <br />
            <em className="text-[color:var(--illus-jewel)]">{italic}</em>
          </>
        )}
      </h1>
      <p className="mt-8 max-w-2xl text-lg text-ink/70 leading-relaxed">{intro}</p>
      <p className="mt-4 text-xs tracking-[0.22em] uppercase text-ink/40">{eyebrow}</p>
    </div>
  );
}

export function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="mb-10">
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="font-display text-4xl md:text-5xl text-ink leading-[1.05]">{title}</h2>
      <span className="gold-rule mt-6 !mx-0" />
    </header>
  );
}
