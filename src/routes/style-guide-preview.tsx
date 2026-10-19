import type { ProductMatches } from "@/lib/shopping-profile";
import { ShoppingBrief } from "@/mobile/components/ShoppingBrief";
import { useEffect, useState } from "react";
import { WardrobeCard } from "@/mobile/components/LookCard";
import type { WardrobeItem } from "@/mobile/lib/storage";
import { createFileRoute } from "@tanstack/react-router";
import { StyleBlueprintDocument } from "@/mobile/components/StyleBlueprint";
import { studioSample } from "@/mobile/lib/studio-sample";
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
  const [products, setProducts] = useState<ProductMatches | null>(null),
    [interviewSaved, setInterviewSaved] = useState(false);
  useEffect(() => {
    void fetch("/api/public/style-guide-products")
      .then((r) => (r.ok ? r.json() : null))
      .then(setProducts)
      .catch(() => {});
  }, []);
  const [sample, setSample] = useState<WardrobeItem>({
    id: "sample-closet",
    photo: "",
    label: "Your favorite cotton shirt",
    verdict: "maybe",
    reason:
      "Try it with your capsule and check how it feels. This is a fictional wardrobe example.",
    error: null,
  });
  return (
    <main
      className="bee-studio"
      style={{ background: "#faf8f3", color: "#201d18", padding: "24px clamp(20px,5vw,72px)" }}
    >
      <div className="studio-toolbar">
        <span>Sample guide · fictional client</span>
        <a href="/app">Open my Bee studio</a>
      </div>
      <p className="studio-document studio-fine">
        Live shopping example: fictional US women’s size M, shoes US 6, up to USD 150 per item and
        USD 1,000 total before tax/shipping. Product availability varies.
      </p>
      <StyleBlueprintDocument guide={studioSample} products={products} />
      <details className="studio-document">
        <summary>Try the interview’s shopping step</summary>
        <ShoppingBrief onComplete={() => setInterviewSaved(true)} />
        {interviewSaved && (
          <p role="status">
            Sample interview details saved. In your account, the next step is Generate my Style
            Guide.
          </p>
        )}
      </details>
      <details className="studio-document">
        <summary>Try a sample wardrobe decision</summary>
        <div style={{ maxWidth: 400, padding: "24px 0" }}>
          <WardrobeCard
            item={sample}
            onDecide={(verdict) => setSample((s) => ({ ...s, verdict }))}
          />
          <p className="studio-fine">Sample only. Your personal closet is in Bee → Reset.</p>
        </div>
      </details>
    </main>
  );
}
