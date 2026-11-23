import { createFileRoute } from "@tanstack/react-router";
import {
  bookingPayload,
  forwardBooking,
  inquiryRow,
  isSpam,
  parseBooking,
} from "@/lib/booking.server";

// Small per-IP budget so the public form can't be used to flood the inbox.
const windows = new Map<string, { count: number; end: number }>();
function allowed(ip: string, now = Date.now()) {
  for (const [key, value] of windows) if (value.end <= now) windows.delete(key);
  const window = windows.get(ip) ?? { count: 0, end: now + 3_600_000 };
  if (window.count >= 5 || windows.size >= 5000) return false;
  window.count++;
  windows.set(ip, window);
  return true;
}

async function recordInquiry(row: ReturnType<typeof inquiryRow>) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("personal_styling_inquiries").insert(row);
    return !error;
  } catch {
    return false;
  }
}

/** Consultation requests from the public site: stored, then sent on to the booking webhook. */
export const Route = createFileRoute("/api/public/booking")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (origin !== new URL(request.url).origin)
          return Response.json({ error: "invalid_origin" }, { status: 403 });
        const raw = await request.text();
        if (raw.length > 12_000) return Response.json({ error: "too_large" }, { status: 413 });
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          return Response.json({ error: "invalid_body" }, { status: 400 });
        }
        // Pretend success to bots so they don't retry.
        if (isSpam(body)) return Response.json({ ok: true });
        const parsed = parseBooking(body);
        if (!parsed.ok)
          return Response.json({ error: "invalid_fields", fields: parsed.fields }, { status: 400 });

        const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "local";
        if (!allowed(ip))
          return Response.json(
            { error: "rate_limited" },
            { status: 429, headers: { "Retry-After": "3600" } },
          );

        const stored = await recordInquiry(inquiryRow(parsed.value));
        const forwarded = await forwardBooking(
          bookingPayload(parsed.value, new URL(request.url).origin),
          {
            url: process.env.BOOKING_WEBHOOK_URL,
            secret: process.env.BOOKING_WEBHOOK_SECRET,
          },
        );
        if (forwarded === "failed") console.error("[booking] webhook delivery failed");
        if (!stored && forwarded !== "sent")
          return Response.json({ error: "unavailable" }, { status: 503 });
        return Response.json({ ok: true });
      },
    },
  },
});
