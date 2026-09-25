import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/site/SiteFrame";
import { HoneyBoard } from "@/components/site/HoneyBoard";

export const Route = createFileRoute("/honey")({
  head: () => ({
    meta: [
      { title: "Honey — LiveAskew" },
      {
        name: "description",
        content:
          "Honey is the calendar. Schedule the event, the meeting, and the social post, and see the hour it hits.",
      },
    ],
  }),
  component: HoneyPage,
});

function HoneyPage() {
  return (
    <SiteFrame>
      <section className="mx-auto max-w-[1100px] px-6 pt-36 pb-20">
        <p className="text-[0.68rem] tracking-[0.28em] uppercase text-[#b8860b]">Honey</p>
        <h1 className="font-display mt-3 text-5xl leading-[0.95] md:text-6xl">
          The day, in one place.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed">
          Schedule the event, the meeting, and the post. Honey holds the day the way a calendar
          does, and it records the social post and the hour it hits.
        </p>
        <div className="mt-8">
          <HoneyBoard />
        </div>
      </section>
    </SiteFrame>
  );
}
