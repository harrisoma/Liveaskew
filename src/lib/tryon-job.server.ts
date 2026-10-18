import { createHash, randomUUID } from "node:crypto";
import { supabaseAdmin as db } from "@/integrations/supabase/client.server";
import { guardAi } from "./entitlement.server";
import { generateTryOn, imageBytes } from "./tryon-provider.server";
const out = (body: object, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
/** Called only after the route verifies the bearer, or from the private deployment smoke script. */
export async function renderOwnedLook(
  user: string,
  input: { lookId: string; selfieDataUrl: string; retry?: boolean },
) {
  imageBytes(input.selfieDataUrl);
  const { data: owned, error: lookError } = await db
    .from("member_looks")
    .select("look")
    .eq("user_id", user)
    .eq("id", input.lookId)
    .maybeSingle();
  if (lookError || !owned) return out({ error: "look_not_found" }, 404);
  const stored = owned.look as unknown as {
    title: string;
    formula: string[];
    fit: string;
    fabric: string;
  };
  const look = {
    title: stored.title,
    formula: stored.formula,
    fit: stored.fit,
    fabric: stored.fabric,
  };
  if (!Array.isArray(look.formula) || !look.formula.length)
    return out({ error: "invalid_look" }, 400);
  const key =
    "v3_" +
    createHash("sha256")
      .update(user + "\n" + input.selfieDataUrl + "\n" + JSON.stringify(look))
      .digest("hex");
  const { data: existing, error: readError } = await db
    .from("tryon_renders")
    .select("id,status,image_path,error_code,updated_at")
    .eq("cache_key", key)
    .eq("user_id", user)
    .maybeSingle();
  if (readError) return out({ error: "render_store_unavailable" }, 503);
  if (existing?.status === "ready" && existing.image_path) {
    const { data, error } = await db.storage
      .from("try-ons")
      .createSignedUrl(existing.image_path, 3600);
    if (error || !data?.signedUrl) return out({ error: "render_store_unavailable" }, 503);
    return out({ url: data.signedUrl, source: "cache", cached: true });
  }
  if (existing?.status === "running") {
    if (Date.now() - Date.parse(existing.updated_at) > 300000) {
      await db
        .from("tryon_renders")
        .update({ status: "uncertain", error_code: "provider_uncertain" })
        .eq("id", existing.id)
        .eq("user_id", user)
        .eq("status", "running");
      return out({ error: "render_needs_review" }, 409);
    }
    return out({ status: "processing" }, 202);
  }
  if (existing?.status === "uncertain") return out({ error: "render_needs_review" }, 409);
  if (existing?.status === "failed" && !input.retry)
    return out({ error: "tryon_failed", retryable: true }, 502);
  const denied = await guardAi(user, "tryon");
  if (denied) return denied;
  const op = randomUUID();
  if (existing) {
    const { data, error } = await db
      .from("tryon_renders")
      .update({
        status: "running",
        operation_id: op,
        error_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("user_id", user)
      .eq("status", "failed")
      .select("id");
    if (error || !data?.length) return out({ status: "processing" }, 202);
  } else {
    const { error } = await db
      .from("tryon_renders")
      .insert({
        user_id: user,
        look_id: input.lookId,
        cache_key: key,
        status: "running",
        operation_id: op,
      });
    if (error) return out({ status: "processing" }, 202);
  }
  let providerCompleted = false;
  try {
    const render = await generateTryOn(input.selfieDataUrl, look);
    providerCompleted = true;
    const path = `${user}/${key}.${render.type === "image/jpeg" ? "jpg" : render.type.split("/")[1]}`;
    const { error: uploadError } = await db.storage
      .from("try-ons")
      .upload(path, render.bytes, { contentType: render.type, upsert: false });
    if (uploadError) throw Error("render_store_unavailable");
    const { data, error } = await db.storage.from("try-ons").createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) throw Error("render_store_unavailable");
    const { data: saved, error: saveError } = await db
      .from("tryon_renders")
      .update({
        status: "ready",
        image_path: path,
        image_url: null,
        error_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq("cache_key", key)
      .eq("user_id", user)
      .eq("operation_id", op)
      .select("id");
    if (saveError || !saved?.length) throw Error("render_store_unavailable");
    return out({
      url: data.signedUrl,
      source: "onixus",
      cached: false,
      receipt: { request_id: render.requestId, model: render.model },
    });
  } catch (error) {
    const uncertain =
      providerCompleted ||
      (error instanceof Error &&
        (["TimeoutError", "AbortError"].includes(error.name) ||
          error.message === "invalid_render"));
    await db
      .from("tryon_renders")
      .update({
        status: uncertain ? "uncertain" : "failed",
        error_code: uncertain ? "provider_uncertain" : "tryon_failed",
        updated_at: new Date().toISOString(),
      })
      .eq("cache_key", key)
      .eq("user_id", user)
      .eq("operation_id", op);
    return out(
      { error: uncertain ? "render_needs_review" : "tryon_failed", retryable: !uncertain },
      uncertain ? 409 : 502,
    );
  }
}
