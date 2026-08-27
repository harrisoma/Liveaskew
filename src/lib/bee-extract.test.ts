// Simulates structured-output failures from the three sequential calls
// inside extractAndPersistBeeSignals and confirms partial sections still
// persist when one step's schema validation breaks.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NoObjectGeneratedError } from "ai";

const generateObjectMock = vi.fn();

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    generateObject: (...args: unknown[]) => generateObjectMock(...args),
  };
});

vi.mock("@/lib/ai-gateway.server", () => ({
  createLovableAiGatewayProvider: () => (_modelId: string) => ({ modelId: _modelId }),
}));

import { extractAndPersistBeeSignals } from "./bee-extract.server";

type Row = Record<string, unknown>;

function makeFakeSupabase() {
  const calls: Record<string, Row[]> = {
    bee_onboarding_responses: [],
    profiles: [],
    style_profiles: [],
  };

  const builder = (table: keyof typeof calls) => ({
    upsert: (rows: Row | Row[]) => {
      const arr = Array.isArray(rows) ? rows : [rows];
      calls[table].push(...arr);
      return Promise.resolve({ error: null });
    },
    update: (patch: Row) => ({
      eq: () => {
        calls[table].push(patch);
        return Promise.resolve({ error: null });
      },
    }),
  });

  return {
    client: {
      from: (table: string) => builder(table as keyof typeof calls),
    } as unknown as Parameters<typeof extractAndPersistBeeSignals>[0]["supabase"],
    calls,
  };
}

function makeNoObjectError(label: string) {
  return new NoObjectGeneratedError({
    message: `No object generated: ${label}`,
    cause: new Error("schema validation failed"),
    text: '{"answers":[{"question_id":"q9_hardest',
    response: { id: "r", timestamp: new Date(), modelId: "test" },
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      inputTokenDetails: { noCacheTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
      outputTokenDetails: { textTokens: 0, reasoningTokens: 0 },
    },
    finishReason: "length",
  });
}

const transcript = [
  { role: "user" as const, content: "I want pure ease and soft naturals." },
  { role: "assistant" as const, content: "Got it." },
];

const baseOpts = () => ({
  userId: "user-1",
  apiKey: "test-key",
  transcript,
});

beforeEach(() => {
  generateObjectMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("extractAndPersistBeeSignals — partial persistence on validation failure", () => {
  it("persists onboarding + style profile when the profile section fails twice", async () => {
    generateObjectMock
      // 1. onboarding succeeds
      .mockResolvedValueOnce({
        object: {
          answers: [
            { question_id: "q4_silhouette", pillar: "fit", choice: "pure ease" },
            { question_id: "q6_fabric_preference", pillar: "fabric", choice: "soft naturals" },
          ],
        },
      })
      // 2. profile: fail, fail (retry exhausted)
      .mockRejectedValueOnce(makeNoObjectError("profile-1"))
      .mockRejectedValueOnce(makeNoObjectError("profile-2"))
      // 3. style profile succeeds
      .mockResolvedValueOnce({
        object: {
          color_palette: [{ name: "bone", hex: "f5f1ea", role: "neutral" }],
          north_star: "quiet ease.",
        },
      });

    const { client, calls } = makeFakeSupabase();
    const res = await extractAndPersistBeeSignals({ ...baseOpts(), supabase: client });

    expect(generateObjectMock).toHaveBeenCalledTimes(4); // 1 + 2 (retry) + 1
    expect(res.onboardingCount).toBe(2);
    expect(res.styleProfileSaved).toBe(true);
    expect(calls.bee_onboarding_responses).toHaveLength(2);
    expect(calls.profiles).toHaveLength(0); // profile section gave up
    expect(calls.style_profiles).toHaveLength(1);
    expect(calls.style_profiles[0]).toMatchObject({
      user_id: "user-1",
      north_star: "quiet ease.",
    });
  });

  it("persists onboarding when style profile fails twice", async () => {
    generateObjectMock
      .mockResolvedValueOnce({
        object: {
          answers: [
            { question_id: "q1_pillar_priority", pillar: "meta", choice: "feel" },
          ],
        },
      })
      .mockResolvedValueOnce({ object: { climate: "temperate" } })
      .mockRejectedValueOnce(makeNoObjectError("style-1"))
      .mockRejectedValueOnce(makeNoObjectError("style-2"));

    const { client, calls } = makeFakeSupabase();
    const res = await extractAndPersistBeeSignals({ ...baseOpts(), supabase: client });

    expect(res.onboardingCount).toBe(1);
    expect(res.styleProfileSaved).toBe(false);
    expect(calls.bee_onboarding_responses).toHaveLength(1);
    expect(calls.profiles).toHaveLength(1);
    expect(calls.style_profiles).toHaveLength(0);
  });

  it("recovers via the auto-retry: first attempt fails, second attempt succeeds", async () => {
    generateObjectMock
      // onboarding: fail then succeed
      .mockRejectedValueOnce(makeNoObjectError("onb-1"))
      .mockResolvedValueOnce({
        object: {
          answers: [
            { question_id: "q10_keep_line", pillar: "meta", choice: "protect" },
          ],
        },
      })
      // profile + style succeed
      .mockResolvedValueOnce({ object: {} })
      .mockResolvedValueOnce({
        object: { north_star: "protect what you love." },
      });

    const { client, calls } = makeFakeSupabase();
    const res = await extractAndPersistBeeSignals({ ...baseOpts(), supabase: client });

    expect(generateObjectMock).toHaveBeenCalledTimes(4);
    expect(res.onboardingCount).toBe(1);
    expect(res.styleProfileSaved).toBe(true);
    expect(calls.bee_onboarding_responses).toHaveLength(1);
    expect(calls.style_profiles).toHaveLength(1);
  });

  it("returns zeros (without throwing) when all three sections fail", async () => {
    generateObjectMock
      .mockRejectedValueOnce(makeNoObjectError("a1"))
      .mockRejectedValueOnce(makeNoObjectError("a2"))
      .mockRejectedValueOnce(makeNoObjectError("b1"))
      .mockRejectedValueOnce(makeNoObjectError("b2"))
      .mockRejectedValueOnce(makeNoObjectError("c1"))
      .mockRejectedValueOnce(makeNoObjectError("c2"));

    const { client, calls } = makeFakeSupabase();
    const res = await extractAndPersistBeeSignals({ ...baseOpts(), supabase: client });

    expect(res).toEqual({ onboardingCount: 0, styleProfileSaved: false });
    expect(calls.bee_onboarding_responses).toHaveLength(0);
    expect(calls.profiles).toHaveLength(0);
    expect(calls.style_profiles).toHaveLength(0);
  });

  it("filters out invalid question_ids returned by the model", async () => {
    generateObjectMock
      .mockResolvedValueOnce({
        object: {
          answers: [
            { question_id: "q4_silhouette", pillar: "fit", choice: "pure ease" },
            { question_id: "q99_made_up", pillar: "meta", choice: "nope" },
            { question_id: "q6_fabric_preference", pillar: "weird-pillar", choice: "soft naturals" },
          ],
        },
      })
      .mockResolvedValueOnce({ object: {} })
      .mockResolvedValueOnce({ object: {} });

    const { client, calls } = makeFakeSupabase();
    const res = await extractAndPersistBeeSignals({ ...baseOpts(), supabase: client });

    expect(res.onboardingCount).toBe(2);
    expect(calls.bee_onboarding_responses).toHaveLength(2);
    expect(
      (calls.bee_onboarding_responses[1] as { pillar: string }).pillar,
    ).toBe("meta"); // bad pillar coerced
  });
});
