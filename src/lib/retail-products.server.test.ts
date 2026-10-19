import { describe, expect, it } from "vitest";
import {
  eligibleVariant,
  productScore,
  safeImage,
  RETAILERS,
  type RetailProduct,
} from "./retail-products.server";
import {
  normalizeSize,
  readShoppingProfile,
  shoppingProfileSchema,
  preferencesFromInterview,
} from "./shopping-profile";
const profile = shoppingProfileSchema.parse({
  department: "women",
  topSize: "Medium",
  bottomSize: "M",
  dressSize: "M",
  shoeSize: "8",
  clothingMax: 100,
  shoeMax: 150,
  accessoryMax: 75,
});
const product: RetailProduct = {
  id: 1,
  title: "Navy cotton shirt",
  handle: "navy-shirt",
  type: "Womens",
  tags: ["shirt"],
  description: "Cotton shirt",
  featured_image: null,
  options: [
    { name: "Color", position: 1 },
    { name: "Size", position: 2 },
  ],
  variants: [
    { id: 11, options: ["Navy", "M"], available: false, price: 9000 },
    { id: 12, options: ["Navy", "M"], available: true, price: 10001 },
    { id: 13, options: ["Navy", "S"], available: true, price: 8000 },
    { id: 14, options: ["Navy", "M"], available: true, price: 9500 },
  ],
};
describe("live shopping constraints", () => {
  it("selects an in-stock exact listed size under the cap, never a nearby size or over-budget variant", () => {
    expect(eligibleVariant(product, "top", profile, RETAILERS[0])?.v.id).toBe(14);
    expect(eligibleVariant(product, "top", { ...profile, topSize: "XL" }, RETAILERS[0])).toBeNull();
    expect(
      eligibleVariant(product, "top", { ...profile, clothingMax: 80 }, RETAILERS[0]),
    ).toBeNull();
  });
  it("does not invent missing sizes, missing budgets or convert a shoe sizing system", () => {
    expect(eligibleVariant(product, "top", { ...profile, topSize: "" }, RETAILERS[0])).toBeNull();
    expect(
      eligibleVariant(product, "top", { ...profile, clothingMax: 0 }, RETAILERS[0]),
    ).toBeNull();
    expect(
      eligibleVariant(product, "shoe", { ...profile, shoeSystem: "EU" }, RETAILERS[2]),
    ).toBeNull();
  });
  it("rejects a mismatched color or material", () => {
    const piece = {
      role: "top" as const,
      name: "Silk shirt",
      color: "Navy",
      hex: "#123456",
      reason: "Comfort",
    };
    expect(productScore(piece, product, "Navy")).toBe(-1);
    expect(productScore({ ...piece, name: "Cotton shirt" }, product, "Pink")).toBe(-1);
    expect(productScore({ ...piece, name: "Cotton shirt" }, product, "Navy")).toBeGreaterThan(0);
  });
  it("accepts only secure images on retailer and product CDN hosts", () => {
    expect(safeImage("//cdn.shopify.com/item.jpg")).toBe("https://cdn.shopify.com/item.jpg");
    expect(safeImage("https://evil.example/item.jpg")).toBeNull();
    expect(safeImage("javascript:alert(1)")).toBeNull();
  });
  it("reads only client-supplied structured shopping answers and carries consultation preferences forward", () => {
    expect(readShoppingProfile({ shopping: "invalid" })).toBeNull();
    expect(readShoppingProfile({ shopping: JSON.stringify(profile) })?.topSize).toBe("Medium");
    expect(
      preferencesFromInterview({
        aesthetic: "Modern classics",
        feel: "Comfortable",
        colors: "Navy and ivory",
      }),
    ).toMatchObject({
      aesthetic: "Modern classics",
      presence: "Comfortable",
      colors: "Navy and ivory",
    });
    expect(normalizeSize("Medium")).toBe("m");
    expect(normalizeSize("M/L")).not.toBe("m");
  });
});
