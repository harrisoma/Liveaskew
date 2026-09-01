import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Lock,
  ArrowUpRight,
  Loader2,
  Sparkles,
  MessageCircle,
  Shirt,
  CalendarDays,
  UserRound,
  Camera,
  BookOpen,
  Mic,
  ThumbsUp,
  ShoppingBag,
  Zap,
  Users,
  Star,
  type LucideIcon,
} from "lucide-react";
import { BeeMark } from "@/components/BeeMark";
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
  icon: LucideIcon;
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
  { key: "beeChat", title: "Talk to Bee", description: "Your stylist in conversation, day or night.", href: "/chat", icon: MessageCircle },
  { key: "wardrobe", title: "Your Wardrobe", description: "Every piece you own, catalogued and ready.", href: "/wardrobe", icon: Shirt },
  { key: "calendar", title: "Dressing Calendar", description: "Bee dresses you for what's actually on your week.", href: "/calendar", icon: CalendarDays },
  { key: "styleProfile", title: "Style Profile", description: "The blueprint Bee styles you from.", href: "/profile", icon: UserRound },
  { key: "selfieAI", title: "Selfie AI", description: "See yourself modeled in every look.", href: "/profile", icon: Camera },
  { key: "monthlyMagazine", title: "Monthly Magazine", description: "Eight editorial spreads, made for you.", href: "/my-style-guide", icon: BookOpen },
  { key: "beeVoice", title: "Bee's Voice", description: "Talk out loud. She talks back.", href: "/chat", icon: Mic },
  { key: "thumbsFeedback", title: "Thumbs Feedback", description: "Teach Bee your taste, look by look.", href: "/chat", icon: ThumbsUp },
  { key: "shoppableManifests", title: "Shoppable Looks", description: "Every look, buyable end-to-end.", href: "/my-style-guide", icon: ShoppingBag },
  { key: "priorityGeneration", title: "Priority Generation", description: "Front of the queue on every render.", href: "/my-style-guide", icon: Zap },
  { key: "householdPartnerSeat", title: "Household Seats", description: "Add partner and family. Their Bee, their face.", href: "/household", icon: Users },
  { key: "quarterlyStylistSession", title: "Session with Bianca", description: "A quarterly hour with your stylist.", href: "/inquiry", icon: Star },
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
        <div className="flex items-center gap-2.5">
          <BeeMark className="h-6 w-6 shrink-0" style={{ color: accent }} />
          <div>
            <p className="text-[0.6rem] font-semibold tracking-[0.1em] uppercase" style={{ color: accent }}>
              Member · {profile?.client_code ?? "LA-————"}
            </p>
            <div className="font-display text-lg font-semibold leading-tight">
              Bee <span className="text-[0.5rem] font-semibold tracking-[0.1em] uppercase text-ink/40">by LiveAskew</span>
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link to="/profile" className="hover:opacity-70">Profile</Link>
          <Link to="/pricing" className="hover:opacity-70">Plan</Link>
        </nav>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[520px_1fr]">
        {/* Left — dark glass greeting */}
        <div className="relative overflow-hidden bg-ink px-8 py-14 text-cream md:px-12 lg:py-20">
          <div aria-hidden className="glass-glow -top-32 right-[-15%] h-[420px] w-[420px]" />
          <div className="relative">
            <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-cream/50">
              {greeting()}{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}
            </p>
            <h1 className="font-display mt-4 text-4xl leading-[1.1] md:text-5xl">
              Style that fits <span className="text-gold">your actual life.</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/65">
              Every capability of LiveAskew, arranged for you — what's active today, and what's ahead.
            </p>

            <div className="relative mt-12 flex pl-2">
              {MOODS.map((m, i) => {
                const rotations = [-9, -2, 4, 10];
                const shifts = [8, 0, 6, 14];
                return (
                  <Link
                    key={m.label}
                    to="/chat"
                    className="glass-card relative h-[180px] w-[118px] shrink-0 rounded-[22px] p-3.5"
                    style={{
                      marginLeft: i === 0 ? 0 : -38,
                      transform: `rotate(${rotations[i]}deg) translateY(${shifts[i]}px)`,
                      zIndex: 4 - i,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="text-cream">
                      {m.icon}
                    </svg>
                    <p className="font-display mt-auto pt-8 text-sm text-cream">{m.label}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — capabilities */}
        <div className="px-6 py-10 md:px-12 md:py-14">
          {loading ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "color-mix(in oklab, var(--ink) 55%, transparent)" }}>
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
                <div className="mt-6">
                  <Link
                    to="/my-style-guide"
                    className="pulse-cta inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-semibold"
                    style={{
                      color: accent,
                      background: `color-mix(in oklab, ${revealed ? "var(--client-accent, var(--gold))" : "var(--gold)"} 12%, var(--cream))`,
                      boxShadow: `0 10px 24px -12px color-mix(in oklab, ${accent} 45%, transparent)`,
                    }}
                  >
                    <Sparkles size={14} /> View Your Style Guide <ArrowUpRight size={14} />
                  </Link>
                </div>
              )}

              <div className="mt-8">
                <HeroCard
                  capability={heroCap}
                  tier={tier}
                  selfieUploaded={selfieUploaded}
                  accent={accent}
                  accentSoft={accentSoft}
                  revealed={revealed}
                />
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
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
        </div>
      </section>
    </main>
  );
}

