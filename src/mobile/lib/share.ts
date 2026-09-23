export type ShareLookInput = {
  title: string;
  occasion: string;
  formula: string[];
  fit: string;
  feel: string;
  fabric: string;
  imageUrl?: string | null;
  pageUrl?: string;
};

export type ShareOutcome = "shared" | "copied" | "opened";

export function lookShareText(look: ShareLookInput): string {
  const pieces = look.formula.filter(Boolean).join(" · ");
  return [
    `${look.title} — ${look.occasion}`,
    pieces,
    `Fit. ${look.fit}`,
    `Feel. ${look.feel}`,
    `Fabric. ${look.fabric}`,
    "Dressed by Bee · LiveAskew",
  ]
    .filter((line) => line.trim().length > 0)
    .join("\n\n");
}

export function facebookShareUrl(pageUrl: string, quote: string): string {
  const share = new URL("https://www.facebook.com/sharer/sharer.php");
  share.searchParams.set("u", pageUrl);
  share.searchParams.set("quote", quote);
  return share.toString();
}

export function instagramHomeUrl(): string {
  return "https://www.instagram.com/";
}

export function defaultSharePageUrl(): string {
  if (typeof window === "undefined") return "https://liveaskew.vercel.app/";
  return `${window.location.origin}/`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

async function fileFromImageUrl(url: string, name: string): Promise<File | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], name, { type: blob.type || "image/jpeg" });
  } catch {
    return null;
  }
}

async function nativeShare(look: ShareLookInput): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  const text = lookShareText(look);
  const url = look.pageUrl ?? defaultSharePageUrl();
  const payload: ShareData = { title: look.title, text, url };
  if (look.imageUrl) {
    const file = await fileFromImageUrl(look.imageUrl, `${look.title.replace(/\s+/g, "-")}.jpg`);
    if (file && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      payload.files = [file];
    }
  }
  try {
    await navigator.share(payload);
    return true;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return false;
    try {
      await navigator.share({ title: look.title, text, url });
      return true;
    } catch {
      return false;
    }
  }
}

function openBlank(url: string): boolean {
  if (typeof window === "undefined") return false;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  return Boolean(opened);
}

export async function shareLookToFacebook(look: ShareLookInput): Promise<ShareOutcome> {
  const text = lookShareText(look);
  const pageUrl = look.pageUrl ?? defaultSharePageUrl();
  if (openBlank(facebookShareUrl(pageUrl, text))) return "opened";
  if (await nativeShare(look)) return "shared";
  if (await copyText(text)) return "copied";
  return "copied";
}

export async function shareLookToInstagram(look: ShareLookInput): Promise<ShareOutcome> {
  if (await nativeShare(look)) return "shared";
  const text = lookShareText(look);
  const copied = await copyText(text);
  openBlank(instagramHomeUrl());
  return copied ? "copied" : "opened";
}

export function shareOutcomeLabel(target: "facebook" | "instagram", outcome: ShareOutcome): string {
  if (target === "instagram") {
    if (outcome === "shared") return "Opened the share sheet — pick Instagram.";
    return "Caption copied. Open Instagram to post this look.";
  }
  if (outcome === "opened") return "Opened Facebook to share this look.";
  if (outcome === "shared") return "Opened the share sheet — pick Facebook.";
  return "Caption copied. Paste it on Facebook.";
}
