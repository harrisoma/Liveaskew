import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireApiUser } from "@/lib/api-auth.server";
import { supabaseAdmin as db } from "@/integrations/supabase/client.server";
import { blueprintSchema } from "@/lib/style-blueprint";
import { readShoppingProfile } from "@/lib/shopping-profile";
import {
  RETAILERS,
  eligibleVariant,
  recheckRetailVariant,
  productScore,
  retailerProductMatchesPiece,
} from "@/lib/retail-products.server";
const input = z.object({
  pieceId: z.string().regex(/^piece-(?:[1-9]|1[0-2])$/),
  url: z.string().url().max(1000),
  variantId: z.string().regex(/^\d{1,20}$/),
});
export const Route = createFileRoute("/api/bee/style-guide/shop")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await requireApiUser(request);
        if (user instanceof Response) return user;
        const parsed = input.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "invalid_product" }, { status: 400 });
        const [guide, style] = await Promise.all([
          db.from("style_blueprints").select("document").eq("user_id", user).maybeSingle(),
          db.from("member_style").select("interview").eq("user_id", user).maybeSingle(),
        ]);
        if (guide.error || style.error)
          return Response.json({ error: "shopping_unavailable" }, { status: 503 });
        if (!guide.data) return Response.json({ error: "style_guide_required" }, { status: 409 });
        const document = blueprintSchema.safeParse(guide.data.document),
          profile = readShoppingProfile((style.data?.interview ?? {}) as Record<string, unknown>);
        if (!document.success || !profile)
          return Response.json({ error: "shopping_details_required" }, { status: 409 });
        const piece = document.data.capsule[Number(parsed.data.pieceId.slice(6)) - 1];
        const target = new URL(parsed.data.url),
          retailer = RETAILERS.find((r) => r.origin === target.origin);
        if (
          !retailer ||
          target.searchParams.get("variant") !== parsed.data.variantId ||
          !/^\/products\/[a-z0-9-]+$/.test(target.pathname)
        )
          return Response.json({ error: "unsupported_retailer" }, { status: 400 });
        try {
          const checked = await recheckRetailVariant({
            ...parsed.data,
            retailer: retailer.name,
            title: "",
            size: "",
            price: 0,
            currency: profile.currency,
            color: null,
            image: null,
            checkedAt: "",
          });
          if (!retailerProductMatchesPiece(piece, checked.product, profile, retailer))
            return Response.json({ error: "product_no_longer_matches" }, { status: 409 });
          if (!checked.variant)
            return Response.json({ error: "product_unavailable" }, { status: 409 });
          const single = { ...checked.product, variants: [checked.variant] };
          const eligible = eligibleVariant(single, piece.role, profile, retailer, piece);
          if (
            !eligible ||
            productScore(piece, single, eligible.color) < 0 ||
            (profile.totalMax > 0 && eligible.v.price > Math.round(profile.totalMax * 100))
          )
            return Response.json({ error: "product_no_longer_matches" }, { status: 409 });
          if (checked.currency !== profile.currency)
            return Response.json({ error: "currency_changed" }, { status: 409 });
          const verifiedTarget = new URL(`/products/${checked.product.handle}`, retailer.origin);
          verifiedTarget.searchParams.set("variant", String(eligible.v.id));
          verifiedTarget.searchParams.set("currency", profile.currency);
          return Response.json(
            {
              url: verifiedTarget.href,
              available: true,
              price: eligible.v.price / 100,
              currency: profile.currency,
              size: eligible.size,
              checkedAt: new Date().toISOString(),
            },
            { headers: { "Cache-Control": "private, no-store" } },
          );
        } catch {
          return Response.json({ error: "retailer_unavailable" }, { status: 503 });
        }
      },
    },
  },
});
