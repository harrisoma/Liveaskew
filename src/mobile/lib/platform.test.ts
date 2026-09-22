import { describe, expect, it } from "vitest";
import { parseCapacitorPlatform, platformLabel } from "./platform";

describe("platform", () => {
  it("maps Capacitor platforms and falls back to web", () => {
    expect(parseCapacitorPlatform("ios")).toBe("ios");
    expect(parseCapacitorPlatform("android")).toBe("android");
    expect(parseCapacitorPlatform("web")).toBe("web");
    expect(parseCapacitorPlatform(undefined)).toBe("web");
  });

  it("labels the three shipping surfaces", () => {
    expect(platformLabel("ios")).toBe("iOS");
    expect(platformLabel("android")).toBe("Android");
    expect(platformLabel("web")).toBe("Web");
  });
});
