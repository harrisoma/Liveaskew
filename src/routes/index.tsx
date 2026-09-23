import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/site/SiteFrame";
import heroEditorial from "@/assets/hero-editorial.jpg";
import heroStylist from "@/assets/hero-stylist.jpg";
import hivePortrait from "@/assets/women/woman-01.jpg";
import buzzCloth from "@/assets/formulas/formula-quiet-luxury.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { name: "theme-color", content: "#ffffff" },
      { title: "LiveAskew" },
      {
        name: "description",
        content:
          "LiveAskew is the house. Bee is the styling app. The Hive is the community. Buzz posts your style. Enter the app from here — it is its own place.",
      },
      { property: "og:title", content: "LiveAskew" },
      { property: "og:image", content: "/liveaskew-signature.png" },
    ],
    links: [{ rel: "icon", href: "/liveaskew-signature.png", type: "image/png" }],
  }),
  component: HomePage,
});

const PRODUCTS = [
  {
    id: "bee",
    kicker: "The app",
    name: "Bee",
    line: "The stylist for working mothers. Maternity to the boardroom. Its own app.",
    href: "/app",
    cta: "Enter Bee",
    image: heroStylist,
    alt: "A stylist at a sunlit table, reviewing a sketch with a client",
    mark: "/bee-logo-192.png",
  },
  {
    id: "hive",
    kicker: "The community",
    name: "The Hive",
    line: "One community. Google, Apple, Instagram, Facebook, and TikTok, then the same rooms.",
    href: "/hive",
    cta: "Enter The Hive",
    image: hivePortrait,
    alt: "A woman in a black blazer and gold jewelry, seated in warm light",
    mark: "/hive-logo.png",
  },
  {
    id: "buzz",
    kicker: "The posting service",
    name: "Buzz",
    line: "Bee sends the look. Buzz schedules it across Instagram, TikTok, Pinterest, Facebook, and LinkedIn.",
    href: "/buzz",
    cta: "Enter Buzz",
    image: buzzCloth,
    alt: "An ivory silk blouse with black trousers and a textured gold jacket",
    mark: "/buzz-logo.png",
  },
] as const;

function HomePage() {
  return (
    <SiteFrame>
      <section className="relative min-h-[100svh]">
        <img
          src={heroEditorial}
          alt="A woman in a cream silk blouse and black tailored trousers, hand on hip"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/25" />
        <div className="relative z-10 flex min-h-[100svh] items-end px-5 pt-28 pb-12 md:items-center md:px-16 md:pb-16">
          <div className="glass-dark max-w-xl rounded-[2rem] px-7 py-8 md:px-10 md:py-10">
            <img
              src="/liveaskew-signature.png"
              alt="LiveAskew"
              className="h-28 w-auto md:h-36"
              style={{ aspectRatio: "788 / 1570" }}
            />
            <p className="mt-5 text-[0.68rem] tracking-[0.28em] uppercase text-[#b8860b]">
              LiveAskew
            </p>
            <h1 className="font-display mt-3 text-5xl leading-[0.95] text-white md:text-7xl">
              Bee. The Hive. Buzz.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white">
              The house is here. Bee, the styling app, has its own pages. Enter it when you want to
              be dressed.
            </p>
            <a href="/app" className="glass-btn mt-7">
              Enter the app
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1180px] gap-6 px-5 py-16 md:grid-cols-3 md:py-24">
        {PRODUCTS.map((product) => (
          <article
            id={product.id}
            key={product.id}
            className="group overflow-hidden rounded-[1.75rem]"
          >
            <a href={product.href} className="relative block min-h-[460px]">
              <img
                src={product.image}
                alt={product.alt}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="glass absolute inset-x-4 bottom-4 rounded-[1.4rem] p-5 text-black">
                <div className="flex items-center gap-3">
                  {product.mark && (
                    <img src={product.mark} alt="" className="h-10 w-10 rounded-full" />
                  )}
                  <div>
                    <p className="text-[0.62rem] tracking-[0.22em] uppercase text-[#b8860b]">
                      {product.kicker}
                    </p>
                    <h2 className="font-display text-3xl leading-none">{product.name}</h2>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed">{product.line}</p>
                <p className="mt-4 text-[0.68rem] tracking-[0.18em] uppercase text-[#b8860b]">
                  {product.cta}
                </p>
              </div>
            </a>
          </article>
        ))}
      </section>
    </SiteFrame>
  );
}
