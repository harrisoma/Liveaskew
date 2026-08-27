import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { MyStyleGuide } from "@/lib/my-style-guide.functions";
import type { HeroLook, LookIllustration } from "@/lib/style-looks.functions";
import beePortraitAsset from "@/assets/bee-portrait.png.asset.json";

const BEE_PORTRAIT = beePortraitAsset.url;

/* ───────────────────────────── helpers ───────────────────────────── */

function isDark(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

const NAMED_COLORS: Array<[RegExp, string]> = [
  [/black|onyx|jet|charcoal/i, "#1A1A1A"],
  [/white|ivory|cream|chalk|alabaster/i, "#F5EFE2"],
  [/camel|caramel|tan|wheat|sand|beige|biscuit/i, "#B8895A"],
  [/brown|chocolate|espresso|coffee|mocha|cocoa/i, "#5A3A24"],
  [/rust|terracotta|brick|clay|sienna/i, "#A64B2A"],
  [/burgundy|wine|oxblood|merlot|bordeaux/i, "#5A1A2B"],
  [/red|crimson|scarlet|cherry/i, "#B22234"],
  [/coral|salmon|peach/i, "#E58D74"],
  [/pink|rose|blush|petal/i, "#D89BA6"],
  [/plum|aubergine|eggplant|mulberry/i, "#5C2A4D"],
  [/lavender|lilac|orchid/i, "#9D89B8"],
  [/purple|violet/i, "#5E3A87"],
  [/navy|midnight|indigo|ink/i, "#1E2A4A"],
  [/teal|peacock|cerulean/i, "#11525C"],
  [/blue|sapphire|cobalt|denim/i, "#2C4E80"],
  [/sky|powder|periwinkle/i, "#A8C5DE"],
  [/mint|sage|eucalyptus/i, "#9CB5A1"],
  [/olive|moss|fern|forest|hunter/i, "#4A5A2E"],
  [/emerald|jade|kelly/i, "#2E6F4E"],
  [/green/i, "#3F6B43"],
  [/mustard|ochre|saffron|amber/i, "#C8932B"],
  [/gold|brass|bronze/i, "#A4853A"],
  [/yellow|butter|lemon/i, "#E4C24B"],
  [/grey|gray|smoke|dove|pewter|stone|slate/i, "#7A7A78"],
  [/taupe|mushroom|fawn/i, "#8C7762"],
  [/nude|skin|bone/i, "#D9C0A6"],
];

function ensureSwatchHex(hex: string | undefined, name: string | undefined): string {
  const raw = (hex ?? "").trim();
  if (raw && /^#?[0-9a-fA-F]{6}$/.test(raw)) return raw.startsWith("#") ? raw : `#${raw}`;
  if (name) for (const [re, h] of NAMED_COLORS) if (re.test(name)) return h;
  return "#B8895A";
}

/* ───────── empty-state plate (kraft panel) ─────────
   Used whenever an illustration is missing or failed. NEVER the orb. */

function PlatePending({ className }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center bg-bone border hairline ${className ?? ""}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(0,0,0,0.025) 0 2px, transparent 2px 8px)",
      }}
    >
      <div className="text-center px-4 py-6">
        <span className="block font-mono text-[9px] tracking-[0.3em] uppercase text-ink/40 mb-2">
          plate
        </span>
        <span className="block font-display italic text-sm text-ink/55">
          illustration pending
        </span>
      </div>
    </div>
  );
}

