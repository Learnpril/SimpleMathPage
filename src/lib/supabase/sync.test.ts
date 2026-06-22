import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";

// Mock the Supabase client module
vi.mock("./client", () => ({
  createSupabaseClient: vi.fn(),
}));

// Mock streak-record module
vi.mock("../streak-record", () => ({
  readStreakDates: vi.fn(),
}));

import { syncLocalProgressToSupabase } from "./sync";
import { createSupabaseClient } from "./client";
import { readStreakDates } from "../streak-record";

const mockedCreateSupabaseClient = vi.mocked(createSupabaseClient);
const mockedReadStreakDates = vi.mocked(readStreakDates);

/**
 * Helper to build a mock Supabase client with configurable behavior.
 * The from() method returns different chain objects based on the call pattern,
 * matching the real usage where select() and upsert() are called separately.
 */
function buildMockSupabase(options: {
  user?: { id: string } | null;
  progressSelectFn?: () => { data: any; error: any };
  progressUpsertFn?: (data: any, opts: any) => { error: any };
  streakUpsertFn?: (data: any, opts: any) => { error: any };
}) {
  const {
    user = null,
    progressSelectFn = () => ({ data: null, error: null }),
    progressUpsertFn = () => ({ error: null }),
    streakUpsertFn = () => ({ error: null }),
  } = options;

  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "user_progress") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi
                  .fn()
                  .mockImplementation(() =>
                    Promise.resolve(progressSelectFn()),
                  ),
              }),
            }),
          }),
          upsert: vi
            .fn()
            .mockImplementation((data: any, opts: any) =>
              Promise.resolve(progressUpsertFn(data, opts)),
            ),
        };
      }
      if (table === "user_streak_dates") {
        return {
          upsert: vi
            .fn()
            .mockImplementation((data: any, opts: any) =>
              Promise.resolve(streakUpsertFn(data, opts)),
            ),
        };
      }
      return {};
    }),
  };

  return mockClient;
}

