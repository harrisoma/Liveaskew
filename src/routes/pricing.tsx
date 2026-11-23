import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "@/site/PricingPage";
import { pageMeta } from "@/site/seo";

export const Route = createFileRoute("/pricing")({
  head: () =>
    pageMeta({
      title: "Pricing | LiveAskew",
      description:
        "Pricing for every LiveAskew service: Bee app memberships from $20/month with 14 days free, styling and consulting by consultation, and the Design Studio at $199/month.",
      path: "/pricing",
    }),
  component: PricingPage,
});
