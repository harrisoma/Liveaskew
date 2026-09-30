import { ArrowRight, Sparkles } from "lucide-react";
import flatlay from "@/assets/brand/flatlay.webp";
import hiveGathering from "@/assets/brand/hive-gathering.webp";
import { dayLabel, sortHoney, type HoneyItem } from "@/lib/honey";
import { Crest, type CrestName } from "../components/Crest";
import { NeoButton } from "../components/ui";
import { lookPhoto, type GuideLook } from "../lib/storage";

type Destination = "bee" | "honey" | "buzz" | "hive";

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * The LiveAskew home: today's look, what's next on Honey, and one door into each of
 * Bee, Honey, Buzz, and the Hive. Everything shown is the person's own data.
 */
export function TodayScreen({
  now,
  today,
  looks,
  selfie,
  honey,
  dressingId,
  buzzConnected,
  onOpen,
  onOpenLook,
  onDressMe,
}: {
  now: Date;
  today: string;
  looks: GuideLook[];
  selfie: string | null;
  honey: HoneyItem[];
  dressingId: string | null;
  /** null = not signed in; otherwise the number of connected social accounts. */
  buzzConnected: number | null;
  onOpen: (to: Destination) => void;
  onOpenLook: (look: GuideLook) => void;
  onDressMe: (item: HoneyItem) => void;
}) {
  const saved = looks.filter((l) => l.saved);
  const look = saved[0] ?? looks[0] ?? null;
  const upcoming = sortHoney(honey).filter((h) => h.date >= today);
  const next = upcoming.filter((h) => h.kind !== "post").slice(0, 3);
  const week = new Date(`${today}T00:00:00`);
  week.setDate(week.getDate() + 7);
  const weekEnd = week.toISOString().slice(0, 10);
  const thisWeek = upcoming.filter((h) => h.date <= weekEnd && h.kind !== "post").length;
  const scheduled = upcoming.filter(
    (h) => h.kind === "post" && h.postStatus === "scheduled",
  ).length;
  const dressedLook = (item: HoneyItem) => looks.find((l) => l.id === item.lookId) ?? null;

  const tiles: { crest: CrestName; to: Destination; title: string; line: string }[] = [
    {
      crest: "bee",
      to: "bee",
      title: "Bee",
      line:
        saved.length > 0
          ? `${saved.length} saved look${saved.length === 1 ? "" : "s"}`
          : "Your stylist",
    },
    {
      crest: "honey",
      to: "honey",
      title: "Honey",
      line: thisWeek > 0 ? `${thisWeek} this week` : "Your days",
    },
    {
      crest: "buzz",
      to: "buzz",
      title: "Buzz",
      line:
        scheduled > 0
          ? `${scheduled} post${scheduled === 1 ? "" : "s"} scheduled`
          : buzzConnected
            ? `${buzzConnected} account${buzzConnected === 1 ? "" : "s"} connected`
            : "Share your looks",
    },
    { crest: "hive", to: "hive", title: "The Hive", line: "Talk it through" },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-5">
      <p className="la-kicker">
        {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </p>
      <h1 className="la-display mt-1 text-[2.125rem] leading-[1.1] font-bold">{greeting(now)}.</h1>

      {/* Today's look */}
      <section className="la-hero mt-5 aspect-[4/5]" aria-label="Today's look">
        <img
          src={(look && lookPhoto(look, selfie)) || flatlay}
          alt={
            look && lookPhoto(look, selfie)
              ? `${look.title} on you`
              : "A look laid out on the bed, ready to wear"
          }
        />
        <div className="la-hero-shade" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="la-kicker la-gold">{look ? "Today's look" : "Your Style Guide"}</p>
          <h2 className="la-display mt-1 text-[1.75rem] leading-tight font-bold">
            {look ? look.title : "Dressed for the day you actually have"}
          </h2>
          {look ? (
            <>
              <p className="mt-2 text-sm leading-relaxed opacity-90">
                {look.formula.slice(0, 3).join(" · ")}
              </p>
              <div className="mt-3 flex items-center gap-2" aria-hidden>
                {look.palette.map((c) => (
                  <span key={c} className="la-swatch" style={{ background: c }} />
                ))}
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm leading-relaxed opacity-90">
              Fit, Feel, and Fabric — on your body, never a retouched one.
            </p>
          )}
          <NeoButton
            variant="gold"
            className="mt-4"
            onClick={() => (look ? onOpenLook(look) : onOpen("bee"))}
          >
            {look ? "Open in Bee" : "Build my looks"} <ArrowRight size={16} aria-hidden />
          </NeoButton>
        </div>
      </section>

      {/* Next on Honey */}
      <section className="mt-6" aria-label="Next on Honey">
        <div className="flex items-center justify-between">
          <p className="la-kicker">Next on Honey</p>
          <button type="button" className="text-sm font-semibold" onClick={() => onOpen("honey")}>
            See all
          </button>
        </div>
        {next.length === 0 ? (
          <button
            type="button"
            className="neo-raised mt-2 flex w-full items-center gap-3 p-4 text-left text-sm"
            onClick={() => onOpen("honey")}
          >
            <Crest name="honey" size={40} decorative />
            <span>
              Nothing planned yet. Connect your calendar and Bee dresses you for each day.
            </span>
          </button>
        ) : (
          <ul className="mt-2 space-y-3">
            {next.map((item) => {
              const dressed = dressedLook(item);
              return (
                <li key={item.id} className="neo-raised p-4 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold">{item.title}</p>
                    <p className="shrink-0 opacity-70">
                      {dayLabel(item.date, today)}
                      {item.time ? ` · ${item.time}` : ""}
                    </p>
                  </div>
                  {dressed ? (
                    <p className="mt-2 opacity-80">
                      <span className="font-semibold" style={{ color: "var(--gold)" }}>
                        Wearing:
                      </span>{" "}
                      {dressed.title}
                    </p>
                  ) : item.beeNote ? (
                    <p className="mt-2 opacity-80">{item.beeNote}</p>
                  ) : (
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1 font-semibold"
                      style={{ color: "var(--gold)" }}
                      disabled={dressingId !== null}
                      onClick={() => onDressMe(item)}
                    >
                      <Sparkles size={14} aria-hidden />
                      {dressingId === item.id ? "Bee is dressing you…" : "Dress me for this"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* One door into each product */}
      <section className="mt-6 grid grid-cols-2 gap-4" aria-label="LiveAskew">
        {tiles.map((t) => (
          <button
            key={t.crest}
            type="button"
            className="neo-raised flex flex-col items-start gap-3 p-4 text-left"
            onClick={() => onOpen(t.to)}
          >
            <Crest name={t.crest} size={52} decorative />
            <span>
              <span className="la-display block text-base font-semibold">{t.title}</span>
              <span className="block text-sm opacity-70">{t.line}</span>
            </span>
          </button>
        ))}
      </section>

      {/* The Hive */}
      <button
        type="button"
        className="la-hero mt-6 block aspect-[16/10] w-full text-left"
        onClick={() => onOpen("hive")}
      >
        <img src={hiveGathering} alt="Women laughing together on a sofa in soft daylight" />
        <span className="la-hero-shade" />
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <span>
            <span className="la-kicker la-gold block">The Hive</span>
            <span className="la-display block text-lg font-semibold">
              One community, every side of you.
            </span>
          </span>
          <Crest name="hive" size={44} decorative />
        </span>
      </button>

      <div className="la-rule mt-8" />
      <p className="mt-4 text-center text-sm leading-relaxed">
        <span className="la-display font-semibold">Fit · Feel · Fabric</span>
        <br />
        Clothes follow your body. We never alter it.
      </p>
    </div>
  );
}
