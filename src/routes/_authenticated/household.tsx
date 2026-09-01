import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Lock, Plus, Trash2, Users, X } from "lucide-react";
import { BeeMark } from "@/components/BeeMark";
import {
  createFamilyProfile,
  deleteFamilyProfile,
  listFamilyProfiles,
  updateFamilyProfile,
} from "@/lib/family.functions";
import { getMySelfies } from "@/lib/selfies.functions";
import { SelfieUploader } from "@/components/SelfieUploader";
import { hasEntitlement, loadResolvedTier } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/household")({
  head: () => ({
    meta: [
      { title: "Household — LiveAskew" },
      { name: "description", content: "Manage the family profiles Bee styles for your household." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HouseholdPage,
});

type Sizes = {
  top?: string;
  bottom?: string;
  shoe?: string;
  dress?: string;
  notes?: string;
};

type Profile = {
  id: string;
  name: string;
  relationship: "husband" | "wife" | "partner" | "child" | string;
  sizes: Sizes;
  aesthetic_territory: string | null;
  notes: string | null;
};

const RELATIONSHIPS: { value: Profile["relationship"]; label: string }[] = [
  { value: "husband", label: "Husband" },
  { value: "wife", label: "Wife" },
  { value: "partner", label: "Partner" },
  { value: "child", label: "Child" },
];

function HouseholdPage() {
  const list = useServerFn(listFamilyProfiles);
  const create = useServerFn(createFamilyProfile);
  const update = useServerFn(updateFamilyProfile);
  const remove = useServerFn(deleteFamilyProfile);

  const [tier, setTier] = useState<string | null>(null);
  const [tierLoading, setTierLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resolved = await loadResolvedTier();
      setTier(resolved);
      setTierLoading(false);
    })();
  }, []);

  const canFamily = hasEntitlement(tier, "householdPartnerSeat");
  const canSelfie = hasEntitlement(tier, "selfieAI");
  const fetchSelfies = useServerFn(getMySelfies);
  const [primarySelfie, setPrimarySelfiePath] = useState<string | null>(null);
  const [familySelfies, setFamilySelfies] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!canFamily) {
      setLoading(false);
      return;
    }
    list()
      .then((r) => setProfiles((r.profiles ?? []) as Profile[]))
      .finally(() => setLoading(false));
  }, [canFamily, list]);

  useEffect(() => {
    if (!canSelfie) return;
    fetchSelfies()
      .then((r) => {
        setPrimarySelfiePath(r.primaryPath);
        const map: Record<string, string | null> = {};
        for (const f of r.family) map[f.id] = f.selfie_photo_path;
        setFamilySelfies(map);
      })
      .catch(() => {});
  }, [canSelfie, fetchSelfies]);

  async function handleSubmit(form: {
    name: string;
    relationship: Profile["relationship"];
    sizes: Sizes;
    aesthetic_territory: string;
    notes: string;
  }) {
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const { profile } = await update({
          data: {
            id: editing.id,
            name: form.name,
            relationship: form.relationship as "husband" | "wife" | "partner" | "child",
            sizes: form.sizes,
            aesthetic_territory: form.aesthetic_territory || null,
            notes: form.notes || null,
          },
        });
        setProfiles((p) => p.map((x) => (x.id === profile.id ? (profile as Profile) : x)));
      } else {
        const { profile } = await create({
          data: {
            name: form.name,
            relationship: form.relationship as "husband" | "wife" | "partner" | "child",
            sizes: form.sizes,
            aesthetic_territory: form.aesthetic_territory || null,
            notes: form.notes || null,
          },
        });
        setProfiles((p) => [...p, profile as Profile]);
      }
      setShowForm(false);
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this household profile?")) return;
    await remove({ data: { id } });
    setProfiles((p) => p.filter((x) => x.id !== id));
  }

  if (tierLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream text-ink/40">
        <Loader2 className="animate-spin" size={20} />
      </main>
    );
  }

  if (!canSelfie && !canFamily) {
    return (
      <main className="min-h-screen bg-cream text-ink">
        <header className="flex items-center justify-between px-6 py-5 md:px-10">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-ink/55 hover:text-gold-deep">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <BeeMark className="h-5 w-5 text-gold-deep" />
            <span className="font-display text-base font-semibold">Household</span>
          </div>
          <span />
        </header>
        <div className="neu-raised mx-auto mt-14 max-w-2xl rounded-[30px] px-6 py-16 text-center md:px-10">
          <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">Premium</p>
          <h1 className="font-display mt-4 text-4xl leading-tight md:text-5xl">
            Selfie AI &amp; Household — Premium.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-ink/65">
            Upgrade to Premium for Selfie AI lookbooks on your own likeness, or to Premium Plus to
            bring up to three family members into your styling life.
          </p>
          <Link
            to="/pricing"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-deep px-7 py-3.5 text-sm font-semibold text-ink shadow-lg shadow-gold/30 transition hover:brightness-105"
          >
            See Premium tiers
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream text-ink">
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-ink/55 hover:text-gold-deep">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <BeeMark className="h-5 w-5 text-gold-deep" />
          <span className="font-display text-base font-semibold">Household</span>
        </div>
        {canFamily ? (
          <button
            disabled={profiles.length >= 3}
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="neu-raised inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-ink transition disabled:opacity-40"
          >
            <Plus size={14} /> Add member
          </button>
        ) : (
          <Link
            to="/pricing"
            className="neu-inset inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-ink/60 hover:text-gold-deep"
          >
            <Lock size={12} /> Add household
          </Link>
        )}
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10 md:px-10">
        <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">Section 04</p>
        <h1 className="font-display mt-3 text-4xl leading-tight md:text-5xl">
          Manage your household profiles.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/65">
          Up to three sub-profiles. Each has their own sizes, aesthetic territory, and styling
          rules — and Bee shifts her voice the moment you switch.
        </p>

        <section className="neu-raised mt-10 rounded-[26px] p-7">
          <p className="text-[0.6rem] font-semibold tracking-[0.1em] uppercase text-gold-deep">Selfie AI · Primary</p>
          <h2 className="font-display mt-2 text-2xl">Your face on every cover.</h2>
          <p className="mt-2 max-w-xl text-sm text-ink/60">
            Bee uses your selfie to render lookbook imagery on your own likeness. One clear,
            front-facing photo is enough.
          </p>
          <div className="mt-5">
            <SelfieUploader
              scope={{ kind: "primary" }}
              tier={tier}
              label="You — primary member"
              sublabel="Used across magazine covers and event lookbooks."
              path={primarySelfie}
              onChange={setPrimarySelfiePath}
            />
          </div>
        </section>

        {!canFamily ? (
          <div className="neu-raised mt-8 rounded-[26px] p-8 text-center">
            <Users className="mx-auto text-ink/40" size={24} />
            <p className="font-display mt-3 text-xl">Add the rest of your household.</p>
            <p className="mt-2 text-sm text-ink/60">
              Premium Plus unlocks up to three family sub-profiles, each with their own Selfie AI.
            </p>
            <Link
              to="/pricing"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-deep px-5 py-2.5 text-sm font-semibold text-ink"
            >
              See Premium Plus
            </Link>
          </div>
        ) : loading ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-ink/55">
            <Loader2 size={14} className="animate-spin" /> Loading household…
          </div>
        ) : profiles.length === 0 ? (
          <div className="neu-raised mt-8 rounded-[26px] p-10 text-center">
            <Users className="mx-auto text-ink/40" size={28} />
            <p className="font-display mt-4 text-2xl">No family profiles yet.</p>
            <p className="mt-2 text-sm text-ink/60">Add your first member to begin.</p>
          </div>
        ) : (
          <ul className="mt-8 grid gap-5 md:grid-cols-2">
            {profiles.map((p) => (
              <li key={p.id} className="neu-raised rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.6rem] font-semibold tracking-[0.1em] uppercase text-gold-deep">{p.relationship}</p>
                    <h3 className="font-display mt-2 text-2xl">{p.name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setEditing(p); setShowForm(true); }}
                      className="neu-inset rounded-full px-3.5 py-1.5 text-xs font-medium text-ink/70 hover:text-ink"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="neu-inset grid h-8 w-8 place-items-center rounded-full text-ink/50 hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <dl className="mt-5 space-y-2 text-sm text-ink/70">
                  {p.aesthetic_territory && (
                    <div>
                      <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink/40">Aesthetic</dt>
                      <dd className="mt-1">{p.aesthetic_territory}</dd>
                    </div>
                  )}
                  {Object.keys(p.sizes ?? {}).length > 0 && (
                    <div>
                      <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink/40">Sizes</dt>
                      <dd className="mt-1 text-xs">{JSON.stringify(p.sizes)}</dd>
                    </div>
                  )}
                  {p.notes && (
                    <div>
                      <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink/40">Notes</dt>
                      <dd className="mt-1 italic text-ink/55">{p.notes}</dd>
                    </div>
                  )}
                </dl>
                <div className="mt-5">
                  <SelfieUploader
                    scope={{ kind: "family", id: p.id }}
                    tier={tier}
                    label={`${p.name} — ${p.relationship}`}
                    sublabel={p.relationship === "child" ? "Used for child lookbook renders." : "Used on this profile's looks."}
                    path={familySelfies[p.id] ?? null}
                    onChange={(path) => setFamilySelfies((m) => ({ ...m, [p.id]: path }))}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {profiles.length >= 3 && (
          <p className="mt-6 text-xs text-ink/45">
            Platinum Plus households support up to three family profiles.
          </p>
        )}
      </div>

      {showForm && (
        <ProfileForm
          initial={editing}
          saving={saving}
          error={error}
          onClose={() => { setShowForm(false); setEditing(null); setError(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </main>
  );
}

function ProfileForm({
  initial,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  initial: Profile | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (form: {
    name: string;
    relationship: Profile["relationship"];
    sizes: Sizes;
    aesthetic_territory: string;
    notes: string;
  }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [relationship, setRelationship] = useState<Profile["relationship"]>(
    initial?.relationship ?? "partner",
  );
  const [aesthetic, setAesthetic] = useState(initial?.aesthetic_territory ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [top, setTop] = useState(initial?.sizes?.top ?? "");
  const [bottom, setBottom] = useState(initial?.sizes?.bottom ?? "");
  const [shoe, setShoe] = useState(initial?.sizes?.shoe ?? "");
  const [dress, setDress] = useState(initial?.sizes?.dress ?? "");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const sizes: Sizes = {};
          if (top) sizes.top = top;
          if (bottom) sizes.bottom = bottom;
          if (shoe) sizes.shoe = shoe;
          if (dress) sizes.dress = dress;
          onSubmit({ name: name.trim(), relationship, sizes, aesthetic_territory: aesthetic.trim(), notes: notes.trim() });
        }}
        className="neu-raised w-full max-w-xl rounded-[26px] p-6 md:p-8"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[0.6rem] font-semibold tracking-[0.14em] uppercase text-gold-deep">{initial ? "Edit member" : "Add member"}</p>
            <h3 className="font-display mt-2 text-2xl">Household profile</h3>
          </div>
          <button type="button" onClick={onClose} className="neu-inset grid h-8 w-8 place-items-center rounded-full text-ink/40 hover:text-ink" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} className="input" />
          </Field>
          <Field label="Relationship">
            <select value={relationship} onChange={(e) => setRelationship(e.target.value as Profile["relationship"])} className="input">
              {RELATIONSHIPS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Top size"><input value={top} onChange={(e) => setTop(e.target.value)} className="input" /></Field>
          <Field label="Bottom size"><input value={bottom} onChange={(e) => setBottom(e.target.value)} className="input" /></Field>
          <Field label="Shoe size"><input value={shoe} onChange={(e) => setShoe(e.target.value)} className="input" /></Field>
          <Field label="Dress size"><input value={dress} onChange={(e) => setDress(e.target.value)} className="input" /></Field>
        </div>

        <Field className="mt-4" label="Aesthetic territory">
          <input value={aesthetic} onChange={(e) => setAesthetic(e.target.value)} placeholder="Quiet luxury, downtown tailored, sporty heritage…" maxLength={280} className="input" />
        </Field>
        <Field className="mt-4" label="Notes for Bee">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={600} placeholder="Avoids loud prints. Prefers natural fibres. Cold-runs." className="input resize-none" />
        </Field>

        {error && <p className="mt-4 text-xs text-destructive">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2.5 text-sm font-medium text-ink/60 hover:text-ink">Cancel</button>
          <button type="submit" disabled={saving || !name.trim()} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-gold to-gold-deep px-5 py-2.5 text-sm font-semibold text-ink transition disabled:opacity-50">
            {saving && <Loader2 size={12} className="animate-spin" />}
            Save profile
          </button>
        </div>

        <style>{`.input{width:100%;border-radius:18px;border:none;background:var(--cream);box-shadow:inset 3px 3px 7px var(--border), inset -3px -3px 7px var(--bone);padding:0.65rem 1rem;font-size:0.875rem;outline:none}.input:focus{box-shadow:inset 3px 3px 7px var(--border), inset -3px -3px 7px var(--bone), 0 0 0 2px var(--gold)}`}</style>
      </form>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="block text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ink/50">{label}</span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
