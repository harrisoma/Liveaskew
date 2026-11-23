import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/site/HomePage";
import { SITE_DESCRIPTION, SITE_TITLE, pageMeta } from "@/site/seo";

export const Route = createFileRoute("/")({
  head: () => pageMeta({ title: SITE_TITLE, description: SITE_DESCRIPTION, path: "/" }),
  component: HomePage,
});
