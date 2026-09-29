import { describe, expect, it } from "vitest";
import { networkById, postProblem, scheduledInstant } from ".";

describe("postProblem", () => {
  const x = networkById("x")!;
  const ig = networkById("instagram")!;
  it("enforces each network's length and image rules", () => {
    expect(postProblem(x, "a".repeat(280), null)).toBeNull();
    expect(postProblem(x, "a".repeat(281), null)).toMatch(/280/);
    expect(postProblem(ig, "caption", null)).toMatch(/photo/);
    expect(postProblem(ig, "caption", "https://x/y.jpg")).toBeNull();
    expect(postProblem(x, "  ", null)).toMatch(/caption/);
  });
  it("counts emoji as one character", () => {
    expect(postProblem(x, "👗".repeat(280), null)).toBeNull();
  });
});

describe("scheduledInstant", () => {
  it("turns local date and time into an ISO instant", () => {
    const iso = scheduledInstant("2026-10-02", "18:30")!;
    expect(new Date(iso).getHours()).toBe(18);
    expect(scheduledInstant("nope", "18:30")).toBeNull();
  });
});
