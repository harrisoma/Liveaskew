import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/site/SiteFrame";
import { HIVE_NETWORKS, HIVE_ROOMS } from "@/lib/hive";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LiveAskew — Bee, The Hive, and Buzz" },
      {
        name: "description",
        content:
          "LiveAskew is three products: Bee, the styling app; The Hive, one community across X, Telegram, Facebook, and Instagram; and Buzz, which posts your style everywhere, every day, with a new message.",
      },
      { property: "og:title", content: "LiveAskew — Bee, The Hive, and Buzz" },
      {
        property: "og:description",
        content:
          "Bee styles you. The Hive is the room. Buzz posts the look to every platform, every day, in different words.",
      },
    ],
  }),
  component: HomePage,
});

const PRODUCTS = [
  {
    id: "bee",
    kicker: "01 — Styling app",
    name: "Bee",
    line: "Your stylist. Fit, Feel, and Fabric — on the web, iPhone, and Android.",
    points: [
      "Bee interviews you, then dresses the body you have.",
      "Looks stay on your proportions. Nothing is slimmed or smoothed.",
      "Silver through 1-on-1 Live Bee, when you want a human stylist.",
    ],
    href: "/app",
    cta: "Open Bee",
  },
  {
    id: "hive",
    kicker: "02 — Community",
    name: "The Hive",
    line: "One app for the rooms that used to live on four networks.",
    points: [
      "X, Telegram, Facebook, and Instagram, in one place.",
      "Motherhood, style, everyday life, and editorial.",
      "Clients talk to each other. Bee does not have to be in every thread.",
    ],
    href: "/hive",
    cta: "Enter The Hive",
  },
  {
    id: "buzz",
    kicker: "03 — Posting",
    name: "Buzz",
    line: "Upload the photo. Say what to put you in. Buzz posts it everywhere.",
    points: [
      "One image, one instruction, four platforms.",
      "X, Instagram, Facebook, and Telegram each get their own line.",
      "Every day, the same style goes out again with a different message.",
    ],
    href: "/buzz",
    cta: "Open Buzz",
  },
] as const;

function HomePage() {
  return (
    <SiteFrame>
      <section className="mx-auto max-w-[1100px] px-6 pt-16 pb-10 md:pt-24">
        <p className="eyebrow">LiveAskew</p>
        <h1 className="font-display mt-4 max-w-3xl text-5xl leading-[1.05] md:text-6xl">
          Three products. One house.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80">
          Bee styles you. The Hive is where clients talk. Buzz takes the look and posts it — today,
          and again tomorrow, in different words.
        </p>
      </section>

      <section className="mx-auto grid max-w-[1100px] gap-5 px-6 pb-16 md:grid-cols-3">
        {PRODUCTS.map((product) => (
          <article id={product.id} key={product.id} className="rounded-[2rem] bg-cream p-6 shadow-neo">
            <p className="eyebrow">{product.kicker}</p>
            <h2 className="font-display mt-3 text-4xl">{product.name}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/80">{product.line}</p>
            <ul className="mt-5 space-y-2 text-sm leading-relaxed">
              {product.points.map((point) => (
                <li key={point}>· {point}</li>
              ))}
            </ul>
            <a href={product.href} className="neo-btn-ink mt-6">
              {product.cta}
            </a>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-[1100px] px-6 pb-20">
        <div className="rounded-[2rem] bg-cream p-6 shadow-neo-inset md:p-10">
          <p className="eyebrow">The Hive, in short</p>
          <h2 className="font-display mt-3 text-3xl">One room. Four networks.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/80">
            {HIVE_NETWORKS.join(", ")}. The conversation stays in The Hive — motherhood, style, the
            everyday, and editorial — instead of scattering across apps.
          </p>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {HIVE_ROOMS.map((room) => (
              <li key={room.id} className="rounded-[1.5rem] bg-cream px-4 py-4 shadow-neo">
                <p className="font-display text-2xl">{room.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/75">{room.line}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteFrame>
  );
}
