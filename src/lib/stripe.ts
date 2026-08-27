// Client-safe helper to pick Stripe environment.
// Sandbox in preview/dev, live on published production.
export function getStripeEnvironment(): "sandbox" | "live" {
  if (typeof window === "undefined") return "sandbox";
  const host = window.location.hostname;
  // Lovable preview URLs always include "-dev" or run locally
  const isDev =
    host.includes("-dev.") ||
    host.includes("localhost") ||
    host.includes("127.0.0.1") ||
    host.includes("lovableproject.com");
  return isDev ? "sandbox" : "live";
}
