import { createFileRoute } from "@tanstack/react-router";
import {
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  PRIVACY_TITLE,
  PRIVACY_UPDATED,
} from "@/lib/privacy-policy";
import { SiteFrame } from "@/site/chrome";
import { SITE_URL } from "@/site/seo";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: PRIVACY_TITLE },
      { name: "description", content: PRIVACY_INTRO },
      { property: "og:title", content: PRIVACY_TITLE },
      { property: "og:description", content: PRIVACY_INTRO },
      { property: "og:url", content: `${SITE_URL}/privacy` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/privacy` }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteFrame current="/privacy">
      <div className="mx-auto max-w-[760px] px-6 pt-36 pb-16 md:pt-40 md:pb-24">
        <p className="kicker">LiveAskew</p>
        <h1 className="la-serif mt-3 text-4xl md:text-6xl">Privacy policy</h1>
        <p className="mt-6 text-[1.25rem] leading-relaxed text-black/65">{PRIVACY_INTRO}</p>

        <section
          id="delete-account"
          className="mt-10 rounded-2xl border border-black/15 p-6 scroll-mt-24"
          aria-labelledby="delete-account-title"
        >
          <h2 id="delete-account-title" className="text-2xl font-semibold">
            Delete your LiveAskew account
          </h2>
          <p className="mt-3">
            Sign in to LiveAskew, open Settings, then choose Delete account and confirm. This
            removes your account data and cancels linked Stripe memberships. Groups you own and
            their conversations are removed too.
          </p>
          <a className="mt-4 inline-block underline" href="/app?screen=you">
            Open account settings
          </a>
          <p className="mt-4">
            Cannot sign in?{" "}
            <a
              className="underline"
              href="mailto:hello@liveaskew.co?subject=Delete%20my%20LiveAskew%20account"
            >
              Request deletion by email
            </a>{" "}
            from the email on your account. We verify ownership before deleting; do not send a
            password. Processor records required for accounting and posts already published to
            social networks may remain.
          </p>
        </section>

        <div className="mt-14 space-y-12">
          {PRIVACY_SECTIONS.map((section) => (
            <section key={section.title} className="border-t border-black/10 pt-10">
              <h2 className="la-serif text-2xl md:text-3xl">{section.title}</h2>
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
