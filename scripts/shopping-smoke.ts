import { recheckRetailVariant } from "../src/lib/retail-products.server";
// Private build acceptance: real retailer feeds, disposable users; never log account credentials.
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin as db } from "../src/integrations/supabase/client.server";
import { studioSample } from "../src/mobile/lib/studio-sample";
import { shoppingProfileSchema, normalizeSize } from "../src/lib/shopping-profile";
import type { ProductMatches } from "../src/lib/shopping-profile";
const local = process.argv.includes("--local-handler"),
  users: string[] = [];
async function account() {
  const email = `shopping-qa-${randomUUID()}@example.test`,
    password = randomUUID() + randomUUID();
  const created = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw Error("qa_account_failed");
  users.push(created.data.user.id);
  const auth = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const login = await auth.auth.signInWithPassword({ email, password });
  if (!login.data.session) throw Error("qa_login_failed");
  return {
    id: created.data.user.id,
    headers: { Authorization: `Bearer ${login.data.session.access_token}` },
  };
}
async function get(headers: Record<string, string>) {
  const request = new Request("https://www.liveaskew.com/api/bee/style-guide/products", {
    headers,
    signal: AbortSignal.timeout(180000),
  });
  if (local)
    return (
      await import("../src/routes/api/bee/style-guide/products")
    ).Route.options.server.handlers.GET({ request } as never);
  return fetch(request);
}
async function saveProfile(headers: Record<string, string>, profile: object) {
  const request = new Request("https://www.liveaskew.com/api/bee/style-guide/shopping-profile", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  return local
    ? (
        await import("../src/routes/api/bee/style-guide/shopping-profile")
      ).Route.options.server.handlers.POST({ request } as never)
    : fetch(request);
}
try {
  console.log("SHOPPING_QA_START");
  const user = await account(),
    other = await account();
  const profile = shoppingProfileSchema.parse({
    topSize: "M",
    bottomSize: "M",
    dressSize: "M",
    shoeSize: "6",
    shoeSystem: "US-women",
    clothingMax: 250,
    shoeMax: 250,
    accessoryMax: 250,
    totalMax: 2000,
  });
  const names = {
    top: "Cotton shirt",
    bottom: "Pants",
    dress: "Dress",
    layer: "Jacket",
    shoe: "Runners",
    accessory: "Bag",
  };
  const document = {
    ...studioSample,
    capsule: studioSample.capsule.map((p) => ({
      ...p,
      name:
        p.role === "accessory" && p.name.toLowerCase().includes("hoop")
          ? "Gold hoop earrings"
          : names[p.role],
      color: "Client choice",
    })),
  };
  const saved = await db
    .from("style_blueprints")
    .upsert({ user_id: user.id, preferences: {}, document, context_key: "shopping-acceptance" });
  if (saved.error) throw Error("qa_guide_save_failed");
  const interview = { shopping: JSON.stringify(profile) };
  const styleSaved = await db
    .from("member_style")
    .upsert({ user_id: user.id, interview, onboarding: { completed: true } });
  if (styleSaved.error) throw Error("qa_interview_save_failed");
  if (!(await saveProfile(user.headers, profile)).ok) throw Error("profile_save_failed");
  if ((await saveProfile(other.headers, { ...profile, user_id: user.id })).status !== 409)
    throw Error("profile_ownership_failed");
  const response = await get(user.headers);
  if (!response.ok) throw Error(`shopping_http_${response.status}`);
  const matches = (await response.json()) as ProductMatches;
  console.log(
    "SHOPPING_QA_MATCHES",
    JSON.stringify({
      count: matches.items.length,
      sources: [...new Set(matches.items.map((p) => p.retailer))],
    }),
  );
  if (!matches.items.length) throw Error("no_real_products_matched");
  const sources = new Set(matches.items.map((p) => p.retailer));
  if (
    !sources.has("Allbirds") ||
    !sources.has("Portland Leather") ||
    !sources.has("tentree") ||
    !sources.has("PAVOI")
  )
    throw Error("missing_product_category");
  if (matches.total > profile.totalMax) throw Error("total_budget_exceeded");
  for (const item of matches.items) {
    const role = document.capsule[Number(item.pieceId.slice(6)) - 1].role;
    const cap =
      role === "shoe"
        ? profile.shoeMax
        : role === "accessory"
          ? profile.accessoryMax
          : profile.clothingMax;
    if (item.currency !== profile.currency || item.price > cap) throw Error("price_filter_failed");
    const { product, variant: actual } = await recheckRetailVariant(item);
    if (!actual || !actual.available || actual.price !== Math.round(item.price * 100))
      throw Error("variant_recheck_failed");
    if (role !== "accessory") {
      const position = product.options.find((o: { name: string }) =>
        /size/i.test(o.name),
      )?.position;
      const required =
        role === "shoe"
          ? profile.shoeSize
          : role === "bottom"
            ? profile.bottomSize
            : role === "dress"
              ? profile.dressSize
              : profile.topSize;
      if (!position || normalizeSize(actual.options[position - 1]) !== normalizeSize(required))
        throw Error("size_filter_failed");
    }
  }
  const denied = await get(other.headers);
  if (denied.status !== 409) throw Error("account_isolation_failed");
  const profileSaved = await saveProfile(user.headers, {
    ...profile,
    clothingMax: 0,
    shoeMax: 0,
    accessoryMax: 0,
  });
  if (!profileSaved.ok) throw Error("profile_update_failed");
  const zero = (await (await get(user.headers)).json()) as ProductMatches;
  if (zero.items.length) throw Error("missing_budget_not_respected");
  console.log(
    "SHOPPING_QA_PASS",
    JSON.stringify({
      transport: local ? "handler" : "production-http",
      matched: matches.items.length,
      sources: [...sources],
      currency: matches.currency,
      total: matches.total,
      liveVariantRecheck: true,
      exactListedSizes: true,
      priceCaps: true,
      totalCap: true,
      accountIsolation: true,
      profileSaveAndOwnership: true,
      missingBudgetReturnsNoMatches: true,
      products: matches.items.map((p) => ({
        pieceId: p.pieceId,
        retailer: p.retailer,
        title: p.title,
        size: p.size,
        price: p.price,
        currency: p.currency,
        url: p.url,
        image: p.image,
        variantId: p.variantId,
        checkedAt: p.checkedAt,
        color: p.color,
      })),
    }),
  );
} finally {
  for (const id of users) {
    const deleted = await db.auth.admin.deleteUser(id);
    if (deleted.error) {
      console.error("SHOPPING_QA_CLEANUP_FAILED");
      process.exitCode = 1;
    }
  }
  console.log("SHOPPING_QA_CLEANUP", users.length);
}
