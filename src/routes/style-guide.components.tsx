import { createFileRoute } from "@tanstack/react-router";
import { StyleGuideShell, PageTitle, SectionHeader } from "@/components/StyleGuideNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/style-guide/components")({
  head: () => ({
    meta: [
      { title: "Components — LiveAskew Style Guide" },
      { name: "description", content: "Buttons, inputs, cards, hairlines, eyebrows." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ComponentsPage,
});

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border hairline bg-bone p-8 md:p-10">
      <p className="eyebrow mb-6">{label}</p>
      <div className="flex flex-wrap gap-4 items-center">{children}</div>
    </div>
  );
}

function ComponentsPage() {
  return (
    <StyleGuideShell current="/style-guide/components">
      <PageTitle
        num="06"
        eyebrow="Tailwind v4 + shadcn"
        title="UI"
        italic="Components."
        intro="The functional vocabulary — buttons, inputs, cards, and the editorial detail elements that hold them together."
      />

      <section className="mb-20 grid gap-6">
        <SectionHeader eyebrow="06.01 — Buttons" title="Ink primary. Outline secondary." />
        <Spec label="Variants">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </Spec>
        <Spec label="Sizes">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </Spec>
      </section>

      <section className="mb-20 grid gap-6">
        <SectionHeader eyebrow="06.02 — Inputs" title="Hairline border. Gold ring on focus." />
        <Spec label="Text input">
          <Input placeholder="your@email.com" className="max-w-sm" />
          <Button>Subscribe</Button>
        </Spec>
      </section>

      <section className="mb-20">
        <SectionHeader eyebrow="06.03 — Editorial detail" title="Eyebrows, rules, hairlines." />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border hairline bg-bone p-10">
            <p className="eyebrow mb-2">Eyebrow</p>
            <p className="text-xs text-ink/55 font-mono">.eyebrow utility</p>
          </div>
          <div className="border hairline bg-bone p-10 flex flex-col items-start">
            <span className="gold-rule !mx-0 mb-3" />
            <p className="text-xs text-ink/55 font-mono">.gold-rule utility</p>
          </div>
          <div className="border hairline bg-bone p-10">
            <div className="border hairline p-4 text-xs text-ink/55 font-mono">.hairline border</div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <SectionHeader eyebrow="06.04 — Cards" title="Bone surface, hairline border." />
        <div className="grid md:grid-cols-2 gap-6">
          <article className="bg-bone border hairline p-10">
            <p className="eyebrow mb-4">Look 04 · Summer</p>
            <h3 className="font-display text-3xl leading-tight">
              The <em>Romina</em> in deep jewel
            </h3>
            <p className="mt-4 text-ink/70 leading-[1.7]">
              A column dress drawn in for evenings that begin late — soft tailoring,
              sand-washed silk.
            </p>
            <div className="mt-6 flex gap-3">
              <Button size="sm">Shop the look</Button>
              <Button size="sm" variant="outline">Save</Button>
            </div>
          </article>
          <article className="bg-ink text-cream p-10">
            <p className="eyebrow mb-4" style={{ color: "var(--gold)" }}>Bee · Editorial</p>
            <h3 className="font-display text-3xl leading-tight">
              How to <em>break</em> a uniform
            </h3>
            <p className="mt-4 text-cream/70 leading-[1.7]">
              One unexpected element is enough. Three is a costume. The rule is the
              same as styling silk: less, slower, on purpose.
            </p>
          </article>
        </div>
      </section>
    </StyleGuideShell>
  );
}
