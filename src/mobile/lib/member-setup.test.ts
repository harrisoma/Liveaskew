import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  blankMemberSetup,
  memberSetupSchema,
  readMemberSetup,
  saveMemberSetup,
} from "./member-setup";

const { getUser, updateUser } = vi.hoisted(() => ({ getUser: vi.fn(), updateUser: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser, updateUser } } }));
const profile = { ...blankMemberSetup, name: "Alex" };
beforeEach(() => vi.resetAllMocks());

describe("member setup", () => {
  it("allows optional contact fields but rejects invalid phone and plan values", () => {
    expect(memberSetupSchema.safeParse(profile).success).toBe(true);
    for (const invalid of [{ name: " " }, { phone: "555" }, { selectedPlan: "admin" }]) {
      expect(memberSetupSchema.safeParse({ ...profile, ...invalid }).success).toBe(false);
    }
  });
  it.each([
    ["(305) 555-0123", "+13055550123"],
    ["305-555-0123", "+13055550123"],
    ["1 (305) 555-0123", "+13055550123"],
    ["+44 20 7946 0958", "+442079460958"],
    ["+33 (1) 42 68 53 00", "+33142685300"],
    ["  ", ""],
  ])("normalizes %s without losing country information", (phone, expected) => {
    expect(memberSetupSchema.parse({ ...profile, phone }).phone).toBe(expected);
  });
  it.each([
    "call me 3055550123",
    "3055550123 ext 4",
    "++13055550123",
    "02079460958",
    "+1234567890123456",
  ])("rejects ambiguous or malformed phone %s", (phone) => {
    expect(memberSetupSchema.safeParse({ ...profile, phone }).success).toBe(false);
  });
  it("saves the normalized phone value", async () => {
    updateUser.mockResolvedValue({ error: null });
    expect(await saveMemberSetup({ ...profile, phone: "(305) 555-0123" })).toBe(true);
    expect(updateUser).toHaveBeenCalledWith({
      data: { memberSetup: { ...profile, phone: "+13055550123" } },
    });
  });
  it("stores preferences without verification or membership privileges", async () => {
    updateUser.mockResolvedValue({ error: null });
    expect(await saveMemberSetup({ ...profile, membershipActive: true } as typeof profile)).toBe(
      true,
    );
    expect(updateUser).toHaveBeenCalledWith({ data: { memberSetup: profile } });
  });
  it("keeps failed saves retryable without claiming success", async () => {
    updateUser.mockResolvedValue({ error: { message: "offline" } });
    expect(await saveMemberSetup(profile)).toBe(false);
    updateUser.mockRejectedValue(new Error("network"));
    expect(await saveMemberSetup(profile)).toBe(false);
  });
  it("restores valid account preferences and ignores malformed metadata", async () => {
    getUser.mockResolvedValue({
      data: { user: { user_metadata: { memberSetup: profile } } },
      error: null,
    });
    expect(await readMemberSetup()).toEqual(profile);
    getUser.mockResolvedValue({
      data: { user: { user_metadata: { memberSetup: { selectedPlan: "admin" } } } },
      error: null,
    });
    expect(await readMemberSetup()).toBeNull();
  });
});
