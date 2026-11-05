import type { ProductMatches } from "@/lib/shopping-profile";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StyleBlueprintDocument } from "@/mobile/components/StyleBlueprint";
import { GuideLookbook } from "@/mobile/components/GuideLookbook";
import { studioSample, sampleGuideLooks } from "@/mobile/lib/studio-sample";
import "@/mobile/styles.css";
export const Route = createFileRoute("/style-guide-preview")({
  head: () => ({
    meta: [
      { name: "robots", content: "noindex,nofollow" },
      { title: "Sample Style Guide | LiveAskew" },
    ],
  }),
  component: Preview,
});
function Preview() {
  const [products, setProducts] = useState<ProductMatches | null>(null);
  useEffect(() => {
    let active = true;
    void fetch("/api/public/style-guide-products")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return (
    <main className="studio-scroll studio-preview">
      <div className="studio-toolbar">
        <span>LiveAskew · Sample lookbook</span>
        <a href="/app">Open my guide</a>
      </div>
      <GuideLookbook looks={sampleGuideLooks} sample />
      <details className="studio-document studio-reference">
        <summary>About this sample</summary>
        <p>
          Fictional client and AI-created outfit illustrations. These are styling ideas, not exact
          retailer products or a preview of you. Live matches below use sample US clothing size M,
          shoes US 6, up to USD 150 per item and USD 1,000 total before tax and shipping.
        </p>
      </details>
      <StyleBlueprintDocument guide={studioSample} products={products} />
    </main>
  );
}
