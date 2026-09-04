import { createSign } from "node:crypto";
import { trialDaysLeft } from "@/mobile/lib/trial";

export type PushKind = "trial_countdown" | "bee_recommendation";
export type PushPlatform = "ios" | "android" | "web";

export const TRIAL_REMINDER_DAYS = [7, 3, 1] as const;

export function trialReminderDay(daysLeft: number | null): (typeof TRIAL_REMINDER_DAYS)[number] | null {
  if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) return daysLeft;
  return null;
}

export function utcDayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

type FcmPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

function copyFor(kind: PushKind, extra?: { daysLeft?: number }): FcmPayload {
  if (kind === "trial_countdown") {
    const days = extra?.daysLeft ?? 1;
    const when = days === 1 ? "1 day left" : `${days} days left`;
    return {
      title: "Bee",
      body: `${when} in your free trial. Your Style Guide is still dressing the body you have.`,
      data: { kind, daysLeft: String(days) },
    };
  }
  return {
    title: "Bee",
    body: "A new recommendation is ready — Fit, Feel, and Fabric for the day you are actually dressing.",
    data: { kind },
  };
}

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function claimDispatch(userId: string, kind: PushKind, dayKey: string): Promise<boolean> {
  const admin = await getAdmin();
  const { error } = await admin.from("push_dispatches").insert({
    user_id: userId,
    kind,
    day_key: dayKey,
  } as never);
  if (!error) return true;
  const code = (error as { code?: string }).code;
  if (code === "23505") return false;
  console.error("[push] dispatch claim failed", error);
  return false;
}

export async function savePushToken(opts: {
  userId: string;
  token: string;
  platform: PushPlatform;
}): Promise<void> {
  const admin = await getAdmin();
  await admin.from("push_tokens").upsert(
    {
      user_id: opts.userId,
      token: opts.token,
      platform: opts.platform,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "token" },
  );
}

export async function persistTrialStartedAt(userId: string, startedAt: string): Promise<void> {
  const admin = await getAdmin();
  await admin
    .from("profiles")
    .update({ trial_started_at: startedAt } as never)
    .eq("id", userId)
    .is("trial_started_at", null);
}

async function tokensForUser(userId: string): Promise<string[]> {
  const admin = await getAdmin();
  const { data, error } = await admin.from("push_tokens").select("token").eq("user_id", userId);
  if (error || !data) return [];
  return (data as { token: string }[]).map((row) => row.token).filter(Boolean);
}

async function dropInvalidToken(token: string): Promise<void> {
  try {
    const admin = await getAdmin();
    await admin.from("push_tokens").delete().eq("token", token);
  } catch (err) {
    console.error("[push] drop token failed", err);
  }
}

export async function notifyBeeRecommendation(userId: string): Promise<{ sent: number }> {
  if (!(await claimDispatch(userId, "bee_recommendation", utcDayKey()))) {
    return { sent: 0 };
  }
  return sendToUser(userId, "bee_recommendation");
}

export async function runTrialCountdownPushes(now = Date.now()): Promise<{ sent: number; skipped: number }> {
  const admin = await getAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("id, trial_started_at")
    .not("trial_started_at", "is", null);
  if (error || !data) {
    if (error) console.error("[push] trial profile scan failed", error);
    return { sent: 0, skipped: 0 };
  }

  let sent = 0;
  let skipped = 0;
  for (const row of data as { id: string; trial_started_at: string | null }[]) {
    const daysLeft = trialDaysLeft(row.trial_started_at, now);
    const reminder = trialReminderDay(daysLeft);
    if (reminder === null || daysLeft === null) {
      skipped += 1;
      continue;
    }
    if (!(await claimDispatch(row.id, "trial_countdown", `days-${reminder}`))) {
      skipped += 1;
      continue;
    }
    const result = await sendToUser(row.id, "trial_countdown", { daysLeft: reminder });
    sent += result.sent;
  }
  return { sent, skipped };
}

async function sendToUser(
  userId: string,
  kind: PushKind,
  extra?: { daysLeft?: number },
): Promise<{ sent: number }> {
  const tokens = await tokensForUser(userId);
  if (tokens.length === 0) return { sent: 0 };
  const payload = copyFor(kind, extra);
  let sent = 0;
  for (const token of tokens) {
    const ok = await sendFcm(token, payload);
    if (ok === "invalid") await dropInvalidToken(token);
    else if (ok === "sent") sent += 1;
  }
  return { sent };
}

type SendResult = "sent" | "invalid" | "skipped";

async function sendFcm(token: string, payload: FcmPayload): Promise<SendResult> {
  const serviceAccount = process.env.FCM_SERVICE_ACCOUNT_JSON?.trim();
  if (serviceAccount) {
    try {
      return await sendFcmHttpV1(serviceAccount, token, payload);
    } catch (err) {
      console.error("[push] FCM HTTP v1 failed", err);
      return "skipped";
    }
  }
  const serverKey = process.env.FCM_SERVER_KEY?.trim();
  if (serverKey) {
    try {
      return await sendFcmLegacy(serverKey, token, payload);
    } catch (err) {
      console.error("[push] FCM legacy failed", err);
      return "skipped";
    }
  }
  console.warn("[push] no FCM_SERVICE_ACCOUNT_JSON or FCM_SERVER_KEY — skip send");
  return "skipped";
}

async function sendFcmLegacy(serverKey: string, token: string, payload: FcmPayload): Promise<SendResult> {
  const res = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${serverKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data ?? {},
      priority: "high",
    }),
  });
  if (res.status === 404 || res.status === 400) return "invalid";
  if (!res.ok) {
    console.error("[push] FCM legacy status", res.status, await res.text().catch(() => ""));
    return "skipped";
  }
  const json = (await res.json().catch(() => ({}))) as { failure?: number; results?: { error?: string }[] };
  const err = json.results?.[0]?.error;
  if (err === "NotRegistered" || err === "InvalidRegistration") return "invalid";
  if (json.failure && json.failure > 0 && err) return "skipped";
  return "sent";
}

type ServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

async function sendFcmHttpV1(rawJson: string, token: string, payload: FcmPayload): Promise<SendResult> {
  const account = JSON.parse(rawJson) as ServiceAccount;
  const projectId = account.project_id;
  if (!projectId || !account.client_email || !account.private_key) {
    throw new Error("FCM_SERVICE_ACCOUNT_JSON missing project_id/client_email/private_key");
  }
  const accessToken = await googleAccessToken(account);
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data ?? {},
        android: { priority: "HIGH" },
        apns: { payload: { aps: { sound: "default" } } },
      },
    }),
  });
  if (res.status === 404) return "invalid";
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (/UNREGISTERED|INVALID_ARGUMENT/i.test(text)) return "invalid";
    console.error("[push] FCM HTTP v1 status", res.status, text);
    return "skipped";
  }
  return "sent";
}

async function googleAccessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claim = Buffer.from(
    JSON.stringify({
      iss: account.client_email,
      sub: account.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    }),
  ).toString("base64url");
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = signer.sign(account.private_key!, "base64url");
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed (${res.status})`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Google token exchange missing access_token");
  return json.access_token;
}

export async function userIdFromAuthHeader(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims?.sub) return null;
    return String(data.claims.sub);
  } catch {
    return null;
  }
}
