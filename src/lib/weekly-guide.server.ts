import { STYLE_GUIDE_STANDARD } from "./style-guide-standard";
import { createHash, randomUUID } from "node:crypto";
import { supabaseAdmin as db } from "@/integrations/supabase/client.server";
import { imageBytes } from "./tryon-provider.server";
import { renderOwnedLook } from "./tryon-job.server";
import { reviewOutfitImage } from "./style-guide-review.server";
import {
  visualBrief,
  consistentReviewImages,
  visualReviewPassed,
  visualReviewPassedForBrief,
  type OutfitVisualReview,
} from "./style-guide-visual-review";
import { guardAi } from "./entitlement.server";
import { cacheKey } from "@/mobile/lib/storage";
import type { GuideLook } from "@/mobile/lib/storage";
import type { Json } from "@/integrations/supabase/types";

export type GuideImageResult = {
  path: string;
  key: string;
  brief?: string;
  generation?: {
    model: string | null;
    requestId: string | null;
    standardVersion: string | null;
    costUsd: number | null;
  };
  review?: OutfitVisualReview;
  reviewAttempts?: number;
};
type Result = GuideImageResult;
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

export async function startWeeklyGuide(
  user: string,
  ids: string[],
  photo: string,
  options: { reviewOnly?: boolean } = {},
) {
  const image = imageBytes(photo);
  if (ids.length !== 8 || new Set(ids).size !== 8) throw Error("eight_owned_looks_required");
  const { data: looks, error } = await db
    .from("member_looks")
    .select("id,look")
    .eq("user_id", user)
    .in("id", ids);
  if (error || looks?.length !== 8) throw Error("eight_owned_looks_required");
  for (const [index, id] of ids.entries()) {
    const look = looks.find((l) => l.id === id)?.look as unknown as GuideLook;
    if (look?.guideDay !== index + 1 || !Array.isArray(look.formula) || !look.formula.length)
      throw Error("eight_owned_looks_required");
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
  const restartable =
    existing?.status === "expired" ||
    (existing?.status === "ready" &&
      ids.some((id, i) => {
        const previous = (existing.results as unknown as Record<string, Result>)[id];
        return !visualReviewPassed(
          previous?.review,
          looks.find((l) => l.id === ids[i])!.look as unknown as GuideLook,
        );
      })) ||
    (existing?.status === "attention" &&
      ["membership_required", "guide_photo_unavailable", "visual_review_unavailable"].includes(
        existing.last_error ?? "",
      ));
  if (existing && !restartable) return existing as unknown as WeeklyGuideRow;
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
  for (const render of cached ?? []) {
    const index = cacheKeys.indexOf(render.cache_key);
    if (render.image_path && index >= 0) {
      const lookId = ids[index];
      const old = (existing?.results as unknown as Record<string, Result> | undefined)?.[lookId];
      const look = looks.find((l) => l.id === lookId)!.look as unknown as GuideLook;
      const sameReview =
        old?.path === render.image_path &&
        old.review?.referenceHash === createHash("sha256").update(photo).digest("hex") &&
        old.review.brief === visualBrief(look);
      results[lookId] = {
        path: render.image_path,
        key: cacheKey(photo, lookId),
        brief: visualBrief(look),
        ...(sameReview
          ? {
              review: old.review,
              reviewAttempts: old.review?.status === "unavailable" ? 0 : old.reviewAttempts,
            }
          : {}),
        ...(old?.path === render.image_path && old.generation
          ? { generation: old.generation }
          : {}),
      };
    }
  }
  if (options.reviewOnly && ids.some((id) => !results[id])) throw Error("review_images_missing");
  const id = existing?.id ?? randomUUID(),
    path = `${user}/guide-input/${id}-${randomUUID()}.${image.type.split("/")[1]}`;
  const uploaded = await store().upload(path, image.bytes, {
    contentType: image.type,
    upsert: false,
  });
  if (uploaded.error) throw Error("guide_photo_unavailable");
  const values = {
    photo_path: path,
    photo_type: image.type,
    results,
    status: "queued",
    attempts: 0,
    lease_token: null,
    lease_until: null,
    last_error: null,
    not_before: new Date().toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  };
  const saved = existing
    ? await db
        .from("weekly_guides")
        .update(values)
        .eq("id", existing.id)
        .eq("status", existing.status)
        .select("*")
        .single()
    : await db
        .from("weekly_guides")
        .insert({ id, user_id: user, request_key: requestKey, look_ids: ids, ...values })
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
  const { data: current, error: currentError } = await db
    .from("member_looks")
    .select("id,look")
    .eq("user_id", user)
    .in("id", row.look_ids);
  if (currentError) throw Error("guide_queue_unavailable");
  const currentBriefs = new Map(
    (current ?? []).map((item) => [item.id, visualBrief(item.look as unknown as GuideLook)]),
  );
  const reviews = Object.fromEntries(
    row.look_ids
      .filter((id) => row.results[id]?.review && row.results[id].brief === currentBriefs.get(id))
      .map((id) => [id, row.results[id].review!]),
  );
  const reviewed = row.look_ids.filter((id) =>
    visualReviewPassedForBrief(reviews[id], currentBriefs.get(id) ?? ""),
  ).length;
  const changed = row.look_ids.some(
    (id) => row.results[id]?.brief && row.results[id].brief !== currentBriefs.get(id),
  );
  const unreviewed =
    row.status === "ready" &&
    (reviewed !== row.look_ids.length ||
      !consistentReviewImages(row.look_ids.map((id) => reviews[id])));
  const images: Record<string, string> = {};
  for (const [look, result] of Object.entries(row.results)) {
    if (result.brief && result.brief !== currentBriefs.get(look)) continue;
    const signed = await store().createSignedUrl(result.path, 3600);
    if (!signed.error && signed.data?.signedUrl) images[look] = signed.data.signedUrl;
  }
  return {
    id: row.id,
    status: changed || unreviewed ? "attention" : row.status,
    completed: row.look_ids.filter((id) => row.results[id]).length,
    reviewed,
    reviews,
    total: row.look_ids.length,
    images,
    keys: Object.fromEntries(Object.entries(row.results).map(([id, r]) => [id, r.key])),
    lookIds: row.look_ids,
    error: changed ? "guide_changed" : unreviewed ? "visual_review_required" : row.last_error,
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
    const pending = row.look_ids.find((id) => {
      const result = row.results[id];
      return (
        !result.review ||
        result.review.standardVersion !== STYLE_GUIDE_STANDARD.version ||
        (result.review.status === "unavailable" && (result.reviewAttempts ?? 0) < 3)
      );
    });
    if (!pending) {
      const approved =
        row.look_ids.every((id) =>
          visualReviewPassedForBrief(row.results[id].review, row.results[id].brief ?? ""),
        ) && consistentReviewImages(row.look_ids.map((id) => row.results[id].review));
      await update({
        status: approved ? "ready" : "attention",
        last_error: approved
          ? null
          : row.look_ids.some((id) => row.results[id].review?.status === "failed")
            ? "visual_review_failed"
            : row.look_ids.every((id) => row.results[id].review?.status === "passed")
              ? "visual_review_inconsistent"
              : "visual_review_unavailable",
        lease_until: null,
        lease_token: null,
      });
      await store().remove([row.photo_path]);
      return;
    }
    const { data: owned, error: ownedError } = await db
      .from("member_looks")
      .select("look")
      .eq("user_id", row.user_id)
      .eq("id", pending)
      .single();
    const look = owned?.look as unknown as GuideLook;
    if (
      ownedError ||
      !look ||
      !row.results[pending].brief ||
      row.results[pending].brief !== visualBrief(look)
    ) {
      await update({
        status: "attention",
        last_error: "guide_changed",
        lease_until: null,
        lease_token: null,
      });
      return;
    }
    const denied = await guardAi(row.user_id, "wardrobe");
    if (denied) {
      await update({
        status: "queued",
        last_error: denied.status === 402 ? "membership_required" : "visual_review_limited",
        lease_until: null,
        lease_token: null,
        not_before: new Date(Date.now() + 300000).toISOString(),
      });
      return;
    }
    const image = await store().download(row.results[pending].path);
    if (image.error || !image.data) throw Error("review_image_unavailable");
    const bytes = new Uint8Array(await image.data.arrayBuffer());
    const type =
      image.data.type ||
      (row.results[pending].path.endsWith(".jpg")
        ? "image/jpeg"
        : row.results[pending].path.endsWith(".webp")
          ? "image/webp"
          : "image/png");
    const review = await reviewOutfitImage(dataUrl, bytes, type, look);
    const attempts = (row.results[pending].reviewAttempts ?? 0) + 1;
    const permanent = review.issues.some((issue) =>
      ["review_image_invalid", "review_image_too_large", "review_service_not_configured"].includes(
        issue,
      ),
    );
    const results = {
      ...row.results,
      [pending]: { ...row.results[pending], review, reviewAttempts: permanent ? 3 : attempts },
    };
    const done = row.look_ids.every(
      (id) =>
        results[id].review &&
        (results[id].review!.status !== "unavailable" || (results[id].reviewAttempts ?? 0) >= 3),
    );
    const approved =
      row.look_ids.every((id) =>
        visualReviewPassedForBrief(results[id].review, results[id].brief ?? ""),
      ) && consistentReviewImages(row.look_ids.map((id) => results[id].review));
    const status = done ? (approved ? "ready" : "attention") : "queued";
    await update({
      results,
      status,
      attempts: 0,
      lease_until: null,
      lease_token: null,
      last_error:
        status === "attention"
          ? row.look_ids.some((id) => results[id].review?.status === "failed")
            ? "visual_review_failed"
            : row.look_ids.every((id) => results[id].review?.status === "passed")
              ? "visual_review_inconsistent"
              : "visual_review_unavailable"
          : review.status === "unavailable"
            ? "visual_review_retrying"
            : null,
      not_before: new Date(
        Date.now() + (review.status === "unavailable" ? 60000 * attempts : 0),
      ).toISOString(),
    });
    if (done) await store().remove([row.photo_path]);
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
    if (body.receipt?.brief !== visualBrief(stored)) {
      await update({
        status: "attention",
        last_error: "guide_changed",
        lease_until: null,
        lease_token: null,
      });
      return;
    }
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
      [lookId]: {
        path: render.image_path,
        key: cacheKey(dataUrl, lookId),
        brief: visualBrief(stored),
        generation: {
          costUsd:
            typeof body.receipt?.cost_usd === "number" &&
            Number.isFinite(body.receipt.cost_usd) &&
            body.receipt.cost_usd >= 0
              ? body.receipt.cost_usd
              : null,
          model: typeof body.receipt?.model === "string" ? body.receipt.model : null,
          requestId: typeof body.receipt?.request_id === "string" ? body.receipt.request_id : null,
          standardVersion:
            typeof body.receipt?.visual_standard === "string" ? body.receipt.visual_standard : null,
        },
      },
    };
    const saved = await db
      .from("member_looks")
      .update({
        look: {
          ...stored,
          tryOnUrl: body.url,
          tryOnKey: cacheKey(dataUrl, lookId),
          renderError: null,
          visualReview: null,
        } as unknown as Json,
      })
      .eq("user_id", row.user_id)
      .eq("id", lookId);
    if (saved.error) throw Error("guide_sync_unavailable");
    await update({
      results,
      status: "queued",
      attempts: 0,
      lease_until: null,
      lease_token: null,
      not_before: new Date().toISOString(),
      last_error: null,
    });
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
      status: "queued",
      last_error: body.error,
      lease_token: null,
      lease_until: null,
      not_before: new Date(Date.now() + (rendered.status === 402 ? 300000 : 3600000)).toISOString(),
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
  const [terminal, expired] = await Promise.all([
    db
      .from("weekly_guides")
      .select("id,photo_path,status,expires_at")
      .neq("photo_path", "")
      .in("status", ["ready", "attention", "expired"])
      .limit(20),
    db
      .from("weekly_guides")
      .select("id,photo_path,status,expires_at")
      .neq("photo_path", "")
      .lt("expires_at", new Date().toISOString())
      .limit(20),
  ]);
  if (terminal.error || expired.error) throw Error("guide_cleanup_unavailable");
  const cleanup = [
    ...new Map(
      [...(terminal.data ?? []), ...(expired.data ?? [])].map((row) => [row.id, row]),
    ).values(),
  ];
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
  results.forEach((result, index) => {
    if (result.status === "rejected")
      console.error("[weekly-guides] worker retry pending", {
        id: rows[index].id,
        error: result.reason instanceof Error ? result.reason.message : "worker_failed",
      });
  });
  return { claimed: rows.length, advanced: results.filter((r) => r.status === "fulfilled").length };
}
