import { createFileRoute } from "@tanstack/react-router";
import { MobileApp } from "@/mobile/App";
import { PlatformShell } from "@/mobile/PlatformShell";

export const Route = createFileRoute("/app")({
  ssr: false,
  head: () => ({
    meta: [
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
      },
      { name: "theme-color", content: "#f2f2f7" },
      { title: "LiveAskew — Bee, Honey, Buzz, and the Hive" },
      {
        name: "description",
        content: "Open Bee in the browser — the same stylist as the iOS and Android apps.",
      },
    ],
    links: [{ rel: "manifest", href: "/manifest.webmanifest" }],
  }),
  component: WebApp,
});

function WebApp() {
  return (
    <PlatformShell>
      <MobileApp />
    </PlatformShell>
  );
}
