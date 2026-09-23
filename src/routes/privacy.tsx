import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_TITLE, PRIVACY_UPDATED } from "@/lib/privacy-policy";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: PRIVACY_TITLE },
      {
        name: "description",
        content: PRIVACY_INTRO,
      },
      { property: "og:title", content: PRIVACY_TITLE },
      {
        property: "og:description",
        content: PRIVACY_INTRO,
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="mx-auto flex max-w-[1100px] items-center justify-between px-6 pt-10 md:px-10">
        <Link to="/" className="font-display text-2xl tracking-tight">
          Live<em className="text-gold-deep">Askew</em>
        </Link>
        <Link
          to="/"
          className="text-[0.65rem] tracking-[0.25em] uppercase text-ink/55 hover:text-gold-deep"
        >
          ← Home
        </Link>
      </header>

      <main className="mx-auto max-w-[820px] px-6 py-16 md:px-10 md:py-24">
        <p className="text-[0.65rem] tracking-[0.3em] uppercase text-ink/50">Bee by LiveAskew</p>
        <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">Privacy policy</h1>
        <p className="mt-5 font-serif text-lg italic text-ink/70">{PRIVACY_INTRO}</p>

        <div className="mt-12 space-y-12">
          {PRIVACY_SECTIONS.map((section) => (
            <section key={section.title} className="border-t border-ink/10 pt-10">
              <h2 className="font-display text-2xl text-ink md:text-3xl">{section.title}</h2>
              <div className="mt-4 space-y-3 font-serif text-[1.05rem] leading-relaxed text-ink/80">
                {section.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 text-[0.65rem] tracking-[0.25em] uppercase text-ink/45">
          Last updated {PRIVACY_UPDATED} · Play Console data safety URL
        </p>
      </main>

      <Footer />
    </div>
  );
}
