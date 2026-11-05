import { expect, it } from "vitest";
import { buildStylingContext } from "./styling-context";
import type { GuideLook, WardrobeItem } from "./storage";
it("sends only kept usable pieces and bounded feedback", () => {
  const wardrobe = [
    {
      id: "kept",
      label: "Linen shirt",
      reason: "Fits",
      photo: "data:image/jpeg;base64,YQ==",
      verdict: "keep",
    },
    { id: "donate", label: "Old shirt", photo: "", verdict: "donate" },
    { id: "failed", label: "Error", photo: "", verdict: "keep", error: "failed" },
  ] as WardrobeItem[];
  const looks = [
    {
      title: "Dinner",
      formula: ["Dress"],
      feedback: { choice: "budget", note: "Use what I own", updatedAt: "2026-11-05T12:00:00Z" },
    },
  ] as GuideLook[];
  const context = buildStylingContext(wardrobe, looks);
  expect(context.wardrobe.map((p) => p.id)).toEqual(["kept"]);
  expect(context.feedback[0].choice).toBe("budget");
});
