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
  return (
    <main style={{ background: "#faf8f3", color: "#201d18", padding: "24px clamp(20px,5vw,72px)" }}>
      <div className="studio-toolbar">
        <span>Sample guide · fictional client</span>
        <a href="/app">Open my Bee studio</a>
      </div>
      <StyleBlueprintDocument guide={studioSample} />
    </main>
  );
}
