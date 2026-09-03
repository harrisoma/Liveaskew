import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import quoteImage from "@/assets/quote-portrait.jpg";

export const Route = createFileRoute("/inquiry")({
  head: () => ({
    meta: [
      { title: "Request a Personal Styling Consultation — LiveAskew" },
      {
        name: "description",
        content:
          "Private styling consultations with the LiveAskew founder. Limited availability — a stylist will reach out within 48 hours.",
      },
      { property: "og:title", content: "Personal Styling — LiveAskew" },
      {
        property: "og:description",
        content: "Bespoke styling with our founder. Request a private consultation.",
      },
    ],
  }),
  component: InquiryPage,
});

const CONTACT_OPTIONS = ["Phone call", "Email", "Both"] as const;
const TIME_CHIPS = [
  "Mornings (9am–12pm)",
  "Afternoons (12pm–5pm)",
  "Evenings (5pm–8pm)",
  "Weekends",
  "Anytime",
] as const;
const BUDGET_CHIPS = [
  "Under $2,500",
  "$2,500 – $5,000",
  "$5,000 – $10,000",
  "$10,000+",
  "I'd rather discuss",
] as const;

function InquiryPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    city: "",
    preferred_contact: "Phone call" as (typeof CONTACT_OPTIONS)[number],
    best_time_to_call: "",
    what_she_needs: "",
    budget_range: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.phone || !form.what_she_needs) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setSubmitting(true);
    const { error: insertError } = await supabase.from("personal_styling_inquiries").insert({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim() || null,
      preferred_contact: form.preferred_contact,
      best_time_to_call: form.best_time_to_call || null,
      what_she_needs: form.what_she_needs.trim(),
      budget_range: form.budget_range || null,
    });
    setSubmitting(false);
    if (insertError) {
      setError("Something went wrong sending your inquiry. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-6 text-cream">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold/60">
            <Check size={22} className="text-gold-soft" strokeWidth={2} />
          </div>
          <p className="eyebrow mt-8 text-gold-soft">Received</p>
          <h1 className="font-display mt-4 text-5xl leading-tight">Thank you.</h1>
          <span className="mt-7 inline-block h-px w-12 bg-gold" />
          <p className="mt-8 text-base leading-relaxed text-cream/75">
            Your inquiry is with the founder. A stylist will reach out within 48 hours to schedule a
            private consultation. All conversations are confidential.
          </p>
          <Link
            to="/"
            className="mt-12 inline-flex items-center gap-2 text-[0.65rem] tracking-[0.3em] uppercase text-gold-soft hover:text-cream"
          >
            <ArrowLeft size={14} />
            <span>Back to LiveAskew</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-cream">
      {/* Editorial panel */}
      <aside className="relative hidden lg:block lg:w-[42%]">
        <img
          src={quoteImage}
          alt=""
          width={1920}
          height={1080}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-ink/30" />
        <Link
          to="/"
          className="absolute left-10 top-10 flex items-center gap-2 text-[0.65rem] tracking-[0.3em] uppercase text-cream/80 hover:text-cream"
        >
          <ArrowLeft size={14} />
          <span>LiveAskew</span>
        </Link>
        <div className="absolute bottom-12 left-10 right-10 max-w-sm">
          <span className="mb-5 block h-px w-12 bg-gold" />
          <p className="font-display text-2xl italic leading-snug text-cream">
            "Limited availability. Considered intentionally."
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex flex-1 flex-col bg-cream">
        <div className="lg:hidden px-6 pt-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-[0.65rem] tracking-[0.25em] uppercase text-ink/55 hover:text-gold-deep"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-12 md:px-14 md:py-16">
          <div className="max-w-xl">
            <p className="eyebrow">Personal Styling</p>
            <h1 className="font-display mt-5 text-4xl leading-tight md:text-5xl">
              Request a private
              <br />
              <em className="text-gold-deep">consultation</em>.
            </h1>
            <span className="mt-7 block h-px w-12 bg-gold" />
            <p className="mt-7 max-w-md text-sm leading-relaxed text-ink/65">
              Tell us a little about you. Your stylist will be in touch within 48 hours to schedule
              a private consultation.
            </p>

            <form onSubmit={handleSubmit} className="mt-12 space-y-8">
              <Field label="Full name" required>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  placeholder="Your full name"
                  className={inputCls}
                />
              </Field>

              <Field label="Email" required>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="your@email.com"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Field label="Phone" required>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="+1 555 000 0000"
                    className={inputCls}
                  />
                </Field>
                <Field label="City">
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="e.g. New York"
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Best way to reach you">
                <ChipRow
                  options={CONTACT_OPTIONS as unknown as readonly string[]}
                  value={form.preferred_contact}
                  onSelect={(v) => set("preferred_contact", v as (typeof CONTACT_OPTIONS)[number])}
                  single
                />
              </Field>

              {(form.preferred_contact === "Phone call" || form.preferred_contact === "Both") && (
                <Field label="Best time to call">
                  <ChipRow
                    options={TIME_CHIPS as unknown as readonly string[]}
                    value={form.best_time_to_call}
                    onSelect={(v) =>
                      set("best_time_to_call", form.best_time_to_call === v ? "" : v)
                    }
                  />
                </Field>
              )}

              <Field label="What are you looking for?" required>
                <textarea
                  required
                  rows={5}
                  value={form.what_she_needs}
                  onChange={(e) => set("what_she_needs", e.target.value)}
                  placeholder="Tell us about the project — wardrobe build, photoshoot, milestone event. The more you share, the better your stylist can prepare."
                  className={`${inputCls} resize-none leading-relaxed`}
                />
              </Field>

              <Field label="Approximate budget">
                <ChipRow
                  options={BUDGET_CHIPS as unknown as readonly string[]}
                  value={form.budget_range}
                  onSelect={(v) => set("budget_range", form.budget_range === v ? "" : v)}
                />
              </Field>

              {error && (
                <p className="border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gold py-4 text-[0.7rem] font-medium tracking-[0.25em] uppercase text-ink transition hover:bg-gold-deep hover:text-cream disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit inquiry"}
                </button>
                <p className="mt-4 text-center text-xs leading-relaxed text-ink/45">
                  Your inquiry goes directly to the founder. All conversations are confidential.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

const inputCls =
  "w-full border border-ink/15 bg-bone px-4 py-3 text-sm text-ink placeholder:text-ink/35 transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-3 block text-[0.65rem] tracking-[0.25em] uppercase text-ink/55">
        {label}
        {required && <span className="ml-1 text-gold-deep">*</span>}
      </label>
      {children}
    </div>
  );
}

function ChipRow({
  options,
  value,
  onSelect,
  single,
}: {
  options: readonly string[];
  value: string;
  onSelect: (v: string) => void;
  single?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className={`rounded-full px-4 py-2 text-xs tracking-wide shadow-neo-sm transition ${
              active ? "bg-gold/30 text-gold-deep" : "bg-cream text-ink/65 hover:text-gold-deep"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
