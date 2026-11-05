import { ShoppingBrief } from "./ShoppingBrief";
import type { ShoppingProfile } from "@/lib/shopping-profile";
import type { LiveProduct, ProductMatches } from "@/lib/shopping-profile";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Printer,
  Shirt,
  ShoppingBag,
  ArrowRight,
  Footprints,
  SlidersHorizontal,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import type { GuideLook, WardrobeItem } from "../lib/storage";
import {
  blueprintSchema,
  capsuleFormulas,
  retailerSearch,
  type StyleBlueprint as Blueprint,
} from "@/lib/style-blueprint";

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
  liveAccount = false,
}: {
  guide: Blueprint;
  photo?: string;
  products?: ProductMatches | null;
  liveAccount?: boolean;
}) {
  const [category, setCategory] = useState("all");
  const [allFormulas, setAllFormulas] = useState(false);
  const productFor = (index: number) =>
    products?.items.find((p) => p.pieceId === `piece-${index + 1}`);
  const formulas = capsuleFormulas(
    guide.capsule.map((p, i) => ({ ...p, name: productFor(i)?.title ?? p.name })),
  );
  return (
    <div className="studio-document">
      <header className="studio-hero">
        <div>
          <span className="studio-signature">Made for you, by Bee</span>
          <h1>{guide.title}</h1>
          <p className="studio-archetype">{guide.archetype}</p>
          <p>{guide.intro}</p>
          <div className="studio-overview" aria-label="Guide overview">
            <span>
              <strong>{guide.capsule.length}</strong> wardrobe pieces
            </span>
            <span>
              <strong>{formulas.length}</strong> outfit combinations
            </span>
          </div>
          <a className="studio-primary studio-start" href="#studio-capsule">
            Explore your wardrobe <ArrowRight size={16} />
          </a>
        </div>
        <figure>
          {photo ? (
            <img src={photo} alt="Your outfit preview" />
          ) : (
            <div className="studio-palette-cover" aria-label="Your guide’s color palette">
              {[...guide.palette.neutrals, ...guide.palette.accents].map((color) => (
                <div key={color.name}>
                  <span style={{ background: color.hex }} />
                  <p>{color.name}</p>
                </div>
              ))}
            </div>
          )}
          <figcaption>{photo ? "Your personal lookbook" : "Your palette at a glance"}</figcaption>
        </figure>
      </header>
      <div className="studio-intent">
        <h2>Your style priorities</h2>
        <Notes items={guide.intent} />
      </div>
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
          <h2>Your wardrobe, working together</h2>
          <p>
            Start with what you own. These coordinated pieces give you a foundation to mix, repeat,
            and make your own. Photos show retailer matches; color tiles are styling suggestions.
          </p>
        </div>
        <div className="studio-filters" role="group" aria-label="Filter wardrobe pieces">
          {[
            ["all", "All pieces"],
            ["top", "Tops"],
            ["bottom", "Bottoms"],
            ["dress", "Dresses"],
            ["layer", "Layers"],
            ["shoe", "Shoes"],
            ["accessory", "Accessories"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="studio-capsule">
          {guide.capsule.map((p, i) => (
            <article
              key={i}
              id={`piece-${i + 1}`}
              hidden={category !== "all" && category !== p.role}
            >
              <div className="studio-piece" style={{ background: p.hex }}>
                {productFor(i)?.image ? (
                  <img src={productFor(i)!.image!} alt={productFor(i)!.title} loading="lazy" />
                ) : p.role === "dress" ? (
                  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" aria-hidden="true">
                    <path d="M24 7h16l4 12-7 9 16 28H11l16-28-7-9 4-12Z" />
                    <path d="M27 28h10M27 7c0 7 10 7 10 0" />
                  </svg>
                ) : p.role === "bottom" ? (
                  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" aria-hidden="true">
                    <path d="M20 8h24l5 48H35l-3-30-3 30H15l5-48Z" />
                    <path d="M20 15h24M32 8v10" />
                  </svg>
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
              {productFor(i) && <RetailItem product={productFor(i)!} liveAccount={liveAccount} />}
              {!productFor(i) && <span className="studio-suggestion">Styling suggestion</span>}
              <details className="studio-piece-notes">
                <summary>Why it works</summary>
                <p>{p.reason}</p>
              </details>
            </article>
          ))}
        </div>
      </section>
      <section id="studio-formulas">
        <div className="studio-heading">
          <h2>Less deciding. More getting dressed.</h2>
          <p>
            A few pieces, a complete look. Tap any piece to find it in your wardrobe above. Your
            personalized outfit images are in Looks.
          </p>
        </div>
        <div className="studio-formulas">
          {formulas.map((f, i) => (
            <div key={f.id} hidden={!allFormulas && i >= 4}>
              <span>Look {i + 1}</span>
              <div>
                {f.pieces.map((p) => (
                  <a href={`#${p.id}`} key={p.id} onClick={() => setCategory("all")}>
                    <i style={{ background: p.hex }} />
                    {p.name}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        {formulas.length > 4 && (
          <button
            className="studio-expand"
            aria-expanded={allFormulas}
            onClick={() => setAllFormulas(!allFormulas)}
          >
            {allFormulas ? "Show fewer combinations" : `See all ${formulas.length} combinations`}
          </button>
        )}
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
function RetailItem({
  product,
  liveAccount = false,
}: {
  product: LiveProduct;
  liveAccount?: boolean;
}) {
  const [checking, setChecking] = useState(false),
    [error, setError] = useState<string | null>(null);
  async function shop() {
    setChecking(true);
    setError(null);
    try {
      const res = await apiFetch("/api/bee/style-guide/shop", {
        method: "POST",
        body: JSON.stringify({
          pieceId: product.pieceId,
          url: product.url,
          variantId: product.variantId,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw Error(
          data.error === "retailer_unavailable"
            ? "The retailer could not confirm availability. Please try again shortly."
            : "This option no longer matches your saved size, currency or budget. Refresh live products for current options.",
        );
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The retailer could not be opened.");
    } finally {
      setChecking(false);
    }
  }
  return (
    <div className="studio-retail">
      <p>
        {product.retailer} ·{" "}
        {new Intl.NumberFormat("en-US", { style: "currency", currency: product.currency }).format(
          product.price,
        )}
      </p>
      <p>
        {product.color ? `${product.color} · ` : ""}Selected size / option: {product.size}
      </p>
      {liveAccount ? (
        <button className="studio-link" disabled={checking} onClick={() => void shop()}>
          {checking ? "Checking stock & price…" : "Shop this exact item"} <ArrowRight size={14} />
        </button>
      ) : (
        <a className="studio-link" href={product.url} target="_blank" rel="noopener noreferrer">
          View retailer item <ArrowRight size={14} />
        </a>
      )}
      {error && <p role="alert">{error}</p>}
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
  const [editingInterview, setEditingInterview] = useState(false),
    [savedProfile, setSavedProfile] = useState<ShoppingProfile | null>(null);
  async function editInterview() {
    try {
      const res = await apiFetch("/api/bee/style-guide/shopping-profile");
      if (!res.ok) throw Error();
      const data = await res.json();
      setSavedProfile(data.profile);
      setEditingInterview(true);
    } catch {
      setError("Your interview details could not load. Please try again.");
    }
  }
  async function saveInterview(value: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch("/api/bee/style-guide/shopping-profile", {
        method: "POST",
        body: value,
      });
      if (!res.ok) throw Error();
      setEditingInterview(false);
      await loadProducts();
    } catch {
      setError("Your interview details could not save. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const productRequest = useRef(0);
  async function loadProducts() {
    const requestId = ++productRequest.current;
    setProducts(null);
    setShoppingBusy(true);
    try {
      const res = await apiFetch("/api/bee/style-guide/products");
      if (!res.ok) throw Error();
      const matches = await res.json();
      if (requestId === productRequest.current) setProducts(matches);
    } catch {
      if (requestId !== productRequest.current) return;
      setProducts(null);
      setError(
        "Live retailer availability could not load. Your guide is safe; select Refresh live products to try again.",
      );
    } finally {
      if (requestId === productRequest.current) setShoppingBusy(false);
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
          <details className="studio-tools">
            <summary>
              <SlidersHorizontal size={16} /> Guide settings
            </summary>
            <div>
              <button onClick={() => void editInterview()}>Edit sizes & budget</button>
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
            </div>
          </details>
          <button className="studio-primary" onClick={onLooks}>
            View my looks <ArrowRight size={16} />
          </button>
        </div>
      </div>
      {editingInterview && (
        <div className="studio-editor">
          <button className="studio-expand" onClick={() => setEditingInterview(false)}>
            Close interview details
          </button>
          <ShoppingBrief
            initialProfile={savedProfile}
            disabled={busy}
            onComplete={(value) => void saveInterview(value)}
          />
        </div>
      )}
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
          liveAccount
          photo={looks.find((l) => l.tryOnUrl)?.tryOnUrl ?? undefined}
        />
      )}
    </div>
  );
}
