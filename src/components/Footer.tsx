export function Footer() {
  return (
    <footer className="border-t border-ink/15 bg-cream px-6 py-14 md:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 md:flex-row">
        <span className="font-display text-2xl tracking-tight text-ink">
          Live<em className="text-gold-deep">Askew</em>
        </span>
        <p className="text-[0.65rem] tracking-[0.25em] uppercase text-ink/50">
          © 2026 LiveAskew. Crafted with intention.
        </p>
        <div className="flex gap-8">
          <a
            href="/trust"
            className="text-[0.65rem] tracking-[0.25em] uppercase text-ink/55 hover:text-gold-deep"
          >
            Trust & Privacy
          </a>
          {["Terms", "Contact"].map((l) => (
            <a
              key={l}
              href="#"
              className="text-[0.65rem] tracking-[0.25em] uppercase text-ink/55 hover:text-gold-deep"
            >
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
