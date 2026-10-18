// Private deployment-time acceptance check. Credentials stay in the project's build environment.
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { supabaseAdmin as db } from "../src/integrations/supabase/client.server";
import { renderOwnedLook } from "../src/lib/tryon-job.server";
import { identifyGarmentFromPhoto } from "../src/lib/wardrobe-vision.server";
import { wardrobeVerdict } from "../src/mobile/lib/wardrobe-reset";
import { getOnixusAiConfig, getOnixusAiHeaders } from "../src/lib/ai-gateway.server";
const run = randomUUID(),
  users: string[] = [];
const report: { renders: object[]; wardrobe: object[]; assets: string[] } = {
  renders: [],
  wardrobe: [],
  assets: [],
};
const photo = async (name: string) =>
  "data:image/png;base64," +
  (await readFile(new URL(`./fixtures/${name}.png`, import.meta.url))).toString("base64");
const check = (value: unknown, message: string) => {
  if (!value) throw Error(message);
};
try {
  for (let i = 0; i < 2; i++) {
    const { data, error } = await db.auth.admin.createUser({
      email: `media-qa-${run}-${i}@example.test`,
      password: randomUUID() + randomUUID(),
      email_confirm: true,
    });
    if (error)
      console.error(
        "MEDIA_QA_ACCOUNT_ERROR",
        JSON.stringify({ code: error.code, status: error.status, message: error.message }),
      );
    check(!error && data.user, "qa_account_failed");
    users.push(data.user!.id);
  }
  const selfie = await photo("person");
  const outfits = [
    [
      "Ivory workday",
      "ivory cotton blouse",
      "navy tailored trousers",
      "black leather loafers",
      "tan leather tote",
      "small gold stud earrings",
    ],
    [
      "Blue weekend",
      "blue cotton shirt",
      "beige straight trousers",
      "white low-top sneakers",
      "brown crossbody bag",
      "silver watch",
    ],
    [
      "Burgundy dinner",
      "burgundy wrap midi dress",
      "black low block-heel shoes",
      "black clutch bag",
      "gold hoop earrings",
    ],
    [
      "Green garden",
      "sage cotton midi dress",
      "tan flat sandals",
      "woven straw bag",
      "cream sun hat",
    ],
    [
      "Navy meeting",
      "navy soft blazer",
      "white cotton tee",
      "gray tailored trousers",
      "black ballet flats",
      "burgundy structured handbag",
    ],
    [
      "Denim day",
      "cream cotton knit top",
      "straight blue jeans",
      "brown ankle boots",
      "brown belt",
      "small gold necklace",
    ],
    [
      "Sunday ease",
      "soft lilac blouse",
      "cream flowing midi skirt",
      "tan ballet flats",
      "small cream shoulder bag",
      "silver pendant necklace",
    ],
  ];
  const looks = outfits.map((parts, i) => ({
    id: `qa_${i}_${run}`,
    title: parts[0],
    occasion: "Everyday",
    formula: parts.slice(1),
    fit: "Comfortable natural fit, preserve body size.",
    feel: "Comfortable and confident.",
    fabric: "Natural-looking cloth with realistic drape.",
    palette: ["#111111", "#eeeeee"],
    guideDay: i + 1,
    saved: false,
    createdAt: new Date().toISOString(),
    garmentNote: parts[1],
    tryOnUrl: null,
    tryOnKey: null,
  }));
  const { error: insertError } = await db
    .from("member_looks")
    .insert(looks.map((look) => ({ user_id: users[0], id: look.id, look, saved: false })));
  check(!insertError, "qa_looks_failed");
  const other = await renderOwnedLook(users[1], { lookId: looks[0].id, selfieDataUrl: selfie });
  check(other.status === 404, "cross_account_render_allowed");
  for (let i = 0; i < looks.length; i++) {
    const result = await renderOwnedLook(users[0], { lookId: looks[i].id, selfieDataUrl: selfie });
    const data = await result.json();
    check(
      result.ok && typeof data.url === "string" && data.source === "onixus",
      `render_${i + 1}_failed_${data.error ?? result.status}`,
    );
    const bytes = await (await fetch(data.url)).arrayBuffer();
    check(bytes.byteLength > 1000, `render_${i + 1}_empty`);
    const cfg = getOnixusAiConfig(),
      media = cfg.baseURL.replace(/\/onixus-ai-gateway(?:\/v1)?$/, "/liveaskew-media");
    const rendered = "data:image/png;base64," + Buffer.from(bytes).toString("base64");
    check(rendered !== selfie, "original_photo_returned");
    const verify = await fetch(media, {
      method: "POST",
      headers: { ...getOnixusAiHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        photoDataUrl: rendered,
        referencePhotoDataUrl: selfie,
        prompt: `The first image is an AI outfit preview; the second is the reference person. Check this intended outfit: ${looks[i].formula.join("; ")}. Return JSON only: {"same_person":boolean,"body_preserved":boolean,"full_length":boolean,"footwear_present":boolean,"accessories_present":boolean,"outfit_matches":boolean,"notes":string}. Be critical. Do not assume the preview preserved identity or body if visibly different.`,
      }),
    });
    const verdict = await verify.json();
    const raw = verdict.choices?.[0]?.message?.content ?? "";
    let assessment;
    try {
      assessment = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    } catch {
      throw Error("render_verification_invalid");
    }
    check(
      assessment.same_person &&
        assessment.body_preserved &&
        assessment.full_length &&
        assessment.footwear_present &&
        assessment.accessories_present &&
        assessment.outfit_matches,
      `render_${i + 1}_visual_check_failed_${JSON.stringify(assessment)}`,
    );
    const proofPath = `qa/${run}/day-${i + 1}.png`;
    const { error: proofError } = await db.storage
      .from("try-ons")
      .upload(proofPath, bytes, { contentType: "image/png" });
    check(!proofError, "qa_proof_failed");
    const { data: proof } = await db.storage.from("try-ons").createSignedUrl(proofPath, 86400);
    report.renders.push({ day: i + 1, ...assessment });
    if (proof) report.assets.push(proof.signedUrl);
    console.log("MEDIA_QA_DAY", i + 1, "PASS");
  }
  const replay = await renderOwnedLook(users[0], { lookId: looks[0].id, selfieDataUrl: selfie });
  check((await replay.json()).source === "cache", "cache_replay_failed");
  for (const [name, fit, expected] of [
    ["cotton", "soft", "keep"],
    ["jeans", "relaxed", "toss"],
    ["hoodie", "structured", "maybe"],
  ] as const) {
    const sight = await identifyGarmentFromPhoto(await photo(name));
    check(sight, `wardrobe_${name}_vision_failed`);
    const verdict = wardrobeVerdict(sight!, { fit, goal: "everyday", budget: "mid" });
    check(
      verdict.verdict === expected,
      `wardrobe_${name}_expected_${expected}_received_${verdict.verdict}`,
    );
    report.wardrobe.push({ fixture: name, ...sight, ...verdict });
    console.log("MEDIA_QA_WARDROBE", name, verdict.verdict, "PASS");
  }
  console.log(
    "MEDIA_QA_REPORT",
    JSON.stringify({ ...report, run, crossAccount: "blocked", cacheReplay: "passed" }),
  );
} finally {
  for (const user of users) {
    const { data } = await db.storage.from("try-ons").list(user, { limit: 100 });
    if (data?.length)
      await db.storage.from("try-ons").remove(data.map((item) => user + "/" + item.name));
    await db.auth.admin.deleteUser(user);
  }
  console.log("MEDIA_QA_TEST_ACCOUNTS_REMOVED");
}
