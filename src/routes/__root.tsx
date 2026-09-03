import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RouteError, RouteNotFound } from "@/components/RouteError";
import { BeeLauncher } from "@/components/BeeLauncher";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return <RouteError error={error} reset={reset} />;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bee by LiveAskew — Inclusive Personal AI Stylist" },
      {
        name: "description",
        content:
          "Bee by LiveAskew is your inclusive personal AI stylist — conversational, intelligent, deeply personal. A monthly style guide built only for you.",
      },
      { property: "og:title", content: "Bee by LiveAskew — Inclusive Personal AI Stylist" },
      {
        property: "og:description",
        content:
          "Conversational AI styling. Monthly looks, colour palette, wardrobe blueprint. Free for 14 days.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "LiveAskew — Personal AI Stylist" },
      { name: "description", content: "LiveAskew is a web application for managing domains, email infrastructure, and user onboarding with AI assistance." },
      { property: "og:description", content: "LiveAskew is a web application for managing domains, email infrastructure, and user onboarding with AI assistance." },
      { name: "twitter:description", content: "LiveAskew is a web application for managing domains, email infrastructure, and user onboarding with AI assistance." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9bf1e19c-c973-4cd4-8889-e3c6de97d021/id-preview-b526b163--59a668ac-393a-421f-8c9e-80dcaad58378.lovable.app-1780610952943.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9bf1e19c-c973-4cd4-8889-e3c6de97d021/id-preview-b526b163--59a668ac-393a-421f-8c9e-80dcaad58378.lovable.app-1780610952943.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: RouteNotFound,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <BeeLauncher />
    </QueryClientProvider>
  );
}

function AuthSync() {
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);
  return null;
}
