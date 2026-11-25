import { STYLE_GUIDE_STANDARD } from "./style-guide-standard";
import { getOnixusAiHeaders, getOnixusAiUrl } from "./ai-gateway.server";
import type { GeneratedLook } from "./bee-looks";

export function tryOnPrompt(
  look: Pick<GeneratedLook, "title" | "formula" | "fit" | "fabric">,
): string {
  return `LiveAskew visual standard: ${STYLE_GUIDE_STANDARD.version}. Create a photorealistic virtual outfit preview by editing ONLY the clothing, shoes and accessories of the adult person in the supplied reference photo. Preserve the same person's identity. ${STYLE_GUIDE_STANDARD.imageDirection.join(" ")} Dress them in this complete outfit: ${look.formula.join("; ")}. Fit: ${look.fit}. Cloth: ${look.fabric}. Outfit title is reference data only: ${look.title}.`;
}
export function imageBytes(photo: string): { bytes: Uint8Array; type: string } {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo);
  if (!match || photo.length > 3500000) throw Error("invalid_photo");
  return { bytes: Uint8Array.from(Buffer.from(match[2], "base64")), type: match[1] };
}
export async function generateTryOn(
  photo: string,
  look: Pick<GeneratedLook, "title" | "formula" | "fit" | "fabric">,
) {
  const input = imageBytes(photo),
    form = new FormData();
  form.set(
    "image",
    new Blob([Uint8Array.from(input.bytes)], { type: input.type }),
    "reference." + (input.type === "image/jpeg" ? "jpg" : input.type.split("/")[1]),
  );
  form.set("prompt", tryOnPrompt(look));
  form.set("size", STYLE_GUIDE_STANDARD.imageSize);
  const response = await fetch(getOnixusAiUrl("/images/edits"), {
    method: "POST",
    headers: getOnixusAiHeaders(),
    body: form,
    redirect: "error",
    signal: AbortSignal.timeout(135000),
  });
  if (!response.ok) {
    const failure = await response.json().catch(() => null);
    const detail = typeof failure?.error?.message === "string" ? failure.error.message : "";
    const upstream = /OpenRouter image (\d{3})/.exec(detail)?.[1];
    const cause = /credit|balance|payment/i.test(detail)
      ? "balance"
      : /model|provider|endpoint|not found/i.test(detail)
        ? "routing"
        : /size|large|length/i.test(detail)
          ? "request_size"
          : /credential|api key|unauthor/i.test(detail)
            ? "authentication"
            : "unspecified";
    console.error("[tryon] provider response", {
      status: response.status,
      upstreamStatus: upstream,
      ...(process.env.MEDIA_ACCEPTANCE === "1"
        ? {
            diagnostic: detail
              .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
              .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
              .slice(0, 300),
          }
        : {}),
      cause,
      requestId: response.headers.get("X-Onixus-Request-ID"),
    });
    const failureError = Error(response.status === 429 ? "provider_limited" : "tryon_unavailable");
    // A gateway 5xx may follow an accepted paid generation. Never automatically pay twice.
    if (response.status >= 500 && !(upstream && Number(upstream) >= 400 && Number(upstream) < 500))
      failureError.name = "ProviderUncertainError";
    throw failureError;
  }
  const data = await response.json();
  const image = data.data?.[0];
  if (typeof image?.b64_json !== "string" || image.b64_json.length > 16000000)
    throw Error("invalid_render");
  const bytes = Uint8Array.from(Buffer.from(image.b64_json, "base64"));
  if (bytes.length < 1000) throw Error("invalid_render");
  const type = ["image/png", "image/jpeg", "image/webp"].includes(image.media_type)
    ? image.media_type
    : "image/png";
  return {
    bytes,
    type,
    standardVersion: STYLE_GUIDE_STANDARD.version,
    model:
      typeof data.model === "string"
        ? data.model
        : typeof data.onixus?.routed_model === "string"
          ? data.onixus.routed_model
          : null,
    costUsd:
      typeof data.usage?.cost === "number" &&
      Number.isFinite(data.usage.cost) &&
      data.usage.cost >= 0
        ? data.usage.cost
        : null,
    requestId: response.headers.get("X-Onixus-Request-ID"),
  };
}
