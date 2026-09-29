import { describe, expect, it } from "vitest";
import type { HoneyItem } from "./honey";
import { honeyToInsert } from "./honey.server";

const post: HoneyItem = {
  id: "p1",
  title: "X: Monday",
  date: "2026-10-01",
  time: "09:00",
  kind: "post",
  source: "manual",
  network: "X",
  lookId: "l1",
  caption: "hi",
  postStatus: "scheduled",
  beeNote: null,
  scheduledAt: "2026-10-01T14:00:00.000Z",
  mediaUrl: null,
};

describe("honeyToInsert", () => {
  it("queues a new post as scheduled", () => {
    expect(honeyToInsert("u", post, null)).toMatchObject({
      post_status: "scheduled",
      scheduled_at: "2026-10-01T14:00:00.000Z",
    });
  });

  it("never lets a device copy re-queue a published or publishing post", () => {
    for (const status of ["posted", "publishing"]) {
      const row = honeyToInsert("u", { ...post, postStatus: "scheduled" }, { post_status: status });
      expect(row).not.toHaveProperty("post_status");
      expect(row).not.toHaveProperty("scheduled_at");
    }
  });

  it("lets a scheduled post move time without touching its status", () => {
    const row = honeyToInsert("u", { ...post, postStatus: "posted" }, { post_status: "scheduled" });
    expect(row).not.toHaveProperty("post_status");
    expect(row.scheduled_at).toBe("2026-10-01T14:00:00.000Z");
  });

  it("clears post status on non-post rows", () => {
    expect(honeyToInsert("u", { ...post, kind: "event" }, null).post_status).toBeNull();
  });
});
