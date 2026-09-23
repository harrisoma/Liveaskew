import { createFileRoute } from "@tanstack/react-router";
import { MobileApp } from "@/mobile/App";
import { PlatformShell } from "@/mobile/PlatformShell";

export const Route = createFileRoute("/app")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Bee web app — LiveAskew" },
      {
        name: "description",
        content: "Open Bee in the browser — the same stylist as the iOS and Android apps.",
      },
    ],
    links: [{ rel: "manifest", href: "/manifest.webmanifest" }],
  }),
  component: WebAppAlias,
});

function WebAppAlias() {
  return (
    <PlatformShell>
      <MobileApp />
    </PlatformShell>
  );
}