describe("syncLocalProgressToSupabase", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockedReadStreakDates.mockReturnValue([]);
  });

  it("returns {synced: 0, errors: 0} when user is not authenticated", async () => {
    const mockClient = buildMockSupabase({ user: null });
    mockedCreateSupabaseClient.mockReturnValue(mockClient as any);

    const result = await syncLocalProgressToSupabase();

    expect(result).toEqual({ synced: 0, errors: 0 });
  });

  it("does not overwrite higher Supabase scores when localStorage has progress keys", async () => {
    localStorage.setItem("mbu-perfect-addition-and-subtraction", "1");

    const upsertCalls: any[] = [];
    const mockClient = buildMockSupabase({
      user: { id: "user-123" },
      progressSelectFn: () => ({ data: { score: 100 }, error: null }),
      progressUpsertFn: (data) => {
        upsertCalls.push(data);
        return { error: null };
      },
    });
    mockedCreateSupabaseClient.mockReturnValue(mockClient as any);

    const result = await syncLocalProgressToSupabase();

    // Should count as synced (skipped because already higher) but NOT call upsert
    expect(result.synced).toBe(1);
    expect(result.errors).toBe(0);
    expect(upsertCalls.length).toBe(0); // No upsert because score is already 100
  });

  it("upserts progress when Supabase has no existing record", async () => {
    localStorage.setItem("mbu-perfect-addition-and-subtraction", "1");

    const upsertCalls: any[] = [];
    const mockClient = buildMockSupabase({
      user: { id: "user-123" },
      progressSelectFn: () => ({ data: null, error: null }),
      progressUpsertFn: (data, opts) => {
        upsertCalls.push({ data, opts });
        return { error: null };
      },
    });
    mockedCreateSupabaseClient.mockReturnValue(mockClient as any);

    const result = await syncLocalProgressToSupabase();

    expect(result.synced).toBe(1);
    expect(result.errors).toBe(0);
    expect(upsertCalls.length).toBe(1);
    expect(upsertCalls[0].data).toEqual(
      expect.objectContaining({
        user_id: "user-123",
        lesson_slug: "addition-and-subtraction",
        section_slug: "arithmetic",
        completed: true,
        score: 100,
        is_perfect: true,
      }),
    );
  });

  it("upserts streak dates to user_streak_dates", async () => {
    mockedReadStreakDates.mockReturnValue(["2024-06-01", "2024-06-02"]);

    const streakUpsertCalls: any[] = [];
    const mockClient = buildMockSupabase({
      user: { id: "user-123" },
      streakUpsertFn: (data, opts) => {
        streakUpsertCalls.push({ data, opts });
        return { error: null };
      },
    });
    mockedCreateSupabaseClient.mockReturnValue(mockClient as any);

    const result = await syncLocalProgressToSupabase();

    expect(result.synced).toBe(2);
    expect(result.errors).toBe(0);
    expect(streakUpsertCalls.length).toBe(2);
    expect(streakUpsertCalls[0].data).toEqual({
      user_id: "user-123",
      streak_date: "2024-06-01",
    });
    expect(streakUpsertCalls[1].data).toEqual({
      user_id: "user-123",
      streak_date: "2024-06-02",
    });
  });

  it("does NOT clear localStorage when some upserts fail and clearLocalAfterSync is true", async () => {
    localStorage.setItem("mbu-perfect-addition-and-subtraction", "1");
    localStorage.setItem("mbu-streak-dates", JSON.stringify(["2024-06-01"]));
    mockedReadStreakDates.mockReturnValue(["2024-06-01"]);

    const mockClient = buildMockSupabase({
      user: { id: "user-123" },
      progressSelectFn: () => ({ data: null, error: null }),
      progressUpsertFn: () => ({ error: null }),
      streakUpsertFn: () => ({ error: { message: "DB error" } }),
    });
    mockedCreateSupabaseClient.mockReturnValue(mockClient as any);

    const result = await syncLocalProgressToSupabase({
      clearLocalAfterSync: true,
    });

    expect(result.errors).toBeGreaterThan(0);
    // localStorage should NOT be cleared because there were errors
    expect(localStorage.getItem("mbu-perfect-addition-and-subtraction")).toBe(
      "1",
    );
    expect(localStorage.getItem("mbu-streak-dates")).not.toBeNull();
  });

  it("clears localStorage keys when all upserts succeed and clearLocalAfterSync is true", async () => {
    localStorage.setItem("mbu-perfect-addition-and-subtraction", "1");
    localStorage.setItem("mbu-streak-dates", JSON.stringify(["2024-06-01"]));
    mockedReadStreakDates.mockReturnValue(["2024-06-01"]);

    const mockClient = buildMockSupabase({
      user: { id: "user-123" },
      progressSelectFn: () => ({ data: null, error: null }),
      progressUpsertFn: () => ({ error: null }),
      streakUpsertFn: () => ({ error: null }),
    });
    mockedCreateSupabaseClient.mockReturnValue(mockClient as any);

    const result = await syncLocalProgressToSupabase({
      clearLocalAfterSync: true,
    });

    expect(result.errors).toBe(0);
    expect(result.synced).toBeGreaterThan(0);
    // localStorage progress keys should be cleared
    expect(
      localStorage.getItem("mbu-perfect-addition-and-subtraction"),
    ).toBeNull();
    expect(localStorage.getItem("mbu-streak-dates")).toBeNull();
  });

  it("returns {synced: 0, errors: 1} on total failure (exception thrown)", async () => {
    mockedCreateSupabaseClient.mockImplementation(() => {
      throw new Error("Supabase not configured");
    });

    const result = await syncLocalProgressToSupabase();

    expect(result).toEqual({ synced: 0, errors: 1 });
  });
});

