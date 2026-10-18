// Opt-in, paid synthetic acceptance. Existing project credentials stay in the private build.
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin as db } from "../src/integrations/supabase/client.server";
if (process.env.WEEKLY_GUIDE_ACCEPTANCE !== "1")
  throw Error("Opt in to seven synthetic image renders explicitly");
const origin = "https://www.liveaskew.com",
  run = randomUUID(),
  users: string[] = [];
const check = (ok: unknown, message: string) => {
  if (!ok) throw Error(message);
};
const sessions: { Authorization: string; "Content-Type": string }[] = [];
let queuedId = "";
try {
  for (let index = 0; index < 2; index++) {
    const email = `media-qa-weekly-${run}-${index}@example.test`,
      password = randomUUID() + randomUUID();
    const created = await db.auth.admin.createUser({ email, password, email_confirm: true });
    check(!created.error && created.data.user, "qa_account_failed");
    users.push(created.data.user!.id);
    const auth = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const login = await auth.auth.signInWithPassword({ email, password });
    check(!login.error && login.data.session, "qa_login_failed");
    sessions.push({
      Authorization: `Bearer ${login.data.session!.access_token}`,
      "Content-Type": "application/json",
    });
  }
  const plan = await fetch(origin + "/api/bee/looks", {
    method: "POST",
    headers: sessions[0],
    body: JSON.stringify({
      count: 7,
      interview: {
        life: "Office Monday to Friday; Saturday outdoors and Sunday lunch with friends",
        fit: "Comfortable relaxed clothing with natural proportions",
        feel: "Confident and comfortable",
        fabric: "Cotton and linen",
        goal: "Seven complete feminine outfits with shoes and accessories, reusing individual pieces sensibly",
      },
    }),
    signal: AbortSignal.timeout(120000),
  });
  const body = await plan.json();
  check(plan.ok && body.looks?.length === 7, "seven_plans_failed");
  const looks = body.looks.map((look: object, index: number) => ({
    ...look,
    id: `qa-${run}-day-${index + 1}`,
    guideDay: index + 1,
    saved: false,
    createdAt: new Date().toISOString(),
    tryOnUrl: null,
    tryOnKey: null,
  }));
  const saved = await db
    .from("member_looks")
    .upsert(
      looks.map((look: { id: string }) => ({ user_id: users[0], id: look.id, look, saved: false })),
    );
  check(!saved.error, "qa_plan_save_failed");
  const selfie =
    "data:image/png;base64," +
    (await readFile(new URL("./fixtures/person.png", import.meta.url))).toString("base64");
  const input = JSON.stringify({
    lookIds: looks.map((l: { id: string }) => l.id),
    selfieDataUrl: selfie,
  });
  const foreignStart = await fetch(origin + "/api/guide", {
    method: "POST",
    headers: sessions[1],
    body: input,
  });
  check(foreignStart.status === 404, "foreign_guide_start_not_blocked");
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(origin + "/api/guide", {
      method: "POST",
      headers: sessions[0],
      body: input,
      signal: AbortSignal.timeout(45000),
    });
    const result = await response.json();
    check(response.status === 202 && result.guide?.id, "qa_guide_enqueue_failed");
    if (queuedId) check(queuedId === result.guide.id, "duplicate_queue_created");
    queuedId = result.guide.id;
  }
  const denied = await fetch(origin + "/api/guide?id=" + queuedId, { headers: sessions[1] });
  check(denied.status === 404, "foreign_guide_read_not_blocked");
  console.log(
    "WEEKLY_QA_QUEUED",
    JSON.stringify({ id: queuedId, plans: 7, duplicateSubmission: "same job", isolation: "PASS" }),
  );
  console.log(
    "WEEKLY_QA_BROWSER_DISCONNECTED",
    "No browser or worker-driving requests will run. Only read-only status checks; the production cron must finish all seven images.",
  );
  let completed = false,
    previous = -1;
  for (let attempt = 0; attempt < 60; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 20000));
    const response = await fetch(origin + "/api/guide?id=" + queuedId, {
      headers: sessions[0],
      cache: "no-store",
    });
    const state = (await response.json()).guide;
    check(response.ok && state, "qa_guide_progress_failed");
    if (state.completed !== previous) {
      console.log(
        "WEEKLY_QA_PROGRESS",
        JSON.stringify({ completed: state.completed, status: state.status }),
      );
      previous = state.completed;
    }
    check(!["attention", "expired"].includes(state.status), "qa_guide_needs_attention");
    if (state.status !== "ready") continue;
    check(state.completed === 7 && Object.keys(state.images).length === 7, "qa_missing_images");
    const { data: row } = await db
      .from("weekly_guides")
      .select("results,photo_path")
      .eq("id", queuedId)
      .single();
    check(row, "qa_missing_receipt");
    const results = row!.results as Record<string, { path: string }>;
    for (let day = 1; day <= 7; day++) {
      const look = looks[day - 1];
      const bytes = await fetch(state.images[look.id]);
      const data = new Uint8Array(await bytes.arrayBuffer());
      check(bytes.ok && data.length > 1000, "qa_invalid_image");
      const path = `qa/weekly-${run}/day-${day}.png`;
      const copy = await db.storage.from("try-ons").copy(results[look.id].path, path);
      check(!copy.error, "qa_copy_failed");
      const signed = await db.storage.from("try-ons").createSignedUrl(path, 86400);
      check(signed.data?.signedUrl, "qa_proof_failed");
      console.log(
        "WEEKLY_QA_IMAGE",
        JSON.stringify({ day, bytes: data.length, url: signed.data!.signedUrl }),
      );
    }
    const { count } = await db
      .from("ai_calls")
      .select("id", { count: "exact", head: true })
      .eq("user_id", users[0])
      .eq("feature", "tryon");
    check(count === 7, "qa_duplicate_paid_render");
    const replay = await fetch(origin + "/api/guide", {
      method: "POST",
      headers: sessions[0],
      body: input,
    });
    check((await replay.json()).guide?.id === queuedId, "qa_replay_not_idempotent");
    const inputFile = await db.storage.from("try-ons").download(row!.photo_path);
    check(Boolean(inputFile.error), "qa_reference_not_deleted");
    console.log(
      "WEEKLY_QA_PASS",
      "7/7 real images; scheduled worker only; refresh/replay reuse; no duplicate paid calls; reference deleted; ownership enforced",
    );
    completed = true;
    break;
  }
  check(completed, "qa_schedule_did_not_finish_within_20_minutes");
} finally {
  for (const user of users) {
    const { data: renders } = await db
      .from("tryon_renders")
      .select("image_path")
      .eq("user_id", user);
    const { data: guides } = await db
      .from("weekly_guides")
      .select("photo_path")
      .eq("user_id", user);
    const paths = [
      ...(renders ?? []).map((r) => r.image_path),
      ...(guides ?? []).map((g) => g.photo_path),
    ].filter((p): p is string => Boolean(p));
    if (paths.length) await db.storage.from("try-ons").remove(paths);
    const removed = await db.auth.admin.deleteUser(user);
    check(!removed.error, "qa_cleanup_failed");
  }
  console.log("WEEKLY_QA_ACCOUNTS_REMOVED");
}
