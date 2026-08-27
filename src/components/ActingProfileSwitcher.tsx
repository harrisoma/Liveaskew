import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, User, Users } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listFamilyProfiles } from "@/lib/family.functions";
import { hasEntitlement } from "@/lib/plans";

type FamilyProfile = {
  id: string;
  name: string;
  relationship: string;
};

const STORAGE_KEY = "liveaskew.acting_profile_id";

export function getActingProfileId(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v && v !== "primary" ? v : null;
}

export function ActingProfileSwitcher({ tier }: { tier: string | null }) {
  const list = useServerFn(listFamilyProfiles);
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActive(window.localStorage.getItem(STORAGE_KEY));
    }
  }, []);

  useEffect(() => {
    if (!hasEntitlement(tier, "householdPartnerSeat")) return;
    let on = true;
    list()
      .then((r) => {
        if (on) setProfiles((r.profiles ?? []) as FamilyProfile[]);
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, [list, tier]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!hasEntitlement(tier, "householdPartnerSeat")) return null;

  const activeMember = profiles.find((p) => p.id === active) ?? null;

  function pick(id: string | null) {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
    setActive(id);
    setOpen(false);
    window.dispatchEvent(new CustomEvent("liveaskew:acting-profile-change", { detail: id }));
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 border border-ink/20 bg-bone px-3 py-2 text-[0.6rem] uppercase tracking-[0.22em] text-ink/75 transition hover:border-ink hover:text-ink"
      >
        <Users size={12} className="text-gold-deep" />
        <span className="hidden sm:inline">Styling</span>
        <span className="text-ink">
          {activeMember ? activeMember.name : "You"}
        </span>
        <ChevronDown size={12} className="text-ink/40" />
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-64 border border-ink/15 bg-bone shadow-xl">
          <div className="border-b border-ink/10 px-4 py-3">
            <p className="eyebrow text-gold-deep">Who is Bee styling?</p>
          </div>
          <button
            onClick={() => pick(null)}
            className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition hover:bg-cream ${
              !active ? "bg-cream" : ""
            }`}
          >
            <User size={14} className="mt-0.5 text-ink/60" />
            <div>
              <div className="font-display text-base">You</div>
              <div className="text-[0.65rem] uppercase tracking-[0.2em] text-ink/45">Primary member</div>
            </div>
          </button>
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => pick(p.id)}
              className={`flex w-full items-start gap-3 border-t border-ink/10 px-4 py-3 text-left text-sm transition hover:bg-cream ${
                active === p.id ? "bg-cream" : ""
              }`}
            >
              <User size={14} className="mt-0.5 text-ink/60" />
              <div>
                <div className="font-display text-base">{p.name}</div>
                <div className="text-[0.65rem] uppercase tracking-[0.2em] text-ink/45">{p.relationship}</div>
              </div>
            </button>
          ))}
          <Link
            to="/household"
            onClick={() => setOpen(false)}
            className="block border-t border-ink/10 bg-ink px-4 py-3 text-center text-[0.6rem] uppercase tracking-[0.22em] text-cream transition hover:bg-gold-deep"
          >
            Manage household
          </Link>
        </div>
      )}
    </div>
  );
}
