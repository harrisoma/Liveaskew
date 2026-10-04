import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/site/Landing";
import { APP, FAQ_PAGE, SITE_DESCRIPTION, SITE_TITLE, jsonLd, pageMeta } from "@/site/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    ...pageMeta({ title: SITE_TITLE, description: SITE_DESCRIPTION, path: "/" }),
    scripts: [jsonLd(APP), jsonLd(FAQ_PAGE)],
  }),
  component: Landing,
});
