import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/bianca")({
  head: () => ({
    meta: [
      { title: "Work with Bianca — 1-on-1 Personal Styling | LiveAskew" },
      {
        name: "description",
        content:
          "Personal, in-person styling with LiveAskew founder Bianca — two decades of multinational retail and styling experience. Call for pricing.",
      },
      { property: "og:title", content: "Work with Bianca — LiveAskew" },
      {
        property: "og:description",
        content:
          "A private, human styling relationship with LiveAskew's founder. By inquiry only.",
      },
    ],
  }),
  component: BiancaPage,
});

function BiancaPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    looking_for: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.looking_for.trim()) {
      setError("Please complete every field so Bianca can reach you.");
      return;
    }
    setSubmitting(true);
    const { error: insertError } = await supabase
      .from("personal_styling_inquiries")
      .insert({
        full_name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        preferred_contact: "Phone call",
        what_she_needs: form.looking_for.trim(),
      });
    setSubmitting(false);
    if (insertError) {
      setError("Something went wrong sending your inquiry. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <Nav />

      <main className="pt-28">
        {/* HERO */}
        <section className="px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-4xl">
            <p className="eyebrow text-gold-deep">The Personal Path</p>
            <h1 className="font-display mt-6 text-5xl leading-[1.05] md:text-7xl">
              Work with <em className="text-gold-deep">Bianca</em>.
            </h1>
            <span className="mt-8 block h-px w-16 bg-gold" />
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink/75 md:text-xl">
              Some women want a conversation with software. Others want a person —
              someone who learns the way they move through the world and dresses
              them, season after season. This is that relationship.
            </p>
          </div>
        </section>

        {/* ABOUT BIANCA */}
        <section className="px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1fr_1.4fr] md:gap-20">
            <div>
              <p className="eyebrow text-ink/55">The Stylist</p>
              <h2 className="font-display mt-5 text-3xl leading-tight md:text-4xl">
                Two decades, dressing rooms on three continents.
              </h2>
            </div>
            <div className="space-y-5 text-base leading-relaxed text-ink/75">
              <p>
                Bianca is the founder of LiveAskew. Before building Bee, she spent
                twenty years inside multinational retail — buying, merchandising,
                and personally styling clients who wanted more than a trend cycle.
              </p>
              <p>
                Her approach is quiet and exacting. She listens before she
                suggests. She studies how you actually live — the meetings, the
                school runs, the rooms you walk into and the women you sit beside
                — and then she builds a wardrobe that does that work for you.
              </p>
              <p>
                She takes on a small number of private clients each season.
              </p>
            </div>
          </div>
        </section>

        {/* WHAT'S INCLUDED */}
        <section className="border-t hairline bg-bone px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-5xl">
            <p className="eyebrow text-gold-deep">What's Included</p>
            <h2 className="font-display mt-5 text-3xl leading-tight md:text-4xl">
              1-on-1 styling, end to end.
            </h2>
            <span className="mt-7 block h-px w-12 bg-gold" />
            <ul className="mt-10 grid gap-x-12 gap-y-6 md:grid-cols-2">
              {[
                "Private discovery call — your lifestyle, your calendar, your goals.",
                "Closet edit — what stays, what leaves, what's missing.",
                "Personalised colour and silhouette blueprint.",
                "Curated shopping lists and source-down across labels.",
                "Look-by-look styling for the season ahead.",
                "Ongoing access between sessions for the questions that matter.",
              ].map((line) => (
                <li key={line} className="flex gap-4">
                  <span className="mt-2 h-px w-6 shrink-0 bg-gold-deep" />
                  <span className="text-base leading-relaxed text-ink/80">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* INQUIRY FORM */}
        <section id="inquire" className="px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-2xl">
            <p className="eyebrow text-gold-deep">Call for Pricing</p>
            <h2 className="font-display mt-5 text-3xl leading-tight md:text-4xl">
              Begin the conversation.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink/70">
              Tell Bianca a little about yourself. She personally reviews every
              inquiry and will be in touch within two business days to discuss
              fit, scope and pricing.
            </p>
            <span className="mt-7 block h-px w-12 bg-gold" />

            {submitted ? (
              <div className="mt-10 border border-ink/10 bg-bone px-8 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gold/60">
                  <Check size={20} className="text-gold-deep" />
                </div>
                <p className="eyebrow mt-6 text-gold-deep">Received</p>
                <h3 className="font-display mt-3 text-2xl">Thank you.</h3>
                <p className="mt-4 text-sm leading-relaxed text-ink/70">
                  Your inquiry is with Bianca. Expect a personal note within two
                  business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-10 space-y-6">
                <Field
                  label="Your name"
                  value={form.name}
                  onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                  required
                />
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                  required
                />
                <Field
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                  required
                />
                <div>
                  <label className="eyebrow text-ink/60">What you're looking for</label>
                  <textarea
                    value={form.looking_for}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, looking_for: e.target.value }))
                    }
                    rows={5}
                    required
                    placeholder="A few sentences about the season ahead, the wardrobe gaps, the moments you're dressing for…"
                    className="mt-3 w-full rounded-2xl border-0 bg-cream px-4 py-3 text-sm text-ink shadow-neo-inset placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-gold-deep"
                  />
                </div>

                {error && (
                  <p className="border-l-2 border-gold-deep bg-bone px-4 py-3 text-sm text-ink">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-ink px-6 py-4 font-sans text-[0.7rem] tracking-[0.22em] uppercase text-cream transition hover:bg-gold-deep disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send inquiry"}
                </button>
                <p className="text-center text-[0.65rem] tracking-[0.18em] uppercase text-ink/45">
                  By inquiry only · Limited seasonal availability
                </p>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="eyebrow text-ink/60">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-3 w-full rounded-2xl border-0 bg-cream px-4 py-3 text-sm text-ink shadow-neo-inset placeholder:text-ink/35 focus:outline-none focus:ring-2 focus:ring-gold-deep"
      />
    </div>
  );
}
