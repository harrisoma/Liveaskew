import { describe, expect, it } from "vitest";
import { cacheKey } from "./storage";

describe("try-on cache key", () => {
  it("is stable for the same selfie and look, and changes when either changes", () => {
    const selfie = "data:image/jpeg;base64,abc123xyz";
    const a = cacheKey(selfie, "look_one");
    const b = cacheKey(selfie, "look_one");
    const c = cacheKey(selfie + "z", "look_one");
    const d = cacheKey(selfie, "look_two");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).not.toBe(d);
  });
});
