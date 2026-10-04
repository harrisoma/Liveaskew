import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  status: vi.fn(),
  create: vi.fn(),
  prices: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
vi.mock("@/lib/api-auth.server", () => ({ requireApiUser: mocks.auth }));
vi.mock("@/lib/signup-status.server", () => ({ signupStatus: mocks.status }));
vi.mock("@/lib/stripe.server", () => ({
  createStripeClient: () => ({
    prices: { list: mocks.prices },
    checkout: { sessions: { create: mocks.create } },
  }),
  getStripeErrorMessage: () => "unavailable",
}));
import { Route } from "../routes/api/billing/checkout";
const post = (
  Route as unknown as {
    server: { handlers: { POST: (input: { request: Request }) => Promise<Response> } };
  }
).server.handlers.POST;
function request(body: Record<string, unknown> = { tier: "silver", trialOnly: true }) {
  return post({
    request: new Request("https://www.liveaskew.com/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VERCEL_ENV", "preview");
  vi.stubEnv("STRIPE_SANDBOX_API_KEY", "test-only");
  mocks.auth.mockResolvedValue("user-1");
  mocks.status.mockResolvedValue({
    membership: null,
    trialEligible: true,
    legacyTrialActive: false,
    trialStartedAt: null,
    email: "test@example.com",
  });
  mocks.prices.mockResolvedValue({ data: [{ id: "price_silver" }] });
  mocks.create.mockResolvedValue({ url: "https://checkout.stripe.com/test" });
});
describe("guided trial checkout", () => {
  it("requires a card and grants 14 days only through Stripe checkout", async () => {
    expect((await request()).status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_method_types: ["card"],
        payment_method_collection: "always",
        subscription_data: {
          metadata: { userId: "user-1", tier: "silver" },
          trial_period_days: 14,
        },
      }),
    );
  });
  it("does not silently charge an ineligible trial request", async () => {
    mocks.status.mockResolvedValue({ membership: null, trialEligible: false });
    expect((await request()).status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("blocks a second subscription for an active member", async () => {
    mocks.status.mockResolvedValue({ membership: { tier: "silver", status: "trialing" } });
    expect((await request()).status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("fails closed if account eligibility cannot be read", async () => {
    mocks.status.mockRejectedValue(new Error("offline"));
    expect((await request()).status).toBe(502);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("requires authentication and rejects unsupported plans", async () => {
    mocks.auth.mockResolvedValueOnce(new Response(null, { status: 401 }));
    expect((await request()).status).toBe(401);
    expect((await request({ tier: "not-a-plan" })).status).toBe(400);
  });
  it("allows explicitly chosen paid checkout with no new trial", async () => {
    mocks.status.mockResolvedValue({
      membership: null,
      trialEligible: false,
      legacyTrialActive: false,
      trialStartedAt: "2025-01-01",
      email: "test@example.com",
    });
    expect(
      (await request({ tier: "silver", trialOnly: false, returnUrl: "https://attacker.example" }))
        .status,
    ).toBe(200);
    const options = mocks.create.mock.calls[0][0];
    expect(options.subscription_data).toEqual({ metadata: { userId: "user-1", tier: "silver" } });
    expect(options.success_url).toBe("https://www.liveaskew.com/app?billing=success");
  });
});
