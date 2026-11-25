import { createFileRoute } from "@tanstack/react-router";
import { AdFormatsPreview } from "@/components/ads/AdFormatsPreview";
export const Route = createFileRoute("/ad-formats")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex,nofollow" }, { title: "Ad formats | LiveAskew" }],
  }),
  component: AdFormatsPreview,
});
