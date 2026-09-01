import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Plus, Shirt, SlidersHorizontal } from "lucide-react";
import { listWardrobeItems } from "@/lib/wardrobe.functions";
import { supabase } from "@/integrations/supabase/client";
import { BeeMark } from "@/components/BeeMark";

export const Route = createFileRoute("/_authenticated/wardrobe")({
  head: () => ({
    meta: [
      { title: "Wardrobe — LiveAskew" },
      { name: "description", content: "Your archival wardrobe inventory, curated by Bee." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WardrobePage,
});

type WardrobeItem = {
  id: string;
  name: string | null;
  brand: string | null;
  category: string;
  subcategory: string | null;
  color: string | null;
  pattern: string | null;
  season: string | null;
  tags: string[] | null;
  photo_path: string | null;
  notes: string | null;
  created_at: string;
};

const CATEGORIES = ["All", "Outerwear", "Dresses", "Tailoring", "Footwear", "Tops", "Bottoms", "Accessories"];

function WardrobePage() {
  const fetchItems = useServerFn(listWardrobeItems);

  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchItems({ data: { category: selectedCategory } })
      .then((res) => {
        if (!active) return;
        setItems((res.items ?? []) as WardrobeItem[]);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [fetchItems, selectedCategory]);


  const stats = useMemo(() => {
    const total = items.length;
    const categories = new Set(items.map((i) => i.category)).size;
    const withPhotos = items.filter((i) => i.photo_path).length;
    return { total, categories, withPhotos };
  }, [items]);

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-ink/55 hover:text-gold-deep">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <BeeMark className="h-5 w-5 text-gold-deep" />
          <span className="font-display text-base font-semibold">Wardrobe</span>
        </div>
        <button className="neu-raised inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-ink transition">
          <Plus size={14} /> Archive Item
        </button>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">Archival Inventory</p>
        <h1 className="font-display mt-3 text-4xl leading-tight md:text-5xl">
          The Digital Closet
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/70">
          Every piece Bee knows about — sorted by category, tagged by season, and ready to style.
        </p>

        {/* Stats */}
        <section className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="neu-raised relative overflow-hidden rounded-2xl p-6">
            <div className="absolute right-4 bottom-4 text-ink/[0.05] pointer-events-none">
              <Shirt className="h-20 w-20" />
            </div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink/45">Total Curated Pieces</p>
            <p className="font-display mt-2 text-3xl text-ink">{stats.total}</p>
          </div>
          <div className="neu-raised rounded-2xl p-6">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink/45">Categories Represented</p>
            <p className="font-display mt-2 text-3xl text-gold-deep">{stats.categories}</p>
          </div>
          <div className="neu-raised rounded-2xl p-6">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink/45">Photographed</p>
            <p className="font-display mt-2 text-3xl text-ink">
              {stats.total > 0 ? Math.round((stats.withPhotos / stats.total) * 100) : 0}%
            </p>
          </div>
        </section>

        {/* Filters */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === cat
                    ? "bg-gradient-to-br from-gold to-gold-deep text-ink"
                    : "neu-inset text-ink/55 hover:text-ink"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button className="neu-raised flex items-center gap-2 self-end rounded-full px-4 py-2.5 text-sm font-medium text-ink/70 transition hover:text-ink sm:self-auto">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filter Matrix
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-10 flex items-center gap-2 text-sm text-ink/55">
            <Loader2 size={14} className="animate-spin" /> Loading your wardrobe…
          </div>
        )}

        {/* Empty */}
        {!loading && items.length === 0 && (
          <div className="neu-raised mt-12 rounded-[26px] p-10 text-center">
            <Shirt className="mx-auto text-ink/30" size={28} />
            <p className="font-display mt-4 text-2xl">Your closet is waiting.</p>
            <p className="mt-2 text-sm text-ink/60">
              Archive your first piece to begin your digital wardrobe.
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && items.length > 0 && (
          <main className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <WardrobeCard key={item.id} item={item} />
            ))}
          </main>
        )}

        {/* Category empty state */}
        {!loading && items.length === 0 && selectedCategory !== "All" && (
          <p className="mt-10 text-sm text-ink/55">
            No items in <span className="font-medium text-ink">{selectedCategory}</span> yet.
          </p>
        )}
      </div>
    </main>
  );
}

function WardrobeCard({ item }: { item: WardrobeItem }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!item.photo_path) {
      setImgSrc(null);
      return;
    }
    if (item.photo_path.startsWith("http")) {
      setImgSrc(item.photo_path);
      return;
    }
    // Try to resolve a public URL from Supabase storage
    try {
      const { data } = supabase.storage.from("wardrobe").getPublicUrl(item.photo_path);
      setImgSrc(data?.publicUrl ?? null);
    } catch {
      setImgSrc(null);
    }
  }, [item.photo_path]);

  const displayName = item.name || item.brand || item.category;
  const subtitle = [item.brand, item.color, item.subcategory].filter(Boolean).join(" · ");

  return (
    <div className="neu-raised group relative rounded-2xl p-3 transition">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-cream relative mb-4">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={displayName ?? "Wardrobe item"}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink/20">
            <Shirt size={40} />
          </div>
        )}
      </div>
      <div className="space-y-1 px-1">
        <div className="flex justify-between items-baseline">
          <p className="font-display text-base tracking-tight text-ink truncate">{displayName}</p>
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-gold-deep shrink-0 ml-2">{item.category}</span>
        </div>
        {subtitle && <p className="text-xs text-ink/60">{subtitle}</p>}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {(item.tags ?? []).map((tag, i) => (
            <span key={i} className="rounded-full bg-cream px-2.5 py-1 text-[0.6rem] font-medium text-ink/70">
              {tag}
            </span>
          ))}
          {item.season && (
            <span className="rounded-full bg-cream px-2.5 py-1 text-[0.6rem] font-medium text-ink/70">
              {item.season}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
