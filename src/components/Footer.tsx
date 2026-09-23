export function Footer() {
  return (
    <footer className="px-6 py-16 md:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-6 rounded-[2rem] bg-white px-8 py-8 shadow-neo md:flex-row">
        <span className="font-display text-2xl tracking-tight text-black">
          Live<em className="text-gold-deep">Askew</em>
        </span>
        <p className="text-[0.65rem] tracking-[0.25em] uppercase text-black">
          © 2026 LiveAskew. Inclusive styling, crafted with intention.
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <a href="/app" className="text-[0.65rem] tracking-[0.25em] uppercase text-black hover:text-gold-deep">
            Bee
          </a>
          <a href="/hive" className="text-[0.65rem] tracking-[0.25em] uppercase text-black hover:text-gold-deep">
            The Hive
          </a>
          <a href="/buzz" className="text-[0.65rem] tracking-[0.25em] uppercase text-black hover:text-gold-deep">
            Buzz
          </a>
          <a href="/privacy" className="text-[0.65rem] tracking-[0.25em] uppercase text-black hover:text-gold-deep">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}
