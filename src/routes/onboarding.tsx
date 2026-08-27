import { createFileRoute, redirect } from "@tanstack/react-router";

// Onboarding is conducted by Bee in the chat — there is no separate questionnaire.
export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/chat" });
  },
  component: () => null,
});
