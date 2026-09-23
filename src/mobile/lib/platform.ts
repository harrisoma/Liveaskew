export type BeePlatform = "ios" | "android" | "web";

export function parseCapacitorPlatform(raw: string | undefined | null): BeePlatform {
  if (raw === "ios" || raw === "android") return raw;
  return "web";
}

export function isNativeApp(): boolean {
  try {
    const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    return Boolean(cap?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export function currentBeePlatform(): BeePlatform {
  try {
    const cap = (globalThis as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
    return parseCapacitorPlatform(cap?.getPlatform?.());
  } catch {
    return "web";
  }
}

export function platformLabel(platform: BeePlatform = "web"): string {
  if (platform === "ios") return "iOS";
  if (platform === "android") return "Android";
  return "Web";
}