const MOODS: { label: string; icon: React.ReactNode }[] = [
  { label: "Everyday", icon: <><circle cx="12" cy="12" r="4.5" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></> },
  { label: "Elevated", icon: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /> },
  { label: "Grounded", icon: <><path d="M20 4c-9 0-15 6-15 14 8 0 14-5 15-14z" /><path d="M6 18c3-4 6-7 12-11" /></> },
  { label: "Bold", icon: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" /> },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
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
        className="neu-raised inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: accent }}
      >
        <Sparkles size={14} /> Reveal my palette
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
        className="flex items-center justify-between rounded-[26px] px-8 py-6 transition-colors accent-border"
        style={{
          background: `color-mix(in oklab, ${revealed ? "var(--client-accent, var(--gold))" : "var(--gold)"} 8%, var(--cream))`,
          boxShadow: `0 16px 32px -18px color-mix(in oklab, ${accentSoft} 70%, transparent)`,
        }}
      >
        <div className="flex items-center gap-4">
          <Check size={18} style={{ color: accent }} />
          <div>
            <p className="text-[0.6rem] font-semibold tracking-[0.1em] uppercase" style={{ color: accent }}>Selfie AI</p>
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
      className="group relative block overflow-hidden rounded-[30px] px-8 py-14 md:px-14 md:py-20 accent-border"
      style={{
        background: active
          ? `color-mix(in oklab, ${revealed ? "var(--client-accent, var(--gold))" : "var(--gold)"} 6%, var(--cream))`
          : "var(--cream)",
        boxShadow: active
          ? `0 24px 48px -24px color-mix(in oklab, ${accent} 55%, transparent)`
          : `0 16px 32px -20px color-mix(in oklab, ${accentSoft} 60%, transparent)`,
      }}
    >
      <p className="text-[0.6rem] font-semibold tracking-[0.1em] uppercase" style={{ color: accent }}>{eyebrow}</p>
      <h2 className="font-display mt-5 text-3xl leading-[1.05] md:text-5xl">
        {capability.title}
        <span style={{ color: accent }}>.</span>
      </h2>
      <p className="mt-6 max-w-xl text-sm md:text-base" style={{ color: "color-mix(in oklab, var(--ink) 65%, transparent)" }}>
        {capability.description}
      </p>
      <div className="mt-9 inline-flex items-center gap-2 text-sm font-semibold">
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
  const Icon = capability.icon;

  return (
    <Link
      to={active ? capability.href : "/pricing"}
      title={active ? capability.description : `Unlock with ${tierDisplayName(minUnlockingTier(capability.key))}`}
      className="card-accent group relative flex flex-col items-center gap-2.5 rounded-2xl px-3 py-4 text-center transition-colors"
      style={{
        background: active
          ? `color-mix(in oklab, ${revealed ? "var(--client-accent, var(--gold))" : "var(--gold)"} 4%, var(--cream))`
          : "color-mix(in oklab, var(--ink) 2%, var(--cream))",
        boxShadow: active
          ? `0 10px 20px -14px color-mix(in oklab, ${accentSoft} 65%, transparent)`
          : "0 8px 16px -14px color-mix(in oklab, var(--ink) 12%, transparent)",
        opacity: active ? 1 : 0.7,
        animationDelay: revealing ? `${index * 90}ms` : undefined,
      }}
      data-cascade={revealing ? "true" : "false"}
    >
      {!active && (
        <Lock size={10} className="absolute right-2.5 top-2.5" style={{ color: accent }} />
      )}
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{
          background: active
            ? `color-mix(in oklab, ${accent} 14%, var(--cream))`
            : "color-mix(in oklab, var(--ink) 6%, var(--cream))",
        }}
      >
        <Icon size={19} style={{ color: active ? accent : "color-mix(in oklab, var(--ink) 40%, transparent)" }} />
      </div>
      <p className="text-xs font-semibold leading-tight text-ink">{capability.title}</p>
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