function LookPlate({
  illus,
  alt,
  className,
}: {
  illus?: LookIllustration;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  if (!illus || illus.status !== "success" || !illus.url) {
    return <PlatePending className={className} />;
  }
  return (
    <div className={`relative ${className ?? ""}`}>
      <img
        src={illus.url}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {!loaded && <div className="absolute inset-0 bg-bone" aria-hidden />}
    </div>
  );
}

/* ───────────────────────────── component ───────────────────────────── */

type Section = { id: string; num: string; label: string; swatch?: string };

export function MagazineSpread({
  data,
  toolbar,
  generationStatus,
}: {
  data: MyStyleGuide;
  toolbar?: ReactNode;
  generationStatus?: string | null;
}) {
  const { displayName, profile, styleProfile } = data;
  const palette = Array.isArray(styleProfile?.color_palette) ? styleProfile!.color_palette! : [];
  const pillars = styleProfile?.pillar_weights ?? null;
  const lifestyle = styleProfile?.lifestyle_mix ?? null;
  const looks = styleProfile?.looks ?? null;
  const heroes = looks?.heroes ?? [];
  const variations = looks?.variations ?? [];
  const rotation = looks?.rotation ?? [];

  const [enlargedDay, setEnlargedDay] = useState<
    { day: number; hero: HeroLook } | null
  >(null);

  const closeEnlarged = useCallback(() => setEnlargedDay(null), []);

  const heroColor = ensureSwatchHex(palette[0]?.hex, palette[0]?.name) || "#1a1a1a";
  const accentColor =
    ensureSwatchHex(palette[1]?.hex, palette[1]?.name) || heroColor || "#c9a84c";

  const today = new Date();
  const issueLabel = today
    .toLocaleString("en-US", { month: "long", year: "numeric" })
    .toUpperCase();
  const volume = `VOL. ${String(today.getFullYear()).slice(-2)} · NO. ${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}`;

  const sections: Section[] = [
    { id: "cover", num: "00", label: "Cover", swatch: heroColor },
    { id: "letter", num: "ED", label: "Editor's Letter" },
    { id: "foundation", num: "01", label: "The Foundation", swatch: accentColor },
    { id: "looks", num: "02", label: "The Looks", swatch: heroColor },
    { id: "variations", num: "03", label: "Variations" },
    { id: "rotation", num: "04", label: "30-Day Rotation" },
    { id: "colophon", num: "✦", label: "Colophon", swatch: heroColor },
  ];

  return (
    <div className="min-h-screen bg-cream text-ink magazine-root">
      {toolbar ? (
        <div className="no-print sticky top-0 z-40 bg-cream/95 backdrop-blur border-b hairline">
          <div className="max-w-6xl mx-auto px-6 md:px-10 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-baseline gap-3 text-xs tracking-[0.28em] uppercase text-ink/60">
              <span className="font-display not-italic text-ink text-base tracking-normal">
                LiveAskew
              </span>
              <span className="text-ink/30">/</span>
              <span>{issueLabel}</span>
              {generationStatus ? (
                <span className="text-ink/50 italic font-display normal-case tracking-normal text-sm">
                  · {generationStatus}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 flex-wrap">{toolbar}</div>
          </div>
        </div>
      ) : null}

      <SectionDock sections={sections} accent={accentColor} />

      {/* ───────────── COVER ───────────── */}
      <section
        id="cover"
        data-magsection
        className="relative overflow-hidden"
        style={{ background: heroColor, color: isDark(heroColor) ? "#f5f0e0" : "#0d0d0d" }}
      >
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[42%] pointer-events-none">
          <LookPlate
            illus={looks?.cover}
            alt=""
            className="w-full h-full opacity-85 mix-blend-luminosity"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${heroColor} 0%, transparent 35%, transparent 100%)`,
            }}
          />
        </div>
        <div className="relative max-w-6xl mx-auto px-8 md:px-16 py-12 md:py-16 flex flex-col gap-8">
          <header className="flex items-baseline justify-between text-[10px] tracking-[0.3em] uppercase opacity-80">
            <span>LiveAskew</span>
            <span>{volume}</span>
            <span>{issueLabel}</span>
          </header>
          <div className="md:max-w-[58%]">
            <p className="text-[10px] tracking-[0.4em] uppercase opacity-70 mb-4">
              The 30-Day Edition · for {displayName ?? "you"}
            </p>
            <h1
              className="font-display leading-[0.85] tracking-tight"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
            >
              Thirty days,
              <br />
              <em style={{ color: accentColor }}>eight looks.</em>
            </h1>
            {styleProfile?.north_star ? (
              <p className="mt-6 max-w-xl text-base md:text-lg leading-relaxed opacity-90 italic">
                "{styleProfile.north_star}"
              </p>
            ) : null}
          </div>
          <footer className="flex items-end justify-between text-[10px] tracking-[0.28em] uppercase opacity-70 pt-2">
            <span>Inside · Foundation · 8 Looks · Variations · Rotation</span>
            <span className="font-mono">£ ◯ ◯ ◯</span>
          </footer>
        </div>
      </section>

      {/* ───────────── EDITOR'S LETTER ───────────── */}
      <section
        id="letter"
        data-magsection
        className="px-8 md:px-16 py-12 md:py-16 max-w-5xl mx-auto"
      >
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-3">
            <figure className="mb-5">
              <div className="aspect-[3/4] overflow-hidden border hairline bg-bone">
                <img
                  src={BEE_PORTRAIT}
                  alt="Bee, your editor"
                  className="w-full h-full object-cover"
                  style={{ filter: "grayscale(0.15) contrast(1.05)" }}
                />
              </div>
              <figcaption className="mt-2 text-[10px] tracking-[0.28em] uppercase text-ink/55">
                Bee · Editor in chief
              </figcaption>
            </figure>
            <p className="eyebrow mb-2" style={{ color: accentColor }}>
              Editor's Letter
            </p>
            <p className="text-[10px] tracking-[0.22em] uppercase text-ink/50">
              Issued {issueLabel.toLowerCase()}
            </p>
          </div>
          <div className="md:col-span-9">
            <p className="font-display text-2xl md:text-4xl leading-[1.15] text-ink max-w-3xl">
              A wardrobe should{" "}
              <em style={{ color: accentColor }}>argue for you</em> before you
              open your mouth. This month: eight looks, two ways each, mapped
              across thirty days — built from your colors, your climate, your
              real life.
            </p>
            <p className="mt-5 text-ink/65 text-base md:text-lg leading-relaxed max-w-2xl">
              Read it like a magazine. Wear it like a thesis. When something
              shifts, your guide shifts with it.
            </p>
            <p
              className="mt-6 text-2xl md:text-3xl leading-snug"
              style={{ fontFamily: "var(--font-hand)", color: accentColor }}
            >
              with care, <br />— Bee.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── 01 · THE FOUNDATION ───────────── */}
      <section
        id="foundation"
        data-magsection
        className="px-8 md:px-16 py-12 max-w-5xl mx-auto"
      >
        <p className="eyebrow mb-3" style={{ color: accentColor }}>
          01 — The Foundation
        </p>
        <h2
          className="font-display leading-[0.95] tracking-tight mb-6"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
        >
          Your colors,{" "}
          <span className="italic" style={{ color: accentColor }}>
            your shape, your life.
          </span>
        </h2>
        <span className="block w-16 h-px mb-8" style={{ background: accentColor }} />

        {/* Palette swatch row */}
        {palette.length > 0 && (
          <div className="mb-8">
            <p className="eyebrow text-ink/50 mb-3">Palette</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {palette.slice(0, 6).map((c, i) => {
                const hex = ensureSwatchHex(c.hex, c.name).toUpperCase();
                return (
                  <div key={i} className="break-inside-avoid">
                    <div
                      className="aspect-square border hairline relative"
                      style={{ background: hex }}
                      title={`${c.name ?? ""} · ${hex}`}
                    >
                      <span
                        className="absolute bottom-1 left-1 right-1 font-mono text-[9px] tracking-[0.14em]"
                        style={{ color: isDark(hex) ? "#f5f0e0" : "#0d0d0d" }}
                      >
                        {hex}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-tight text-ink/80">
                      {c.name || `Tone 0${i + 1}`}
                    </p>
                  </div>
                );
              })}
            </div>
            {styleProfile?.color_season && (
              <p className="mt-3 eyebrow text-ink/50">
                {styleProfile.color_season === "pending photo"
                  ? "Season · pending photo — upload a headshot to unlock your colour season"
                  : `Season · ${styleProfile.color_season.replace(/_/g, " ")}`}
              </p>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-12 gap-8">
          {/* North star + quick facts */}
          <div className="md:col-span-7 space-y-6">
            {styleProfile?.north_star && (
              <div>
                <p className="eyebrow text-ink/50 mb-2">North star</p>
                <blockquote
                  className="font-display text-xl md:text-2xl leading-snug italic"
                  style={{ color: accentColor }}
                >
                  "{styleProfile.north_star}"
                </blockquote>
              </div>
            )}
            {profile && (
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-ink/15 border hairline">
                <FactCompact label="Body" value={profile.body_shape} />
                <FactCompact label="Located" value={profile.location} />
                <FactCompact label="Climate" value={profile.climate} />
                <FactCompact label="Budget" value={profile.budget_band} />
              </dl>
            )}
          </div>

          {/* Pillars + lifestyle inline */}
          <div className="md:col-span-5 space-y-5">
            {pillars && Object.keys(pillars).length > 0 && (
              <div>
                <p className="eyebrow text-ink/50 mb-2">Pillars</p>
                <ul className="space-y-1.5">
                  {Object.entries(pillars)
                    .sort(([, a], [, b]) => (Number(b) || 0) - (Number(a) || 0))
                    .map(([k, v]) => {
                      const pct = Math.max(0, Math.min(100, Number(v) || 0));
                      return (
                        <li key={k} className="flex items-center gap-3">
                          <span className="capitalize text-sm w-16 shrink-0">{k}</span>
                          <span className="flex-1 h-px bg-ink/15 relative">
                            <span
                              className="absolute inset-y-[-1px] left-0 h-[3px]"
                              style={{ width: `${pct}%`, background: accentColor }}
                            />
                          </span>
                          <span className="font-mono text-[10px] text-ink/50 w-8 text-right">
                            {pct.toFixed(0)}%
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            )}
            {lifestyle && Object.keys(lifestyle).length > 0 && (
              <div>
                <p className="eyebrow text-ink/50 mb-2">Lifestyle mix</p>
                <ul className="space-y-1">
                  {Object.entries(lifestyle)
                    .sort(([, a], [, b]) => (Number(b) || 0) - (Number(a) || 0))
                    .map(([k, v]) => (
                      <li key={k} className="flex items-baseline justify-between text-sm">
                        <span className="capitalize text-ink/80">{k}</span>
                        <span className="font-mono text-xs text-ink/55">
                          {Math.round(Number(v) || 0)}%
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ───────────── 02 · THE LOOKS ───────────── */}
      <section
        id="looks"
        data-magsection
        className="px-8 md:px-16 py-12 max-w-6xl mx-auto"
      >
        <p className="eyebrow mb-3" style={{ color: accentColor }}>
          02 — The Looks
        </p>
        <h2
          className="font-display leading-[0.95] tracking-tight mb-2"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
        >
          Eight,{" "}
          <span className="italic" style={{ color: accentColor }}>
            on the record.
          </span>
        </h2>
        <span className="block w-16 h-px mb-10" style={{ background: accentColor }} />

        {heroes.length === 0 ? (
          <p className="text-ink/55 italic font-display">
            Bee is composing your eight looks. They'll appear here as they finish.
          </p>
        ) : (
          <div className="space-y-12">
            {heroes.map((hero, i) => (
              <LookSpread
                key={hero.id}
                hero={hero}
                index={i + 1}
                accent={accentColor}
                palette={palette}
              />
            ))}
          </div>
        )}
      </section>

      {/* ───────────── 03 · VARIATIONS ───────────── */}
      <section
        id="variations"
        data-magsection
        className="px-8 md:px-16 py-12 max-w-5xl mx-auto"
      >
        <p className="eyebrow mb-3" style={{ color: accentColor }}>
          03 — The Variations
        </p>
        <h2
          className="font-display leading-[0.95] tracking-tight mb-2"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
        >
          Sixteen{" "}
          <span className="italic" style={{ color: accentColor }}>
            small swaps.
          </span>
        </h2>
        <span className="block w-16 h-px mb-8" style={{ background: accentColor }} />

        {variations.length === 0 ? (
          <p className="text-ink/55 italic font-display">
            Variations will appear once the hero looks are done.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
            {heroes.map((hero) => {
              const heroVars = variations.filter((v) => v.heroId === hero.id);
              if (heroVars.length === 0) return null;
              return (
                <article key={hero.id} className="break-inside-avoid">
                  <p
                    className="eyebrow mb-2"
                    style={{ color: accentColor }}
                  >
                    {hero.name}
                  </p>
                  <ul className="space-y-3 border-t hairline pt-3">
                    {heroVars.map((v, i) => (
                      <li key={i}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-display text-base text-ink">{v.name}</span>
                          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink/50">
                            {v.swap}
                          </span>
                        </div>
                        {v.note && (
                          <p className="mt-1 text-sm text-ink/65 leading-snug">{v.note}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ───────────── 04 · 30-DAY ROTATION ───────────── */}
      <section
        id="rotation"
        data-magsection
        className="px-8 md:px-16 py-12 max-w-5xl mx-auto"
      >
        <p className="eyebrow mb-3" style={{ color: accentColor }}>
          04 — The 30-Day Rotation
        </p>
        <h2
          className="font-display leading-[0.95] tracking-tight mb-2"
          style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)" }}
        >
          One month,{" "}
          <span className="italic" style={{ color: accentColor }}>
            mapped.
          </span>
        </h2>
        <span className="block w-16 h-px mb-8" style={{ background: accentColor }} />

        {rotation.length === 0 ? (
          <p className="text-ink/55 italic font-display">
            The rotation builds once your eight looks are composed.
          </p>
        ) : (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
            {rotation.map((d) => {
              const hero = heroes.find((h) => h.id === d.heroId);
              return (
                <button
                  key={d.day}
                  type="button"
                  className="relative border hairline aspect-[3/4] overflow-hidden flex flex-col group cursor-zoom-in"
                  title={hero?.name}
                  onClick={() => hero && setEnlargedDay({ day: d.day, hero })}
                >
                  <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-110">
                    <LookPlate
                      illus={hero?.illustration}
                      alt={hero?.name ?? `Day ${d.day}`}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="relative z-10 flex flex-col justify-between h-full p-1.5 bg-gradient-to-b from-black/0 via-black/0 to-black/55 text-center">
                    <span className="font-mono text-[10px] tracking-[0.16em] text-ink/70 bg-paper/80 px-1 self-start rounded-sm">
                      {String(d.day).padStart(2, "0")}
                    </span>
                    <span
                      className="font-display text-[10px] leading-tight truncate text-white drop-shadow"
                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
                    >
                      {hero?.name ?? d.heroId}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ───────────── ENLARGED DAY LIGHTBOX ───────────── */}
      {enlargedDay && (
        <RotationLightbox
          day={enlargedDay.day}
          hero={enlargedDay.hero}
          accent={accentColor}
          palette={palette}
          onClose={closeEnlarged}
        />
      )}

      {/* ───────────── COLOPHON ───────────── */}
      <section
        id="colophon"
        data-magsection
        className="relative px-8 md:px-16 py-12 md:py-16"
        style={{ background: heroColor, color: isDark(heroColor) ? "#f5f0e0" : "#0d0d0d" }}
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-7 flex items-end gap-6">
            <img
              src={BEE_PORTRAIT}
              alt=""
              aria-hidden
              className="hidden md:block w-24 lg:w-32 aspect-[3/4] object-cover border hairline opacity-90"
              style={{ filter: "grayscale(1) contrast(1.1)" }}
            />
            <div>
              <p className="eyebrow opacity-70 mb-2">Colophon</p>
              <p
                className="font-display leading-[0.95]"
                style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
              >
                Edited by Bee.
                <br />
                <em style={{ color: accentColor }}>Worn by you.</em>
              </p>
            </div>
          </div>
          <div className="md:col-span-5 flex flex-wrap gap-3 no-print">
            <Link
              to="/magazine"
              className="inline-flex items-center px-5 py-3 text-xs tracking-[0.22em] uppercase border"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              See this month's looks →
            </Link>
            <Link
              to="/chat"
              className="inline-flex items-center px-5 py-3 text-xs tracking-[0.22em] uppercase opacity-80 hover:opacity-100"
            >
              Talk to Bee
            </Link>
          </div>
        </div>
        <p className="max-w-5xl mx-auto mt-8 text-[10px] tracking-[0.28em] uppercase opacity-60 flex justify-between">
          <span>LiveAskew · The 30-Day Edition</span>
          <span>{issueLabel}</span>
        </p>
      </section>
    </div>
  );
}

/* ───────────────────────────── look spread ───────────────────────────── */

function LookSpread({
  hero,
  index,
  accent,
  palette,
}: {
  hero: HeroLook;
  index: number;
  accent: string;
  palette: Array<{ name?: string; hex?: string; role?: string }>;
}) {
  const pieces: Array<[string, string | undefined]> = [
    ["Top", hero.pieces.top],
    ["Bottom", hero.pieces.bottom],
    ["Layer", hero.pieces.layer],
    ["Shoe", hero.pieces.shoe],
    ["Accessory", hero.pieces.accessory],
  ];
  return (
    <article className="grid md:grid-cols-12 gap-8 break-inside-avoid border-t hairline pt-8">
      <figure className="md:col-span-5">
        <div className="aspect-[3/4] overflow-hidden border hairline bg-bone relative">
          <LookPlate illus={hero.illustration} alt={hero.name} className="w-full h-full" />
        </div>
        <figcaption className="mt-2 flex items-baseline justify-between text-[10px] tracking-[0.28em] uppercase text-ink/55">
          <span>Look {String(index).padStart(2, "0")}</span>
          <span
            className="text-base normal-case tracking-normal"
            style={{ fontFamily: "var(--font-hand)", color: accent }}
          >
            {hero.occasion}
          </span>
        </figcaption>
      </figure>
      <div className="md:col-span-7">
        <p className="eyebrow mb-2" style={{ color: accent }}>
          Look {String(index).padStart(2, "0")}
        </p>
        <h3
          className="font-display leading-[1] mb-1"
          style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)" }}
        >
          {hero.name}
        </h3>
        <p className="text-sm text-ink/60 mb-4">{hero.occasion}</p>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 mb-5">
          {pieces
            .filter(([, v]) => v && v.trim().length > 0)
            .map(([label, v]) => (
              <div key={label} className="flex items-baseline gap-2 border-b hairline pb-1.5">
                <dt className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink/45 w-16 shrink-0">
                  {label}
                </dt>
                <dd className="text-sm text-ink/85 leading-snug">{v}</dd>
              </div>
            ))}
        </dl>

        {hero.note && (
          <p
            className="font-display italic text-base md:text-lg leading-snug max-w-prose mb-4"
            style={{ color: accent }}
          >
            {hero.note}
          </p>
        )}

        {hero.paletteColors.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="eyebrow text-ink/45">Colors</span>
            {hero.paletteColors.map((name) => {
              const match = palette.find((p) =>
                (p.name ?? "").toLowerCase().includes(name.toLowerCase()),
              );
              const hex = ensureSwatchHex(match?.hex, name);
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 border hairline px-2 py-1"
                >
                  <span className="block w-3 h-3 border hairline" style={{ background: hex }} />
                  <span className="text-xs text-ink/80">{name}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

/* ───────────────────────────── small bits ───────────────────────────── */

function FactCompact({ label, value }: { label: string; value: string | null }) {
  const empty = !value || !value.trim();
  return (
    <div className="bg-cream p-3">
      <dt className="eyebrow text-ink/50 mb-1 text-[9px]">{label}</dt>
      <dd className={`text-sm leading-snug ${empty ? "text-ink/40 italic" : "text-ink"}`}>
        {empty ? "—" : value}
      </dd>
    </div>
  );
}

/* ───────────────────────────── section dock ───────────────────────────── */

function SectionDock({ sections, accent }: { sections: Section[]; accent: string }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((e): e is HTMLElement => !!e);
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  const idx = Math.max(0, sections.findIndex((s) => s.id === active));
  const prev = sections[idx - 1];
  const next = sections[idx + 1];

  return (
    <>
      <aside className="no-print hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col gap-3">
        {sections.map((s) => {
          const isActive = s.id === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              aria-label={`Jump to ${s.label}`}
              title={`${s.num} · ${s.label}`}
              className="group flex items-center gap-3 justify-end"
            >
              <span
                className={`font-mono text-[10px] tracking-[0.2em] uppercase transition-opacity ${
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-80"
                }`}
                style={{ color: isActive ? accent : undefined }}
              >
                {s.num} · {s.label}
              </span>
              <span
                className="block border hairline transition-all"
                style={{
                  width: isActive ? 36 : 18,
                  height: 24,
                  background: s.swatch || "transparent",
                  borderColor: isActive ? accent : undefined,
                  boxShadow: isActive ? `0 0 0 1px ${accent}` : "none",
                }}
              />
            </button>
          );
        })}
      </aside>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="no-print lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-ink text-cream flex flex-col items-center justify-center shadow-lg"
        aria-label="Open section index"
      >
        <span className="font-mono text-[9px] tracking-[0.2em]">{sections[idx]?.num}</span>
        <span className="font-mono text-[9px] tracking-[0.2em] opacity-60">
          {idx + 1}/{sections.length}
        </span>
      </button>

      {open && (
        <div
          className="no-print lg:hidden fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-cream rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow mb-4">Contents</p>
            <div className="grid grid-cols-2 gap-3">
              {sections.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(s.id)}
                  className={`flex items-center gap-3 p-3 border hairline text-left ${
                    s.id === active ? "bg-ink text-cream" : ""
                  }`}
                >
                  <span
                    className="block w-10 h-12 border hairline shrink-0"
                    style={{ background: s.swatch || "var(--cream)" }}
                  />
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.2em] opacity-60">{s.num}</p>
                    <p className="font-display text-base leading-tight">{s.label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="no-print fixed bottom-6 left-6 z-30 flex gap-2">
        <button
          type="button"
          disabled={!prev}
          onClick={() => prev && go(prev.id)}
          className="px-4 py-2 text-xs tracking-[0.22em] uppercase bg-ink/85 text-cream backdrop-blur disabled:opacity-30"
        >
          ← Prev
        </button>
        <button
          type="button"
          disabled={!next}
          onClick={() => next && go(next.id)}
          className="px-4 py-2 text-xs tracking-[0.22em] uppercase bg-ink/85 text-cream backdrop-blur disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    </>
  );
}

/* ───────────────────────────── rotation lightbox ───────────────────────────── */

function RotationLightbox({
  day,
  hero,
  accent,
  palette,
  onClose,
}: {
  day: number;
  hero: HeroLook;
  accent: string;
  palette: Array<{ name?: string; hex?: string; role?: string }>;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const pieces: Array<[string, string | undefined]> = [
    ["Top", hero.pieces.top],
    ["Bottom", hero.pieces.bottom],
    ["Layer", hero.pieces.layer],
    ["Shoe", hero.pieces.shoe],
    ["Accessory", hero.pieces.accessory],
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-cream border hairline max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-ink/10 hover:bg-ink/20 text-ink transition-colors"
          aria-label="Close"
        >
          <span className="font-mono text-sm">×</span>
        </button>

        <div className="aspect-[3/4] overflow-hidden bg-bone">
          <LookPlate illus={hero.illustration} alt={hero.name} className="w-full h-full" />
        </div>

        <div className="p-6 md:p-8">
          <p className="eyebrow text-ink/50 mb-1" style={{ color: accent }}>
            Day {String(day).padStart(2, "0")}
          </p>
          <h3
            className="font-display leading-[1] mb-1"
            style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)" }}
          >
            {hero.name}
          </h3>
          <p className="text-sm text-ink/60 mb-5">{hero.occasion}</p>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 mb-5">
            {pieces
              .filter(([, v]) => v && v.trim().length > 0)
              .map(([label, v]) => (
                <div key={label} className="flex items-baseline gap-2 border-b hairline pb-1.5">
                  <dt className="font-mono text-[9px] tracking-[0.22em] uppercase text-ink/45 w-16 shrink-0">
                    {label}
                  </dt>
                  <dd className="text-sm text-ink/85 leading-snug">{v}</dd>
                </div>
              ))}
          </dl>

          {hero.note && (
            <p
              className="font-display italic text-base md:text-lg leading-snug max-w-prose mb-5"
              style={{ color: accent }}
            >
              {hero.note}
            </p>
          )}

          {hero.paletteColors.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="eyebrow text-ink/45">Colors</span>
              {hero.paletteColors.map((name) => {
                const match = palette.find((p) =>
                  (p.name ?? "").toLowerCase().includes(name.toLowerCase()),
                );
                const hex = ensureSwatchHex(match?.hex, name);
                return (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 border hairline px-2 py-1"
                  >
                    <span className="block w-3 h-3 border hairline" style={{ background: hex }} />
                    <span className="text-xs text-ink/80">{name}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
