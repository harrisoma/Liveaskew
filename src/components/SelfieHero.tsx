import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { hasEntitlement } from "@/lib/plans";
import {
  getPhotorealHero,
  generatePhotorealHero,
} from "@/lib/photoreal-hero.functions";
import type { MyStyleGuide } from "@/lib/my-style-guide.functions";

type Props = {
  tier: string | null;
  data: MyStyleGuide;
};

function buildHeroPrompt(hero: NonNullable<MyStyleGuide["styleProfile"]>["looks"] extends infer L
  ? L extends { heroes: infer H }
    ? H extends Array<infer Item>
      ? Item
      : never
    : never
  : never): string {
  // Loose type — we only read known fields.
  const h = hero as {
    name?: string;
    occasion?: string;
    pieces?: {
      top?: string;
      bottom?: string;
      layer?: string;
      shoe?: string;
      accessory?: string;
    };
  };
  const p = h.pieces ?? {};
  const parts = [p.top, p.bottom, p.layer, p.shoe, p.accessory]
    .filter((s): s is string => !!s && s.trim().length > 0);
  const outfit = parts.length ? parts.join(", ") : "her signature opening look";
  const occasion = h.occasion ? ` for ${h.occasion}` : "";
  return `Wearing ${outfit}. Editorial full-length fashion photograph${occasion}.`;
}

export function SelfieHero({ tier, data }: Props) {
  const canSelfie = hasEntitlement(tier, "selfieAI");
  const selfiePath = data.profile?.selfie_photo_path ?? null;
  const hero = data.styleProfile?.looks?.heroes?.[0] ?? null;
  const displayName = data.displayName ?? "You";

  // STATE C — Silver / no entitlement
  if (!canSelfie) return <UpgradeHero />;

  // STATE B — No selfie or no hero yet
  if (!selfiePath || !hero) {
    return (
      <EmptyHero
        cta={
          !selfiePath
            ? { label: "Add your photo →", to: "/profile" }
            : { label: "Compose your looks →", to: "/my-style-guide" }
        }
        headline={
          !selfiePath
            ? "See yourself in your opening look."
            : "Compose your looks first."
        }
        body={
          !selfiePath
            ? "Add one full-length photo and Bee renders every look on you."
            : "Once your hero looks are composed, we'll style you into the opening one."
        }
      />
    );
  }

  // STATE A — HAS entitlement + selfie + hero
  return <PhotorealHero heroId={hero.id} prompt={buildHeroPrompt(hero)} heroName={hero.name} occasion={hero.occasion} displayName={displayName} />;
}

