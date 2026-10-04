import { afterEach, describe, expect, it, vi } from "vitest";
import { sendVerifyCode, signInWithProvider } from "./auth";

const { otp, oauth } = vi.hoisted(() => ({ otp: vi.fn(), oauth: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      signInWithOtp: otp,
      signInWithOAuth: oauth,
    },
  },
}));
vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: () => false } }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("email and provider sign-in", () => {
  it("accepts an independent email domain and returns to the app", async () => {
    vi.stubGlobal("window", { location: { origin: "https://www.liveaskew.com" } });
    otp.mockResolvedValueOnce({ error: null });
    expect(await sendVerifyCode("email", "  member@example.org  ")).toEqual({
      ok: true,
      preview: false,
    });
    expect(otp).toHaveBeenCalledWith({
      email: "member@example.org",
      options: { emailRedirectTo: "https://www.liveaskew.com/app" },
    });
  });
  it("does not claim an email was sent when delivery fails", async () => {
    vi.stubGlobal("window", { location: { origin: "https://www.liveaskew.com" } });
    otp.mockResolvedValueOnce({ error: { message: "delivery failed" } });
    expect((await sendVerifyCode("email", "member@example.org")).ok).toBe(false);
  });
  it.each(["google", "apple"] as const)("does not start disabled %s OAuth", async (provider) => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ external: { google: false, apple: false } }),
      })),
    );
    expect((await signInWithProvider(provider)).redirected).toBe(false);
    expect(oauth).not.toHaveBeenCalled();
  });
});
