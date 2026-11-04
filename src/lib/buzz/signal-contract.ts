import { z } from "zod";

export const signalAction = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("connect"),
    provider: z.enum(["meta", "threads", "linkedin", "tiktok", "x", "youtube", "google_business"]),
  }),
  z.object({
    action: z.literal("select"),
    connectionId: z.string().uuid(),
    assetIds: z.array(z.string().uuid()).max(100),
  }),
  z.object({ action: z.literal("disconnect"), connectionId: z.string().uuid() }),
]);
export function signalCommand(input: unknown) {
  const action = signalAction.parse(input);
  if (action.action === "connect")
    return { endpoint: "native-social-connect-start", body: { provider: action.provider } };
  if (action.action === "select")
    return {
      endpoint: "native-social-select-assets",
      body: { connection_id: action.connectionId, asset_ids: action.assetIds },
    };
  return { endpoint: "native-social-disconnect", body: { connection_id: action.connectionId } };
}
export const signalSummary = z.object({
  connections: z.array(
    z.object({
      id: z.string().uuid(),
      provider: z.string(),
      status: z.string(),
      assets: z.array(
        z.object({
          id: z.string().uuid(),
          display_name: z.string().nullable(),
          username: z.string().nullable(),
          platform: z.string(),
          selected: z.boolean(),
          status: z.string(),
        }),
      ),
    }),
  ),
});
export type SignalSummary = z.infer<typeof signalSummary>;
export function safeSignalAuthorization(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      [
        "www.facebook.com",
        "threads.net",
        "www.threads.net",
        "www.linkedin.com",
        "x.com",
        "twitter.com",
        "www.tiktok.com",
        "accounts.google.com",
      ].includes(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}
