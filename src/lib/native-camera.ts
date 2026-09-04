import { Capacitor } from "@capacitor/core";

/** Convert a camera data URL into a File. No resize, crop, or beautify. */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const comma = dataUrl.indexOf(",");
  const header = comma >= 0 ? dataUrl.slice(0, comma) : "";
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const mime = header.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

/**
 * Native in-app camera / library picker.
 * Returns null on web, cancel, or plugin failure so callers can use <input type="file">.
 * Does not edit, crop, slim, or beautify the capture.
 */
export async function pickNativeSelfieFile(): Promise<File | null> {
  if (typeof window === "undefined" || !Capacitor.isNativePlatform()) return null;
  const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
  const photo = await Camera.getPhoto({
    quality: 80,
    width: 1600,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
    allowEditing: false,
    correctOrientation: true,
  });
  if (!photo.dataUrl) return null;
  const ext = photo.format === "png" ? "png" : photo.format === "webp" ? "webp" : "jpg";
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const file = dataUrlToFile(photo.dataUrl, `selfie.${ext}`);
  if (file.type !== mime) {
    return new File([file], `selfie.${ext}`, { type: mime });
  }
  return file;
}
