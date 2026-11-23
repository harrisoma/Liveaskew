import { createFileRoute } from "@tanstack/react-router";
import { StartPage } from "@/site/StartPage";
import { pageMeta } from "@/site/seo";

export const Route = createFileRoute("/start")({
  head: () =>
    pageMeta({
      title: "Get Started | LiveAskew",
      description:
        "Choose your path: the Bee styling app, 1-on-1 professional styling, business consulting, or the Design Studio at $199/month.",
      path: "/start",
    }),
  component: StartPage,
});
