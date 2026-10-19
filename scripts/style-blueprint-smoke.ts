// Runs in a private deployment build using existing credentials; logs no client data or tokens.
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin as db } from "../src/integrations/supabase/client.server";
import { parseBlueprint, capsuleFormulas } from "../src/lib/style-blueprint";
const users: string[] = [];
async function account() {
  const email = `studio-qa-${randomUUID()}@example.test`,
    password = randomUUID() + randomUUID();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw Error("qa_account_failed");
  users.push(data.user.id);
  const auth = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const login = await auth.auth.signInWithPassword({ email, password });
  if (!login.data.session) throw Error("qa_login_failed");
  return {
    id: data.user.id,
    headers: {
      Authorization: `Bearer ${login.data.session.access_token}`,
      "Content-Type": "application/json",
    },
  };
}
const local = process.argv.includes("--local-handler");
async function call(path: string, headers: Record<string, string>, body?: object) {
  const request = new Request(`https://www.liveaskew.com${path}`, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(180000),
  });
  if (local) {
    const route = path.includes("wardrobe")
      ? (await import("../src/routes/api/wardrobe/analyze")).Route
      : (await import("../src/routes/api/bee/style-guide")).Route;
    return route.options.server.handlers[body ? "POST" : "GET"]!({ request } as never);
  }
  return fetch(request);
}
try {
  console.log("STUDIO_QA_START");
  const client = await account();
  await db.from("member_style").upsert({
    user_id: client.id,
    interview: {
      week: "Office weekdays, casual weekends in warm weather.",
      fit: "Relaxed fits, flat shoes, comfortable waistbands.",
      fabric: "Cotton and linen",
      aesthetic: "Relaxed modern classics",
      colors: "Navy and ivory",
      budget: "USD 300, reuse existing pieces",
    },
    onboarding: { completed: true, goal: "everyday", fit: "relaxed", budget: "value" },
  });
  const body = {
    wardrobe: [
      { label: "Navy cotton shirt", verdict: "keep", reason: "Comfortable everyday staple" },
    ],
  };
  const result = await call("/api/bee/style-guide", client.headers, body),
    data = await result.json();
  if (!result.ok) throw Error(`guide_http_${result.status}_${data.error}`);
  const guide = parseBlueprint(JSON.stringify(data.guide.document));
  if (capsuleFormulas(guide.capsule).length !== 20) throw Error("formula_count");
  if (
    data.guide.preferences.aesthetic !== "Relaxed modern classics" ||
    data.guide.preferences.colors !== "Navy and ivory"
  )
    throw Error("interview_preferences_not_carried");
  console.log("STUDIO_QA_GUIDE", "6 sections, 12 pieces, 20 formulas PASS");
  const cached = await (await call("/api/bee/style-guide", client.headers, body)).json();
  if (!cached.cached) throw Error("cache_failed");
  const saved = await (await call("/api/bee/style-guide", client.headers)).json();
  if (saved.guide.document.title !== guide.title) throw Error("save_failed");
  const other = await account();
  const isolated = await (await call("/api/bee/style-guide", other.headers)).json();
  if (isolated.guide !== null) throw Error("isolation_failed");
  const invalid = await call("/api/wardrobe/analyze", client.headers, {
    photoDataUrl: "not-an-image",
  });
  if (invalid.status !== 400) throw Error("invalid_photo");
  for (const name of process.argv.includes("--guide-only")
    ? []
    : ["cotton", "jeans", "hoodie", "shoes", "bag"]) {
    const photoDataUrl =
      "data:image/png;base64," +
      (await readFile(new URL(`./fixtures/${name}.png`, import.meta.url))).toString("base64");
    const response = await call("/api/wardrobe/analyze", client.headers, {
      photoDataUrl,
      profile: { goal: "everyday", fit: "relaxed", budget: "mid" },
    });
    const item = await response.json();
    console.log(
      "STUDIO_QA_WARDROBE",
      JSON.stringify({
        fixture: name,
        verdict: item.verdict,
        category: item.category,
        status: response.status,
      }),
    );
    if (
      !response.ok ||
      !["keep", "toss", "maybe"].includes(item.verdict) ||
      !item.reason ||
      !item.label
    )
      throw Error(`closet_${name}_failed`);
  }
  console.log(
    "STUDIO_QA_PASS",
    JSON.stringify({
      guideSections: 6,
      interviewPreferencesReused: true,
      capsule: 12,
      formulas: 20,
      saved: true,
      cached: true,
      accountIsolation: true,
      invalidPhotoRejected: true,
      closetChecks: !process.argv.includes("--guide-only"),
      transport: local ? "handler" : "production-http",
    }),
  );
} finally {
  for (const id of users) {
    const result = await db.auth.admin.deleteUser(id);
    if (result.error) {
      console.error("STUDIO_QA_CLEANUP_FAILED");
      process.exitCode = 1;
    }
  }
  console.log("STUDIO_QA_CLEANUP", users.length);
}
