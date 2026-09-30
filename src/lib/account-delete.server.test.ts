import { describe, expect, it } from "vitest";
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
