import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { advanceWeeklyGuide, startWeeklyGuide, type WeeklyGuideRow } from "./weekly-guide.server";
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  download: vi.fn(),
  render: vi.fn(),
}));
vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: { from: mocks.from, storage: { from: () => mocks } },
}));
vi.mock("./tryon-job.server", () => ({ renderOwnedLook: mocks.render }));
const photo = "data:image/png;base64,AAAA";
const ids = [1, 2, 3, 4, 5, 6, 7].map((n) => "day-" + n);
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
    if (this.table === "member_looks") return { data: looks, error: null };
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
  then(resolve: (value: ReturnType<Query["result"]>) => unknown) {
    return Promise.resolve(this.result()).then(resolve);
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
  mocks.from.mockImplementation((table: string) => new Query(table));
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.download.mockResolvedValue({ data: new Blob(["fixture"]), error: null });
});
describe("weekly guide recovery", () => {
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
