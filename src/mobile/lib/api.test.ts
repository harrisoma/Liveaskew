import { describe, expect, it } from "vitest";
import { apiUrl } from "./api";

describe("apiUrl", () => {
  it("keeps same-origin paths when VITE_API_BASE is unset", () => {
    expect(apiUrl("/api/tryon")).toBe("/api/tryon");
    expect(apiUrl("api/bee/app")).toBe("/api/bee/app");
  });
});
