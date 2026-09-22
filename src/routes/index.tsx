import { createFileRoute } from "@tanstack/react-router";
import { MobileApp } from "@/mobile/App";
import { PlatformShell } from "@/mobile/PlatformShell";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
      },
      { name: "theme-color", content: "#e0e5ec" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Bee" },
      { name: "mobile-web-app-capable", content: "yes" },
      { title: "Bee — AI stylist by LiveAskew" },
      {
        name: "description",
        content:
          "Bee by LiveAskew is a personal styling web app, iPhone app, and Android app built on Fit, Feel, and Fabric. Clothes follow your body — we never alter it.",
      },
    ],
    links: [{ rel: "manifest", href: "/manifest.webmanifest" }],
  }),
  component: WebAppHome,
});

function WebAppHome() {
  return (
    <PlatformShell>
      <MobileApp />
    </PlatformShell>
  );
}
