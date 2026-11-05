import { studioSample } from "@/mobile/lib/studio-sample";
import { describe, expect, it } from "vitest";
import {
  capsuleFormulas,
  parseBlueprint,
  retailerSearch,
  type CapsulePiece,
} from "./style-blueprint";
const roles: CapsulePiece["role"][] = [
  "top",
  "top",
  "top",
  "bottom",
  "bottom",
  "bottom",
  "dress",
  "layer",
  "shoe",
  "shoe",
  "accessory",
  "accessory",
];
const capsule = roles.map((role, i) => ({
  role,
  name: `Garment ${i}`,
  color: "Navy",
  hex: "#123456",
  reason: "Fits your week",
}));
describe("editorial capsule", () => {
  it("builds twenty distinct formulas with shoes and accessories, referencing only the twelve pieces", () => {
    const formulas = capsuleFormulas(capsule);
    expect(formulas).toHaveLength(20);
    expect(new Set(formulas.map((f) => f.pieces.map((p) => p.id).join(","))).size).toBe(20);
    for (const f of formulas) {
      expect(f.pieces.some((p) => capsule[Number(p.id.slice(6)) - 1].role === "shoe")).toBe(true);
      expect(f.pieces.some((p) => capsule[Number(p.id.slice(6)) - 1].role === "accessory")).toBe(
        true,
      );
      expect(f.pieces.every((p) => Number(p.id.slice(6)) <= 12)).toBe(true);
    }
  });
  it("rejects incomplete model output", () =>
    expect(() => parseBlueprint('{"title":"Guide"}')).toThrow());
  it("encodes searches into a fixed retailer host", () => {
    const url = new URL(retailerSearch('https://evil.example/"<script>'));
    expect(url.hostname).toBe("www.nordstrom.com");
    expect(url.searchParams.get("keyword")).toBe('https://evil.example/"<script>');
  });
});

describe("wardrobe variety", () => {
  it("accepts two dresses and two bottoms and builds complete combinations", () => {
    const guide = parseBlueprint(JSON.stringify(studioSample));
    expect(guide.capsule.filter((p) => p.role === "dress")).toHaveLength(2);
    expect(capsuleFormulas(guide.capsule)).toHaveLength(16);
  });
  it("keeps legacy one-dress guides valid", () => {
    expect(parseBlueprint(JSON.stringify({ ...studioSample, capsule })).capsule).toHaveLength(12);
  });
  it("supports an explicit no-dresses preference without losing shoes or accessories", () => {
    const noDresses = studioSample.capsule.map((p) =>
      p.role === "dress" ? { ...p, role: "bottom" } : p,
    );
    expect(
      parseBlueprint(JSON.stringify({ ...studioSample, capsule: noDresses })).capsule.filter(
        (p) => p.role === "bottom",
      ),
    ).toHaveLength(4);
  });
  it("rejects a capsule that trades required shoes for extra garments", () => {
    const invalid = studioSample.capsule.map((p) =>
      p.role === "shoe" ? { ...p, role: "top" } : p,
    );
    expect(() => parseBlueprint(JSON.stringify({ ...studioSample, capsule: invalid }))).toThrow(
      "incomplete_capsule",
    );
  });
});
