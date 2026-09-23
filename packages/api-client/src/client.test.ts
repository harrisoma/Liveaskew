import { describe, expect, it } from "vitest";
import { suggestHashtags } from "./hashtags";
import { clearLooks, getLookStore, parseLookTransfer } from "./looks";
import { planOutfit } from "./stylist";
import { rankWardrobe } from "./vectors";
import { visionPayload } from "./vision";

const look = {
  lookId: "look-1",
  userId: "user-1",
  imageUrl: "https://liveaskew.com/look.jpg",
  caption: "Stretch blazer for a maternity boardroom day",
  platforms: ["instagram", "linkedin"] as const,
  source: "bee" as const,
};

describe("Bee to Buzz", () => {
  it("rejects a transfer that did not come from Bee", () => {
    expect(parseLookTransfer({ ...look, source: "web" })).toEqual({
      error: "Looks transfer only from Bee.",
    });
  });

  it("queues a look and suggests hashtags from the caption", () => {
    clearLooks();
    const parsed = parseLookTransfer(look);
    if ("error" in parsed) throw new Error(parsed.error);
    const stored = getLookStore().transfer(parsed);
    expect(stored.status).toBe("queued");
    expect(stored.hashtags).toContain("#MaternityStyle");
    expect(suggestHashtags(look.caption)).toContain("#BoardroomLook");
    const scheduled = getLookStore().schedule(stored.id, "2026-09-24T11:00:00.000Z");
    expect(scheduled?.status).toBe("scheduled");
  });
});

describe("Bee stylist", () => {
  it("plans a boardroom outfit around a maternity body", () => {
    const plan = planOutfit({ occasion: "boardroom", stage: "maternity" });
    expect(plan.pieces.some((piece) => /stretch/i.test(piece.item))).toBe(true);
    expect(plan.note.toLowerCase()).toContain("body");
  });

  it("ranks wardrobe pieces that share the boardroom tags", () => {
    const ranked = rankWardrobe(
      [
        { id: "tee", label: "Jersey tee", tags: ["knit"] },
        { id: "jacket", label: "Stretch wool blazer", tags: ["blazer", "stretch", "tailored"] },
      ],
      ["blazer", "tailored", "stretch"],
    );
    expect(ranked[0]?.id).toBe("jacket");
  });

  it("asks vision for the garment, not the body", () => {
    const payload = visionPayload("https://example.com/jacket.jpg");
    const text = payload.messages[0].content[0];
    expect(text.type).toBe("text");
    if (text.type === "text") expect(text.text).toContain("Do not comment on her body");
  });
});
