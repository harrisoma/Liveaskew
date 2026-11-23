import { createFileRoute } from "@tanstack/react-router";
import { DesignStudioPage } from "@/site/DesignStudioPage";
import { pageMeta } from "@/site/seo";

export const Route = createFileRoute("/design-studio")({
  head: () =>
    pageMeta({
      title: "Design Studio: Apparel & Brand Design | LiveAskew",
      description:
        "The LiveAskew Design Studio creates apparel, merchandise and visual identity for brands and companies. Start a design project.",
      path: "/design-studio",
    }),
  component: DesignStudioPage,
});
