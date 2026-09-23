import type { GuideLook } from "./storage";
import { cacheKey } from "./storage";
import { apiUrl } from "./api";

export type TryOnResult = {
  url: string;
  cached: boolean;
  source: "cache" | "n8n" | "identity";
};

export async function requestTryOn(opts: {
  look: GuideLook;
  selfie: string;
  cache: Record<string, string>;
}): Promise<TryOnResult> {
  const key = cacheKey(opts.selfie, opts.look.id);
  const hit = opts.cache[key] ?? opts.look.tryOnUrl;
  if (hit && opts.look.tryOnKey === key) {
    return { url: hit, cached: true, source: "cache" };
  }

  try {
    const res = await fetch(apiUrl("/api/tryon"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lookId: opts.look.id,
        cacheKey: key,
        selfieDataUrl: opts.selfie,
        garment: {
          title: opts.look.title,
          formula: opts.look.formula,
          fit: opts.look.fit,
          fabric: opts.look.fabric,
        },
        constraints: {
          preserveBodyProportions: true,
          noBeautify: true,
          noReshape: true,
        },
      }),
    });
    if (res.ok) {
      const json = (await res.json()) as { url?: string; source?: TryOnResult["source"] };
      if (json.url) {
        return { url: json.url, cached: false, source: json.source ?? "n8n" };
      }
    }
  } catch {
    /* identity fallback */
  }

  // Never invent a reshaped body. If the try-on service is down, show her.
  await new Promise((r) => setTimeout(r, 1200));
  return { url: opts.selfie, cached: false, source: "identity" };
}
