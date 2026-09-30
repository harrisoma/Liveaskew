import { describe, expect, it } from "vitest";
import { ownerCacheKey, safeSegment } from "./tryon.server";

describe("try-on keys", () => {
  it("namespaces the cache by owner", () => {
    expect(ownerCacheKey("u1", "tryon_a_1")).not.toBe(ownerCacheKey("u2", "tryon_a_1"));
  });

  it("strips anything that could walk out of the member's storage folder", () => {
    expect(safeSegment("../victim/look")).toBe("victimlook");
    expect(safeSegment("tryon_look_abc_-12x")).toBe("tryon_look_abc_-12x");
    expect(safeSegment(undefined)).toBe("");
  });
});
