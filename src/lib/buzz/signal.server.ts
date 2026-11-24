import { getOnixusAiConfig, getOnixusAiHeaders } from "../ai-gateway.server";
import type { LiveConnection } from "./providers.server";

export type SignalReceipt = {
  state: "posted" | "publishing" | "failed" | "uncertain";
  post_url?: string | null;
  error?: string | null;
};
export function usesSignalPublisher(): boolean {
  return process.env.BUZZ_PUBLISHER === "signal";
}
export function signalPublisherUrl(): string {
  const config = getOnixusAiConfig();
  const url = config.baseURL.replace(/\/onixus-ai-gateway(?:\/v1)?$/, "/liveaskew-publish");
  if (url === config.baseURL || !url.startsWith("https://"))
    throw Error("signal_publisher_not_configured");
  return url;
}
async function request(body: unknown): Promise<SignalReceipt> {
  const response = await fetch(signalPublisherUrl(), {
    method: "POST",
    headers: { ...getOnixusAiHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
  });
  const result = (await response.json().catch(() => ({}))) as SignalReceipt;
  if (!response.ok || !["posted", "publishing", "failed", "uncertain"].includes(result.state))
    throw Error("signal_publisher_unavailable");
  return result;
}
/** Only called after the owner-scoped Honey row is claimed and its own connection loaded. */
export async function publishWithSignal(
  post: { id: string; user_id: string; caption: string | null; media_url: string | null },
  connection: LiveConnection,
): Promise<SignalReceipt> {
  return request({
    memberId: post.user_id,
    postId: post.id,
    network: connection.network,
    accountId: connection.accountId,
    accessToken: connection.accessToken,
    caption: post.caption ?? "",
    mediaUrl: post.media_url,
  });
}
export async function signalPostStatus(memberId: string, postId: string): Promise<SignalReceipt> {
  return request({ operation: "status", memberId, postId });
}

export async function deleteSignalMemberReceipts(memberId: string): Promise<void> {
  if (!usesSignalPublisher()) return;
  const response = await fetch(signalPublisherUrl(), {
    method: "POST",
    headers: { ...getOnixusAiHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ operation: "delete-member", memberId }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw Error("publisher_cleanup_failed");
}
