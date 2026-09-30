import { createFileRoute } from "@tanstack/react-router";
import {
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  PRIVACY_TITLE,
  PRIVACY_UPDATED,
} from "@/lib/privacy-policy";
import { SiteFrame } from "@/site/chrome";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: PRIVACY_TITLE },
      { name: "description", content: PRIVACY_INTRO },
      { property: "og:title", content: PRIVACY_TITLE },
      { property: "og:description", content: PRIVACY_INTRO },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteFrame>
      <div className="mx-auto max-w-[760px] px-6 pt-36 pb-16 md:pt-40 md:pb-24">
        <p className="kicker">LiveAskew</p>
        <h1 className="font-display mt-3 text-4xl font-bold tracking-[-0.035em] md:text-6xl">
          Privacy policy
        </h1>
        <p className="mt-6 text-[1.25rem] leading-relaxed text-black/65">{PRIVACY_INTRO}</p>

        <div className="mt-14 space-y-12">
          {PRIVACY_SECTIONS.map((section) => (
            <section key={section.title} className="border-t border-black/10 pt-10">
              <h2 className="font-display text-2xl font-semibold md:text-3xl">{section.title}</h2>
              <div className="mt-4 space-y-3 text-[1.0625rem] leading-relaxed text-black/70">
                {section.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-16 text-sm text-black/55">
          Last updated {PRIVACY_UPDATED} · App Store and Play Console privacy URL
        </p>
      </div>
    </SiteFrame>
  );
}
