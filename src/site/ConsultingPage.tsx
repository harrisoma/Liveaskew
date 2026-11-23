import { SiteFrame } from "./chrome";
import { BookingBand, ItemGrid, PageHero, SectionHeading, Steps } from "./ui";

export function ConsultingPage() {
  return (
    <SiteFrame current="/consulting">
      <PageHero
        eyebrow="Business Consulting"
        title="Your brand, styled with intention."
        intro={
          <p>
            We bring a stylist's eye to companies and brands — how you look, how you show up and how
            you sell. Strategy, image and marketing that feel like you.
          </p>
        }
        actions={
          <>
            <a href="/book?service=consulting" className="la-btn la-btn-dark">
              Book a Consultation <span aria-hidden>→</span>
            </a>
            <a href="/design-studio" className="la-btn la-btn-light">
              See the Design Studio
            </a>
          </>
        }
      />

      <section className="la-section">
        <div className="mx-auto max-w-[1320px]">
          <SectionHeading
            eyebrow="What we help with"
            title="From first impression to every post."
          />
          <ItemGrid
            columns={2}
            items={[
              {
                title: "Brand image & positioning",
                text: "Define how your brand should look and feel, then make every touchpoint match — from your storefront to your team.",
              },
              {
                title: "Marketing & content",
                text: "Campaign ideas, shoot direction and social content that show your product the way it deserves to be seen.",
              },
              {
                title: "Team & on-camera styling",
                text: "Style the people who represent you — founders, staff and talent — for events, shoots and everyday presence.",
              },
              {
                title: "Retail & product strategy",
                text: "Guidance on what to make, how to present it and how to tell its story so it sells.",
              },
            ]}
          />
        </div>
      </section>

      <section className="la-section la-panel">
        <div className="mx-auto max-w-[1320px]">
          <SectionHeading eyebrow="How we work" title="A simple start." />
          <Steps
            steps={[
              {
                title: "Consultation",
                text: "We learn your goals, your audience and where your brand stands today.",
              },
              {
                title: "Plan",
                text: "You get a clear recommendation and scope, built around your budget and timeline.",
              },
              {
                title: "Deliver",
                text: "We do the work with you — and bring in the Design Studio when you need it made.",
              },
            ]}
          />
        </div>
      </section>

      <BookingBand
        title="Let's talk about your brand."
        text="Tell us about your company and what you're working toward. We'll follow up to set a time."
        service="consulting"
      />
    </SiteFrame>
  );
}
