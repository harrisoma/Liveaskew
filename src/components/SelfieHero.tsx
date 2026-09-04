import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { hasEntitlement } from "@/lib/plans";
import { getPhotorealHero, generatePhotorealHero } from "@/lib/photoreal-hero.functions";
import type { MyStyleGuide } from "@/lib/my-style-guide.functions";

type Props = {
  tier: string | null;
  data: MyStyleGuide;
};

type HeroLook = {
  id?: string;
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

function buildHeroPrompt(hero: HeroLook): string {
  const p = hero.pieces ?? {};
  const parts = [p.top, p.bottom, p.layer, p.shoe, p.accessory].filter(
    (s): s is string => !!s && s.trim().length > 0,
  );
  const outfit = parts.length ? parts.join(", ") : "the look Bee selected";
  const occasion = hero.occasion ? ` for ${hero.occasion}` : "";
  return `Wearing ${outfit}. Editorial full-length fashion photograph${occasion}.`;
}

export function SelfieHero({ tier, data }: Props) {
  const canSelfie = hasEntitlement(tier, "selfieAI");
  const selfiePath = data.profile?.selfie_photo_path ?? null;
  const heroes = (data.styleProfile?.looks?.heroes ?? []) as HeroLook[];
  const displayName = data.displayName ?? "You";
  const [unlocked, setUnlocked] = useState(1);

  if (!canSelfie) return <UpgradeHero />;

  if (!selfiePath || heroes.length === 0) {
    return (
      <EmptyHero
        cta={
          !selfiePath
            ? { label: "Add your photo →", to: "/profile" }
            : { label: "Compose your looks →", to: "/my-style-guide" }
        }
        headline={!selfiePath ? "See yourself in every look." : "Compose your looks first."}
        body={
          !selfiePath
            ? "Add one full-length photo and Bee renders every look on you."
            : "Once Bee's looks are composed, we style you into each one — same body, same proportions."
        }
      />
    );
  }

  return (
    <section className="w-full bg-ink text-cream">
      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-12 pb-4">
        <p className="eyebrow text-gold">Looks on you</p>
        <h1 className="font-display mt-3 text-4xl md:text-5xl leading-[1.05] text-cream">
          {displayName}, every fit Bee selected.
        </h1>
        <p className="mt-3 max-w-lg text-sm text-cream/75 leading-relaxed">
          Each render uses your selfie as identity. We never slim, smooth, or change your
          proportions.
        </p>
      </div>
      <div className="flex flex-col">
        {heroes.map((hero, index) =>
          hero.id ? (
            <PhotorealHero
              key={hero.id}
              heroId={hero.id}
              prompt={buildHeroPrompt(hero)}
              heroName={hero.name ?? `Look ${index + 1}`}
              occasion={hero.occasion ?? ""}
              displayName={displayName}
              index={index}
              total={heroes.length}
              allowGenerate={index === 0 || unlocked > index}
              onSettled={() => setUnlocked((n) => Math.max(n, index + 2))}
            />
          ) : null,
        )}
      </div>
    </section>
  );
}

function PhotorealHero({
  heroId,
  prompt,
  heroName,
  occasion,
  displayName,
  index,
  total,
  allowGenerate,
  onSettled,
}: {
  heroId: string;
  prompt: string;
  heroName: string;
  occasion: string;
  displayName: string;
  index: number;
  total: number;
  allowGenerate: boolean;
  onSettled: () => void;
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

  useEffect(() => {
    if (cached.isSuccess && cached.data?.url) {
      onSettled();
      return;
    }
    if (
      allowGenerate &&
      cached.isSuccess &&
      !cached.data?.url &&
      !gen.isPending &&
      !gen.data?.url &&
      !gen.isError
    ) {
      gen.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowGenerate, cached.isSuccess, cached.data]);

  useEffect(() => {
    if (gen.isSuccess || gen.isError) onSettled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gen.isSuccess, gen.isError]);

  const imageUrl = cached.data?.url ?? gen.data?.url ?? null;
  const loading =
    cached.isLoading || (!imageUrl && gen.isPending) || (!imageUrl && !cached.data && !gen.isError);

  if (gen.isError && !imageUrl) {
    return (
      <HeroFrame>
        <div className="flex h-full flex-col items-start justify-end gap-3 p-10">
          <p className="eyebrow text-cream/70">
            Look {index + 1} of {total}
          </p>
          <h2 className="font-display max-w-md text-3xl leading-tight text-cream">
            We couldn't render {heroName}.
          </h2>
          <p className="max-w-sm text-sm text-cream/70">
            Bee's studio hit a snag. Give it another try.
          </p>
          <button
            type="button"
            onClick={() => gen.mutate()}
            className="mt-2 bg-cream px-6 py-3 text-[11px] tracking-[0.22em] text-ink uppercase transition-colors hover:bg-cream/90"
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
        <div className="flex h-full flex-col items-start justify-end gap-3 p-10">
          <p className="eyebrow text-cream/70">
            Look {index + 1} of {total}
          </p>
          <h2 className="font-display max-w-md text-3xl leading-tight text-cream italic">
            Styling you into {heroName}…
          </h2>
          <p className="max-w-sm text-sm text-cream/70">
            Bee is dressing you in this look. Cached after the first render.
          </p>
        </div>
      </HeroFrame>
    );
  }

  return (
    <div className="relative w-full">
      <div className="grid md:grid-cols-[1.4fr_1fr]">
        <div className="relative bg-ink">
          <img
            src={imageUrl}
            alt={`${displayName} styled in ${heroName}`}
            className="h-full max-h-[86vh] w-full object-cover object-top"
          />
        </div>
        <div className="flex flex-col justify-end gap-4 bg-ink p-8 md:p-12">
          <p className="eyebrow text-gold">
            Look {index + 1} of {total} · rendered on you
          </p>
          <h2 className="font-display text-4xl leading-[1.05] text-cream md:text-5xl">
            {displayName},
            <br />
            <span className="italic text-gold">{heroName}.</span>
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-cream/75">
            {occasion}. This is you, styled — not a stock illustration.
          </p>
          <div className="mt-2 h-px w-16 bg-gold/60" />
          <p className="text-xs tracking-wide text-cream/50">Powered by your Gold membership</p>
        </div>
      </div>
    </div>
  );
}

function HeroFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full bg-ink text-cream">
      <div className="mx-auto min-h-[60vh] max-w-6xl md:min-h-[70vh]">{children}</div>
    </div>
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
      <div className="mx-auto max-w-6xl px-6 py-16 md:px-12 md:py-24">
        <div className="flex flex-col items-start gap-6 border hairline bg-cream p-10 md:p-16">
          <p className="eyebrow text-ink/50">Your looks on you</p>
          <h1 className="font-display max-w-2xl text-4xl leading-[1.02] text-ink md:text-6xl">
            {headline}
          </h1>
          <p className="max-w-md text-base leading-relaxed text-ink/70 md:text-lg">{body}</p>
          <Link
            to={cta.to}
            className="mt-2 inline-flex items-center bg-ink px-8 py-4 text-sm tracking-[0.22em] text-cream uppercase transition-colors hover:bg-ink/90"
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
    <section className="relative w-full overflow-hidden bg-ink text-cream">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 blur-2xl"
        style={{
          background:
            "radial-gradient(1200px 500px at 30% 40%, oklch(0.78 0.14 78 / 0.55), transparent 60%), radial-gradient(900px 400px at 80% 70%, oklch(0.65 0.18 30 / 0.35), transparent 65%)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:px-12 md:py-28">
        <div className="flex flex-col gap-5">
          <p className="eyebrow text-gold">Gold membership</p>
          <h1 className="font-display max-w-lg text-4xl leading-[1.02] text-cream md:text-6xl">
            Step inside your own <span className="italic text-gold">lookbook.</span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-cream/75 md:text-lg">
            Gold renders every look on your own face — see yourself styled, not a stock
            illustration.
          </p>
          <Link
            to="/pricing"
            className="mt-3 inline-flex items-center self-start bg-gold px-8 py-4 text-sm tracking-[0.22em] text-ink uppercase transition-colors hover:bg-gold/90"
          >
            Unlock with Gold →
          </Link>
        </div>
        <div className="relative hidden aspect-[3/4] border hairline border-cream/20 bg-cream/[0.03] md:block">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="eyebrow text-cream/40">Preview locked</p>
          </div>
        </div>
      </div>
    </section>
  );
}
