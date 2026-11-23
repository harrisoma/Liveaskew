import { createFileRoute } from "@tanstack/react-router";
import { BookPage } from "@/site/BookPage";
import { pageMeta } from "@/site/seo";

export const Route = createFileRoute("/book")({
  head: () =>
    pageMeta({
      title: "Book a Consultation | LiveAskew",
      description:
        "Request a consultation for personal styling, business consulting, the Design Studio or the Bee app. We'll follow up to set a time.",
      path: "/book",
    }),
  component: BookPage,
});
