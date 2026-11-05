import { apiFetch } from "./api";
import type { WardrobeItem } from "./storage";

/** Stable account-scoped database key; old device IDs remain usable. */
export async function wardrobeRowId(userId: string, itemId: string) {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${userId}:${itemId}`)),
  );
  const hex = Array.from(bytes.slice(0, 16), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
export function wardrobeMobileId(notes: string | null, fallback: string): string {
  try {
    const value = JSON.parse(notes ?? "{}");
    return value.source === "bee-reset" && typeof value.mobileId === "string"
      ? value.mobileId
      : fallback;
  } catch {
    return fallback;
  }
}
async function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
export async function syncWardrobe(local: WardrobeItem[]): Promise<WardrobeItem[]> {
  const readiness = await apiFetch("/api/wardrobe/status");
  if (!readiness.ok)
    throw new Error(
      "Private wardrobe storage is not available. Your photos remain on this device.",
    );
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new Error("Sign in to sync your wardrobe.");
  const { data: rows, error } = await supabase
    .from("wardrobe_items")
    .select("id,name,category,notes,photo_path,reset_verdict,reset_reason")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error("Your account wardrobe could not load. Your device copy is safe.");
  const merged = new Map(local.map((item) => [item.id, item]));
  for (const row of rows ?? []) {
    const id = wardrobeMobileId(row.notes, row.id);
    const localPiece = merged.get(id);
    if (localPiece?.photo) continue;
    let photo = "";
    if (row.photo_path?.startsWith(`${userId}/`)) {
      const { data, error } = await supabase.storage
        .from("wardrobe-photos")
        .download(row.photo_path);
      if (error)
        throw new Error(
          "A saved photo could not be restored. Your device copy is safe; try syncing again.",
        );
      if (data) photo = await dataUrl(data);
    }
    merged.set(
      id,
      localPiece
        ? { ...localPiece, photo }
        : {
            id,
            photo,
            label: row.name ?? "Wardrobe piece",
            verdict:
              row.reset_verdict === "keep" ||
              row.reset_verdict === "maybe" ||
              row.reset_verdict === "toss"
                ? row.reset_verdict
                : null,
            reason: row.reset_reason,
            error: row.reset_verdict
              ? null
              : "This piece needs review. Retry the photo or choose a decision yourself.",
          },
    );
  }
  // Explicit sync: this device's decisions win for matching pieces; other pieces are restored.
  for (const item of local) {
    const existing = (rows ?? []).find((row) => wardrobeMobileId(row.notes, row.id) === item.id);
    const id = existing?.id ?? (await wardrobeRowId(userId, item.id));
    let photoPath = existing?.photo_path ?? null;
    if (item.photo.startsWith("data:image/")) {
      const match = item.photo.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
      if (!match)
        throw new Error("One photo has an unsupported format. Re-upload it before syncing.");
      const content = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
      photoPath = `${userId}/${id}`;
      const { error } = await supabase.storage
        .from("wardrobe-photos")
        .upload(photoPath, content, { contentType: match[1], upsert: true });
      if (error)
        throw new Error(
          "Your photos could not be backed up. They remain on this device; try again.",
        );
    }
    const { error } = await supabase.from("wardrobe_items").upsert(
      {
        id,
        user_id: userId,
        category: existing?.category ?? "other",
        name: item.label,
        notes: JSON.stringify({ source: "bee-reset", mobileId: item.id }),
        photo_path: photoPath,
        reset_verdict: item.verdict,
        reset_reason: item.reason,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error)
      throw new Error("Wardrobe sync did not finish. Your device copy is safe; retry to finish.");
  }
  return [...merged.values()];
}
