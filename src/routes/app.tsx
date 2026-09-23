import { createFileRoute } from "@tanstack/react-router";
import { MobileApp } from "@/mobile/App";
import { PlatformShell } from "@/mobile/PlatformShell";

export const Route = createFileRoute("/app")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Bee — the app" },
      { name: "apple-mobile-web-app-title", content: "Bee" },
      {
        name: "description",
        content: "Open Bee in the browser — the same stylist as the iOS and Android apps.",
      },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/bee-logo-192.png", type: "image/png" },
    ],
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
