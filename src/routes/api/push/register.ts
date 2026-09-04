import { createFileRoute } from "@tanstack/react-router";
import {
  persistTrialStartedAt,
  savePushToken,
  userIdFromAuthHeader,
  type PushPlatform,
} from "@/lib/push.server";

type Body = {
  token?: string;
  platform?: string;
  trialStartedAt?: string;
};

function asPlatform(value: string | undefined): PushPlatform {
  if (value === "ios" || value === "android" || value === "web") return value;
  return "web";
}

export const Route = createFileRoute("/api/push/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const userId = await userIdFromAuthHeader(request);
        if (!userId) return Response.json({ error: "unauthorized" }, { status: 401 });

        const body = (await request.json().catch(() => ({}))) as Body;
        const token = body.token?.trim();
        if (!token) return Response.json({ error: "missing_token" }, { status: 400 });

        await savePushToken({
          userId,
          token,
          platform: asPlatform(body.platform),
        });

        const started = body.trialStartedAt?.trim();
        if (started) {
          try {
            await persistTrialStartedAt(userId, started);
          } catch (err) {
            console.error("[push] trial persist skipped", err);
          }
        }

        return Response.json({ ok: true });
      },
    },
  },
});
