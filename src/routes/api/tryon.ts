import { createFileRoute } from "@tanstack/react-router";

type Body = {
  lookId?: string;
  cacheKey?: string;
  selfieDataUrl?: string;
  userId?: string;
  garment?: {
    title?: string;
    formula?: string[];
    fit?: string;
    fabric?: string;
  };
  constraints?: {
    preserveBodyProportions?: boolean;
    noBeautify?: boolean;
    noReshape?: boolean;
  };
};

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; contentType: string } | null {
  const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return null;
  return {
    contentType: m[1],
    bytes: Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0)),
  };
}

export const Route = createFileRoute("/api/tryon")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Body;
        const lookId = body.lookId?.trim();
        const key = body.cacheKey?.trim();
        const selfie = body.selfieDataUrl;
        if (!lookId || !key || !selfie) {
          return Response.json({ error: "missing_fields" }, { status: 400 });
        }
        if (
          body.constraints?.preserveBodyProportions === false ||
          body.constraints?.noReshape === false
        ) {
          return Response.json({ error: "reshape_forbidden" }, { status: 422 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: cached } = await supabaseAdmin
            .from("tryon_renders")
            .select("image_url")
            .eq("cache_key", key)
            .maybeSingle();
          const url = (cached as { image_url?: string } | null)?.image_url;
          if (url) return Response.json({ url, cached: true, source: "cache" });
        } catch {
          /* continue */
        }

        const webhook = process.env.N8N_TRYON_WEBHOOK_URL;
        if (webhook) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 22_000);
          try {
            const res = await fetch(webhook, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                lookId,
                cacheKey: key,
                selfieDataUrl: selfie,
                garment: body.garment,
                constraints: {
                  preserveBodyProportions: true,
                  noBeautify: true,
                  noReshape: true,
                  model: "idm-vton",
                  identityLock: true,
                },
              }),
            });
            if (res.ok) {
              const json = (await res.json()) as {
                url?: string;
                imageUrl?: string;
                imageBase64?: string;
              };
              let url = json.url ?? json.imageUrl ?? null;
              if (!url && json.imageBase64) url = `data:image/jpeg;base64,${json.imageBase64}`;
              if (url) {
                await persistTryOn(key, lookId, body.userId, url, selfie);
                return Response.json({ url, cached: false, source: "n8n" });
              }
            }
          } catch (err) {
            console.error("[tryon] n8n webhook failed", err);
          } finally {
            clearTimeout(timer);
          }
        }

        // Identity passthrough: never generate a reshaped body if the try-on model is unavailable.
        await persistTryOn(key, lookId, body.userId, selfie, selfie);
        return Response.json({
          url: selfie,
          cached: false,
          source: "identity",
          note: "Try-on service unavailable. Showing your unaltered photo.",
        });
      },
    },
  },
});

async function persistTryOn(
  cacheKey: string,
  lookId: string,
  userId: string | undefined,
  url: string,
  selfie: string,
) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let imageUrl = url;
    if (url.startsWith("data:") && userId) {
      const parsed = dataUrlToBytes(url.startsWith("data:") ? url : selfie);
      if (parsed) {
        const path = `${userId}/${lookId}-${cacheKey}.jpg`;
        const { error } = await supabaseAdmin.storage.from("try-ons").upload(path, parsed.bytes, {
          contentType: parsed.contentType,
          upsert: true,
        });
        if (!error) {
          const signed = await supabaseAdmin.storage
            .from("try-ons")
            .createSignedUrl(path, 60 * 60 * 24 * 7);
          imageUrl = signed.data?.signedUrl ?? url;
        }
      }
    }
    await supabaseAdmin.from("tryon_renders").upsert(
      {
        user_id: userId ?? null,
        look_id: lookId,
        cache_key: cacheKey,
        image_url: imageUrl,
      } as never,
      { onConflict: "cache_key" },
    );
  } catch (err) {
    console.error("[tryon] persist skipped", err);
  }
}
