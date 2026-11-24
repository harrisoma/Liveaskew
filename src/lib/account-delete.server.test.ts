import { describe, expect, it, vi } from "vitest";
import { listAllFiles } from "./account-delete.server";

describe("listAllFiles", () => {
  it("walks every page and every subfolder", async () => {
    const tree: Record<string, { name: string; id: string | null }[]> = {
      u: [
        ...Array.from({ length: 1000 }, (_, i) => ({ name: `f${i}.jpg`, id: `id${i}` })),
        { name: "extra.jpg", id: "x" },
        { name: "looks", id: null },
      ],
      "u/looks": [
        { name: "a.jpg", id: "a" },
        { name: "deep", id: null },
      ],
      "u/looks/deep": [{ name: "b.jpg", id: "b" }],
    };
    const files = await listAllFiles(
      async (prefix, offset) => (tree[prefix] ?? []).slice(offset, offset + 1000),
      "u",
    );
    expect(files).toHaveLength(1003);
    expect(files).toContain("u/extra.jpg");
    expect(files).toContain("u/looks/deep/b.jpg");
  });
});

describe("account deletion safety", () => {
  it("stops before storage/auth deletion when subscription lookup fails", async () => {
    vi.resetModules();
    const removeUser = vi.fn();
    const storage = vi.fn();
    vi.doMock("@/integrations/supabase/client.server", () => ({
      supabaseAdmin: {
        from: () => ({
          select: () => ({
            eq: () => ({
              not: async () => ({ data: null, error: { message: "database unavailable" } }),
            }),
          }),
        }),
        storage: { from: storage },
        auth: { admin: { deleteUser: removeUser } },
      },
    }));
    const { deleteAccount } = await import("./account-delete.server");
    await expect(deleteAccount("test-user")).rejects.toThrow("subscription_cancel_failed");
    expect(storage).not.toHaveBeenCalled();
    expect(removeUser).not.toHaveBeenCalled();
    vi.doUnmock("@/integrations/supabase/client.server");
  });
});

describe("account cleanup order", () => {
  it("removes every bucket before deleting the auth account", async () => {
    vi.resetModules();
    const calls: string[] = [];
    vi.doMock("@/integrations/supabase/client.server", () => ({
      supabaseAdmin: {
        from: () => ({
          select: () => ({ eq: () => ({ not: async () => ({ data: [], error: null }) }) }),
        }),
        storage: {
          from: (bucket: string) => ({
            list: async () => ({ data: [{ name: "photo.jpg", id: "file" }], error: null }),
            remove: async () => {
              calls.push(bucket);
              return { error: null };
            },
          }),
        },
        auth: {
          admin: {
            deleteUser: async () => {
              calls.push("auth");
              return { error: null };
            },
          },
        },
      },
    }));
    const { deleteAccount, USER_BUCKETS } = await import("./account-delete.server");
    await deleteAccount("disposable-test-user");
    expect(calls).toEqual([...USER_BUCKETS, "auth"]);
    vi.doUnmock("@/integrations/supabase/client.server");
  });
  it("keeps the auth account when photo cleanup fails", async () => {
    vi.resetModules();
    const removeUser = vi.fn();
    vi.doMock("@/integrations/supabase/client.server", () => ({
      supabaseAdmin: {
        from: () => ({
          select: () => ({ eq: () => ({ not: async () => ({ data: [], error: null }) }) }),
        }),
        storage: {
          from: () => ({
            list: async () => ({ data: null, error: { message: "storage offline" } }),
          }),
        },
        auth: { admin: { deleteUser: removeUser } },
      },
    }));
    const { deleteAccount } = await import("./account-delete.server");
    await expect(deleteAccount("disposable-test-user")).rejects.toThrow("storage_cleanup_failed");
    expect(removeUser).not.toHaveBeenCalled();
    vi.doUnmock("@/integrations/supabase/client.server");
  });
});
