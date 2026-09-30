import { afterEach, describe, expect, it, vi } from "vitest";
import { isLocalDev, requireApiUser } from "./api-auth.server";

afterEach(() => vi.unstubAllEnvs());

describe("isLocalDev", () => {
  it("is true only on a developer machine", () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(isLocalDev()).toBe(true);
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isLocalDev()).toBe(false);
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(isLocalDev()).toBe(false);
  });
});

describe("requireApiUser without Supabase", () => {
  it("refuses on a Vercel preview instead of treating callers as local dev", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("NODE_ENV", "production");
    const res = await requireApiUser(new Request("https://preview.example/api/bee/app"));
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(503);
  });
});
