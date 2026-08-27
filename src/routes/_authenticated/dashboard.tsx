import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Lock, ArrowUpRight, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  hasEntitlement,
  loadResolvedTier,
  PLANS,
  type Entitlement,
  type PlanSlug,
} from "@/lib/plans";
import { parsePalette, type PaletteAccents } from "@/lib/palette";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Your Dashboard — LiveAskew" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

type ProfileRow = {
  display_name: string | null;
  client_code: string | null;
  selfie_photo_path: string | null;
  tier: string | null;
  dashboard_theme: string | null;
};

type Capability = {
  key: Entitlement;
  title: string;
  description: string;
  href: string;
};

const TIER_ORDER: PlanSlug[] = [
  "silver",
  "gold",
  "platinum",
  "platinum_plus",
  "platinum_plus_family",
  "atelier",
];

const CAPABILITIES: Capability[] = [
  { key: "beeChat", title: "Talk to Bee", description: "Your stylist in conversation, day or night.", href: "/chat" },
  { key: "wardrobe", title: "Your Wardrobe", description: "Every piece you own, catalogued and ready.", href: "/wardrobe" },
  { key: "calendar", title: "Dressing Calendar", description: "Bee dresses you for what's actually on your week.", href: "/calendar" },
  { key: "styleProfile", title: "Style Profile", description: "The blueprint Bee styles you from.", href: "/profile" },
  { key: "selfieAI", title: "Selfie AI", description: "See yourself modeled in every look.", href: "/profile" },
  { key: "monthlyMagazine", title: "Monthly Magazine", description: "Eight editorial spreads, made for you.", href: "/my-style-guide" },
  { key: "beeVoice", title: "Bee's Voice", description: "Talk out loud. She talks back.", href: "/chat" },
  { key: "thumbsFeedback", title: "Thumbs Feedback", description: "Teach Bee your taste, look by look.", href: "/chat" },
  { key: "shoppableManifests", title: "Shoppable Looks", description: "Every look, buyable end-to-end.", href: "/my-style-guide" },
  { key: "priorityGeneration", title: "Priority Generation", description: "Front of the queue on every render.", href: "/my-style-guide" },
  { key: "householdPartnerSeat", title: "Household Seats", description: "Add partner and family. Their Bee, their face.", href: "/household" },
  { key: "quarterlyStylistSession", title: "Session with Bianca", description: "A quarterly hour with your stylist.", href: "/inquiry" },
];

function minUnlockingTier(key: Entitlement): PlanSlug | null {
  for (const slug of TIER_ORDER) {
    if (hasEntitlement(slug, key)) return slug;
  }
  return null;
}

