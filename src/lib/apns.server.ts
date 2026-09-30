import { createSign } from "node:crypto";

/**
 * Apple Push Notification service, direct. Capacitor gives iPhones an APNs device token
 * (not an FCM one), so iOS pushes go here with a token-based .p8 key:
 * APNS_KEY_ID, APNS_TEAM_ID, APNS_PRIVATE_KEY (the .p8 contents), APNS_BUNDLE_ID,
 * APNS_ENV = production (App Store / TestFlight) or sandbox (Xcode debug builds).
 */

export type ApnsPayload = { title: string; body: string; data?: Record<string, string> };
export type ApnsResult = "sent" | "invalid" | "skipped";

export function apnsConfigured(): boolean {
  const e = process.env;
  return Boolean(e.APNS_KEY_ID && e.APNS_TEAM_ID && e.APNS_PRIVATE_KEY);
}

let cached: { jwt: string; at: number } | null = null;

/** ES256 provider token; Apple accepts one for up to an hour, we refresh at 50 minutes. */
export function apnsJwt(
  opts: { keyId: string; teamId: string; privateKey: string },
  nowMs = Date.now(),
): string {
  if (cached && nowMs - cached.at < 50 * 60_000) return cached.jwt;
  const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: opts.keyId })).toString(
    "base64url",
  );
  const claims = Buffer.from(
    JSON.stringify({ iss: opts.teamId, iat: Math.floor(nowMs / 1000) }),
  ).toString("base64url");
  const signer = createSign("SHA256");
  signer.update(`${header}.${claims}`);
  const sig = signer.sign({ key: opts.privateKey, dsaEncoding: "ieee-p1363" }, "base64url");
  cached = { jwt: `${header}.${claims}.${sig}`, at: nowMs };
  return cached.jwt;
}

export function resetApnsJwtCache(): void {
  cached = null;
}

/** Apple's answer → keep the token, drop it, or just log. */
export function apnsOutcome(status: number, reason: string | undefined): ApnsResult {
  if (status === 200) return "sent";
  if (status === 410) return "invalid";
  if (status === 400 && (reason === "BadDeviceToken" || reason === "DeviceTokenNotForTopic")) {
    return "invalid";
  }
  return "skipped";
}

export async function sendApns(deviceToken: string, payload: ApnsPayload): Promise<ApnsResult> {
  const e = process.env;
  if (!apnsConfigured()) return "skipped";
  const host =
    e.APNS_ENV === "sandbox" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
  const jwt = apnsJwt({
    keyId: e.APNS_KEY_ID!,
    teamId: e.APNS_TEAM_ID!,
    privateKey: e.APNS_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  });
  const body = JSON.stringify({
    aps: { alert: { title: payload.title, body: payload.body }, sound: "default" },
    ...(payload.data ?? {}),
  });

  // APNs only speaks HTTP/2, which fetch does not; use node:http2.
  const http2 = await import("node:http2");
  return new Promise<ApnsResult>((resolve) => {
    const client = http2.connect(host);
    const done = (result: ApnsResult) => {
      client.close();
      resolve(result);
    };
    client.on("error", (err) => {
      console.error("[push] APNs connection failed", err);
      done("skipped");
    });
    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": e.APNS_BUNDLE_ID || "co.liveaskew.app",
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    });
    let status = 0;
    let text = "";
    req.setEncoding("utf8");
    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    req.on("data", (chunk: string) => {
      text += chunk;
    });
    req.on("end", () => {
      let reason: string | undefined;
      try {
        reason = text ? (JSON.parse(text) as { reason?: string }).reason : undefined;
      } catch {
        /* empty body on success */
      }
      if (status !== 200) console.error("[push] APNs", status, reason);
      done(apnsOutcome(status, reason));
    });
    req.on("error", (err) => {
      console.error("[push] APNs request failed", err);
      done("skipped");
    });
    req.setTimeout(10_000, () => {
      req.close();
      done("skipped");
    });
    req.end(body);
  });
}
