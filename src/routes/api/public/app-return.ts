import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_PATHS = new Set(["billing", "buzz"]);
const ALLOWED_PARAMS = new Set(["billing", "buzz", "network", "reason"]);

/**
 * Stripe (and some networks) only send people back to an https URL. This hands them to
 * the installed app. It only ever redirects to co.liveaskew.app://, never elsewhere.
 */
export const Route = createFileRoute("/api/public/app-return")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url);
        const path = url.searchParams.get("path") ?? "";
        const target = new URL(`co.liveaskew.app://${ALLOWED_PATHS.has(path) ? path : "app"}`);
        for (const [k, v] of url.searchParams) {
          if (ALLOWED_PARAMS.has(k)) target.searchParams.set(k, v.slice(0, 200));
        }
        return new Response(null, { status: 302, headers: { Location: target.toString() } });
      },
    },
  },
});
