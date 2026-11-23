import { describe, expect, it, vi } from "vitest";
import { bookingPayload, forwardBooking, inquiryRow, isSpam, parseBooking } from "./booking.server";

const valid = {
  name: " Ada Lovelace ",
  email: "ADA@example.com",
  phone: "(305) 555-0100",
  service: "styling",
  message: "Wardrobe refresh before a big event.",
  preferredContact: "text",
  bestTime: "Weekday evenings",
};

describe("parseBooking", () => {
  it("cleans a valid request", () => {
    const result = parseBooking(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("Ada Lovelace");
    expect(result.value.email).toBe("ada@example.com");
    expect(result.value.preferredContact).toBe("text");
  });

  it("names every invalid field", () => {
    const result = parseBooking({ email: "nope", phone: "12", service: "unknown" });
    expect(result).toEqual({
      ok: false,
      fields: ["name", "email", "phone", "service", "message"],
    });
  });

  it("treats non-objects as empty", () => {
    expect(parseBooking(null).ok).toBe(false);
  });
});

describe("isSpam", () => {
  it("flags the hidden website field", () => {
    expect(isSpam({ website: "http://spam" })).toBe(true);
    expect(isSpam({ website: "" })).toBe(false);
    expect(isSpam(valid)).toBe(false);
  });
});

describe("bookingPayload", () => {
  it("builds a client-neutral payload", () => {
    const parsed = parseBooking(valid);
    if (!parsed.ok) throw new Error("expected valid");
    const payload = bookingPayload(parsed.value, "https://www.liveaskew.com", new Date(0));
    expect(payload).toMatchObject({
      type: "consultation_request",
      version: 1,
      client: "liveaskew",
      source: "https://www.liveaskew.com",
      submittedAt: "1970-01-01T00:00:00.000Z",
      service: { id: "styling", label: "Professional styling" },
      contact: { email: "ada@example.com", city: null, bestTime: "Weekday evenings" },
    });
  });
});

describe("forwardBooking", () => {
  const parsed = parseBooking(valid);
  if (!parsed.ok) throw new Error("expected valid");
  const payload = bookingPayload(parsed.value, "https://example.com");

  it("does nothing without a webhook", async () => {
    const fetcher = vi.fn();
    expect(await forwardBooking(payload, {}, fetcher)).toBe("not_configured");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("posts JSON with the shared secret", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("ok"));
    expect(await forwardBooking(payload, { url: "https://hook", secret: "s3" }, fetcher)).toBe(
      "sent",
    );
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://hook");
    expect(init.headers["x-booking-secret"]).toBe("s3");
    expect(JSON.parse(init.body).client).toBe("liveaskew");
  });

  it("reports failures instead of throwing", async () => {
    const down = vi.fn().mockRejectedValue(new Error("offline"));
    expect(await forwardBooking(payload, { url: "https://hook" }, down)).toBe("failed");
    const error = vi.fn().mockResolvedValue(new Response("no", { status: 500 }));
    expect(await forwardBooking(payload, { url: "https://hook" }, error)).toBe("failed");
  });
});

describe("inquiryRow", () => {
  it("labels the service for the stylist", () => {
    const parsed = parseBooking(valid);
    if (!parsed.ok) throw new Error("expected valid");
    expect(inquiryRow(parsed.value).what_she_needs).toBe(
      "[Professional styling] Wardrobe refresh before a big event.",
    );
  });
});
