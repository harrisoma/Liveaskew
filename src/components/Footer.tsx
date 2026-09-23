export function Footer() {
  return (
    <footer className="px-6 py-16 md:px-10">
      <div className="glass mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-6 rounded-[2rem] px-8 py-8 md:flex-row">
        <span className="flex items-center gap-3 font-display text-2xl tracking-tight text-black">
          <img
            src="/liveaskew-signature.png"
            alt=""
            className="h-10 w-auto"
            style={{ aspectRatio: "788 / 1570" }}
          />
          Live<em className="text-gold-deep">Askew</em>
        </span>
        <p className="text-[0.65rem] tracking-[0.22em] uppercase text-black">
          © 2026 LiveAskew
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <a href="/app" className="text-[0.65rem] tracking-[0.22em] uppercase text-black hover:text-gold-deep">
            The app
          </a>
          <a href="/hive" className="text-[0.65rem] tracking-[0.22em] uppercase text-black hover:text-gold-deep">
            The Hive
          </a>
          <a href="/buzz" className="text-[0.65rem] tracking-[0.22em] uppercase text-black hover:text-gold-deep">
            Buzz
          </a>
          <a href="/privacy" className="text-[0.65rem] tracking-[0.22em] uppercase text-black hover:text-gold-deep">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}