function tierDisplayName(slug: PlanSlug | null): string {
  if (!slug) return "Atelier";
  return PLANS.find((p) => p.slug === slug)?.name ?? slug;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [palette, setPalette] = useState<PaletteAccents | null>(null);
  const [theme, setTheme] = useState<"default" | "revealed">("default");
  const [revealing, setRevealing] = useState(false);
  const [saving, setSaving] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [{ data: userRes }, resolved] = await Promise.all([
          supabase.auth.getUser(),
          loadResolvedTier(),
        ]);
        if (!active) return;
        setTier(resolved);
        if (userRes.user) {
          userIdRef.current = userRes.user.id;
          const [{ data: p }, { data: sp }] = await Promise.all([
            supabase
              .from("profiles")
              .select("display_name, client_code, selfie_photo_path, tier, dashboard_theme")
              .eq("id", userRes.user.id)
              .maybeSingle(),
            supabase
              .from("style_profiles")
              .select("color_palette")
              .eq("user_id", userRes.user.id)
              .maybeSingle(),
          ]);
          if (!active) return;
          const prof = (p as ProfileRow | null) ?? null;
          setProfile(prof);
          const initialTheme = prof?.dashboard_theme === "revealed" ? "revealed" : "default";
          setTheme(initialTheme);
          setPalette(parsePalette((sp as { color_palette?: unknown } | null)?.color_palette));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const hasSelfieAccess = hasEntitlement(tier, "selfieAI");
  const selfieUploaded = Boolean(profile?.selfie_photo_path);

  const heroKey: Entitlement = !hasSelfieAccess
    ? "selfieAI"
    : selfieUploaded
      ? "monthlyMagazine"
      : "selfieAI";

  const heroCap = CAPABILITIES.find((c) => c.key === heroKey)!;
  const restCaps = CAPABILITIES.filter((c) => c.key !== heroKey);

  const persistTheme = async (next: "default" | "revealed") => {
    if (!userIdRef.current) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ dashboard_theme: next })
        .eq("id", userIdRef.current);
    } finally {
      setSaving(false);
    }
  };

  const onReveal = async () => {
    if (!palette || revealing) return;
    const reduced = prefersReducedMotion();
    if (reduced) {
      setTheme("revealed");
      void persistTheme("revealed");
      return;
    }
    setRevealing(true);
    setTheme("revealed");
    // Let the staggered animation play; then persist.
    window.setTimeout(() => {
      setRevealing(false);
      void persistTheme("revealed");
    }, 1900);
  };

  const onRevert = () => {
    setTheme("default");
    void persistTheme("default");
  };

  // Accent CSS vars only apply when revealed; otherwise vars are undefined
  // and every accent falls back to the house gold (see inline fallbacks).
  const themeVars = useMemo<React.CSSProperties>(() => {
    if (theme !== "revealed" || !palette) return {};
    return {
      // Scoped custom props — never leak outside this wrapper.
      ["--client-accent" as string]: palette.primary,
      ["--client-accent-soft" as string]: palette.soft,
      ["--client-accent-2" as string]: palette.secondary,
    };
  }, [theme, palette]);

  const revealed = theme === "revealed";
  const accent = revealed ? "var(--client-accent, var(--gold-deep))" : "var(--gold-deep)";
  const accentSoft = revealed ? "var(--client-accent-soft, var(--gold-soft))" : "var(--gold-soft)";

  return (
    <main
      className="min-h-screen dashboard-scope"
      style={{ background: "var(--cream)", color: "var(--ink)", ...themeVars }}
      data-theme={theme}
      data-revealing={revealing ? "true" : "false"}
    >
      <style>{revealCss}</style>
      <header
        className="flex items-center justify-between px-6 py-6 md:px-12 dash-rule"
        style={{ borderBottom: `1px solid ${revealed ? accentSoft : "color-mix(in oklab, var(--ink) 10%, transparent)"}` }}
      >
        <div>
          <p className="eyebrow" style={{ color: accent }}>
            Member · {profile?.client_code ?? "LA-————"}
          </p>
          <div className="font-display mt-1 text-lg">
            LiveAskew<span style={{ color: accent }}>.</span>
          </div>
        </div>
        <nav className="flex items-center gap-6 text-[0.65rem] uppercase tracking-[0.25em]">
          <Link to="/profile" className="hover:opacity-70">Profile</Link>
          <Link to="/pricing" className="hover:opacity-70">Plan</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-[1400px] px-6 py-16 md:px-12 md:py-24">
        <p className="eyebrow" style={{ color: accent }}>Welcome back</p>
        <h1 className="font-display mt-4 text-4xl leading-[1.05] md:text-6xl">
          {profile?.display_name ? (
            <>
              {profile.display_name}
              <span style={{ color: accent }}>.</span>
            </>
          ) : (
            <>Your studio<span style={{ color: accent }}>.</span></>
          )}
        </h1>
        <span className="mt-8 inline-block h-px w-16" style={{ background: accent }} />
        <p className="mt-6 max-w-xl text-sm" style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
          Every capability of LiveAskew, arranged for you. What's active is yours today. What isn't, is what's ahead.
        </p>

        {loading ? (
          <div className="mt-16 flex items-center gap-2 text-sm" style={{ color: "color-mix(in oklab, var(--ink) 55%, transparent)" }}>
            <Loader2 size={14} className="animate-spin" /> Loading your studio…
          </div>
        ) : (
          <>
            <RevealControl
              palette={palette}
              selfieUploaded={selfieUploaded}
              theme={theme}
              saving={saving}
              onReveal={onReveal}
              onRevert={onRevert}
              accent={accent}
            />

            {revealed && (
              <div className="mt-8">
                <Link
                  to="/my-style-guide"
                  className="pulse-cta inline-flex items-center gap-3 px-8 py-4 text-[0.7rem] uppercase tracking-[0.3em]"
                  style={{
                    border: `1px solid ${accent}`,
                    color: accent,
                    background: `color-mix(in oklab, ${revealed ? "var(--client-accent, var(--gold))" : "var(--gold)"} 6%, var(--cream))`,
                  }}
                >
                  <Sparkles size={14} /> View Your Style Guide <ArrowUpRight size={14} />
                </Link>
              </div>
            )}

            <div className="mt-14">
              <HeroCard
                capability={heroCap}
                tier={tier}
                selfieUploaded={selfieUploaded}
                accent={accent}
                accentSoft={accentSoft}
                revealed={revealed}
              />
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {restCaps.map((cap, i) => (
                <CapabilityCard
                  key={cap.key}
                  capability={cap}
                  tier={tier}
                  index={i}
                  accent={accent}
                  accentSoft={accentSoft}
                  revealed={revealed}
                  revealing={revealing}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function RevealControl({
  palette,
  selfieUploaded,
  theme,
  saving,
  onReveal,
  onRevert,
  accent,
}: {
  palette: PaletteAccents | null;
  selfieUploaded: boolean;
  theme: "default" | "revealed";
  saving: boolean;
  onReveal: () => void;
  onRevert: () => void;
  accent: string;
}) {
  const wrap = "mt-14 flex flex-wrap items-center gap-4";

  if (!selfieUploaded) {
    return (
      <div className={wrap}>
        <Link
          to="/profile"
          className="text-[0.7rem] uppercase tracking-[0.28em] hover:opacity-70"
          style={{ color: accent, borderBottom: `1px solid ${accent}` }}
        >
          Add your photo to bring your dashboard to life →
        </Link>
      </div>
    );
  }

  if (!palette) {
    return (
      <div className={wrap}>
        <Link
          to="/chat"
          className="text-[0.7rem] uppercase tracking-[0.28em] hover:opacity-70"
          style={{ color: accent, borderBottom: `1px solid ${accent}` }}
        >
          Finish your style chat with Bee to unlock your palette →
        </Link>
      </div>
    );
  }

  if (theme === "revealed") {
    return (
      <div className={wrap}>
        <div className="flex items-center gap-2">
          {palette.swatches.slice(0, 5).map((c, i) => (
            <span
              key={i}
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: c, boxShadow: "0 0 0 1px color-mix(in oklab, var(--ink) 15%, transparent)" }}
            />
          ))}
        </div>
        <button
          onClick={onRevert}
          disabled={saving}
          className="text-[0.65rem] uppercase tracking-[0.28em] hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ color: "color-mix(in oklab, var(--ink) 55%, transparent)" }}
        >
          Revert to classic
        </button>
        <SavingIndicator saving={saving} accent={accent} />
      </div>
    );
  }

  return (
    <div className={wrap}>
      <button
        onClick={onReveal}
        disabled={saving}
        className="inline-flex items-center gap-3 border px-6 py-3 text-[0.7rem] uppercase tracking-[0.3em] transition-colors hover:bg-[color-mix(in_oklab,var(--gold)_6%,var(--cream))] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ borderColor: accent, color: accent }}
      >
        ✦ Reveal my palette
      </button>
      <div className="flex items-center gap-1.5">
        {palette.swatches.slice(0, 5).map((c, i) => (
          <span
            key={i}
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: c, opacity: 0.85 }}
          />
        ))}
      </div>
      <SavingIndicator saving={saving} accent={accent} />
    </div>
  );
}

function SavingIndicator({ saving, accent }: { saving: boolean; accent: string }) {
  if (!saving) return null;
  return (
    <span
      className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.28em]"
      style={{ color: accent }}
      role="status"
      aria-live="polite"
    >
      <Loader2 size={12} className="animate-spin" />
      Saving
    </span>
  );
}

function HeroCard({
  capability,
  tier,
  selfieUploaded,
  accent,
  accentSoft,
  revealed,
}: {
  capability: Capability;
  tier: string | null;
  selfieUploaded: boolean;
  accent: string;
  accentSoft: string;
  revealed: boolean;
}) {
  const active = hasEntitlement(tier, capability.key);
  const unlockTier = minUnlockingTier(capability.key);
  const isSelfie = capability.key === "selfieAI";
  const selfieConfirmed = isSelfie && active && selfieUploaded;

  if (selfieConfirmed) {
    return (
      <Link
        to={capability.href}
        className="flex items-center justify-between border px-8 py-6 transition-colors accent-border"
        style={{
          borderColor: accentSoft,
          background: `color-mix(in oklab, ${revealed ? "var(--client-accent, var(--gold))" : "var(--gold)"} 8%, var(--cream))`,
        }}
      >
        <div className="flex items-center gap-4">
          <Check size={18} style={{ color: accent }} />
          <div>
            <p className="eyebrow" style={{ color: accent }}>Selfie AI</p>
            <p className="font-display mt-1 text-lg">Your face is set.</p>
          </div>
        </div>
        <ArrowUpRight size={18} style={{ color: "var(--ink)" }} />
      </Link>
    );
  }

  const startHere = isSelfie && active && !selfieUploaded;
  const eyebrow = startHere
    ? "Start here"
    : active
      ? "Next step"
      : `Unlock with ${tierDisplayName(unlockTier)}`;

  return (
    <Link
      to={active ? capability.href : "/pricing"}
      className="group relative block overflow-hidden border px-8 py-14 md:px-14 md:py-20 accent-border"
      style={{
        borderColor: active ? accent : accentSoft,
        background: active
          ? `color-mix(in oklab, ${revealed ? "var(--client-accent, var(--gold))" : "var(--gold)"} 6%, var(--cream))`
          : "var(--cream)",
      }}
    >
      <p className="eyebrow" style={{ color: accent }}>{eyebrow}</p>
      <h2 className="font-display mt-6 text-3xl leading-[1.05] md:text-5xl">
        {capability.title}
        <span style={{ color: accent }}>.</span>
      </h2>
      <p className="mt-6 max-w-xl text-sm md:text-base" style={{ color: "color-mix(in oklab, var(--ink) 65%, transparent)" }}>
        {capability.description}
      </p>
      <span className="mt-8 inline-block h-px w-12" style={{ background: accent }} />
      <div className="mt-10 inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em]">
        {active ? (
          <>Open <ArrowUpRight size={14} /></>
        ) : (
          <><Lock size={12} style={{ color: accent }} /> See {tierDisplayName(unlockTier)}</>
        )}
      </div>
    </Link>
  );
}

function CapabilityCard({
  capability,
  tier,
  index,
  accent,
  accentSoft,
  revealed,
  revealing,
}: {
  capability: Capability;
  tier: string | null;
  index: number;
  accent: string;
  accentSoft: string;
  revealed: boolean;
  revealing: boolean;
}) {
  const active = hasEntitlement(tier, capability.key);
  const unlockTier = minUnlockingTier(capability.key);

  return (
    <Link
      to={active ? capability.href : "/pricing"}
      className="card-accent group relative flex h-full flex-col justify-between border p-7 transition-colors"
      style={{
        borderColor: active ? accentSoft : "color-mix(in oklab, var(--ink) 10%, transparent)",
        background: active
          ? `color-mix(in oklab, ${revealed ? "var(--client-accent, var(--gold))" : "var(--gold)"} 4%, var(--cream))`
          : "color-mix(in oklab, var(--ink) 2%, var(--cream))",
        opacity: active ? 1 : 0.78,
        animationDelay: revealing ? `${index * 90}ms` : undefined,
      }}
      data-cascade={revealing ? "true" : "false"}
    >
      <div>
        <div className="flex items-center justify-between">
          <p
            className="eyebrow"
            style={{ color: active ? accent : "color-mix(in oklab, var(--ink) 45%, transparent)" }}
          >
            {active ? "Active" : "Locked"}
          </p>
          {active ? (
            <Check size={14} style={{ color: accent }} />
          ) : (
            <Lock size={12} style={{ color: accent }} />
          )}
        </div>
        <h3 className="font-display mt-4 text-xl leading-tight">{capability.title}</h3>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "color-mix(in oklab, var(--ink) 60%, transparent)" }}>
          {capability.description}
        </p>
      </div>
      <div className="mt-8 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.28em]">
        {active ? (
          <>Open <ArrowUpRight size={12} /></>
        ) : (
          <span style={{ color: accent }}>Unlock with {tierDisplayName(unlockTier)}</span>
        )}
      </div>
    </Link>
  );
}

