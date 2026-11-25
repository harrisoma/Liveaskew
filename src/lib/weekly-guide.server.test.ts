import { STYLE_GUIDE_STANDARD } from "./style-guide-standard";
import {
  visualBrief,
  VISUAL_REVIEW_CRITERIA,
  type OutfitVisualReview,
} from "./style-guide-visual-review";
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { advanceWeeklyGuide, startWeeklyGuide, type WeeklyGuideRow } from "./weekly-guide.server";
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  download: vi.fn(),
  render: vi.fn(),
  review: vi.fn(),
  guard: vi.fn(),
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: mocks.from, storage: { from: () => mocks } },
}));
vi.mock("./ai-gateway.server", () => ({ getOnixusAiHeaders: vi.fn(), getOnixusAiUrl: vi.fn() }));
vi.mock("./style-guide-review.server", () => ({ reviewOutfitImage: mocks.review }));
vi.mock("./entitlement.server", () => ({ guardAi: mocks.guard }));
vi.mock("./tryon-job.server", () => ({ renderOwnedLook: mocks.render }));
const photo = "data:image/png;base64,AAAA";
const ids = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => "day-" + n);
const looks = ids.map((id, index) => ({
  id,
  look: {
    title: id,
    guideDay: index + 1,
    formula: ["Blouse", "Trousers", "Loafers", "Tote"],
    fit: "Relaxed",
    fabric: "Cotton",
  },
}));
let row: WeeklyGuideRow;
class Query {
  filters: Record<string, unknown> = {};
  changes: Record<string, unknown> | null = null;
  constructor(readonly table: string) {}
  select() {
    return this;
  }
  eq(key: string, value: unknown) {
    this.filters[key] = value;
    return this;
  }
  in(key: string, value: unknown) {
    this.filters[key] = value;
    return this;
  }
  update(value: Record<string, unknown>) {
    this.changes = value;
    return this;
  }
  result() {
    if (this.table === "member_looks")
      return {
        data:
          typeof this.filters.id === "string"
            ? looks.find((look) => look.id === this.filters.id)
            : looks,
        error: null,
      };
    if (this.table === "tryon_renders") return { data: [], error: null };
    if (this.filters.request_key && row.request_key !== this.filters.request_key)
      return { data: null, error: null };
    if (Array.isArray(this.filters.status) && !this.filters.status.includes(row.status))
      return { data: null, error: null };
    if (this.changes) row = { ...row, ...this.changes } as WeeklyGuideRow;
    return { data: row, error: null };
  }
  maybeSingle() {
    return Promise.resolve(this.result());
  }
  single() {
    return Promise.resolve(this.result());
  }
  then(resolve: (value: { data: unknown; error: null }) => unknown) {
    const result = this.result();
    return Promise.resolve({
      ...result,
      data: this.changes && result.data ? [result.data] : result.data,
    }).then(resolve);
  }
}
beforeEach(() => {
  vi.clearAllMocks();
  const hash = createHash("sha256")
    .update(
      "member\n" +
        photo +
        "\n" +
        JSON.stringify(
          looks.map((l) => ({
            id: l.id,
            title: l.look.title,
            formula: l.look.formula,
            fit: l.look.fit,
            fabric: l.look.fabric,
          })),
        ),
    )
    .digest("hex");
  row = {
    id: "guide",
    user_id: "member",
    request_key: hash,
    look_ids: ids,
    photo_path: "member/old-photo.png",
    photo_type: "image/png",
    results: {},
    status: "expired",
    attempts: 2,
    lease_token: "lease",
    lease_until: null,
    not_before: new Date().toISOString(),
    expires_at: new Date(0).toISOString(),
    last_error: "guide_photo_expired",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mocks.guard.mockResolvedValue(null);
  mocks.from.mockImplementation((table: string) => new Query(table));
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.download.mockResolvedValue({ data: new Blob(["fixture"]), error: null });
});
describe("weekly guide recovery", () => {
  it("rejects the old seven-look request before uploading a reference", async () => {
    await expect(startWeeklyGuide("member", ids.slice(0, 7), photo)).rejects.toThrow(
      "eight_owned_looks_required",
    );
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("re-adding an expired reference revives the same job, and repeating it does not upload or pay twice", async () => {
    const restored = await startWeeklyGuide("member", ids, photo);
    expect(restored.id).toBe("guide");
    expect(restored.status).toBe("queued");
    expect(Date.parse(restored.expires_at)).toBeGreaterThan(Date.now());
    expect(restored.attempts).toBe(0);
    expect(restored.photo_path).not.toBe("member/old-photo.png");
    await startWeeklyGuide("member", ids, photo);
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    expect(mocks.render).not.toHaveBeenCalled();
  });
  it("membership pauses keep their reference and requeue automatically rather than becoming terminal", async () => {
    row.status = "running";
    row.expires_at = new Date(Date.now() + 86400000).toISOString();
    mocks.render.mockResolvedValue(
      Response.json({ error: "membership_required" }, { status: 402 }),
    );
    await advanceWeeklyGuide({ ...row });
    expect(row.status).toBe("queued");
    expect(row.last_error).toBe("membership_required");
    expect(Date.parse(row.not_before)).toBeGreaterThan(Date.now());
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("an uncertain paid operation is never restarted just by reopening the guide", async () => {
    row.status = "attention";
    row.last_error = "render_needs_review";
    const unchanged = await startWeeklyGuide("member", ids, photo);
    expect(unchanged.status).toBe("attention");
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.render).not.toHaveBeenCalled();
  });
});

function approved(index: number): OutfitVisualReview {
  return {
    status: "passed",
    standardVersion: STYLE_GUIDE_STANDARD.version,
    brief: visualBrief(looks[index].look),
    imageHash: (index + 1).toString(16).repeat(64),
    referenceHash: createHash("sha256").update(photo).digest("hex"),
    checkedAt: new Date().toISOString(),
    checks: Object.fromEntries(VISUAL_REVIEW_CRITERIA.map((key) => [key, "pass"])),
    issues: [],
    model: "vision",
    requestId: "review-id",
    costUsd: null,
  };
}
function generated() {
  row.status = "running";
  row.expires_at = new Date(Date.now() + 86400000).toISOString();
  row.results = Object.fromEntries(
    ids.map((id, i) => [
      id,
      { path: `member/${id}.png`, key: id, brief: visualBrief(looks[i].look) },
    ]),
  );
}
describe("durable guide quality gate", () => {
  it("reviews saved assets instead of calling the image generator, and only finishes after all pass", async () => {
    generated();
    for (let i = 0; i < ids.length; i++) {
      mocks.review.mockResolvedValueOnce(approved(i));
      await advanceWeeklyGuide({ ...row });
      expect(row.status).toBe(i === 7 ? "ready" : "queued");
    }
    expect(mocks.review).toHaveBeenCalledTimes(8);
    expect(mocks.render).not.toHaveBeenCalled();
    expect(row.results[ids[7]].review?.status).toBe("passed");
    expect(mocks.remove).toHaveBeenCalledTimes(1);
  });
  it("preserves rejected artwork and the failure reason without regenerating it", async () => {
    generated();
    for (let i = 0; i < 7; i++) row.results[ids[i]].review = approved(i);
    mocks.review.mockResolvedValueOnce({
      ...approved(7),
      status: "failed",
      checks: { ...approved(7).checks, outfit_matches: "fail" },
      issues: ["Requested shoes are missing."],
    });
    await advanceWeeklyGuide({ ...row });
    expect(row.status).toBe("attention");
    expect(row.last_error).toBe("visual_review_failed");
    expect(row.results[ids[7]].path).toBe("member/day-8.png");
    expect(mocks.render).not.toHaveBeenCalled();
  });
  it("retries unavailable review three times while retaining every generated image", async () => {
    generated();
    for (let i = 0; i < 7; i++) row.results[ids[i]].review = approved(i);
    mocks.review.mockResolvedValue({
      ...approved(7),
      status: "unavailable",
      checks: {},
      issues: ["review_provider_unavailable"],
    });
    for (let i = 1; i <= 3; i++) {
      await advanceWeeklyGuide({ ...row });
      expect(row.results[ids[7]].reviewAttempts).toBe(i);
      expect(row.status).toBe(i === 3 ? "attention" : "queued");
    }
    expect(row.last_error).toBe("visual_review_unavailable");
    expect(mocks.render).not.toHaveBeenCalled();
    expect(Object.keys(row.results)).toHaveLength(8);
  });
  it("does not approve duplicate image bytes even when individual critics passed", async () => {
    generated();
    for (let i = 0; i < 8; i++)
      row.results[ids[i]].review = { ...approved(i), imageHash: "a".repeat(64) };
    await advanceWeeklyGuide({ ...row });
    expect(row.status).toBe("attention");
    expect(row.last_error).toBe("visual_review_inconsistent");
    expect(mocks.review).not.toHaveBeenCalled();
    expect(mocks.render).not.toHaveBeenCalled();
  });
  it("refuses to review a generated image against an edited brief", async () => {
    generated();
    row.results[ids[0]].brief = "outdated";
    await advanceWeeklyGuide({ ...row });
    expect(row.last_error).toBe("guide_changed");
    expect(mocks.review).not.toHaveBeenCalled();
  });
  it("a review-only request cannot create missing images", async () => {
    await expect(startWeeklyGuide("member", ids, photo, { reviewOnly: true })).rejects.toThrow(
      "review_images_missing",
    );
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.render).not.toHaveBeenCalled();
  });
});
