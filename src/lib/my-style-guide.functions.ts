import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { LooksDoc } from "@/lib/style-looks.functions";

export type StyleIllustration = {
  kind: "color" | "silhouette" | "lifestyle";
  status: "success" | "failed" | "fallback";
  url?: string;
  error?: string;
  attempts?: number;
};


export type MyStyleGuide = {
  hasSubscription: boolean;
  displayName: string | null;
  profile: {
    body_shape: string | null;
    location: string | null;
    climate: string | null;
    budget_band: string | null;
    selfie_photo_path: string | null;
  } | null;
  styleProfile: {
    color_palette: Array<{ name?: string; hex?: string; role?: string }> | null;
    color_season: string | null;
    pillar_weights: Record<string, number> | null;
    lifestyle_mix: Record<string, number> | null;
    north_star: string | null;
    illustrations: Array<StyleIllustration> | null;
    looks: LooksDoc | null;
  } | null;
  onboarding: Array<{ question_id: string | null; pillar: string | null; choice: string | null; note: string | null }>;
};

async function buildGuide(
  supabase: Awaited<ReturnType<typeof getClient>>,
  userId: string,
  opts: { skipSubscriptionCheck?: boolean } = {},
): Promise<MyStyleGuide> {
  let hasSubscription = true;
  if (!opts.skipSubscriptionCheck) {
    const { data: live } = await supabase.rpc("has_active_subscription", {
      user_uuid: userId,
      check_env: "live",
    });
    const { data: sandbox } = live
      ? { data: true }
      : await supabase.rpc("has_active_subscription", {
          user_uuid: userId,
          check_env: "sandbox",
        });
    hasSubscription = Boolean(live || sandbox);
  }

  const [{ data: profile }, { data: styleProfile }, { data: onboarding }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, body_shape, location, climate, budget_band, selfie_photo_path")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("style_profiles")
        .select("color_palette, color_season, pillar_weights, lifestyle_mix, north_star, illustrations, looks")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("bee_onboarding_responses")
        .select("question_id, pillar, choice, note")
        .eq("user_id", userId),
    ]);

  // Resolve illustration entries. Each entry has a status. Successful entries
  // include a `path` we sign into a short-lived URL; failed/fallback entries
  // are passed through with the error so the UI can render the fallback plate
  // (and we know which kinds are still missing).
  let resolvedIllustrations: StyleIllustration[] | null = null;
  type StoredIllus = {
    kind?: string;
    status?: string;
    path?: string;
    error?: string;
    attempts?: number;
  };
  const storedIllus = (styleProfile?.illustrations as StoredIllus[] | null) ?? null;
  if (storedIllus && storedIllus.length) {
    const paths = storedIllus
      .map((i) => i?.path)
      .filter((p): p is string => typeof p === "string" && p.length > 0);
    const urlByPath = new Map<string, string>();
    if (paths.length) {
      const { data: signed } = await supabase.storage
        .from("style-illustrations")
        .createSignedUrls(paths, 60 * 60 * 24 * 7); // 7 days
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
      }
    }
    const VALID: StyleIllustration["kind"][] = ["color", "silhouette", "lifestyle"];
    resolvedIllustrations = storedIllus
      .map((i): StyleIllustration | null => {
        const kind = i.kind as StyleIllustration["kind"] | undefined;
        if (!kind || !VALID.includes(kind)) return null;
        const status = (i.status as StyleIllustration["status"]) ?? (i.path ? "success" : "failed");
        const url = i.path ? urlByPath.get(i.path) : undefined;
        return {
          kind,
          status,
          ...(url ? { url } : {}),
          ...(i.error ? { error: i.error } : {}),
          ...(typeof i.attempts === "number" ? { attempts: i.attempts } : {}),
        };
      })
      .filter((x): x is StyleIllustration => x !== null);
  }

  // Resolve looks doc: sign hero and cover illustration paths into URLs.
  let resolvedLooks: LooksDoc | null = null;
  const storedLooks = (styleProfile?.looks as LooksDoc | null) ?? null;
  if (storedLooks) {
    const paths: string[] = [];
    for (const h of storedLooks.heroes ?? []) {
      if (h.illustration?.path) paths.push(h.illustration.path);
    }
    if (storedLooks.cover?.path) paths.push(storedLooks.cover.path);
    const urlByPath = new Map<string, string>();
    if (paths.length) {
      const { data: signed } = await supabase.storage
        .from("style-illustrations")
        .createSignedUrls(paths, 60 * 60 * 24 * 7);
      for (const s of signed ?? []) {
        if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
      }
    }
    resolvedLooks = {
      ...storedLooks,
      heroes: (storedLooks.heroes ?? []).map((h) => ({
        ...h,
        illustration: h.illustration
          ? { ...h.illustration, url: h.illustration.path ? urlByPath.get(h.illustration.path) : undefined }
          : undefined,
      })),
      cover: storedLooks.cover
        ? { ...storedLooks.cover, url: storedLooks.cover.path ? urlByPath.get(storedLooks.cover.path) : undefined }
        : undefined,
    };
  }


  return {
    hasSubscription,
    displayName: (profile?.display_name as string | null) ?? null,
    profile: profile
      ? {
          body_shape: (profile.body_shape as string | null) ?? null,
          location: (profile.location as string | null) ?? null,
          climate: (profile.climate as string | null) ?? null,
          budget_band: (profile.budget_band as string | null) ?? null,
          selfie_photo_path: (profile.selfie_photo_path as string | null) ?? null,
        }
      : null,
    styleProfile: styleProfile
      ? {
          color_palette:
            (styleProfile.color_palette as Array<{
              name?: string;
              hex?: string;
              role?: string;
            }> | null) ?? null,
          color_season: (styleProfile.color_season as string | null) ?? null,
          pillar_weights:
            (styleProfile.pillar_weights as Record<string, number> | null) ?? null,
          lifestyle_mix:
            (styleProfile.lifestyle_mix as Record<string, number> | null) ?? null,
          north_star: (styleProfile.north_star as string | null) ?? null,
          illustrations: resolvedIllustrations,
          looks: resolvedLooks,
        }
      : null,
    onboarding: (onboarding ?? []).map((o) => ({
      question_id: (o.question_id as string | null) ?? null,
      pillar: (o.pillar as string | null) ?? null,
      choice: (o.choice as string | null) ?? null,
      note: (o.note as string | null) ?? null,
    })),
  };
}

