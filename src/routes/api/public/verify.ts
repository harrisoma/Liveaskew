import { createFileRoute } from "@tanstack/react-router";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

type Body = {
  channel?: "email" | "sms";
  destination?: string;
  code?: string;
};

function hashCode(code: string, destination: string) {
  return createHash("sha256").update(`${destination.trim().toLowerCase()}:${code}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

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

        if (action === "send") {
          const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
          const codeHash = hashCode(code, destination);
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
          let stored = false;
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { error } = await supabaseAdmin.from("verification_codes").insert({
              channel,
              destination,
              code_hash: codeHash,
              expires_at: expiresAt,
            } as never);
            stored = !error;
          } catch {
            stored = false;
          }

          const preview = process.env.NODE_ENV !== "production" || !stored;
          if (channel === "email") {
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              await supabaseAdmin.auth.signInWithOtp({ email: destination });
            } catch {
              /* preview path */
            }
          } else {
            try {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              await supabaseAdmin.auth.signInWithOtp({ phone: destination });
            } catch {
              /* preview path */
            }
          }

          return Response.json({
            ok: true,
            preview,
            ...(preview ? { hint: "000000" } : {}),
          });
        }

        const code = (body.code ?? "").replace(/\s/g, "");
        if (!/^\d{6}$/.test(code)) {
          return Response.json({ error: "invalid_code" }, { status: 400 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("verification_codes")
            .select("id, code_hash, expires_at, consumed_at")
            .eq("destination", destination)
            .order("expires_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          const row = data as {
            id: string;
            code_hash: string;
            expires_at: string;
            consumed_at: string | null;
          } | null;
          if (row && !row.consumed_at && Date.parse(row.expires_at) > Date.now()) {
            if (safeEqual(row.code_hash, hashCode(code, destination))) {
              await supabaseAdmin
                .from("verification_codes")
                .update({ consumed_at: new Date().toISOString() } as never)
                .eq("id", row.id);
              return Response.json({ ok: true });
            }
          }
        } catch {
          /* preview */
        }

        if (code === "000000" && process.env.NODE_ENV !== "production") {
          return Response.json({ ok: true, preview: true });
        }
        return Response.json({ error: "mismatch" }, { status: 401 });
      },
    },
  },
});
