import { randomBytes } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// In-memory stand-ins for the two tables confirm.server touches.
const pending = new Map<string, { user_id: string; accounts_enc: string; created_at: string }>();
const saved: { userId: string; networks: string[] }[] = [];

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: () => ({
      insert: async (row: { finish_hash: string; user_id: string; accounts_enc: string }) => {
        pending.set(row.finish_hash, { ...row, created_at: new Date().toISOString() });
        return { error: null };
      },
      select: () => ({
        eq: (_col: string, hash: string) => ({
          maybeSingle: async () => ({ data: pending.get(hash) ?? null }),
        }),
      }),
      delete: () => ({
        lt: async () => ({ error: null }),
        eq: async (_col: string, hash: string) => {
          pending.delete(hash);
          return { error: null };
        },
      }),
    }),
  },
}));
let failSave = false;
vi.mock("./store.server", () => ({
  saveAccounts: async (userId: string, accounts: { network: string }[]) => {
    if (failSave) throw new Error("db down");
    saved.push({ userId, networks: accounts.map((a) => a.network) });
  },
}));

const { confirmAccounts, parkAccounts } = await import("./confirm.server");

const ALICE = "11111111-1111-1111-1111-111111111111";
const EVE = "22222222-2222-2222-2222-222222222222";
const account = {
  network: "instagram" as const,
  accountId: "ig1",
  accountName: "victim",
  accessToken: "secret",
  refreshToken: null,
  expiresAt: null,
};

beforeAll(() => {
  process.env.BUZZ_TOKEN_KEY = randomBytes(32).toString("base64");
});
beforeEach(() => {
  pending.clear();
  saved.length = 0;
  failSave = false;
});

describe("Buzz connect confirmation", () => {
  it("attaches the account for the member who started the connect", async () => {
    const token = await parkAccounts(ALICE, "instagram", [account]);
    expect(await confirmAccounts(token, ALICE)).toEqual({ ok: true, networks: ["instagram"] });
    expect(saved).toEqual([{ userId: ALICE, networks: ["instagram"] }]);
  });

  it("refuses when a different account completes it, and burns the token", async () => {
    // Eve started the connect; Alice approved it in her browser and her app confirms.
    const token = await parkAccounts(EVE, "instagram", [account]);
    expect(await confirmAccounts(token, ALICE)).toEqual({ ok: false, error: "wrong_account" });
    // Eve cannot use it afterwards either.
    expect(await confirmAccounts(token, EVE)).toEqual({ ok: false, error: "expired" });
    expect(saved).toEqual([]);
  });

  it("never stores the network token in plain text while parked", async () => {
    await parkAccounts(ALICE, "instagram", [account]);
    const [row] = [...pending.values()];
    expect(row.accounts_enc).not.toContain("secret");
  });

  it("keeps the parked account when saving fails, so the member can retry", async () => {
    const token = await parkAccounts(ALICE, "instagram", [account]);
    failSave = true;
    await expect(confirmAccounts(token, ALICE)).rejects.toThrow();
    failSave = false;
    expect(await confirmAccounts(token, ALICE)).toEqual({ ok: true, networks: ["instagram"] });
  });
});
