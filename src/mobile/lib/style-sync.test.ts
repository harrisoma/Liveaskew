import { describe, expect, it } from "vitest";
import { lookForSync, mergeLooks } from "./style-sync";
import type { GuideLook } from "./storage";

const look = (id: string, extra: Partial<GuideLook> = {}): GuideLook => ({
  id,
  title: id,
  occasion: "o",
  formula: ["a"],
  fit: "",
  feel: "",
  fabric: "",
  palette: [],
  saved: false,
  createdAt: `2026-09-${id.padStart(2, "0")}T00:00:00Z`,
  garmentNote: "",
  tryOnUrl: null,
  tryOnKey: null,
  ...extra,
});

describe("lookForSync", () => {
  it("never uploads inline photos or the selfie marker", () => {
    expect(
      lookForSync(look("1", { tryOnUrl: "data:image/jpeg;base64,AA", tryOnKey: "k" })).tryOnUrl,
    ).toBeNull();
    expect(lookForSync(look("1", { tryOnUrl: "self", tryOnKey: "k" })).tryOnKey).toBeNull();
    expect(lookForSync(look("1", { tryOnUrl: "https://r/1.jpg", tryOnKey: "k" })).tryOnUrl).toBe(
      "https://r/1.jpg",
    );
  });
});

describe("mergeLooks", () => {
  it("unions by id, keeps the device's render, and never un-saves", () => {
    const merged = mergeLooks(
      [look("2", { tryOnUrl: "self" })],
      [look("1", { saved: true }), look("2", { saved: true })],
    );
    expect(merged.map((l) => l.id)).toEqual(["2", "1"]);
    expect(merged[0]).toMatchObject({ saved: true, tryOnUrl: "self" });
  });
});
