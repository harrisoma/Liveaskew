import { describe, expect, it } from "vitest";
import { apiJson, apiUrl } from "./api";

describe("Bee API response parsing", () => {
  it("reads a valid JSON response", async () => {
    await expect(apiJson(Response.json({ guide: { id: "saved" } }))).resolves.toEqual({
      guide: { id: "saved" },
    });
  });
  it.each([200, 404, 502])("rejects an HTML fallback with HTTP %s", async (status) => {
    const response = new Response("<!DOCTYPE html><title>Fallback</title>", {
      status,
      headers: { "Content-Type": "text/html" },
    });
    await expect(apiJson(response)).rejects.toThrow("Bee could not reach the service");
  });
  it("does not expose malformed JSON parser output", async () => {
    const response = new Response("<html>upstream error</html>", {
      headers: { "Content-Type": "application/json" },
    });
    await expect(apiJson(response)).rejects.toThrow("Bee received an incomplete response");
  });
  it("accepts a structured JSON error so callers can handle its status", async () => {
    await expect(
      apiJson(Response.json({ error: "interview_required" }, { status: 409 })),
    ).resolves.toEqual({ error: "interview_required" });
  });
});

describe("apiUrl", () => {
  it("keeps same-origin paths when VITE_API_BASE is unset", () => {
    expect(apiUrl("/api/tryon")).toBe("/api/tryon");
    expect(apiUrl("api/bee/app")).toBe("/api/bee/app");
  });
});
