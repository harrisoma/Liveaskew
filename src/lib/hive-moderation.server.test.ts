import { describe, expect, it } from "vitest";
import { groupReports } from "./hive-moderation.server";

describe("groupReports", () => {
  it("counts reasons per message and ignores reports older than the last review", () => {
    const reports = [
      { message_id: "m1", reason: "spam", created_at: "2026-09-29T10:00:00Z" },
      { message_id: "m1", reason: "spam", created_at: "2026-09-29T11:00:00Z" },
      { message_id: "m1", reason: "harassment", created_at: "2026-09-29T12:00:00Z" },
      { message_id: "m2", reason: "other", created_at: "2026-09-29T09:00:00Z" },
    ];
    const grouped = groupReports(
      reports,
      new Map([
        ["m1", null],
        ["m2", "2026-09-29T09:30:00Z"],
      ]),
    );
    expect(grouped.get("m1")).toEqual({
      count: 3,
      reasons: { spam: 2, harassment: 1 },
      last: "2026-09-29T12:00:00Z",
    });
    expect(grouped.has("m2")).toBe(false);
  });
});
