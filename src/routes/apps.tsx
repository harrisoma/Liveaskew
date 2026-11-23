import { createFileRoute } from "@tanstack/react-router";
import { AppsPage } from "@/site/AppsPage";
import { APP, APP_DESCRIPTION, APP_TITLE, FAQ_PAGE, jsonLd, pageMeta } from "@/site/seo";

export const Route = createFileRoute("/apps")({
  head: () => ({
    ...pageMeta({ title: APP_TITLE, description: APP_DESCRIPTION, path: "/apps" }),
    scripts: [jsonLd(APP), jsonLd(FAQ_PAGE)],
  }),
  component: AppsPage,
});
