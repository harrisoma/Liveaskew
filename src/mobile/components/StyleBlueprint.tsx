import type { LiveProduct, ProductMatches } from "@/lib/shopping-profile";
import { useEffect, useState } from "react";
import { BookOpen, Printer, Shirt, ShoppingBag, ArrowRight, Footprints } from "lucide-react";
import { apiFetch } from "../lib/api";
import type { GuideLook, WardrobeItem } from "../lib/storage";
import {
  blueprintSchema,
  capsuleFormulas,
  retailerSearch,
  type StyleBlueprint as Blueprint,
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
export function StyleBlueprintDocument({
  guide,
  photo,
  products,
}: {
  guide: Blueprint;
  photo?: string;
  products?: ProductMatches | null;
}) {
  const productFor = (index: number) =>
    products?.items.find((p) => p.pieceId === `piece-${index + 1}`);
  const formulas = capsuleFormulas(
    guide.capsule.map((p, i) => ({ ...p, name: productFor(i)?.title ?? p.name })),
  );
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
            Twelve coordinated pieces, including shoes and accessories. Retailer photos show the
            actual products linked below. Unmatched pieces are styling directions; check your closet
            before shopping.
          </p>
        </div>
        <div className="studio-capsule">
          {guide.capsule.map((p, i) => (
            <article key={i} id={`piece-${i + 1}`}>
              <div className="studio-piece" style={{ background: p.hex }}>
                {productFor(i)?.image ? (
                  <img src={productFor(i)!.image!} alt={productFor(i)!.title} loading="lazy" />
                ) : p.role === "shoe" ? (
                  <Footprints />
                ) : p.role === "accessory" ? (
                  <ShoppingBag />
                ) : (
                  <Shirt />
                )}
              </div>
              <span>
                {p.role} · {p.color}
              </span>
              <h3>{productFor(i)?.title ?? p.name}</h3>
              {productFor(i) && <RetailItem product={productFor(i)!} />}
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
            Consider these gaps after your wardrobe review. Live, size-and-budget checked products
            appear in your capsule. The search links below are for further research and are not
            verified inventory.
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
function RetailItem({ product }: { product: LiveProduct }) {
  return (
    <div className="studio-retail">
      <p>
        {product.retailer} ·{" "}
        {new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(
          product.price,
        )}
      </p>
      <p>
        {product.color ? `${product.color} · ` : ""}Listed size: {product.size}
      </p>
      <a className="studio-link" href={product.url} target="_blank" rel="noopener noreferrer">
        Shop this exact item <ArrowRight size={14} />
      </a>
    </div>
  );
}
export function StyleBlueprint({
  wardrobe,
  looks,
  onLooks,
  notice,
}: {
  wardrobe: WardrobeItem[];
  looks: GuideLook[];
  onLooks: () => void;
  notice?: string | null;
}) {
  const [guide, setGuide] = useState<Blueprint | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [products, setProducts] = useState<ProductMatches | null>(null),
    [shoppingBusy, setShoppingBusy] = useState(false);
  async function loadProducts() {
    setShoppingBusy(true);
    try {
      const res = await apiFetch("/api/bee/style-guide/products");
      if (!res.ok) throw Error();
      setProducts(await res.json());
    } catch {
      setProducts(null);
      setError(
        "Live retailer availability could not load. Your guide is safe; select Refresh live products to try again.",
      );
    } finally {
      setShoppingBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await apiFetch("/api/bee/style-guide");
        if (!res.ok) throw Error();
        const data = await res.json();
        if (active && data.guide) setGuide(blueprintSchema.parse(data.guide.document));
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
  useEffect(() => {
    if (guide) void loadProducts();
  }, [guide]);
  async function create() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch("/api/bee/style-guide", {
        method: "POST",
        body: JSON.stringify({
          wardrobe: wardrobe
            .filter((w) => w.verdict && !w.error)
            .map((w) => ({ label: w.label, verdict: w.verdict, reason: w.reason || undefined })),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw Error(
          res.status === 409
            ? "Finish your interview with Bee before generating your guide."
            : res.status === 402
              ? "Choose a membership under You to continue styling."
              : res.status === 429
                ? "Your styling limit has been reached. Please try again later."
                : "Bee couldn’t complete the guide. Your saved interview is ready; please try again.",
        );
      setGuide(blueprintSchema.parse(data.guide.document));
    } catch (e) {
      setError(e instanceof Error ? e.message : "The guide could not be generated.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="studio-scroll">
      <div className="studio-toolbar">
        <span>
          <BookOpen size={17} /> Your Style Guide
        </span>
        <div>
          {guide && (
            <>
              <button disabled={busy} onClick={() => void create()}>
                {busy ? "Updating your guide…" : "Update from my interview"}
              </button>
              <button onClick={() => window.print()}>
                <Printer size={15} /> Print / save PDF
              </button>
              <button disabled={shoppingBusy} onClick={() => void loadProducts()}>
                {shoppingBusy ? "Checking retailers…" : "Refresh live products"}
              </button>
            </>
          )}
          <button onClick={onLooks}>View my looks</button>
        </div>
      </div>
      {loading && (
        <p role="status" className="studio-message">
          Opening your styling notes…
        </p>
      )}
      {notice && (
        <p role="status" className="studio-message">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="studio-message">
          {error}
        </p>
      )}
      {!guide && !loading && (
        <div className="studio-brief">
          <h2>Your interview is complete.</h2>
          <p>
            Your style, fit, color preferences and shopping details come from your saved interview.
            You won’t need to answer another questionnaire.
          </p>
          <button className="studio-primary" disabled={busy} onClick={() => void create()}>
            {busy ? "Bee is writing your guide…" : "Generate my Style Guide"}
          </button>
        </div>
      )}
      {products && (
        <div className="studio-message">
          <p>{products.notice}</p>
          {products.items.length > 0 && (
            <p className="studio-fine">
              {products.items.length} live matches ·{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: products.currency,
              }).format(products.total)}{" "}
              before tax and shipping · Checked {new Date(products.checkedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
      {shoppingBusy && (
        <p role="status" className="studio-message">
          Checking your size, price and availability with retailers…
        </p>
      )}
      {guide && (
        <StyleBlueprintDocument
          guide={guide}
          products={products}
          photo={looks.find((l) => l.tryOnUrl)?.tryOnUrl ?? undefined}
        />
      )}
    </div>
  );
}
