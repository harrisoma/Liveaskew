import { BeeMark } from "@/components/BeeMark";

export function Footer() {
  return (
    <footer className="bg-ink px-6 py-14 md:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <BeeMark className="h-5 w-5 text-gold" />
          <span className="font-display text-lg font-semibold text-cream">Bee</span>
          <span className="text-[0.55rem] font-semibold tracking-[0.14em] uppercase text-cream/45">
            by LiveAskew
          </span>
        </div>
        <p className="text-sm text-cream/45">
          © 2026 LiveAskew. Crafted with intention.
        </p>
        <div className="flex gap-7">
          <a href="/trust" className="text-sm text-cream/60 hover:text-gold">
            Trust &amp; Privacy
          </a>
          {["Terms", "Contact"].map((l) => (
            <a key={l} href="#" className="text-sm text-cream/60 hover:text-gold">
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
