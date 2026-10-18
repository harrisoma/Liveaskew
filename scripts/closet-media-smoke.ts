// Run privately in the deployment build; never expose a QA/admin HTTP endpoint.
import { readFile } from "node:fs/promises";
import { identifyGarmentFromPhoto } from "../src/lib/wardrobe-vision.server";
import { wardrobeVerdict } from "../src/mobile/lib/wardrobe-reset";
import { supabaseAdmin as db } from "../src/integrations/supabase/client.server";
process.env.MEDIA_ACCEPTANCE = "1";
for (const [name, category] of [
  ["shoes", "footwear"],
  ["bag", "accessory"],
] as const) {
  const photo =
    "data:image/png;base64," +
    (await readFile(new URL(`./fixtures/${name}.png`, import.meta.url))).toString("base64");
  const sight = await identifyGarmentFromPhoto(photo);
  if (!sight || sight.category !== category) throw Error(`closet_${name}_category_failed`);
  const verdict = wardrobeVerdict(sight, { goal: "everyday", fit: "soft", budget: "mid" });
  if (verdict.verdict !== "maybe") throw Error(`closet_${name}_uncertain_condition_not_preserved`);
  console.log(
    "MEDIA_QA_CLOSET",
    JSON.stringify({ fixture: name, ...sight, ...verdict, result: "PASS" }),
  );
}
const run = process.argv[2];
if (run) {
  if (!/^[a-f0-9-]{36}$/.test(run)) throw Error("invalid_qa_run");
  for (let day = 1; day <= 7; day++) {
    const { data, error } = await db.storage
      .from("try-ons")
      .createSignedUrl(`qa/${run}/day-${day}.png`, 86400);
    if (error || !data) throw Error("qa_proof_unavailable");
    console.log("MEDIA_QA_PROOF", JSON.stringify({ day, url: data.signedUrl }));
  }
}
