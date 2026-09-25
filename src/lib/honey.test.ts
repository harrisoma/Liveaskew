import { describe, expect, it } from "vitest";
import { postHasHit, type HoneyItem } from "./honey";

const post: HoneyItem = {
  id: "1",
  title: "The look",
  date: "2026-09-25",
  time: "09:00",
  kind: "post",
  network: "Instagram",
};

describe("postHasHit", () => {
  it("marks a post after its hour", () => {
    expect(postHasHit(post, new Date("2026-09-25T09:30:00"))).toBe(true);
  });

  it("waits until the scheduled hour", () => {
    expect(postHasHit(post, new Date("2026-09-25T08:00:00"))).toBe(false);
  });

  it("leaves meetings unmarked", () => {
    expect(
      postHasHit({ ...post, kind: "meeting", network: null }, new Date("2026-09-25T12:00:00")),
    ).toBe(false);
  });
});
