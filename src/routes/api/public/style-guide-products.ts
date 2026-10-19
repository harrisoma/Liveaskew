import { createFileRoute } from "@tanstack/react-router";
import { matchRetailProducts } from "@/lib/retail-products.server";
import { shoppingProfileSchema } from "@/lib/shopping-profile";
import { studioSample } from "@/mobile/lib/studio-sample";
// Fixed fictional profile only. This public demonstration never accepts client information.
export const Route = createFileRoute("/api/public/style-guide-products")({
  server: {
    handlers: {
      GET: async () =>
        Response.json(
          await matchRetailProducts(
            studioSample.capsule,
            shoppingProfileSchema.parse({
              topSize: "M",
              bottomSize: "M",
              dressSize: "M",
              shoeSize: "6",
              clothingMax: 150,
              shoeMax: 150,
              accessoryMax: 150,
              totalMax: 1000,
            }),
          ),
          { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" } },
        ),
    },
  },
});
