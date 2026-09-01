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

      <main>
        {/* HERO — dark glass */}
        <section className="relative overflow-hidden bg-ink px-6 pb-20 pt-32 text-cream md:px-10 md:pb-28 md:pt-40">
          <div aria-hidden className="glass-glow -top-32 right-[-10%] h-[440px] w-[440px]" />
          <div className="relative mx-auto max-w-4xl">
            <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold">The Personal Path</p>
            <h1 className="font-display mt-6 text-5xl leading-[1.05] md:text-7xl">
              Work with <span className="text-gold">Bianca</span>.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-cream/70 md:text-xl">
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
              <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-ink/45">The Stylist</p>
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
        <section className="bg-cream px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-5xl">
            <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">What's Included</p>
            <h2 className="font-display mt-5 text-3xl leading-tight md:text-4xl">
              1-on-1 styling, end to end.
            </h2>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                "Private discovery call — your lifestyle, your calendar, your goals.",
                "Closet edit — what stays, what leaves, what's missing.",
                "Personalised colour and silhouette blueprint.",
                "Curated shopping lists and source-down across labels.",
                "Look-by-look styling for the season ahead.",
                "Ongoing access between sessions for the questions that matter.",
              ].map((line) => (
                <li key={line} className="neu-raised flex gap-3 rounded-2xl px-5 py-4">
                  <Check size={16} className="mt-0.5 shrink-0 text-gold-deep" />
                  <span className="text-sm leading-relaxed text-ink/80">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* INQUIRY FORM */}
        <section id="inquire" className="px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-2xl">
            <p className="text-center text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">Call for Pricing</p>
            <h2 className="font-display mt-5 text-center text-3xl leading-tight md:text-4xl">
              Begin the conversation.
            </h2>
            <p className="mt-5 text-center text-base leading-relaxed text-ink/70">
              Tell Bianca a little about yourself. She personally reviews every
              inquiry and will be in touch within two business days to discuss
              fit, scope and pricing.
            </p>

            {submitted ? (
              <div className="neu-raised mt-10 rounded-[26px] px-8 py-12 text-center">
                <div className="neu-raised mx-auto flex h-14 w-14 items-center justify-center rounded-full">
                  <Check size={22} className="text-gold-deep" />
                </div>
                <p className="mt-6 text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">Received</p>
                <h3 className="font-display mt-3 text-2xl">Thank you.</h3>
                <p className="mt-4 text-sm leading-relaxed text-ink/70">
                  Your inquiry is with Bianca. Expect a personal note within two
                  business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="neu-raised mt-10 space-y-4 rounded-[26px] p-8">
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
                <div className="neu-inset rounded-2xl px-5 py-3.5">
                  <label className="text-[0.6rem] font-semibold tracking-[0.1em] uppercase text-ink/45">
                    What you're looking for
                  </label>
                  <textarea
                    value={form.looking_for}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, looking_for: e.target.value }))
                    }
                    rows={4}
                    required
                    placeholder="A few sentences about the season ahead, the wardrobe gaps, the moments you're dressing for…"
                    className="mt-2 w-full resize-none bg-transparent text-sm text-ink placeholder:text-ink/35 focus:outline-none"
                  />
                </div>

                {error && (
                  <p className="rounded-full border border-destructive/30 bg-destructive/10 px-5 py-3 text-center text-sm text-destructive">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-gradient-to-br from-gold to-gold-deep py-4 text-sm font-semibold text-ink shadow-lg shadow-gold/30 transition hover:brightness-105 disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send inquiry"}
                </button>
                <p className="text-center text-sm text-ink/45">
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
    <div className="neu-inset flex items-center gap-3 rounded-full px-5 py-3.5">
      <label className="sr-only">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={label}
        className="w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
      />
    </div>
  );
}
