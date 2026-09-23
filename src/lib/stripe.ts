// Client-safe helper to pick Stripe environment.
// Sandbox in local/dev and Vercel preview; live on Vercel production.
export function getStripeEnvironment(hostname?: string): "sandbox" | "live" {
  const vercelEnv = typeof process !== "undefined" ? process.env.VERCEL_ENV : undefined;
  if (vercelEnv === "production") return "live";
  if (vercelEnv === "preview" || vercelEnv === "development") return "sandbox";

  const host = (
    hostname ?? (typeof window === "undefined" ? "" : window.location.hostname)
  ).toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
    return "sandbox";
  }
  return "live";
}
