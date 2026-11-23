import { isServiceId, serviceLabel, type ServiceId } from "@/site/services";

/**
 * Consultation booking requests from the public site.
 *
 * The payload is deliberately client-neutral (`client`, `source`, `service`, `contact`) so the
 * same webhook can be served by n8n today and by the shared Workspace booking app later,
 * for any client — only BOOKING_WEBHOOK_URL changes.
 */
export const BOOKING_CLIENT = "liveaskew";

export type BookingRequest = {
  name: string;
  email: string;
  phone: string;
  service: ServiceId;
  message: string;
  preferredContact: "email" | "phone" | "text";
  bestTime: string;
  city: string;
};

export type BookingPayload = {
  type: "consultation_request";
  version: 1;
  client: string;
  source: string;
  submittedAt: string;
  service: { id: ServiceId; label: string };
  contact: {
    name: string;
    email: string;
    phone: string;
    preferredContact: BookingRequest["preferredContact"];
    bestTime: string | null;
    city: string | null;
  };
  message: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/** Validates a raw form body. Returns the clean request, or the names of the invalid fields. */
export function parseBooking(
  raw: unknown,
): { ok: true; value: BookingRequest } | { ok: false; fields: string[] } {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const value: BookingRequest = {
    name: text(body.name, 200),
    email: text(body.email, 320).toLowerCase(),
    phone: text(body.phone, 50),
    service: isServiceId(body.service) ? body.service : "other",
    message: text(body.message, 5000),
    preferredContact:
      body.preferredContact === "phone" || body.preferredContact === "text"
        ? body.preferredContact
        : "email",
    bestTime: text(body.bestTime, 200),
    city: text(body.city, 120),
  };
  const fields: string[] = [];
  if (!value.name) fields.push("name");
  if (!EMAIL.test(value.email)) fields.push("email");
  if (value.phone.replace(/\D/g, "").length < 7) fields.push("phone");
  if (!isServiceId(body.service)) fields.push("service");
  if (!value.message) fields.push("message");
  return fields.length ? { ok: false, fields } : { ok: true, value };
}

/** Hidden field only bots fill in. */
export function isSpam(raw: unknown) {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return typeof body.website === "string" && body.website.trim() !== "";
}

export function bookingPayload(
  request: BookingRequest,
  source: string,
  now = new Date(),
): BookingPayload {
  return {
    type: "consultation_request",
    version: 1,
    client: BOOKING_CLIENT,
    source,
    submittedAt: now.toISOString(),
    service: { id: request.service, label: serviceLabel(request.service) },
    contact: {
      name: request.name,
      email: request.email,
      phone: request.phone,
      preferredContact: request.preferredContact,
      bestTime: request.bestTime || null,
      city: request.city || null,
    },
    message: request.message,
  };
}

/** Sends the request to the booking webhook (n8n now, the Workspace booking app later). */
export async function forwardBooking(
  payload: BookingPayload,
  env: { url?: string; secret?: string },
  fetcher: typeof fetch = fetch,
): Promise<"sent" | "not_configured" | "failed"> {
  if (!env.url) return "not_configured";
  try {
    const response = await fetcher(env.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(env.secret ? { "x-booking-secret": env.secret } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

/** The inquiries table row, kept as the system of record if the webhook is down. */
export function inquiryRow(request: BookingRequest) {
  return {
    full_name: request.name,
    email: request.email,
    phone: request.phone,
    city: request.city || null,
    preferred_contact: request.preferredContact,
    best_time_to_call: request.bestTime || null,
    what_she_needs: `[${serviceLabel(request.service)}] ${request.message}`.slice(0, 5000),
  };
}
