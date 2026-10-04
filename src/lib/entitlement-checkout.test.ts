import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ from: vi.fn(), insert: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: mock.from } }));
import { guardAi } from "./entitlement.server";
function query(result: unknown) {
  const chain: Record<string, unknown> = {
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
  for (const method of ["select", "eq", "gte", "maybeSingle"]) chain[method] = () => chain;
  chain.insert = mock.insert;
  return chain;
}
function data(subs: unknown[], start: string | null) {
  mock.from.mockImplementation((table: string) =>
    query(
      table === "subscriptions"
        ? { data: subs }
        : table === "member_trials"
          ? { data: start ? { started_at: start } : null }
          : { count: 0 },
    ),
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mock.insert.mockResolvedValue({ error: null });
});
describe("checkout-gated AI access", () => {
  it("does not create a card-free trial for a new account", async () => {
    data([], null);
    expect((await guardAi("user", "looks"))?.status).toBe(402);
    expect(mock.insert).not.toHaveBeenCalled();
  });
  it("preserves an existing card-free trial", async () => {
    data([], new Date().toISOString());
    expect(await guardAi("user", "looks")).toBeNull();
  });
  it("requires a confirmed active subscription after cancellation", async () => {
    data(
      [{ status: "canceled", price_id: "silver_monthly", current_period_end: null }],
      new Date().toISOString(),
    );
    expect((await guardAi("user", "looks"))?.status).toBe(402);
  });
  it("unlocks a server-confirmed Stripe trial", async () => {
    data([{ status: "trialing", price_id: "silver_monthly", current_period_end: null }], null);
    expect(await guardAi("user", "looks")).toBeNull();
  });
});
