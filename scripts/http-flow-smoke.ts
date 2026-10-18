import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin as db } from "../src/integrations/supabase/client.server";
const email = `media-qa-${randomUUID()}@example.test`,
  password = randomUUID() + randomUUID();
const { data: created, error } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error || !created.user) throw Error("qa_account_failed");
try {
  const auth = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error: loginError } = await auth.auth.signInWithPassword({ email, password });
  if (loginError || !data.session) throw Error("qa_signin_failed");
  const headers = {
    Authorization: `Bearer ${data.session.access_token}`,
    "Content-Type": "application/json",
  };
  const request = new Request("https://www.liveaskew.com/api/bee/looks", {
    method: "POST",
    headers,
    body: JSON.stringify({
      count: 7,
      interview: {
        week: "Office Monday to Friday, a relaxed Saturday, and Sunday lunch with friends.",
        fit: "Comfortable relaxed clothing, natural body proportions, flat shoes.",
        fabric: "Cotton and linen.",
        budget: "Modest; reuse pieces across the week.",
      },
    }),
    signal: AbortSignal.timeout(90000),
  });
  const response = process.argv.includes("--local-handler")
    ? await (
        await import("../src/routes/api/bee/looks")
      ).Route.options.server.handlers.POST({ request })
    : await fetch(request);
  const body = await response.json();
  if (!response.ok || !Array.isArray(body.looks) || body.looks.length !== 7) {
    console.error("MEDIA_QA_GUIDE_ERROR", { status: response.status, error: body.error });
    throw Error("seven_day_guide_failed");
  }
  console.log("MEDIA_QA_HTTP_GUIDE", "7 looks PASS");
  const denied = await fetch("https://www.liveaskew.com/api/tryon", {
    method: "POST",
    headers,
    body: JSON.stringify({
      lookId: "qa_unowned_look",
      selfieDataUrl: "data:image/png;base64,AAAA",
    }),
  });
  if (denied.status !== 404) throw Error("unowned_look_not_blocked");
  console.log("MEDIA_QA_HTTP_OWNERSHIP", "PASS");
} finally {
  const { error: cleanup } = await db.auth.admin.deleteUser(created.user.id);
  if (cleanup) {
    console.error("MEDIA_QA_HTTP_CLEANUP_FAILED");
    process.exitCode = 1;
  }
  console.log("MEDIA_QA_HTTP_ACCOUNT_REMOVED");
}
