import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  getMyStyleGuide,
  getMyShareToken,
  rotateShareToken,
  revokeShareToken,
} from "@/lib/my-style-guide.functions";
import { backfillMyStyleFromBee } from "@/lib/bee-backfill.functions";
import {
  getLooksStatus,
  generateOneHero,
  generateHeroVariations,
  generateRotation,
  generateLookIllustration,
  resetLooks,
  HERO_COUNT,
} from "@/lib/style-looks.functions";

import { StyleGuideShell, PageTitle } from "@/components/StyleGuideNav";
import { MagazineSpread } from "@/components/MagazineSpread";
import { SelfieHero } from "@/components/SelfieHero";
import { checkIsAdmin } from "@/lib/admin.functions";
import { loadResolvedTier } from "@/lib/plans";
import { parsePalette } from "@/lib/palette";

export const Route = createFileRoute("/_authenticated/my-style-guide")({
  head: () => ({
    meta: [
      { title: "My Style Guide — LiveAskew" },
      { name: "description", content: "Your personalized LiveAskew style guide." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: MyStyleGuidePage,
});

function MyStyleGuidePage() {
  const fetchGuide = useServerFn(getMyStyleGuide);
  const fetchToken = useServerFn(getMyShareToken);
  const runBackfill = useServerFn(backfillMyStyleFromBee);
  const fetchIsAdmin = useServerFn(checkIsAdmin);
  // runIllustrations removed: per-plate runner lives below.
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["my-style-guide"],
    queryFn: () => fetchGuide(),
  });
  const tokenQuery = useQuery({
    queryKey: ["my-style-guide", "share-token"],
    queryFn: () => fetchToken(),
    enabled: !!data?.hasSubscription,
  });
  const adminQuery = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => fetchIsAdmin(),
    staleTime: 5 * 60 * 1000,
  });
  const tierQuery = useQuery({
    queryKey: ["resolved-tier"],
    queryFn: () => loadResolvedTier(),
    staleTime: 5 * 60 * 1000,
  });
  const isAdmin = Boolean(adminQuery.data?.isAdmin) || import.meta.env.DEV;

  // One-shot backfill: if the guide is empty but the user has Bee history,
  // pull existing transcripts through the extractor so the page populates
  // without making them re-chat.
  const backfillTried = useRef(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillError, setBackfillError] = useState<string | null>(null);
  const [backfillResult, setBackfillResult] = useState<{
    messageCount: number;
    onboardingCount: number;
    styleProfileSaved: boolean;
  } | null>(null);
  const executeBackfill = async () => {
    setBackfilling(true);
    setBackfillError(null);
    try {
      const res = await runBackfill({});
      if (res?.ran && res.ok) {
        setBackfillResult({
          messageCount: res.messageCount,
          onboardingCount: res.onboardingCount ?? 0,
          styleProfileSaved: res.styleProfileSaved ?? false,
        });
        await queryClient.invalidateQueries({ queryKey: ["my-style-guide"] });
      } else if (res && !res.ran && res.ok) {
        // Nothing to backfill (e.g. not enough history) — still refresh.
        setBackfillResult({
          messageCount: res.messageCount,
          onboardingCount: 0,
          styleProfileSaved: false,
        });
        await queryClient.invalidateQueries({ queryKey: ["my-style-guide"] });
      } else {
        setBackfillError(res?.reason ?? "Backfill failed");
      }
    } catch (err) {
      setBackfillError(err instanceof Error ? err.message : "Backfill failed");
    } finally {
      setBackfilling(false);
    }
  };

  useEffect(() => {
    if (!data || backfillTried.current || backfillError) return;
    const empty =
      !data.styleProfile?.north_star &&
      !(data.styleProfile?.color_palette && data.styleProfile.color_palette.length) &&
      data.onboarding.length === 0;
    if (!empty || !data.hasSubscription) return;
    backfillTried.current = true;
    void executeBackfill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, backfillError]);

  const retryBackfill = () => {
    backfillTried.current = false;
    setBackfillError(null);
    setBackfillResult(null);
  };

  const rerunBackfill = () => {
    backfillTried.current = true;
    void executeBackfill();
  };

  // 30-Day Guide generation pipeline. Runs sequentially on the client so we
  // can show real progress per step (hero 1/8 text, hero 1/8 image, …).
  const looksTried = useRef(false);
  const [looksError, setLooksError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const fetchStatus = useServerFn(getLooksStatus);
  const runHero = useServerFn(generateOneHero);
  const runVariations = useServerFn(generateHeroVariations);
  const runRotation = useServerFn(generateRotation);
  const runIllustration = useServerFn(generateLookIllustration);
  const reset = useServerFn(resetLooks);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["my-style-guide"] });

  const runFullPipeline = async (opts: { reset?: boolean } = {}) => {
    setGenerating(true);
    setLooksError(null);
    const errors: string[] = [];
    try {
      if (opts.reset) {
        await reset();
        await refresh();
      }
      // 1. 8 hero looks (text only, one at a time)
      const status0 = await fetchStatus();
      for (const idx of status0.missingHeroes) {
        setStatusLabel(`Composing look ${idx}/${HERO_COUNT}…`);
        try {
          const r = await runHero({ data: { index: idx } });
          if (!r.ok) errors.push(`look ${idx}: ${r.error}`);
        } catch (err) {
          errors.push(`look ${idx}: ${err instanceof Error ? err.message : String(err)}`);
        }
        await refresh();
      }
      // 2. Variations
      const status1 = await fetchStatus();
      for (let i = 0; i < status1.missingVariations.length; i += 1) {
        const heroId = status1.missingVariations[i];
        setStatusLabel(`Drafting variations ${i + 1}/${status1.missingVariations.length}…`);
        try {
          const r = await runVariations({ data: { heroId } });
          if (!r.ok) errors.push(`${heroId} vars: ${r.error}`);
        } catch (err) {
          errors.push(`${heroId} vars: ${err instanceof Error ? err.message : String(err)}`);
        }
        await refresh();
      }
      // 3. Rotation
      const status2 = await fetchStatus();
      if (!status2.hasRotation) {
        setStatusLabel("Laying out the 30-day rotation…");
        try {
          await runRotation();
        } catch (err) {
          errors.push(`rotation: ${err instanceof Error ? err.message : String(err)}`);
        }
        await refresh();
      }
      // 4. Cover illustration
      const status3 = await fetchStatus();
      if (!status3.hasCover) {
        setStatusLabel("Illustrating the cover…");
        try {
          const r = await runIllustration({ data: { target: "cover" } });
          if (!r.ok) errors.push(`cover: ${"error" in r ? r.error : r.entry?.error ?? "failed"}`);
        } catch (err) {
          errors.push(`cover: ${err instanceof Error ? err.message : String(err)}`);
        }
        await refresh();
      }
      // 5. Hero illustrations
      const status4 = await fetchStatus();
      for (let i = 0; i < status4.missingIllustrations.length; i += 1) {
        const heroId = status4.missingIllustrations[i];
        setStatusLabel(
          `Illustrating ${heroId} (${i + 1}/${status4.missingIllustrations.length})…`,
        );
        try {
          const r = await runIllustration({ data: { target: heroId } });
          if (!r.ok)
            errors.push(`${heroId}: ${"error" in r ? r.error : r.entry?.error ?? "failed"}`);
        } catch (err) {
          errors.push(`${heroId}: ${err instanceof Error ? err.message : String(err)}`);
        }
        await refresh();
      }
    } finally {
      setStatusLabel(null);
      setGenerating(false);
      if (errors.length) setLooksError(errors.join(" · "));
    }
  };

  useEffect(() => {
    if (!data?.hasSubscription || looksTried.current || generating) return;
    const palette = data.styleProfile?.color_palette;
    const hasPalette = Array.isArray(palette) && palette.length > 0;
    if (!hasPalette) return;
    const looks = data.styleProfile?.looks;
    const heroCount = looks?.heroes?.length ?? 0;
    const varCount = looks?.variations?.length ?? 0;
    const rotationOk = (looks?.rotation?.length ?? 0) === 30;
    const coverOk = looks?.cover?.status === "success";
    const heroImgOk = (looks?.heroes ?? []).every((h) => h.illustration?.status === "success");
    if (heroCount === HERO_COUNT && varCount >= HERO_COUNT * 2 && rotationOk && coverOk && heroImgOk) {
      return;
    }
    looksTried.current = true;
    void runFullPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const regenerateAll = () => {
    looksTried.current = true;
    void runFullPipeline({ reset: true });
  };
  const continueMissing = () => {
    looksTried.current = true;
    void runFullPipeline();
  };

  const heroCount = data?.styleProfile?.looks?.heroes?.length ?? 0;




  if (isLoading) {
    return (
      <StyleGuideShell current="/my-style-guide">
        <p className="eyebrow text-ink/50">Loading your guide…</p>
      </StyleGuideShell>
    );
  }
  if (backfilling) {
    return (
      <StyleGuideShell current="/my-style-guide">
        <BackfillStatus />
      </StyleGuideShell>
    );
  }
  if (backfillError) {
    return (
      <StyleGuideShell current="/my-style-guide">
        <div className="mx-auto max-w-xl py-12 text-center">
          <p className="eyebrow text-ink/50 mb-3">Style guide</p>
          <h2 className="font-serif text-2xl text-ink mb-4">
            Bee couldn't finish reading your story.
          </h2>
          <p className="text-sm text-ink/60 mb-8 max-w-xs mx-auto leading-relaxed">
            {backfillError}
          </p>
          <button
            type="button"
            onClick={retryBackfill}
            className="inline-flex items-center px-8 py-4 bg-ink text-cream text-sm tracking-[0.22em] uppercase hover:bg-ink/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </StyleGuideShell>
    );
  }
  if (error || !data) {
    return (
      <StyleGuideShell current="/my-style-guide">
        <p className="text-ink/70">We couldn't load your guide. Try again in a moment.</p>
      </StyleGuideShell>
    );
  }
  if (!data.hasSubscription) return <Paywall />;

  return (
    <>
      {isAdmin ? (
        <>
          <BackfillSummary
            backfillResult={backfillResult}
            currentOnboarding={data.onboarding.length}
            hasStyleProfile={Boolean(data.styleProfile)}
          />
          <FieldDiagnostics
            onboarding={data.onboarding}
            styleProfile={data.styleProfile as Record<string, unknown> | null | undefined}
            onRetry={rerunBackfill}
            retrying={backfilling}
          />
        </>
      ) : null}
      <SelfieHero tier={tierQuery.data ?? null} data={data} />
      <PaletteExplainer palette={data.styleProfile?.color_palette} />
      <MagazineSpread
        data={data}
        generationStatus={isAdmin ? statusLabel : null}
        toolbar={
          <OwnerToolbar
            token={tokenQuery.data?.token ?? null}
            onRegenerateAll={regenerateAll}
            onContinueMissing={continueMissing}
            running={generating}
            error={looksError}
            heroCount={heroCount}
            statusLabel={statusLabel}
            showOwnerControls={isAdmin}
          />
        }
      />

    </>
  );
}

const QUESTION_CATALOG: Array<{ id: string; label: string }> = [
  { id: "q1_pillar_priority", label: "Q1 · Pillar priority" },
  { id: "q2_cultural_lineage", label: "Q2 · Cultural lineage" },
  { id: "q3_journey_stage", label: "Q3 · Journey stage" },
  { id: "q4_silhouette", label: "Q4 · Silhouette" },
  { id: "q5_palette", label: "Q5 · Palette" },
  { id: "q6_fabric_preference", label: "Q6 · Fabric preference" },
  { id: "q7_closet_state", label: "Q7 · Closet state" },
  { id: "q8_lifestyle", label: "Q8 · Lifestyle" },
  { id: "q9_hardest_moments", label: "Q9 · Hardest moments" },
  { id: "q10_keep_line", label: "Q10 · Keep line" },
];

type OnboardingRow = {
  question_id: string | null;
  choice?: string | null;
  note?: string | null;
};

function FieldDiagnostics({
  onboarding,
  styleProfile,
  onRetry,
  retrying,
}: {
  onboarding: Array<OnboardingRow> | undefined;
  styleProfile: Record<string, unknown> | null | undefined;
  onRetry: () => void;
  retrying: boolean;
}) {
  const rows = onboarding ?? [];
  const byQuestion = new Map<string, OnboardingRow>();
  for (const r of rows) if (r.question_id) byQuestion.set(r.question_id, r);

  const palette = (styleProfile?.color_palette as unknown[] | null) ?? null;
  const pillarWeights = (styleProfile?.pillar_weights as Record<string, unknown> | null) ?? null;
  const lifestyleMix = (styleProfile?.lifestyle_mix as Record<string, unknown> | null) ?? null;
  const colorSeason = styleProfile?.color_season as string | null | undefined;
  const northStar = styleProfile?.north_star as string | null | undefined;

  const profileFields: Array<{ label: string; saved: boolean; detail: string }> = [
    {
      label: "color_palette",
      saved: Array.isArray(palette) && palette.length > 0,
      detail: Array.isArray(palette) ? `${palette.length} swatch${palette.length === 1 ? "" : "es"}` : "—",
    },
    {
      label: "color_season",
      saved: !!colorSeason,
      detail: colorSeason ?? "—",
    },
    {
      label: "pillar_weights",
      saved: !!pillarWeights && Object.keys(pillarWeights).length > 0,
      detail: pillarWeights ? Object.keys(pillarWeights).join(", ") || "—" : "—",
    },
    {
      label: "lifestyle_mix",
      saved: !!lifestyleMix && Object.keys(lifestyleMix).length > 0,
      detail: lifestyleMix ? Object.keys(lifestyleMix).join(", ") || "—" : "—",
    },
    {
      label: "north_star",
      saved: !!northStar,
      detail: northStar ? `${northStar.slice(0, 60)}${northStar.length > 60 ? "…" : ""}` : "—",
    },
  ];

  const answeredCount = QUESTION_CATALOG.filter((q) => byQuestion.has(q.id)).length;
  const savedFieldCount = profileFields.filter((f) => f.saved).length;

  return (
    <div className="max-w-5xl mx-auto px-6 pt-4">
      <details className="border hairline bg-bone/40 p-4" open>
        <summary className="cursor-pointer eyebrow text-ink/60 select-none flex items-center justify-between gap-3">
          <span>
            Field diagnostics · {answeredCount}/{QUESTION_CATALOG.length} onboarding · {savedFieldCount}/{profileFields.length} style profile fields
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!retrying) onRetry();
            }}
            disabled={retrying}
            className="px-3 py-1.5 text-[10px] tracking-[0.22em] uppercase border hairline hover:bg-ink hover:text-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {retrying ? "Rerunning…" : "Retry backfill"}
          </button>
        </summary>


        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-ink/50 mb-2">
              Onboarding answers (per question)
            </p>
            <ul className="space-y-1.5 text-sm">
              {QUESTION_CATALOG.map((q) => {
                const row = byQuestion.get(q.id);
                const has = !!row;
                const count = has ? 1 : 0;
                return (
                  <li key={q.id} className="flex items-start gap-2">
                    <span
                      className={`mt-1 inline-block h-2 w-2 rounded-full shrink-0 ${has ? "bg-ink" : "bg-ink/20"}`}
                      aria-hidden
                    />
                    <span className="flex-1">
                      <span className="text-ink">{q.label}</span>
                      <span className="text-ink/50"> · {count} value{count === 1 ? "" : "s"}</span>
                      {has && row?.choice ? (
                        <span className="block text-xs text-ink/60 mt-0.5">
                          choice: <span className="text-ink/80">{row.choice}</span>
                          {row.note ? <span className="text-ink/40"> · note ✓</span> : null}
                        </span>
                      ) : (
                        <span className="block text-xs text-ink/40 mt-0.5">no value extracted</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-ink/50 mb-2">
              Style profile (per field)
            </p>
            <ul className="space-y-1.5 text-sm">
              {profileFields.map((f) => (
                <li key={f.label} className="flex items-start gap-2">
                  <span
                    className={`mt-1 inline-block h-2 w-2 rounded-full shrink-0 ${f.saved ? "bg-ink" : "bg-ink/20"}`}
                    aria-hidden
                  />
                  <span className="flex-1">
                    <span className="text-ink font-mono text-xs">{f.label}</span>
                    <span className="text-ink/50"> · {f.saved ? "saved" : "not saved"}</span>
                    <span className="block text-xs text-ink/60 mt-0.5">{f.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </details>
    </div>
  );
}

function BackfillSummary({
  backfillResult,
  currentOnboarding,
  hasStyleProfile,
}: {
  backfillResult: { messageCount: number; onboardingCount: number; styleProfileSaved: boolean } | null;
  currentOnboarding: number;
  hasStyleProfile: boolean;
}) {
  return (
    <div className="max-w-5xl mx-auto px-6 pt-6">
      <div className="border hairline p-4 bg-bone/40">
        <p className="eyebrow text-ink/50 mb-2">Diagnostics</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-ink/50 block text-xs uppercase tracking-wider">Database rows</span>
            <span className="text-ink">
              Onboarding: {currentOnboarding} row{currentOnboarding === 1 ? "" : "s"} · Style profile: {hasStyleProfile ? "yes" : "no"}
            </span>
          </div>
          {backfillResult ? (
            <>
              <div>
                <span className="text-ink/50 block text-xs uppercase tracking-wider">Messages scanned</span>
                <span className="text-ink">{backfillResult.messageCount}</span>
              </div>
              <div>
                <span className="text-ink/50 block text-xs uppercase tracking-wider">Extracted</span>
                <span className="text-ink">
                  {backfillResult.onboardingCount} answer{backfillResult.onboardingCount === 1 ? "" : "s"} · Style profile: {backfillResult.styleProfileSaved ? "saved" : "none"}
                </span>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <span className="text-ink/50 block text-xs uppercase tracking-wider">Backfill</span>
              <span className="text-ink/60">Not run yet (guide already had data or no Bee history)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BackfillStatus() {
  const steps = [
    "Reading your conversation with Bee",
    "Extracting your style answers",
    "Composing your palette and north star",
    "Laying out your guide",
  ];
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const stepTimer = setInterval(
      () => setStepIdx((i) => (i < steps.length - 1 ? i + 1 : i)),
      2200,
    );
    const tick = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      clearInterval(stepTimer);
      clearInterval(tick);
    };
  }, [steps.length]);
  const pct = Math.min(95, 15 + stepIdx * 25 + Math.min(15, elapsed));

  return (
    <div className="mx-auto max-w-xl py-12">
      <p className="eyebrow text-ink/50 mb-3">Building your style guide</p>
      <h2 className="font-serif text-2xl text-ink mb-6">
        Bee is reading your story…
      </h2>
      <div
        className="h-1.5 w-full rounded-full bg-ink/10 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-ink transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="mt-6 space-y-2">
        {steps.map((label, i) => {
          const done = i < stepIdx;
          const active = i === stepIdx;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 text-sm transition-opacity ${
                done || active ? "opacity-100" : "opacity-40"
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                  done
                    ? "bg-ink text-bg border-ink"
                    : active
                      ? "border-ink text-ink animate-pulse"
                      : "border-ink/30 text-ink/40"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className="text-ink/80">{label}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-xs text-ink/40">
        Takes about 15–30 seconds. Don't close this tab.
      </p>
    </div>
  );
}

function OwnerToolbar({
  token,
  onRegenerateAll,
  onContinueMissing,
  running,
  error,
  heroCount,
  statusLabel,
  showOwnerControls = false,
}: {
  token: string | null;
  onRegenerateAll: () => void;
  onContinueMissing: () => void;
  running: boolean;
  error: string | null;
  heroCount: number;
  statusLabel: string | null;
  showOwnerControls?: boolean;
}) {
  const qc = useQueryClient();
  const rotate = useServerFn(rotateShareToken);
  const revoke = useServerFn(revokeShareToken);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const rotateMutation = useMutation({
    mutationFn: () => rotate(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-style-guide", "share-token"] }),
  });
  const revokeMutation = useMutation({
    mutationFn: () => revoke(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-style-guide", "share-token"] }),
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = token ? `${origin}/share/style-guide/${token}` : "";

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <>
      {showOwnerControls && running && statusLabel ? (
        <span
          className="px-3 py-2 bg-bone text-ink/70 border hairline italic font-display text-sm"
          aria-live="polite"
        >
          {statusLabel}
        </span>
      ) : null}
      {showOwnerControls ? (
        <>
          <button
            type="button"
            onClick={onRegenerateAll}
            disabled={running}
            title={error ?? `${heroCount}/8 hero looks`}
            className="px-4 py-2 text-[11px] tracking-[0.24em] uppercase border hairline hover:bg-ink hover:text-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running ? "Generating…" : heroCount > 0 ? "Regenerate guide" : "Generate guide"}
          </button>
          {!running && heroCount > 0 && heroCount < 8 ? (
            <button
              type="button"
              onClick={onContinueMissing}
              className="px-4 py-2 text-[11px] tracking-[0.24em] uppercase border hairline hover:bg-ink hover:text-cream transition-colors"
              title="Resume any missing looks, variations, or illustrations"
            >
              Continue ({8 - heroCount} left)
            </button>
          ) : null}
        </>
      ) : null}



      <button
        type="button"
        onClick={() => window.print()}
        className="px-4 py-2 text-[11px] tracking-[0.24em] uppercase border hairline hover:bg-ink hover:text-cream transition-colors"
      >
        Download PDF
      </button>
      <button
        type="button"
        onClick={() => setShowShare(true)}
        className="px-4 py-2 text-[11px] tracking-[0.24em] uppercase bg-ink text-cream hover:bg-ink/90 transition-colors"
      >
        Share
      </button>

      {showShare && (
        <div
          className="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowShare(false)}
        >
          <div
            className="bg-cream max-w-lg w-full p-8 border hairline"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow mb-3">Share preview</p>
            <h3 className="font-display text-3xl leading-tight mb-4">
              A private link to your guide.
            </h3>
            <p className="text-sm text-ink/65 mb-6 leading-relaxed">
              Anyone with the link can view your style guide without signing in.
              Rotate it any time to invalidate the old link.
            </p>

            {token ? (
              <>
                <div className="flex items-stretch border hairline mb-4">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-3 font-mono text-xs bg-bone text-ink/80 truncate"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className="px-4 text-[11px] tracking-[0.22em] uppercase bg-ink text-cream"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => rotateMutation.mutate()}
                    disabled={rotateMutation.isPending}
                    className="px-4 py-2 text-[11px] tracking-[0.22em] uppercase border hairline"
                  >
                    {rotateMutation.isPending ? "Rotating…" : "Rotate link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => revokeMutation.mutate()}
                    disabled={revokeMutation.isPending}
                    className="px-4 py-2 text-[11px] tracking-[0.22em] uppercase text-ink/60 hover:text-ink"
                  >
                    {revokeMutation.isPending ? "Revoking…" : "Disable sharing"}
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => rotateMutation.mutate()}
                disabled={rotateMutation.isPending}
                className="px-5 py-3 text-[11px] tracking-[0.22em] uppercase bg-ink text-cream"
              >
                {rotateMutation.isPending ? "Generating…" : "Generate share link"}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowShare(false)}
              className="mt-6 text-xs tracking-[0.22em] uppercase text-ink/50 hover:text-ink"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Paywall() {
  return (
    <StyleGuideShell current="/my-style-guide">
      <PageTitle
        num="✦"
        eyebrow="Members only"
        title="Your guide is"
        italic="almost ready."
        intro="The personalized style guide unlocks with a free trial or paid membership. Start one to see your colors, silhouettes, and editorial direction rendered just for you."
      />
      <div className="flex flex-wrap gap-4">
        <Link
          to="/pricing"
          className="inline-flex items-center px-8 py-4 bg-ink text-cream text-sm tracking-[0.22em] uppercase hover:bg-ink/90 transition-colors"
        >
          Start free trial
        </Link>
        <Link
          to="/style-guide"
          className="inline-flex items-center px-8 py-4 border hairline text-sm tracking-[0.22em] uppercase hover:bg-bone transition-colors"
        >
          Preview the framework
        </Link>
      </div>
    </StyleGuideShell>
  );
}

function PaletteExplainer({ palette: raw }: { palette?: unknown }) {
  const palette = parsePalette(raw);
  const accent = palette?.primary ?? "var(--gold-deep)";
  const soft = palette?.soft ?? "color-mix(in oklab, var(--gold) 30%, transparent)";

  return (
    <section className="mx-auto max-w-5xl px-6 pt-10 pb-4 md:pt-14">
      <div
        className="border p-8 md:p-12"
        style={{
          borderColor: soft,
          background: `color-mix(in oklab, ${accent} 4%, var(--cream))`,
        }}
      >
        <p className="eyebrow" style={{ color: accent }}>
          Your palette
        </p>
        <h2 className="font-display mt-3 text-2xl leading-tight md:text-3xl">
          The colors Bee pulled for you<span style={{ color: accent }}>.</span>
        </h2>

        {palette ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {palette.swatches.map((c, i) => (
              <span
                key={i}
                className="inline-block h-8 w-8 rounded-full"
                style={{
                  background: c,
                  boxShadow:
                    "0 0 0 1px color-mix(in oklab, var(--ink) 12%, transparent)",
                }}
                title={c}
              />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-ink/60">
            Finish your conversation with Bee and your palette will land here.
          </p>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <ExplainerBlock
            label="On your dashboard"
            body="Reveal your palette and these tones take over borders, eyebrows and small accents — the cream and ink stay put, so the studio still feels like LiveAskew, just tuned to you."
            accent={accent}
          />
          <ExplainerBlock
            label="Inside your guide"
            body="Every look Bee composes leans on these colors first. Your rotation, your hero looks, and your shoppable manifests all reference this palette."
            accent={accent}
          />
          <ExplainerBlock
            label="What it never touches"
            body="Photography, editorial typography, and the magazine layout stay in the house voice. Your palette accents the frame — it doesn't repaint the room."
            accent={accent}
          />
        </div>

        <div className="mt-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] hover:opacity-70"
            style={{ color: accent, borderBottom: `1px solid ${accent}` }}
          >
            Reveal it on your dashboard →
          </Link>
        </div>
      </div>
    </section>
  );
}

function ExplainerBlock({
  label,
  body,
  accent,
}: {
  label: string;
  body: string;
  accent: string;
}) {
  return (
    <div>
      <p
        className="text-[0.65rem] uppercase tracking-[0.28em]"
        style={{ color: accent }}
      >
        {label}
      </p>
      <span
        className="mt-3 inline-block h-px w-8"
        style={{ background: accent }}
      />
      <p className="mt-3 text-sm leading-relaxed text-ink/70">{body}</p>
    </div>
  );
}
