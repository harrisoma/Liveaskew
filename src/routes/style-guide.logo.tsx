import { createFileRoute } from "@tanstack/react-router";
import { StyleGuideShell, PageTitle, SectionHeader } from "@/components/StyleGuideNav";

export const Route = createFileRoute("/style-guide/logo")({
  head: () => ({
    meta: [
      { title: "Logo — LiveAskew Style Guide" },
      { name: "description", content: "Wordmark, Bee mark, clearspace, misuse." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LogoPage,
});

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display tracking-tight ${className}`}>
      Live<em className="text-[color:var(--gold-deep)]">Askew</em>
    </span>
  );
}

function LogoPage() {
  return (
    <StyleGuideShell current="/style-guide/logo">
      <PageTitle
        num="03"
        eyebrow="The mark"
        title="Logo &"
        italic="Wordmark."
        intro="A literary wordmark — set in Cormorant Garamond with one italic gesture. Quiet, confident, never decorated."
      />

      <section className="mb-28">
        <SectionHeader eyebrow="03.01 — Primary wordmark" title="The full lockup." />
        <div className="bg-bone border hairline aspect-[16/7] flex items-center justify-center">
          <Wordmark className="text-7xl md:text-9xl" />
        </div>
        <p className="mt-4 text-sm text-ink/60">Cormorant Garamond · "Askew" in italic, color var(--gold-deep).</p>
      </section>

      <section className="mb-28">
        <SectionHeader eyebrow="03.02 — Scale" title="Holds at any size." />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { size: "text-8xl", label: "Hero" },
            { size: "text-5xl", label: "Header" },
            { size: "text-2xl", label: "Footer / inline" },
          ].map((v) => (
            <div key={v.label} className="bg-bone border hairline p-10 flex flex-col items-center justify-center aspect-[4/3]">
              <Wordmark className={v.size} />
              <p className="mt-6 eyebrow">{v.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-28">
        <SectionHeader eyebrow="03.03 — Color treatments" title="Three valid surfaces." />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-cream border hairline p-10 aspect-[4/3] flex items-center justify-center">
            <Wordmark className="text-5xl" />
          </div>
          <div className="bg-ink p-10 aspect-[4/3] flex items-center justify-center">
            <span className="font-display tracking-tight text-5xl text-cream">
              Live<em className="text-[color:var(--gold)]">Askew</em>
            </span>
          </div>
          <div className="p-10 aspect-[4/3] flex items-center justify-center" style={{ background: "var(--illus-peach)" }}>
            <Wordmark className="text-5xl" />
          </div>
        </div>
      </section>

      <section className="mb-28">
        <SectionHeader eyebrow="03.04 — Clearspace" title="Breathing room equal to the cap height." />
        <div className="bg-bone border hairline p-16 flex items-center justify-center relative">
          <div className="border-2 border-dashed border-[color:var(--gold-deep)]/40 p-10 inline-block">
            <Wordmark className="text-6xl" />
          </div>
        </div>
        <p className="mt-4 text-sm text-ink/60">Minimum padding = the height of the capital "L" on all sides.</p>
      </section>

      <section>
        <SectionHeader eyebrow="03.05 — Misuse" title="Never do this." />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { label: "Don't change the italic word", el: <span className="font-display text-4xl"><em>Live</em>Askew</span> },
            { label: "Don't use a different face", el: <span className="font-sans font-bold text-4xl">LiveAskew</span> },
            { label: "Don't apply effects", el: <span className="font-display text-4xl" style={{ textShadow: "2px 2px 0 #7E1F2B" }}>LiveAskew</span> },
          ].map((m) => (
            <div key={m.label} className="bg-bone border hairline p-10 aspect-[4/3] flex flex-col items-center justify-center relative">
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[color:var(--illus-jewel)] text-cream flex items-center justify-center text-sm">✕</div>
              {m.el}
              <p className="mt-6 text-xs tracking-[0.22em] uppercase text-ink/50 text-center">{m.label}</p>
            </div>
          ))}
        </div>
      </section>
    </StyleGuideShell>
  );
}
