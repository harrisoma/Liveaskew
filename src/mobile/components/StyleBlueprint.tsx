import { useEffect, useState } from "react";
import { BookOpen, Printer, Shirt, ShoppingBag, ArrowRight } from "lucide-react";
import { apiFetch } from "../lib/api";
import type { GuideLook, WardrobeItem } from "../lib/storage";
import {
  blueprintSchema,
  blueprintPreferences,
  emptyBlueprintPreferences,
  capsuleFormulas,
  retailerSearch,
  type StyleBlueprint as Blueprint,
  type BlueprintPreferences,
} from "@/lib/style-blueprint";
import flatlay from "@/assets/brand/flatlay.webp";

function Notes({ items }: { items: string[] }) {
  return (
    <ul className="studio-notes">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
export function StyleBlueprintDocument({ guide, photo }: { guide: Blueprint; photo?: string }) {
  const formulas = capsuleFormulas(guide.capsule);
  return (
    <div className="studio-document">
      <header className="studio-hero">
        <div>
          <span className="studio-signature">Bee’s personal styling studio</span>
          <h1>{guide.title}</h1>
          <p className="studio-archetype">{guide.archetype}</p>
          <p>{guide.intro}</p>
          <Notes items={guide.intent} />
        </div>
        <figure>
          <img
            src={photo || flatlay}
            alt={photo ? "Your outfit preview" : "Studio wardrobe inspiration"}
          />
          <figcaption>
            {photo
              ? "Your personal lookbook"
              : "Studio inspiration · your guide is personalized below"}
          </figcaption>
        </figure>
      </header>
      <nav className="studio-index" aria-label="Guide sections">
        {[
          ["palette", "Your palette"],
          ["silhouette", "Shape & fit"],
          ["capsule", "The capsule"],
          ["formulas", "Outfit formulas"],
          ["shopping", "Shopping notes"],
          ["finishing", "Finishing touches"],
        ].map(([id, label]) => (
          <a key={id} href={`#studio-${id}`}>
            {label}
          </a>
        ))}
      </nav>
      <section id="studio-palette">
        <div className="studio-heading">
          <h2>Your color story</h2>
          <p>{guide.palette.basis}</p>
        </div>
        <div className="studio-palette">
          {[...guide.palette.neutrals, ...guide.palette.accents].map((c) => (
            <div key={c.name}>
              <span style={{ background: c.hex }} />
              <p>{c.name}</p>
            </div>
          ))}
        </div>
        <Notes items={guide.palette.consider} />
      </section>
      <section id="studio-silhouette">
        <div className="studio-heading">
          <h2>Shape, fit & movement</h2>
          <p>{guide.silhouette.basis}</p>
        </div>
        <div className="studio-columns">
          {[
            ["Your silhouettes", guide.silhouette.cuts],
            ["Fabric & feel", guide.silhouette.fabrics],
            ["The tailor’s notes", guide.silhouette.tailoring],
          ].map(([title, items]) => (
            <div key={title as string}>
              <h3>{title as string}</h3>
              <Notes items={items as string[]} />
            </div>
          ))}
        </div>
      </section>
      <section id="studio-capsule">
        <div className="studio-heading">
          <h2>A considered capsule</h2>
          <p>
            Twelve coordinated pieces, including shoes and accessories. Check your closet before
            shopping; these are recommendations, not confirmed possessions.
          </p>
        </div>
        <div className="studio-capsule">
          {guide.capsule.map((p, i) => (
            <article key={i} id={`piece-${i + 1}`}>
              <div className="studio-piece" style={{ background: p.hex }}>
                {p.role === "accessory" ? <ShoppingBag /> : <Shirt />}
              </div>
              <span>
                {p.role} · {p.color}
              </span>
              <h3>{p.name}</h3>
              <p>{p.reason}</p>
            </article>
          ))}
        </div>
      </section>
      <section id="studio-formulas">
        <div className="studio-heading">
          <h2>Twenty ways to wear it</h2>
          <p>
            Use these mix-and-match formulas as a starting point. Your seven personalized outfit
            images are in Looks.
          </p>
        </div>
        <div className="studio-formulas">
          {formulas.map((f, i) => (
            <div key={f.id}>
              <span>Look {i + 1}</span>
              <div>
                {f.pieces.map((p) => (
                  <a href={`#${p.id}`} key={p.id}>
                    <i style={{ background: p.hex }} />
                    {p.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section id="studio-shopping">
        <div className="studio-heading">
          <h2>Your shopping notes</h2>
          <p>
            Consider these gaps after your wardrobe review. Retailer links open searches; prices,
            stock, sizing and specific products have not been verified.
          </p>
        </div>
        <div className="studio-columns">
          {guide.gaps.map((g) => (
            <article key={g.item}>
              <span>{g.priority === "first" ? "Consider first" : "For later"}</span>
              <h3>{g.item}</h3>
              <p>{g.why}</p>
              <a
                className="studio-link"
                href={retailerSearch(g.item)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Search retailer <ArrowRight size={14} />
              </a>
            </article>
          ))}
        </div>
        <h3 className="mt-6">Before you buy</h3>
        <Notes items={guide.finishing.shoppingChecklist} />
      </section>
      <section id="studio-finishing">
        <div className="studio-heading">
          <h2>The finishing touches</h2>
          <p>Comfort comes first. Keep the details that feel like you.</p>
        </div>
        <div className="studio-columns">
          {[
            ["Foundations", guide.finishing.foundations],
            ["Shoes", guide.finishing.shoes],
            ["Accessories", guide.finishing.accessories],
            ["Care & grooming", guide.finishing.grooming],
          ].map(([title, items]) => (
            <div key={title as string}>
              <h3>{title as string}</h3>
              <Notes items={items as string[]} />
            </div>
          ))}
        </div>
      </section>
      <footer className="studio-colophon">LiveAskew · A wardrobe for the life you live.</footer>
    </div>
  );
}
export function StyleBlueprint({
  wardrobe,
  looks,
  onLooks,
}: {
  wardrobe: WardrobeItem[];
  looks: GuideLook[];
  onLooks: () => void;
}) {
  const [guide, setGuide] = useState<Blueprint | null>(null),
    [preferences, setPreferences] = useState<BlueprintPreferences>(emptyBlueprintPreferences),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [editing, setEditing] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await apiFetch("/api/bee/style-guide");
        if (!res.ok) throw Error();
        const data = await res.json();
        if (active && data.guide) {
          setGuide(blueprintSchema.parse(data.guide.document));
          setPreferences(blueprintPreferences.parse(data.guide.preferences));
        }
      } catch {
        if (active) setError("Your saved guide could not load. Try again when you’re connected.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  async function create() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch("/api/bee/style-guide", {
        method: "POST",
        body: JSON.stringify({
          preferences,
          wardrobe: wardrobe
            .filter((w) => w.verdict && !w.error)
            .map((w) => ({ label: w.label, verdict: w.verdict, reason: w.reason || undefined })),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw Error(
          res.status === 409
            ? "Finish your interview with Bee before creating your guide."
            : res.status === 402
              ? "Choose a membership under You to continue styling."
              : res.status === 429
                ? "Your styling limit has been reached. Please try again later."
                : "Bee couldn’t complete the guide. Your existing guide is safe; please try again.",
        );
      setGuide(blueprintSchema.parse(data.guide.document));
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The guide could not be created.");
    } finally {
      setBusy(false);
    }
  }
  const fields: [keyof BlueprintPreferences, string][] = [
    ["aesthetic", "Styles you feel drawn to"],
    ["presence", "How you want to feel and be perceived"],
    ["coloring", "Your coloring, if you know it"],
    ["colors", "Colors you love or avoid"],
    ["proportions", "Fit, coverage and silhouette preferences"],
    ["measurements", "Sizes or measurements (optional)"],
    ["occasions", "Your week, climate and occasions"],
    ["budget", "Your shopping budget and currency"],
  ];
  return (
    <div className="studio-scroll">
      <div className="studio-toolbar">
        <span>
          <BookOpen size={17} /> Your Style Guide
        </span>
        <div>
          <button onClick={() => setEditing(!editing)} aria-expanded={editing}>
            {editing ? "Close brief" : "Refine my brief"}
          </button>
          {guide && (
            <button onClick={() => window.print()}>
              <Printer size={15} /> Print / save PDF
            </button>
          )}
          <button onClick={onLooks}>View my looks</button>
        </div>
      </div>
      {loading && (
        <p role="status" className="studio-message">
          Opening your styling notes…
        </p>
      )}
      {error && (
        <p role="alert" className="studio-message">
          {error}
        </p>
      )}
      {((!guide && !loading) || editing) && (
        <div className="studio-brief">
          <h2>{guide ? "A little more about you" : "Your wardrobe, with a point of view."}</h2>
          <p>
            Bee uses your saved interview and wardrobe review to create your editorial guide. Add
            any details you’d like her to consider.
          </p>
          <div className="studio-brief-fields">
            {fields.map(([key, label]) => (
              <label key={key}>
                {label}
                <textarea
                  value={preferences[key]}
                  maxLength={500}
                  rows={2}
                  onChange={(e) => setPreferences((p) => ({ ...p, [key]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <button className="studio-primary" disabled={busy} onClick={() => void create()}>
            {busy
              ? "Bee is writing your guide…"
              : guide
                ? "Update my Style Guide"
                : "Create my Style Guide"}
          </button>
          <p className="studio-fine">
            Your photo is used for outfit previews in Looks. This guide uses your consultation, not
            a body or color scan.
          </p>
        </div>
      )}
      {guide && (
        <StyleBlueprintDocument
          guide={guide}
          photo={looks.find((l) => l.tryOnUrl)?.tryOnUrl ?? undefined}
        />
      )}
    </div>
  );
}
