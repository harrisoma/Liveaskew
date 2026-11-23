import { SiteFrame } from "./chrome";
import { BookingBand, ItemGrid, PageHero, SectionHeading, Steps } from "./ui";

export function DesignStudioPage() {
  return (
    <SiteFrame current="/design-studio">
      <PageHero
        eyebrow="Design Studio"
        title="Designed to be worn and remembered."
        intro={
          <p>
            The LiveAskew Design Studio creates apparel, merchandise and visual identity for brands
            and companies — with the same eye for fit, feel and fabric we bring to every client.
          </p>
        }
        actions={
          <>
            <a href="/book?service=design-studio" className="la-btn la-btn-dark">
              Start a Design Project <span aria-hidden>→</span>
            </a>
            <a href="/consulting" className="la-btn la-btn-light">
              Business Consulting
            </a>
          </>
        }
      />

      <section className="la-section">
        <div className="mx-auto max-w-[1320px]">
          <SectionHeading eyebrow="What we design" title="Made for your brand." />
          <ItemGrid
            items={[
              {
                title: "Apparel & collections",
                text: "Garments and capsule collections, from concept and fabric choice to fit and finish.",
              },
              {
                title: "Uniforms & merchandise",
                text: "Teamwear and branded pieces people actually want to wear — comfortable, flattering and on-brand.",
              },
              {
                title: "Visual identity",
                text: "Look books, brand styling and art direction so everything you put out looks like it belongs together.",
              },
            ]}
          />
        </div>
      </section>

      <section className="la-section la-panel">
        <div className="mx-auto max-w-[1320px]">
          <SectionHeading eyebrow="The process" title="From idea to finished piece." />
          <Steps
            steps={[
              {
                title: "Brief",
                text: "Share your idea, audience and timeline in a consultation.",
              },
              {
                title: "Design",
                text: "We develop concepts, materials and fits, and refine them with you.",
              },
              {
                title: "Finish",
                text: "You receive final designs ready for production, launch or your next shoot.",
              },
            ]}
          />
        </div>
      </section>

      <BookingBand
        title="Have something in mind?"
        text="Tell us about your project and we'll follow up to plan a design consultation."
        service="design-studio"
      />
    </SiteFrame>
  );
}