// helper type — never used at runtime, just for buildGuide's first arg
async function getClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getMyStyleGuide = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyStyleGuide> => {
    return buildGuide(context.supabase as never, context.userId);
  });

export const getMyShareToken = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ token: string | null }> => {
    const { data } = await context.supabase
      .from("profiles")
      .select("share_token")
      .eq("id", context.userId)
      .maybeSingle();
    return { token: (data?.share_token as string | null) ?? null };
  });

export const rotateShareToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ token: string }> => {
    const { data, error } = await context.supabase.rpc(
      "rotate_style_guide_share_token",
    );
    if (error) throw new Error(error.message);
    return { token: data as string };
  });

export const revokeShareToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase.rpc(
      "revoke_style_guide_share_token",
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// PUBLIC — unauthenticated. Gated by random share token; uses admin client.
export const getSharedStyleGuide = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => {
    if (!d?.token || typeof d.token !== "string" || d.token.length < 10) {
      throw new Error("Invalid token");
    }
    return d;
  })
  .handler(async ({ data }): Promise<MyStyleGuide | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("share_token", data.token)
      .maybeSingle();
    if (!row?.id) return null;
    return buildGuide(supabaseAdmin as never, row.id as string, {
      skipSubscriptionCheck: true,
    });
  });
