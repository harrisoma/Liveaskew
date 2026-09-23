import { PROVIDERS, type ProviderId } from "@liveaskew/auth";

const LABELS: Record<ProviderId, string> = {
  google: "Google",
  apple: "Apple",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

export function providerStatus() {
  return PROVIDERS.map((id) => {
    const key = id.toUpperCase();
    return {
      id,
      label: LABELS[id],
      configured: Boolean(process.env[`AUTH_${key}_ID`] && process.env[`AUTH_${key}_SECRET`]),
    };
  });
}

export function devLoginEnabled() {
  return process.env.AUTH_DEV_LOGIN === "1";
}
