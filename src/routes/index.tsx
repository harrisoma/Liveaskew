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
          "LiveAskew dresses the day a working mother actually has. Bee builds the look from her body and her closet. The Hive is the conversation. Buzz posts it in her words.",
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
    index: "01",
    kicker: "The styling app",
    name: "Bee",
    promise:
      "Bee interviews her before it dresses her. Fit, how she wants to feel, and the cloth. The clothes follow the body she has. The photograph stays the woman in front of it.",
    href: "/app",
    cta: "Enter Bee",
    image: heroStylist,
    alt: "A stylist at a sunlit table, reviewing a sketch with a client",
    mark: "/bee-logo-192.png",
    offers: [
      {
        title: "The day she is actually having",
        text: "A school run and a board meeting are one closet with two jobs. Bee plans the hour in front of her, from maternity through the workday, instead of a mood board.",
      },
      {
        title: "What she already owns",
        text: "The wardrobe is ranked, not replaced. Bee builds the outfit from pieces she has, then names the one thing that is missing.",
      },
      {
        title: "Her, in the look",
        text: "When she wants to see it on herself, Bee renders the outfit on her likeness. The body stays hers.",
      },
      {
        title: "A person, when the brief is bigger",
        text: "1-on-1 Live Bee is a human stylist. The price is negotiated after a conversation. It is not a published rate.",
      },
    ],
  },
  {
    id: "hive",
    index: "02",
    kicker: "The community",
    name: "The Hive",
    promise:
      "The Hive is the conversation around getting dressed. Motherhood, style, the everyday, and editorial — with the accounts she already uses, kept as one member.",
    href: "/hive",
    cta: "Enter The Hive",
    image: hivePortrait,
    alt: "A woman in a black blazer and gold jewelry, seated in warm light",
    mark: "/hive-logo.png",
    offers: [
      {
        title: "One member, five doors",
        text: "Google, Apple, Instagram, Facebook, and TikTok sign her in. The same email keeps them as one member.",
      },
      {
        title: "Rooms with a subject",
        text: "Motherhood, style, everyday life, and editorial. A circle for the group, and a direct message when it is just two people.",
      },
      {
        title: "Challenges, not a stranger's feed",
        text: "Style challenges sit with women dressing the same kind of week — school, work, weather, a cloth that has to hold.",
      },
      {
        title: "Follow leaves the house",
        text: "A follow opens her profile on the platform she came from.",
      },
    ],
  },
  {
    id: "buzz",
    index: "03",
    kicker: "The posting service",
    name: "Buzz",
    promise:
      "Buzz posts the look. She can use it alone. Upload a photo, say what to put her in, and the caption starts from what she has already said.",
    href: "/buzz",
    cta: "Enter Buzz",
    image: buzzCloth,
    alt: "An ivory silk blouse with black trousers and a textured gold jacket",
    mark: "/buzz-logo.png",
    offers: [
      {
        title: "No other app required",
        text: "Influencers and anyone else upload a look on Buzz and post from here. Bee can still hand a look across when she wants that.",
      },
      {
        title: "Her words, kept",
        text: "A caption begins with what she has told us — a Bee interview when she has one, and anything she teaches Buzz. The next post keeps the lesson.",
      },
      {
        title: "The platforms she already uses",
        text: "Instagram, TikTok, Pinterest, Facebook, and LinkedIn. Each gets its own line. The look stays the same.",
      },
      {
        title: "A different message each day",
        text: "Buzz schedules the post, suggests the hour, and writes hashtags from the life in the caption — school run, boardroom, cloth.",
      },
    ],
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/30" />
        <div className="relative z-10 flex min-h-[100svh] items-end px-5 pt-36 pb-12 md:items-center md:px-16 md:pb-16">
          <div className="glass-dark max-w-xl rounded-[2rem] px-7 py-8 md:px-10 md:py-10">
            <img
              src="/liveaskew-signature.png"
              alt="LiveAskew"
              className="h-28 w-auto md:h-36"
              style={{ aspectRatio: "788 / 1570" }}
            />
            <p className="mt-5 text-[0.68rem] tracking-[0.28em] uppercase text-[#b8860b]">
              The styling house
            </p>
            <h1 className="font-display mt-3 text-5xl leading-[0.95] text-white md:text-7xl">
              Dressed for the day she has.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white">
              LiveAskew is for the woman between a school run and a room that requires a shoulder.
              Bee builds the look from her body and the closet she owns. The Hive is where she talks
              it through. Buzz posts it, in her words.
            </p>
            <a href="#bee" className="glass-btn mt-7">
              See what we offer
            </a>
          </div>
        </div>
      </section>

      {PRODUCTS.map((product) => (
        <section id={product.id} key={product.id} className="scroll-mt-32 bg-white">
          <div className="relative min-h-[78svh]">
            <img
              src={product.image}
              alt={product.alt}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/25" />
            <div className="relative z-10 flex min-h-[78svh] items-end px-5 pt-32 pb-10 md:px-16 md:pb-16">
              <div className="glass-dark max-w-2xl rounded-[2rem] px-7 py-8 md:px-10 md:py-10">
                <div className="flex items-center gap-4">
                  <img src={product.mark} alt="" className="h-14 w-14 rounded-full" />
                  <div>
                    <p className="text-[0.62rem] tracking-[0.22em] uppercase text-[#b8860b]">
                      {product.index} — {product.kicker}
                    </p>
                    <h2 className="font-display text-5xl leading-none text-white md:text-6xl">
                      {product.name}
                    </h2>
                  </div>
                </div>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white">
                  {product.promise}
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8 md:py-16">
            <ul className="grid gap-4 md:grid-cols-2">
              {product.offers.map((offer) => (
                <li key={offer.title} className="glass rounded-[1.6rem] px-6 py-6 text-black">
                  <h3 className="font-display text-2xl leading-tight">{offer.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed">{offer.text}</p>
                </li>
              ))}
            </ul>
            <a href={product.href} className="glass-btn mt-8">
              {product.cta}
            </a>
          </div>
        </section>
      ))}
    </SiteFrame>
  );
}
