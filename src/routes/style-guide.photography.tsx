import { createFileRoute } from "@tanstack/react-router";
import { StyleGuideShell, PageTitle, SectionHeader } from "@/components/StyleGuideNav";

export const Route = createFileRoute("/style-guide/photography")({
  head: () => ({
    meta: [
      { title: "Photography — LiveAskew Style Guide" },
      { name: "description", content: "Photography treatment, cropping, tone." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PhotographyPage,
});

function PhotographyPage() {
  return (
    <StyleGuideShell current="/style-guide/photography">
      <PageTitle
        num="05"
        eyebrow="When the camera leads"
        title="Photography"
        italic="Direction."
        intro="Photography carries product, garment, and shoppable looks. Illustration carries editorial moments. Never the reverse."
      />

      <section className="mb-28">
        <SectionHeader eyebrow="05.01 — Treatment" title="Natural light. Warm shadow. No filter." />
        <div className="grid md:grid-cols-2 gap-10 max-w-4xl">
          <div>
            <p className="font-display text-3xl mb-4">Color</p>
            <p className="text-ink/80 leading-[1.75]">
              Slight warm cast (3200–4000K). Shadows hold detail. Never crushed
              blacks. Skin tones true — no Instagram saturation, no cool teal grade.
            </p>
          </div>
          <div>
            <p className="font-display text-3xl mb-4">Light</p>
            <p className="text-ink/80 leading-[1.75]">
              Window light or soft overhead diffusion. Hard noon sun and on-camera
              flash are both forbidden — they flatten texture, and texture is the point.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-28">
        <SectionHeader eyebrow="05.02 — Composition" title="Garment first. Body second. Background last." />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Full look", desc: "3:4 vertical. Subject from above the head to below the shoe.", ratio: "aspect-[3/4]" },
            { title: "Detail", desc: "1:1 square. Fabric weave, hem, hardware. No face.", ratio: "aspect-square" },
            { title: "Editorial", desc: "16:9 landscape. Motion, environment, gesture.", ratio: "aspect-video" },
          ].map((c) => (
            <div key={c.title}>
              <div className={`${c.ratio} bg-[color:var(--illus-peach)] border hairline rounded-sm flex items-center justify-center`}>
                <span className="font-display text-xl text-ink/40">{c.title}</span>
              </div>
              <p className="mt-3 font-display text-xl">{c.title}</p>
              <p className="text-sm text-ink/65 mt-1">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <SectionHeader eyebrow="05.03 — Rules" title="Photography ≠ illustration." />
        <ul className="space-y-5 max-w-3xl">
          {[
            "Photography is the only medium for product. If it's shoppable, it's photographed.",
            "Illustration is the only medium for Bee, editorial mood, and styling theory.",
            "Never composite illustration on top of a photograph. They live in separate frames.",
            "Real bodies, real skin, real garments. No retouching beyond color correction.",
            "Captions always sit in Inter caption style — never handwritten beside a photo.",
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
