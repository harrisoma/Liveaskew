import { useEffect, useState, type FormEvent } from "react";
import { CONTACT_EMAIL, SiteFrame } from "./chrome";
import { SERVICES, isServiceId, type ServiceId } from "./services";
import { Eyebrow } from "./ui";

type Status = "idle" | "sending" | "sent" | "error";

const FIELD_LABELS: Record<string, string> = {
  name: "your name",
  email: "a valid email",
  phone: "a phone number",
  service: "a service",
  message: "what you need",
};

export function BookPage() {
  const [service, setService] = useState<ServiceId>("styling");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  // Pre-select the service a visitor clicked through from (?service=consulting).
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("service");
    if (isServiceId(requested)) setService(requested);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/public/booking", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        setStatus("sent");
        return;
      }
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        fields?: string[];
      };
      setError(
        result.error === "invalid_fields" && result.fields?.length
          ? `Please add ${result.fields.map((f) => FIELD_LABELS[f] ?? f).join(", ")}.`
          : result.error === "rate_limited"
            ? "We've received several requests from you already. We'll be in touch soon."
            : "",
      );
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <SiteFrame current="/book">
      <section className="lac-hero px-5 pt-40 pb-24 md:px-8 md:pt-48">
        <div className="relative mx-auto grid max-w-[1320px] gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-xl">
            <Eyebrow>Book a consultation</Eyebrow>
            <h1 className="la-serif mt-5 text-[2.9rem] leading-[1.04] md:text-[4.2rem]">
              Let's talk about what you need.
            </h1>
            <p className="mt-6 text-[1.125rem] leading-relaxed text-black/75">
              Personal styling, your brand, a design project or help with the app — tell us a little
              about it and we'll reach out to set a time that works for you.
            </p>
            <p className="mt-6 text-[1rem] text-black/60">
              Prefer email?{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-black underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>

          <div className="la-card is-featured md:p-10">
            {status === "sent" ? (
              <div role="status" aria-live="polite">
                <Eyebrow>Request received</Eyebrow>
                <h2 className="la-serif mt-4 text-[2.4rem] leading-tight">Thank you.</h2>
                <p className="mt-4 text-[1.0625rem] leading-relaxed text-black/70">
                  We have your request and will be in touch shortly to confirm your consultation.
                </p>
                <a href="/" className="la-btn la-btn-dark mt-8">
                  Back to home
                </a>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-5" noValidate={false}>
                <div className="la-honeypot" aria-hidden>
                  <label>
                    Website
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>
                <label className="la-field">
                  What can we help with?
                  <select
                    name="service"
                    value={service}
                    onChange={(e) => setService(e.target.value as ServiceId)}
                    required
                  >
                    {SERVICES.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="la-field">
                    Name
                    <input name="name" autoComplete="name" required maxLength={200} />
                  </label>
                  <label className="la-field">
                    Email
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={320}
                    />
                  </label>
                  <label className="la-field">
                    Phone
                    <input name="phone" type="tel" autoComplete="tel" required maxLength={50} />
                  </label>
                  <label className="la-field">
                    Best way to reach you
                    <select name="preferredContact" defaultValue="email">
                      <option value="email">Email</option>
                      <option value="phone">Phone call</option>
                      <option value="text">Text message</option>
                    </select>
                  </label>
                  <label className="la-field">
                    City <span className="la-hint">Optional</span>
                    <input name="city" autoComplete="address-level2" maxLength={120} />
                  </label>
                  <label className="la-field">
                    Best days or times <span className="la-hint">Optional</span>
                    <input name="bestTime" placeholder="e.g. weekday evenings" maxLength={200} />
                  </label>
                </div>
                <label className="la-field">
                  Tell us about it
                  <textarea
                    name="message"
                    required
                    maxLength={5000}
                    placeholder="An event, a wardrobe refresh, a brand launch, a product line…"
                  />
                </label>
                {status === "error" ? (
                  <p role="alert" className="text-[0.95rem] text-[#a3261b]">
                    {error ||
                      `We couldn't send that just now. Please try again, or email ${CONTACT_EMAIL}.`}
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="la-btn la-btn-dark justify-self-start"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Sending…" : "Request a consultation"}
                </button>
                <p className="text-[0.85rem] text-black/55">
                  We use your details only to arrange your consultation. See our{" "}
                  <a href="/privacy" className="underline">
                    privacy policy
                  </a>
                  .
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </SiteFrame>
  );
}