// Feature: progress-dashboard-and-streaks, Property 9: Sync merge correctness
describe("Property 9: Sync merge correctness", () => {
  // **Validates: Sync-on-login requirement**

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockedReadStreakDates.mockReturnValue([]);
  });

  /**
   * Generator for valid lesson slugs from the known mapping.
   */
  const knownSlugs = [
    "addition-and-subtraction",
    "multiplication",
    "division",
    "about-arithmetic",
    "rounding-decimals",
    "combining-like-terms",
    "evaluating-expressions",
    "about-geometry",
    "pythagorean-theorem",
    "about-calculus-1",
  ];

  const slugArb = fc.constantFrom(...knownSlugs);

  const validDateArb = fc
    .record({
      year: fc.integer({ min: 2020, max: 2025 }),
      month: fc.integer({ min: 1, max: 12 }),
      day: fc.integer({ min: 1, max: 28 }),
    })
    .map(
      ({ year, month, day }) =>
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );

  it("adds localStorage slugs not already in Supabase (no overwrite of higher scores)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(slugArb, { minLength: 1, maxLength: 5 }),
        fc.integer({ min: 0, max: 100 }),
        async (localSlugs, existingScore) => {
          localStorage.clear();
          vi.clearAllMocks();

          // Set up localStorage with progress keys
          for (const slug of localSlugs) {
            localStorage.setItem(`mbu-perfect-${slug}`, "1");
          }

          const upsertCalls: any[] = [];
          const mockClient = buildMockSupabase({
            user: { id: "user-prop9" },
            progressSelectFn: () => ({
              data: { score: existingScore },
              error: null,
            }),
            progressUpsertFn: (data) => {
              upsertCalls.push(data);
              return { error: null };
            },
          });
          mockedCreateSupabaseClient.mockReturnValue(mockClient as any);
          mockedReadStreakDates.mockReturnValue([]);

          await syncLocalProgressToSupabase();

          // If existing score >= 100, upsert should NOT be called (no overwrite)
          if (existingScore >= 100) {
            expect(upsertCalls.length).toBe(0);
          } else {
            // If existing score < 100, all slugs should be upserted
            expect(upsertCalls.length).toBe(localSlugs.length);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it("unions streak dates from localStorage without duplicates via upsert", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(validDateArb, { minLength: 1, maxLength: 10 }),
        async (streakDates) => {
          localStorage.clear();
          vi.clearAllMocks();

          mockedReadStreakDates.mockReturnValue(streakDates);

          const upsertedDates: string[] = [];
          const mockClient = buildMockSupabase({
            user: { id: "user-prop9" },
            progressSelectFn: () => ({ data: null, error: null }),
            progressUpsertFn: () => ({ error: null }),
            streakUpsertFn: (data) => {
              upsertedDates.push(data.streak_date);
              return { error: null };
            },
          });
          mockedCreateSupabaseClient.mockReturnValue(mockClient as any);

          const result = await syncLocalProgressToSupabase();

          // Each unique streak date should be upserted exactly once
          expect(upsertedDates.length).toBe(streakDates.length);
          const upsertedSet = new Set(upsertedDates);
          expect(upsertedSet.size).toBe(upsertedDates.length); // no dupes
          expect(result.errors).toBe(0);

          // All local streak dates should appear in the upserted set
          for (const d of streakDates) {
            expect(upsertedSet.has(d)).toBe(true);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it("partial failure does not clear localStorage (preserves data safety)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(slugArb, { minLength: 1, maxLength: 3 }),
        fc.uniqueArray(validDateArb, { minLength: 1, maxLength: 3 }),
        async (localSlugs, streakDates) => {
          localStorage.clear();
          vi.clearAllMocks();

          for (const slug of localSlugs) {
            localStorage.setItem(`mbu-perfect-${slug}`, "1");
          }
          localStorage.setItem("mbu-streak-dates", JSON.stringify(streakDates));
          mockedReadStreakDates.mockReturnValue(streakDates);

          // Make streak upsert always fail
          const mockClient = buildMockSupabase({
            user: { id: "user-prop9" },
            progressSelectFn: () => ({ data: null, error: null }),
            progressUpsertFn: () => ({ error: null }),
            streakUpsertFn: () => ({ error: { message: "fail" } }),
          });
          mockedCreateSupabaseClient.mockReturnValue(mockClient as any);

          const result = await syncLocalProgressToSupabase({
            clearLocalAfterSync: true,
          });

          // Should have errors
          expect(result.errors).toBeGreaterThan(0);

          // localStorage should NOT be cleared because of errors
          for (const slug of localSlugs) {
            expect(localStorage.getItem(`mbu-perfect-${slug}`)).not.toBeNull();
          }
          expect(localStorage.getItem("mbu-streak-dates")).not.toBeNull();
        },
      ),
      { numRuns: 50 },
    );
  });
});
