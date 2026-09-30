import type { Json } from "@/integrations/supabase/types";
import type { OnboardingAnswers } from "./recommend";
import { SELF_PHOTO, type GuideLook } from "./storage";

/** What travels to the server for a look: never an inline photo or the selfie marker. */
export function lookForSync(look: GuideLook): GuideLook {
  const keepRender = look.tryOnUrl && /^https:\/\//.test(look.tryOnUrl);
  return {
    ...look,
    tryOnUrl: keepRender ? look.tryOnUrl : null,
    tryOnKey: keepRender ? look.tryOnKey : null,
  };
}

/** Union by id. The device copy wins (it may hold a local render); saved is sticky. */
export function mergeLooks(local: GuideLook[], remote: GuideLook[]): GuideLook[] {
  const byId = new Map<string, GuideLook>();
  for (const r of remote) byId.set(r.id, r);
  for (const l of local) {
    const r = byId.get(l.id);
    byId.set(l.id, r ? { ...r, ...l, saved: l.saved || r.saved } : l);
  }
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export { SELF_PHOTO };

async function client() {
  try {
    const { isSupabaseConfigured, supabase } = await import("@/integrations/supabase/client");
    if (!isSupabaseConfigured()) return null;
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    return userId ? { supabase, userId } : null;
  } catch {
    return null;
  }
}

export type SyncedStyle = {
  interview: Record<string, string>;
  onboarding: OnboardingAnswers & { completed: boolean };
};

export async function pullStyle(): Promise<SyncedStyle | null> {
  const c = await client();
  if (!c) return null;
  const { data } = await c.supabase
    .from("member_style")
    .select("interview, onboarding")
    .eq("user_id", c.userId)
    .maybeSingle();
  if (!data) return null;
  const onboarding = data.onboarding as SyncedStyle["onboarding"] | null;
  if (!onboarding?.completed) return null;
  return { interview: (data.interview ?? {}) as Record<string, string>, onboarding };
}

export async function pushStyle(style: SyncedStyle): Promise<void> {
  const c = await client();
  if (!c) return;
  await c.supabase.from("member_style").upsert(
    {
      user_id: c.userId,
      interview: style.interview as Json,
      onboarding: style.onboarding as unknown as Json,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

export async function pullLooks(): Promise<GuideLook[] | null> {
  const c = await client();
  if (!c) return null;
  const { data, error } = await c.supabase
    .from("member_looks")
    .select("look, saved")
    .eq("user_id", c.userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return null;
  return (data ?? []).map((r) => ({ ...(r.look as unknown as GuideLook), saved: r.saved }));
}

export async function pushLooks(looks: GuideLook[]): Promise<void> {
  if (looks.length === 0) return;
  const c = await client();
  if (!c) return;
  const now = new Date().toISOString();
  await c.supabase.from("member_looks").upsert(
    looks.slice(0, 100).map((l) => ({
      user_id: c.userId,
      id: l.id.slice(0, 120),
      look: lookForSync(l) as unknown as Json,
      saved: l.saved,
      updated_at: now,
    })),
    { onConflict: "user_id,id" },
  );
}
