import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SelfieUploader } from "@/components/SelfieUploader";
import { getMySelfies } from "@/lib/selfies.functions";
import { listFamilyProfiles } from "@/lib/family.functions";
import { hasEntitlement, loadResolvedTier } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{ title: "Profile & Selfie — LiveAskew" }, { name: "robots", content: "noindex" }],
  }),
  component: ProfilePage,
});

type FamilyMember = { id: string; name: string; relationship: string };

function ProfilePage() {
  const fetchSelfies = useServerFn(getMySelfies);
  const listFamily = useServerFn(listFamilyProfiles);

  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<string | null>(null);
  const [primaryPath, setPrimaryPath] = useState<string | null>(null);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [familySelfies, setFamilySelfies] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const resolved = await loadResolvedTier();
        if (!active) return;
        setTier(resolved);
        const r = await fetchSelfies();
        if (!active) return;
        setPrimaryPath(r.primaryPath);
        const map: Record<string, string | null> = {};
        for (const f of r.family) map[f.id] = f.selfie_photo_path;
        setFamilySelfies(map);
        if (hasEntitlement(resolved, "householdPartnerSeat")) {
          const fam = await listFamily();
          if (!active) return;
          setFamily((fam.profiles ?? []) as FamilyMember[]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fetchSelfies, listFamily]);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="mx-4 mt-4 flex items-center justify-between rounded-full bg-cream px-6 py-3 shadow-neo md:mx-8 md:px-8">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.25em] text-ink/55 hover:text-gold-deep"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div className="font-display text-lg">
          Profile<span className="text-gold-deep">.</span>
        </div>
        <Link
          to="/chat"
          className="text-[0.65rem] uppercase tracking-[0.25em] text-ink/55 hover:text-gold-deep"
        >
          Bee →
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
        <p className="eyebrow">Section 01</p>
        <h1 className="font-display mt-3 text-4xl leading-tight md:text-5xl">
          Your face, your looks.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/65">
          Upload one clear, front-facing photo so Bee can render every look on your own likeness.
          Used only for your private lookbook imagery.
        </p>
        <span className="mt-6 block h-px w-12 bg-gold-deep" />

        {loading ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-ink/55">
            <Loader2 size={14} className="animate-spin" /> Loading your profile…
          </div>
        ) : (
          <>
            <section className="mt-10">
              <p className="eyebrow">Selfie AI · Primary</p>
              <h2 className="font-display mt-2 text-2xl">Your primary selfie.</h2>
              <div className="mt-5">
                <SelfieUploader
                  scope={{ kind: "primary" }}
                  tier={tier}
                  label="You"
                  sublabel="Used across magazine covers and event lookbooks."
                  path={primaryPath}
                  onChange={setPrimaryPath}
                />
              </div>
              {primaryPath && (
                <div className="mt-6">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 border border-gold-deep px-5 py-3 text-[0.65rem] uppercase tracking-[0.28em] text-gold-deep hover:bg-gold-deep/5"
                  >
                    Back to your dashboard →
                  </Link>
                </div>
              )}
            </section>

            {hasEntitlement(tier, "householdPartnerSeat") && (
              <section className="mt-14">
                <p className="eyebrow">Household</p>
                <h2 className="font-display mt-2 text-2xl">
                  Selfies for the rest of your household.
                </h2>
                <p className="mt-2 max-w-xl text-sm text-ink/60">
                  Add or edit household members in{" "}
                  <Link
                    to="/household"
                    className="underline decoration-gold-deep underline-offset-4"
                  >
                    Household settings
                  </Link>
                  . Each member gets their own Selfie AI slot.
                </p>
                {family.length === 0 ? (
                  <p className="mt-4 text-sm text-ink/55">No household members yet.</p>
                ) : (
                  <ul className="mt-6 grid gap-5 md:grid-cols-2">
                    {family.map((m) => (
                      <li key={m.id}>
                        <SelfieUploader
                          scope={{ kind: "family", id: m.id }}
                          tier={tier}
                          label={`${m.name} — ${m.relationship}`}
                          path={familySelfies[m.id] ?? null}
                          onChange={(path) =>
                            setFamilySelfies((prev) => ({ ...prev, [m.id]: path }))
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
