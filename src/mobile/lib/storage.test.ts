import { describe, expect, it } from "vitest";
import {
  emptySnapshot,
  lookPhoto,
  SELF_PHOTO,
  snapshotFallbacks,
  type AppSnapshot,
} from "./storage";

const look = (tryOnUrl: string | null) => ({
  id: "l",
  title: "t",
  occasion: "o",
  formula: ["a"],
  fit: "",
  feel: "",
  fabric: "",
  palette: [],
  saved: true,
  createdAt: "",
  garmentNote: "",
  tryOnUrl,
  tryOnKey: null,
});

describe("lookPhoto", () => {
  it("resolves the self marker to the selfie without storing a copy", () => {
    expect(lookPhoto(look(SELF_PHOTO), "data:image/jpeg;base64,AAA")).toBe(
      "data:image/jpeg;base64,AAA",
    );
    expect(lookPhoto(look("https://r/1.jpg"), "x")).toBe("https://r/1.jpg");
    expect(lookPhoto(look(null), "x")).toBeNull();
  });
});

describe("snapshotFallbacks", () => {
  it("keeps looks and Honey while shedding wardrobe photos and old chat", () => {
    const snap: AppSnapshot = {
      ...emptySnapshot,
      messages: Array.from({ length: 200 }, (_, i) => ({
        id: String(i),
        role: "user" as const,
        content: "x",
      })),
      wardrobe: Array.from({ length: 40 }, (_, i) => ({
        id: String(i),
        photo: "data:image/jpeg;base64,BIG",
        label: "l",
        verdict: null,
        reason: null,
      })),
      looks: [look("data:image/jpeg;base64,RENDER")],
    };
    const steps = snapshotFallbacks(snap);
    expect(steps[0].messages).toHaveLength(120);
    expect(steps[1].wardrobe).toHaveLength(20);
    expect(steps[2].wardrobe.every((w) => w.photo === "")).toBe(true);
    const last = steps[steps.length - 1];
    expect(last.looks).toHaveLength(1);
    expect(last.looks[0].tryOnUrl).toBeNull();
    expect(last.messages).toHaveLength(30);
  });
});
