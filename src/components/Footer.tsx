export function Footer() {
  return (
    <footer className="border-t border-cream/10 bg-ink px-6 py-14 text-cream md:px-10">
      <div className="mx-auto grid max-w-[1400px] gap-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <span className="font-display text-4xl tracking-tight">
            Live<em className="text-gold">Askew</em>
          </span>
          <p className="mt-3 max-w-sm text-sm leading-6 text-cream/45">
            Intelligent tools, thoughtful objects and personal experiences for a more
            considered relationship with style.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-4 md:justify-end">
          <a
            href="/trust"
            className="text-[0.62rem] tracking-[0.22em] uppercase text-cream/55 hover:text-gold-soft"
          >
            Trust & Privacy
          </a>
          <a href="/bianca" className="text-[0.62rem] tracking-[0.22em] uppercase text-cream/55 hover:text-gold-soft">Studio</a>
          <a href="/#brands" className="text-[0.62rem] tracking-[0.22em] uppercase text-cream/55 hover:text-gold-soft">Brands</a>
        </div>
        <p className="border-t border-cream/10 pt-6 text-[0.58rem] tracking-[0.22em] uppercase text-cream/30 md:col-span-2">
          © 2026 LiveAskew. Crafted with intention.
        </p>
      </div>
    </footer>
  );
}
