import type { GuideLook } from "./storage";
import { cacheKey } from "./storage";
import { apiFetch } from "./api";
export type TryOnResult = {
  url: string;
  cached: boolean;
  source: "cache" | "onixus" | "unavailable" | "locked" | "limited" | "review";
  error?: string;
};
export async function requestTryOn(opts: {
  look: GuideLook;
  selfie: string;
  cache: Record<string, string>;
  retry?: boolean;
}): Promise<TryOnResult> {
  const key = cacheKey(opts.selfie, opts.look.id),
    hit = opts.cache[key] ?? opts.look.tryOnUrl;
  if (hit && hit !== "self" && opts.look.tryOnKey === key) {
    try {
      const url = new URL(hit);
      const expires = JSON.parse(
        atob((url.searchParams.get("token") ?? "").split(".")[1] ?? ""),
      )?.exp;
      if (typeof expires === "number" && expires * 1000 > Date.now() + 60000)
        return { url: hit, cached: true, source: "cache" };
    } catch {
      /* refresh signed URL from server */
    }
  }
  try {
    for (let attempt = 0; attempt < 45; attempt++) {
      const r = await apiFetch("/api/tryon", {
        method: "POST",
        body: JSON.stringify({
          lookId: opts.look.id,
          selfieDataUrl: opts.selfie,
          retry: opts.retry === true && attempt === 0,
        }),
      });
      if (r.status === 202) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      if (r.status === 402) return { url: "", cached: false, source: "locked" };
      if (r.status === 429) return { url: "", cached: false, source: "limited" };
      const data = await r.json();
      if (data.error === "render_needs_review")
        return {
          url: "",
          cached: false,
          source: "review",
          error: "This render needs review before another paid attempt.",
        };
      if (r.ok && typeof data.url === "string" && ["cache", "onixus"].includes(data.source))
        return { url: data.url, cached: data.cached === true, source: data.source };
      return {
        url: "",
        cached: false,
        source: "unavailable",
        error: "This outfit preview could not finish. Your guide is saved.",
      };
    }
  } catch {
    /* retain the guide, never replace a render with the original photo */
  }
  return {
    url: "",
    cached: false,
    source: "unavailable",
    error: "This preview is still processing or unavailable. Check again shortly.",
  };
}
