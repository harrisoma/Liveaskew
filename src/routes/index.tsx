import { createFileRoute } from "@tanstack/react-router";
import { MobileApp } from "@/mobile/App";

/**
 * The product UI is the Capacitor phone app.
 * Marketing / desktop web is a separate later project sharing only Supabase.
 */
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1",
      },
      { name: "theme-color", content: "#e0e5ec" },
      { title: "Bee — AI stylist by LiveAskew" },
      {
        name: "description",
        content:
          "Bee by LiveAskew is a personal styling app and AI stylist built on Fit, Feel, and Fabric. Clothes follow your body — we never alter it.",
      },
    ],
  }),
  component: MobileHome,
});

function MobileHome() {
  return <MobileApp />;
}
