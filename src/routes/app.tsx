import { createFileRoute } from "@tanstack/react-router";
import { MobileApp } from "@/mobile/App";
import { PlatformShell } from "@/mobile/PlatformShell";
import { pageMeta } from "@/site/seo";

const APP_META = pageMeta({
  title: "Open Bee, your AI personal stylist | LiveAskew",
  description:
    "Open Bee in your browser: outfit ideas, an outfit calendar, Wardrobe Reset and Real Talk, styled on the real you. Works on any phone or computer.",
  path: "/app",
});

export const Route = createFileRoute("/app")({
  ssr: false,
  head: () => ({
    meta: [
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
      },
      { name: "theme-color", content: "#f2f2f7" },
      ...APP_META.meta,
    ],
    links: [{ rel: "manifest", href: "/manifest.webmanifest" }, ...APP_META.links],
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
