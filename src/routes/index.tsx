import { createFileRoute } from "@tanstack/react-router";
import { PriceBook } from "@/components/site/PriceBook";
import { SiteFrame } from "@/components/site/SiteFrame";
import { SocialMarks, type SocialId } from "@/components/site/SocialMarks";
import heroEditorial from "@/assets/hero-editorial.jpg";
import beeHoldingApp from "@/assets/bee-holding-app.jpg";
import hiveGathering from "@/assets/hive-gathering.jpg";
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
    image: beeHoldingApp,
    alt: "A look laid out on the bed: burgundy sweater, grey trousers, gold mules, scarf, bag, and jewelry, with that look open on the tablet",
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
      "Talk it through. Mothers gather for family, motherhood, relationships, styling, and the everyday of a working life. One member. The accounts she already has.",
    networks: ["instagram", "facebook", "tiktok", "google", "apple"] as SocialId[],
    href: "/hive",
    cta: "Enter The Hive",
    image: hiveGathering,
    alt: "Mothers gathered on a sofa in a bright room, laughing and sipping wine, casually dressed",
    frame: "object-[78%_center]",
    wash: "bg-gradient-to-t from-black/30 via-transparent to-transparent",
    mark: "/hive-logo.png",
    offers: [
      {
        title: "One member, the accounts she has",
        text: "Instagram, Facebook, and TikTok are the rooms. Google and Apple open the door. The same email keeps them as one member.",
        icons: true,
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
      "Grow your presence. Elevate. Uplift. Broadcast to the world. Upload a look, or let Bee hand one across. Buzz writes her line and posts it on the networks she connects.",
    networks: ["instagram", "tiktok", "pinterest", "facebook", "linkedin"] as SocialId[],
    href: "/buzz",
    cta: "Enter Buzz",
    image: buzzCloth,
    alt: "An ivory silk blouse with black trousers and a textured gold jacket",
    mark: "/buzz-logo.png",
    offers: [
      {
        title: "Grow your presence",
        text: "She can use Buzz alone. Upload the photograph, or let Bee hand the look across. The people who already watch her see the cloth.",
      },
      {
        title: "Elevate",
        text: "The caption starts from her own words — a Bee interview when she has one, and anything she teaches Buzz. The next post keeps the lesson.",
      },
      {
        title: "Uplift",
        text: "A different line each day, on the hour that network is awake. School run, boardroom, the cloth she actually wore.",
      },
      {
        title: "Broadcast to the world",
        text: "Instagram, TikTok, Pinterest, Facebook, and LinkedIn. She connects each account once. Buzz posts through that network's own door. No outside scheduler.",
        icons: true,
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
          alt="An African American mother in a tailored black and gold ensemble, standing in a modern interior with thin gold frames of looks"
          className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
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
          {product.id === "bee" ? (
            <div className="mx-auto max-w-[1180px] px-5 pt-28 md:px-8 md:pt-32">
              <article className="relative aspect-[2752/1536] w-full overflow-hidden rounded-[2rem]">
                <img
                  src={product.image}
                  alt={product.alt}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute top-4 left-4 z-10 max-w-[46%] md:top-6 md:left-6">
                  <div className="glass rounded-[2rem] px-5 py-5 text-black md:px-8 md:py-7">
                    <div className="flex items-center gap-4">
                      <img src={product.mark} alt="" className="h-14 w-14 rounded-full" />
                      <div>
                        <p className="text-[0.62rem] tracking-[0.22em] uppercase text-[#b8860b]">
                          {product.index} — {product.kicker}
                        </p>
                        <h2 className="font-display text-4xl leading-none text-black md:text-6xl">
                          {product.name}
                        </h2>
                      </div>
                    </div>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-black md:mt-5 md:text-base">
                      {product.promise}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          ) : (
            <div className="relative min-h-[78svh]">
              <img
                src={product.image}
                alt={product.alt}
                className={`absolute inset-0 h-full w-full object-cover ${"frame" in product ? product.frame : ""}`}
              />
              <div
                className={`absolute inset-0 ${"wash" in product ? product.wash : "bg-gradient-to-t from-black/70 via-black/20 to-black/25"}`}
              />
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
                  {"networks" in product ? <SocialMarks ids={product.networks} /> : null}
                </div>
              </div>
            </div>
          )}

          <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8 md:py-16">
            <ul className="grid gap-4 md:grid-cols-2">
              {product.offers.map((offer) => (
                <li key={offer.title} className="glass rounded-[1.6rem] px-6 py-6 text-black">
                  <h3 className="font-display text-2xl leading-tight">{offer.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed">{offer.text}</p>
                  {"icons" in offer && offer.icons && "networks" in product ? (
                    <SocialMarks ids={product.networks} />
                  ) : null}
                </li>
              ))}
            </ul>
            <a href={product.href} className="glass-btn mt-8">
              {product.cta}
            </a>
          </div>
        </section>
      ))}

      <section id="pricing" className="scroll-mt-32 bg-white px-5 py-20 md:px-8 md:py-28">
        <PriceBook />
      </section>
    </SiteFrame>
  );
}
