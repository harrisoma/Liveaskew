import { createFileRoute } from "@tanstack/react-router";
import { PriceBook } from "@/components/site/PriceBook";
import { SiteFrame } from "@/components/site/SiteFrame";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "LiveAskew Pricing" },
      {
        name: "description",
        content:
          "Open the LiveAskew price book. Each plan shows its price on one page and its features on the other.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <SiteFrame>
      <section className="bg-white px-5 pt-36 pb-20 md:px-8 md:pt-40 md:pb-28">
        <PriceBook />
      </section>
    </SiteFrame>
  );
}
