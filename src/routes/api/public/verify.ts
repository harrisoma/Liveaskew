import { createFileRoute } from "@tanstack/react-router";
import { isLocalDev, supabaseAuthConfigured } from "@/lib/api-auth.server";

type Body = {
  channel?: "email" | "sms";
  destination?: string;
  code?: string;
};

const PREVIEW_CODE = "000000";

async function authClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Email / SMS one-time codes. Supabase Auth generates, delivers, and checks the code,
 * so the code the person receives is the code we verify. The 000000 preview code is
 * only honoured in local development (`npm run dev`) when Supabase is not configured.
 */
export const Route = createFileRoute("/api/public/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const action = url.searchParams.get("action") ?? "send";
        const body = (await request.json().catch(() => ({}))) as Body;
        const channel = body.channel === "sms" ? "sms" : "email";
        const destination = (body.destination ?? "").trim();
        if (!destination) {
          return Response.json({ error: "missing_destination" }, { status: 400 });
        }

        const live = supabaseAuthConfigured();
        if (!live && !isLocalDev()) {
          return Response.json({ error: "auth_not_configured" }, { status: 503 });
        }

        if (action === "send") {
          if (!live) return Response.json({ ok: true, preview: true, hint: PREVIEW_CODE });
          const supabase = await authClient();
          const { error } =
            channel === "email"
              ? await supabase.auth.signInWithOtp({ email: destination })
              : await supabase.auth.signInWithOtp({ phone: destination });
          if (error) {
            console.error("[verify] send failed", error.message);
            return Response.json({ error: "send_failed" }, { status: 502 });
          }
          return Response.json({ ok: true, preview: false });
        }

        const code = (body.code ?? "").replace(/\s/g, "");
        if (!/^\d{6}$/.test(code)) {
          return Response.json({ error: "invalid_code" }, { status: 400 });
        }

        if (!live) {
          return code === PREVIEW_CODE
            ? Response.json({ ok: true, preview: true })
            : Response.json({ error: "mismatch" }, { status: 401 });
        }

        const supabase = await authClient();
        const { error } =
          channel === "email"
            ? await supabase.auth.verifyOtp({ email: destination, token: code, type: "email" })
            : await supabase.auth.verifyOtp({ phone: destination, token: code, type: "sms" });
        if (error) return Response.json({ error: "mismatch" }, { status: 401 });
        return Response.json({ ok: true });
      },
    },
  },
});