function PhotorealHero({
  heroId,
  prompt,
  heroName,
  occasion,
  displayName,
}: {
  heroId: string;
  prompt: string;
  heroName: string;
  occasion: string;
  displayName: string;
}) {
  const fetchHero = useServerFn(getPhotorealHero);
  const runHero = useServerFn(generatePhotorealHero);

  const cached = useQuery({
    queryKey: ["photoreal-hero", heroId],
    queryFn: () => fetchHero({ data: { heroId } }),
    staleTime: 1000 * 60 * 60,
  });

  const gen = useMutation({
    mutationFn: () => runHero({ data: { heroId, prompt } }),
  });

  // Auto-generate once when cache is confirmed empty.
  useEffect(() => {
    if (
      cached.isSuccess &&
      !cached.data?.url &&
      !gen.isPending &&
      !gen.data?.url &&
      !gen.isError
    ) {
      gen.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cached.isSuccess, cached.data]);

  const imageUrl = cached.data?.url ?? gen.data?.url ?? null;
  const loading = cached.isLoading || (!imageUrl && gen.isPending) || (!imageUrl && !cached.data && !gen.isError);

  if (gen.isError && !imageUrl) {
    return (
      <HeroFrame>
        <div className="flex flex-col items-start justify-end h-full p-10 gap-3">
          <p className="eyebrow text-cream/70">Opening look</p>
          <h2 className="font-display text-3xl text-cream leading-tight max-w-md">
            We couldn't render your look.
          </h2>
          <p className="text-sm text-cream/70 max-w-sm">
            Bee's studio hit a snag. Give it another try.
          </p>
          <button
            type="button"
            onClick={() => gen.mutate()}
            className="mt-2 px-6 py-3 text-[11px] tracking-[0.22em] uppercase bg-cream text-ink hover:bg-cream/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </HeroFrame>
    );
  }

  if (loading || !imageUrl) {
    return (
      <HeroFrame>
        <div className="flex flex-col items-start justify-end h-full p-10 gap-3">
          <p className="eyebrow text-cream/70">Opening look</p>
          <h2 className="font-display text-3xl text-cream leading-tight max-w-md italic">
            Styling you into your opening look…
          </h2>
          <p className="text-sm text-cream/70 max-w-sm">
            Bee is dressing you in {heroName}. This takes a moment the first time.
          </p>
        </div>
      </HeroFrame>
    );
  }

  return (
    <section className="w-full bg-ink text-cream">
      <div className="relative w-full">
        <div className="grid md:grid-cols-[1.4fr_1fr]">
          <div className="relative bg-ink">
            <img
              src={imageUrl}
              alt={`${displayName} styled in ${heroName}`}
              className="w-full h-full object-cover object-top max-h-[86vh]"
            />
          </div>
          <div className="flex flex-col justify-end p-8 md:p-12 gap-4 bg-ink">
            <p className="eyebrow text-gold">Opening look · rendered on you</p>
            <h1 className="font-display text-4xl md:text-5xl leading-[1.05] text-cream">
              {displayName},<br />
              <span className="italic text-gold">{heroName}.</span>
            </h1>
            <p className="text-sm text-cream/75 max-w-sm leading-relaxed">
              {occasion}. This is you, styled — not a stock illustration.
            </p>
            <div className="mt-2 h-px w-16 bg-gold/60" />
            <p className="text-xs text-cream/50 tracking-wide">
              Powered by your Gold membership
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroFrame({ children }: { children: React.ReactNode }) {
  return (
    <section className="w-full bg-ink text-cream">
      <div className="min-h-[60vh] md:min-h-[70vh] max-w-6xl mx-auto">
        {children}
      </div>
    </section>
  );
}

function EmptyHero({
  headline,
  body,
  cta,
}: {
  headline: string;
  body: string;
  cta: { label: string; to: string };
}) {
  return (
    <section className="w-full bg-bone">
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-16 md:py-24">
        <div className="border hairline p-10 md:p-16 bg-cream flex flex-col items-start gap-6">
          <p className="eyebrow text-ink/50">Your opening spread</p>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.02] text-ink max-w-2xl">
            {headline}
          </h1>
          <p className="text-base md:text-lg text-ink/70 max-w-md leading-relaxed">
            {body}
          </p>
          <Link
            to={cta.to}
            className="mt-2 inline-flex items-center px-8 py-4 bg-ink text-cream text-sm tracking-[0.22em] uppercase hover:bg-ink/90 transition-colors"
          >
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

function UpgradeHero() {
  return (
    <section className="relative w-full bg-ink text-cream overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 blur-2xl"
        style={{
          background:
            "radial-gradient(1200px 500px at 30% 40%, oklch(0.78 0.14 78 / 0.55), transparent 60%), radial-gradient(900px 400px at 80% 70%, oklch(0.65 0.18 30 / 0.35), transparent 65%)",
        }}
      />
      <div className="relative max-w-6xl mx-auto px-6 md:px-12 py-20 md:py-28 grid md:grid-cols-[1fr_1fr] gap-12 items-center">
        <div className="flex flex-col gap-5">
          <p className="eyebrow text-gold">Gold membership</p>
          <h1 className="font-display text-4xl md:text-6xl leading-[1.02] text-cream max-w-lg">
            Step inside your own <span className="italic text-gold">lookbook.</span>
          </h1>
          <p className="text-base md:text-lg text-cream/75 max-w-md leading-relaxed">
            Gold renders every look on your own face — see yourself styled, not a stock illustration.
          </p>
          <Link
            to="/pricing"
            className="mt-3 inline-flex items-center px-8 py-4 bg-gold text-ink text-sm tracking-[0.22em] uppercase hover:bg-gold/90 transition-colors self-start"
          >
            Unlock with Gold →
          </Link>
        </div>
        <div className="hidden md:block relative aspect-[3/4] border hairline border-cream/20 bg-cream/[0.03]">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="eyebrow text-cream/40">Preview locked</p>
          </div>
        </div>
      </div>
    </section>
  );
}