// Scoped CSS: theme transitions, staggered cascade, and the pulsing CTA.
// prefers-reduced-motion strips all animation while keeping the themed state.
const revealCss = `
.dashboard-scope .card-accent,
.dashboard-scope .accent-border,
.dashboard-scope .dash-rule,
.dashboard-scope .eyebrow,
.dashboard-scope [style*="--client-accent"] {
  transition: border-color 700ms ease, background-color 700ms ease, color 700ms ease;
}
.dashboard-scope[data-revealing="true"] .card-accent[data-cascade="true"] {
  animation: dash-cascade 900ms ease both;
}
@keyframes dash-cascade {
  0%   { transform: translateY(6px); opacity: 0.55; }
  60%  { transform: translateY(0);   opacity: 1; }
  100% { transform: translateY(0);   opacity: 1; }
}
.dashboard-scope .pulse-cta {
  animation: dash-pulse 2.4s ease-in-out infinite;
}
@keyframes dash-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 color-mix(in oklab, var(--client-accent, var(--gold)) 40%, transparent);
  }
  50% {
    transform: scale(1.015);
    box-shadow: 0 0 0 10px color-mix(in oklab, var(--client-accent, var(--gold)) 0%, transparent);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dashboard-scope .card-accent,
  .dashboard-scope .accent-border,
  .dashboard-scope .dash-rule,
  .dashboard-scope .eyebrow,
  .dashboard-scope [style*="--client-accent"],
  .dashboard-scope .pulse-cta {
    transition: none !important;
    animation: none !important;
  }
}
`;
