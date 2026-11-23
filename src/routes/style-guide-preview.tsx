import { createFileRoute } from "@tanstack/react-router";
import { StyleGuidePreview } from "@/mobile/StyleGuidePreview";

export const Route = createFileRoute("/style-guide-preview")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex,nofollow" },
      { title: "Sample Style Guide | LiveAskew" },
    ],
  }),
  component: StyleGuidePreview,
});
