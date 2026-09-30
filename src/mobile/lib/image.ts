/**
 * Phone photos are several MB. Device storage holds ~5 MB in total and the API takes
 * 4.5 MB per request, so every photo is resized before it is kept or sent.
 * Proportions are preserved exactly — this only scales, never crops or reshapes.
 */
export async function downscaleDataUrl(
  dataUrl: string,
  maxSide: number,
  quality = 0.82,
): Promise<string> {
  if (typeof document === "undefined" || !dataUrl.startsWith("data:image/")) return dataUrl;
  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    const out = canvas.toDataURL("image/jpeg", quality);
    // Keep the original if it was already smaller (e.g. a tiny PNG).
    return out.length < dataUrl.length ? out : dataUrl;
  } catch {
    return dataUrl;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image decode failed"));
    img.src = src;
  });
}

/** Sizes used across the app. */
export const PHOTO_MAX = 1280; // selfie, try-on, and wardrobe analysis
export const THUMB_MAX = 360; // wardrobe cards kept on the device
