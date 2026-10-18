import { createHash, randomUUID } from "node:crypto";
import { supabaseAdmin as db } from "@/integrations/supabase/client.server";
import { imageBytes } from "./tryon-provider.server";
import { renderOwnedLook } from "./tryon-job.server";
import { cacheKey } from "@/mobile/lib/storage";
import type { GuideLook } from "@/mobile/lib/storage";
import type { Json } from "@/integrations/supabase/types";

type Result = { path: string; key: string };
export type WeeklyGuideRow = {
  id: string;
  user_id: string;
  request_key: string;
  look_ids: string[];
  photo_path: string;
  photo_type: string;
  results: Record<string, Result>;
  status: string;
  attempts: number;
  lease_token: string | null;
  lease_until: string | null;
  not_before: string;
  expires_at: string;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};
const store = () => db.storage.from("try-ons");

export async function startWeeklyGuide(user: string, ids: string[], photo: string) {
  const image = imageBytes(photo);
  if (ids.length !== 7 || new Set(ids).size !== 7) throw Error("seven_owned_looks_required");
  const { data: looks, error } = await db
    .from("member_looks")
    .select("id,look")
    .eq("user_id", user)
    .in("id", ids);
  if (error || looks?.length !== 7) throw Error("seven_owned_looks_required");
  for (const [index, id] of ids.entries()) {
    const look = looks.find((l) => l.id === id)?.look as unknown as GuideLook;
    if (look?.guideDay !== index + 1 || !Array.isArray(look.formula) || !look.formula.length)
      throw Error("seven_owned_looks_required");
  }
  const requestKey = createHash("sha256")
    .update(
      user +
        "\n" +
        photo +
        "\n" +
        JSON.stringify(
          ids.map((id) => {
            const l = looks.find((l) => l.id === id)?.look as unknown as GuideLook;
            return { id, title: l.title, formula: l.formula, fit: l.fit, fabric: l.fabric };
          }),
        ),
    )
    .digest("hex");
  const { data: existing } = await db
    .from("weekly_guides")
    .select("*")
    .eq("request_key", requestKey)
    .maybeSingle();
  if (existing) return existing as unknown as WeeklyGuideRow;
  const { data: active } = await db
    .from("weekly_guides")
    .select("*")
    .eq("user_id", user)
    .in("status", ["queued", "running"])
    .maybeSingle();
  if (active) return active as unknown as WeeklyGuideRow;
  const cacheKeys = ids.map((id) => {
    const l = looks.find((row) => row.id === id)!.look as unknown as GuideLook;
    return (
      "v3_" +
      createHash("sha256")
        .update(
          user +
            "\n" +
            photo +
            "\n" +
            JSON.stringify({ title: l.title, formula: l.formula, fit: l.fit, fabric: l.fabric }),
        )
        .digest("hex")
    );
  });
  const { data: cached } = await db
    .from("tryon_renders")
    .select("look_id,cache_key,image_path")
    .eq("user_id", user)
    .eq("status", "ready")
    .in("cache_key", cacheKeys);
  const results: Record<string, Result> = {};
  for (const render of cached ?? [])
    if (render.image_path && render.look_id && ids.includes(render.look_id))
      results[render.look_id] = { path: render.image_path, key: cacheKey(photo, render.look_id) };
  const id = randomUUID(),
    path = `${user}/guide-input/${id}.${image.type.split("/")[1]}`;
  const uploaded = await store().upload(path, image.bytes, {
    contentType: image.type,
    upsert: false,
  });
  if (uploaded.error) throw Error("guide_photo_unavailable");
  const saved = await db
    .from("weekly_guides")
    .insert({
      id,
      user_id: user,
      request_key: requestKey,
      look_ids: ids,
      photo_path: path,
      photo_type: image.type,
      results,
      status: Object.keys(results).length === 7 ? "ready" : "queued",
    })
    .select("*")
    .single();
  if (saved.error) {
    await store().remove([path]);
    const { data: winner } = await db
      .from("weekly_guides")
      .select("*")
      .eq("user_id", user)
      .in("status", ["queued", "running", "ready"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (winner) return winner as unknown as WeeklyGuideRow;
    throw Error("guide_queue_unavailable");
  }
  if (Object.keys(results).length === 7) await store().remove([path]);
  return saved.data as unknown as WeeklyGuideRow;
}

export async function weeklyGuideStatus(user: string, id?: string) {
  let query = db
    .from("weekly_guides")
    .select("*")
    .eq("user_id", user)
    .order("created_at", { ascending: false })
    .limit(1);
  if (id) query = query.eq("id", id);
  const { data, error } = await query.maybeSingle();
  if (error) throw Error("guide_queue_unavailable");
  if (!data) return null;
  const row = data as unknown as WeeklyGuideRow;
  const images: Record<string, string> = {};
  for (const [look, result] of Object.entries(row.results)) {
    const signed = await store().createSignedUrl(result.path, 3600);
    if (!signed.error && signed.data?.signedUrl) images[look] = signed.data.signedUrl;
  }
  return {
    id: row.id,
    status: row.status,
    completed: Object.keys(row.results).length,
    total: 7,
    images,
    keys: Object.fromEntries(Object.entries(row.results).map(([id, r]) => [id, r.key])),
    lookIds: row.look_ids,
    error: row.last_error,
  };
}

/** One claimed guide advances one image. Cron reclaims only after a four-minute lease. */
export async function advanceWeeklyGuide(row: WeeklyGuideRow) {
  const update = async (changes: object) => {
    const { data, error } = await db
      .from("weekly_guides")
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("lease_token", row.lease_token!)
      .select("id");
    if (error || !data?.length) throw Error("guide_lease_lost");
  };
  if (Date.parse(row.expires_at) < Date.now()) {
    await store().remove([row.photo_path]);
    await update({ status: "expired", last_error: "guide_photo_expired", lease_until: null });
    return;
  }
  const photo = await store().download(row.photo_path);
  if (photo.error || !photo.data) {
    await update({ status: "attention", last_error: "guide_photo_unavailable", lease_until: null });
    return;
  }
  const dataUrl = `data:${row.photo_type};base64,${Buffer.from(await photo.data.arrayBuffer()).toString("base64")}`;
  const lookId = row.look_ids.find((id) => !row.results[id]);
  if (!lookId) {
    await update({ status: "ready", last_error: null, lease_until: null });
    await store().remove([row.photo_path]);
    return;
  }
  const rendered = await renderOwnedLook(row.user_id, {
    lookId,
    selfieDataUrl: dataUrl,
    retry: row.attempts > 0,
  });
  const body = await rendered.json();
  if (rendered.ok && rendered.status !== 202 && body.url) {
    const { data: look } = await db
      .from("member_looks")
      .select("look")
      .eq("user_id", row.user_id)
      .eq("id", lookId)
      .single();
    if (!look) {
      await update({ status: "attention", last_error: "look_not_found", lease_until: null });
      return;
    }
    const stored = look.look as unknown as GuideLook;
    const renderKey =
      "v3_" +
      createHash("sha256")
        .update(
          row.user_id +
            "\n" +
            dataUrl +
            "\n" +
            JSON.stringify({
              title: stored.title,
              formula: stored.formula,
              fit: stored.fit,
              fabric: stored.fabric,
            }),
        )
        .digest("hex");
    const { data: render } = await db
      .from("tryon_renders")
      .select("image_path")
      .eq("cache_key", renderKey)
      .eq("user_id", row.user_id)
      .single();
    if (!render?.image_path) throw Error("render_receipt_unavailable");
    const results = {
      ...row.results,
      [lookId]: { path: render.image_path, key: cacheKey(dataUrl, lookId) },
    };
    const saved = await db
      .from("member_looks")
      .update({
        look: {
          ...stored,
          tryOnUrl: body.url,
          tryOnKey: cacheKey(dataUrl, lookId),
          renderError: null,
        } as unknown as Json,
      })
      .eq("user_id", row.user_id)
      .eq("id", lookId);
    if (saved.error) throw Error("guide_sync_unavailable");
    const complete = Object.keys(results).length === 7;
    await update({
      results,
      status: complete ? "ready" : "queued",
      attempts: 0,
      lease_until: null,
      lease_token: null,
      not_before: new Date().toISOString(),
      last_error: null,
    });
    if (complete) await store().remove([row.photo_path]);
    return;
  }
  if (rendered.status === 202) {
    await update({
      status: "queued",
      lease_until: null,
      lease_token: null,
      not_before: new Date(Date.now() + 60000).toISOString(),
    });
    return;
  }
  if (rendered.status === 429 || rendered.status === 402) {
    await update({
      status: rendered.status === 402 ? "attention" : "queued",
      last_error: body.error,
      lease_token: null,
      lease_until: null,
      not_before: new Date(Date.now() + 3600000).toISOString(),
    });
    return;
  }
  const retry = body.retryable === true && row.attempts < 2;
  await update({
    status: retry ? "queued" : "attention",
    attempts: row.attempts + 1,
    last_error: body.error ?? "tryon_unavailable",
    lease_token: null,
    lease_until: null,
    not_before: new Date(Date.now() + 60000).toISOString(),
  });
  if (!retry) await store().remove([row.photo_path]);
}

export async function processWeeklyGuides(user?: string) {
  // Delete terminal references promptly, and all references after 24 hours, including failed jobs.
  const { data: cleanup } = await db
    .from("weekly_guides")
    .select("id,photo_path,status,expires_at")
    .neq("photo_path", "")
    .or(`status.in.(ready,attention,expired),expires_at.lt.${new Date().toISOString()}`)
    .limit(20);
  for (const row of cleanup ?? []) {
    const removed = await store().remove([row.photo_path]);
    if (!removed.error)
      await db
        .from("weekly_guides")
        .update({
          photo_path: "",
          ...(["queued", "running"].includes(row.status)
            ? { status: "expired", last_error: "guide_photo_expired" }
            : {}),
        })
        .eq("id", row.id);
  }
  const { data, error } = await db.rpc("claim_weekly_guides", { p_user: user, p_limit: 4 });
  if (error) throw Error("guide_claim_unavailable");
  const rows = (data ?? []) as unknown as WeeklyGuideRow[];
  const results = await Promise.allSettled(rows.map(advanceWeeklyGuide));
  return { claimed: rows.length, advanced: results.filter((r) => r.status === "fulfilled").length };
}
