import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/site/Landing";

const TITLE = "LiveAskew — Bee, Honey, Buzz, and the Hive";
const DESCRIPTION =
  "Bee styles you, Honey plans your days, Buzz shares your looks, and the Hive talks it through. Clothes follow your body — we never alter it. Free for 14 days.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "https://www.liveaskew.com/" },
    ],
    links: [{ rel: "canonical", href: "https://www.liveaskew.com/" }],
  }),
  component: Landing,
});
