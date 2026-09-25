import { createFileRoute } from "@tanstack/react-router";
import { PriceBook } from "@/components/site/PriceBook";
import { SiteFrame } from "@/components/site/SiteFrame";
import { SocialMarks, type SocialId } from "@/components/site/SocialMarks";
import heroEditorial from "@/assets/hero-editorial.jpg";
import beeHoldingApp from "@/assets/bee-holding-app.jpg";
import hiveGathering from "@/assets/hive-gathering.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { name: "theme-color", content: "#ffffff" },
      { title: "LiveAskew" },
      {
        name: "description",
        content:
          "LiveAskew dresses the day a working mother actually has. Bee builds the look from her body and her closet. The Hive is the conversation.",
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
      "A warm, unified space for motherhood, style, work, everyday life, and what's next. No juggling five apps. No performing perfect. Just real women, real wardrobes, real work. Sign in from any platform, follow each other, and build a social presence.",
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
        title: "Follow from any platform",
        text: "She signs in with Instagram, Facebook, TikTok, Google, or Apple, follows the women in the room, and builds her presence from there.",
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
              it through.
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
                      {product.id === "hive" ? (
                        <h2 className="font-display text-4xl leading-[0.95] text-white md:text-5xl">
                          One community.
                          <br />
                          Every side
                          <br />
                          of you.
                        </h2>
                      ) : (
                        <h2 className="font-display text-5xl leading-none text-white md:text-6xl">
                          {product.name}
                        </h2>
                      )}
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

      <section id="honey" className="scroll-mt-32 bg-white">
        <div className="mx-auto max-w-[1180px] px-5 pt-16 md:px-8 md:pt-20">
          <article className="glass overflow-hidden rounded-[2rem] md:grid md:min-h-[560px] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="flex items-center px-7 py-10 md:px-12 md:py-12">
              <div className="glass max-w-xl rounded-[2rem] px-7 py-8 text-black md:px-10 md:py-10">
                <div className="flex items-center gap-4">
                  <img src="/honey-mark.svg" alt="" className="h-14 w-14 rounded-full" />
                  <div>
                    <p className="text-[0.62rem] tracking-[0.22em] uppercase text-[#b8860b]">
                      03 — The calendar
                    </p>
                    <h2 className="font-display text-4xl leading-none text-black md:text-6xl">
                      Honey
                    </h2>
                  </div>
                </div>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-black">
                  Schedule the event, the meeting, and the post. Honey holds the day the way a
                  calendar does, and it records the social post and the hour it hits.
                </p>
              </div>
            </div>
            <div className="flex items-center px-6 py-8 md:px-8">
              <ul className="grid w-full gap-3">
                <li className="glass rounded-[1.4rem] px-5 py-4 text-black">
                  <p className="text-[0.62rem] tracking-[0.18em] uppercase text-[#b8860b]">
                    3:00 · Event
                  </p>
                  <p className="mt-1 font-display text-2xl">School pickup</p>
                </li>
                <li className="glass rounded-[1.4rem] px-5 py-4 text-black">
                  <p className="text-[0.62rem] tracking-[0.18em] uppercase text-[#b8860b]">
                    11:00 · Meeting
                  </p>
                  <p className="mt-1 font-display text-2xl">Stylist meeting</p>
                </li>
                <li className="glass rounded-[1.4rem] px-5 py-4 text-black">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.62rem] tracking-[0.18em] uppercase text-[#b8860b]">
                      9:00 · Post · Hit
                    </p>
                    <SocialMarks ids={["instagram"]} />
                  </div>
                  <p className="mt-1 font-display text-2xl">The boardroom look</p>
                </li>
              </ul>
            </div>
          </article>
        </div>
        <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8 md:py-16">
          <ul className="grid gap-4 md:grid-cols-2">
            <li className="glass rounded-[1.6rem] px-6 py-6 text-black">
              <h3 className="font-display text-2xl leading-tight">Upcoming events</h3>
              <p className="mt-3 text-sm leading-relaxed">
                The school run, the dinner, the thing already on the day.
              </p>
            </li>
            <li className="glass rounded-[1.6rem] px-6 py-6 text-black">
              <h3 className="font-display text-2xl leading-tight">Meetings</h3>
              <p className="mt-3 text-sm leading-relaxed">
                A meeting sits on the hour, with the room and the reason.
              </p>
            </li>
            <li className="glass rounded-[1.6rem] px-6 py-6 text-black">
              <h3 className="font-display text-2xl leading-tight">Social posting schedule</h3>
              <p className="mt-3 text-sm leading-relaxed">
                The post lands on the same calendar, with the network and the hour.
              </p>
            </li>
            <li className="glass rounded-[1.6rem] px-6 py-6 text-black">
              <h3 className="font-display text-2xl leading-tight">When it hits</h3>
              <p className="mt-3 text-sm leading-relaxed">
                A post that has gone out is marked. The hour it hit stays on the day.
              </p>
            </li>
          </ul>
          <a href="/honey" className="glass-btn mt-8">
            Open Honey
          </a>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-32 bg-white px-5 py-20 md:px-8 md:py-28">
        <PriceBook />
      </section>
    </SiteFrame>
  );
}
