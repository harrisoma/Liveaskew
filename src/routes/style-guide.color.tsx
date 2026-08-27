import { createFileRoute } from "@tanstack/react-router";
import { StyleGuideShell, PageTitle, SectionHeader } from "@/components/StyleGuideNav";

export const Route = createFileRoute("/style-guide/color")({
  head: () => ({
    meta: [
      { title: "Color — LiveAskew Style Guide" },
      { name: "description", content: "Brand palette and illustration palette tokens." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ColorPage,
});

const BRAND = [
  { name: "--ink", hex: "#161514", label: "Editorial ink", dark: true, role: "Primary text, wordmark, primary surfaces." },
  { name: "--cream", hex: "#FCFBF7", label: "Gallery cream", dark: false, role: "Page background. The default canvas." },
  { name: "--bone", hex: "#FFFFFF", label: "Bone white", dark: false, role: "Cards and elevated surfaces only." },
  { name: "--gold", hex: "#D6A85A", label: "Tailored gold", dark: false, role: "Accent rules, focus rings, key marks." },
  { name: "--gold-deep", hex: "#A88040", label: "Deep gold", dark: true, role: "Eyebrow text, restrained metallic detail." },
  { name: "--gold-soft", hex: "#E8CD9D", label: "Soft gold", dark: false, role: "Backgrounds for callouts, hover wash." },
];

const ILLUS = [
  { name: "--illus-kraft", hex: "#A8824E", label: "Warm kraft", dark: true },
  { name: "--illus-peach", hex: "#F6DDCB", label: "Editorial peach", dark: false },
  { name: "--illus-olive", hex: "#8A8453", label: "Olive-taupe", dark: true },
  { name: "--illus-jewel", hex: "#7E1F2B", label: "Jewel red", dark: true },
  { name: "--ink", hex: "#161514", label: "Linework ink", dark: true },
];

function Swatch({ name, hex, label, dark, role }: { name: string; hex: string; label: string; dark: boolean; role?: string }) {
  return (
    <div className="flex flex-col">
      <div
        className="aspect-[4/5] rounded-sm border hairline flex items-end p-4"
        style={{ background: `var(${name})` }}
      >
        <span
          className="text-xs tracking-[0.18em] uppercase font-medium"
          style={{ color: dark ? "var(--cream)" : "var(--ink)" }}
        >
          {hex}
        </span>
      </div>
      <p className="mt-3 font-display text-xl leading-tight">{label}</p>
      <code className="mt-1 text-xs text-ink/55 font-mono">{name}</code>
      {role && <p className="mt-2 text-sm text-ink/60 leading-snug">{role}</p>}
    </div>
  );
}

function ColorPage() {
  return (
    <StyleGuideShell current="/style-guide/color">
      <PageTitle
        num="01"
        eyebrow="Tokens defined in src/styles.css"
        title="Color &"
        italic="Tokens."
        intro="One ivory canvas. Editorial black. A single tailored gold. The illustration palette extends the brand without competing with it."
      />

      <section className="mb-28">
        <SectionHeader eyebrow="01.01 — Brand palette" title="The page chrome." />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {BRAND.map((s) => <Swatch key={s.name} {...s} />)}
        </div>
      </section>

      <section className="mb-28">
        <SectionHeader eyebrow="01.02 — Illustration palette" title="Warm paper, jewel ink." />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {ILLUS.map((s) => <Swatch key={s.name + s.label} {...s} />)}
        </div>
      </section>

      <section className="mb-12">
        <SectionHeader eyebrow="01.03 — Rules" title="Restraint over saturation." />
        <ul className="space-y-5 max-w-3xl">
          {[
            "Cream is the default canvas. Bone is only for elevated cards.",
            "Gold is punctuation — rules, focus rings, the wordmark accent. Never fills.",
            "Jewel red is the only saturated accent. Use once per composition.",
            "Illustration palette stays inside illustration — don't bleed kraft or peach onto product pages.",
            "Never introduce a new color without adding it as a token in styles.css.",
          ].map((r, i) => (
            <li key={i} className="flex gap-5 items-start">
              <span className="font-display text-2xl leading-none mt-1 shrink-0" style={{ color: "var(--illus-jewel)" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-lg text-ink/80 leading-[1.6]">{r}</span>
            </li>
          ))}
        </ul>
      </section>
    </StyleGuideShell>
  );
}
