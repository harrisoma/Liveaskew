import { createFileRoute, redirect } from "@tanstack/react-router";

// The home page is the login page — landing on "/" takes you straight into
// the app's entry point. auth.tsx itself redirects an already-signed-in
// visitor onward to /chat or /dashboard.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/auth", search: { mode: "signup" } });
  },
  component: () => null,
});
