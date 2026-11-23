import { createFileRoute } from "@tanstack/react-router";
import { ConsultingPage } from "@/site/ConsultingPage";
import { pageMeta } from "@/site/seo";

export const Route = createFileRoute("/consulting")({
  head: () =>
    pageMeta({
      title: "Business Consulting for Brands & Companies | LiveAskew",
      description:
        "Brand image, marketing and styling strategy for companies, teams and public-facing people, from the LiveAskew styling team. Book a consultation.",
      path: "/consulting",
    }),
  component: ConsultingPage,
});
