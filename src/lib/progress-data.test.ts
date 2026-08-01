import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchProgressData } from "./progress-data";

// Mock the Supabase client
vi.mock("./supabase/client", () => ({
  createSupabaseClient: vi.fn(),
}));

// Mock the Supabase streak module
vi.mock("./supabase/streak", () => ({
  readStreakDatesFromSupabase: vi.fn(),
}));

// Mock progress-calc module (partially - keep computeProgress real but mock localStorage reader)
vi.mock("./progress-calc", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./progress-calc")>();
  return {
    ...actual,
    readPassedSlugsFromLocalStorage: vi.fn(),
  };
});

// Mock streak-record module
vi.mock("./streak-record", () => ({
  readStreakDates: vi.fn(),
}));

import { createSupabaseClient } from "./supabase/client";
import { readStreakDatesFromSupabase } from "./supabase/streak";
import { readPassedSlugsFromLocalStorage } from "./progress-calc";
import { readStreakDates } from "./streak-record";

const mockCreateSupabaseClient = vi.mocked(createSupabaseClient);
const mockReadStreakDatesFromSupabase = vi.mocked(readStreakDatesFromSupabase);
const mockReadPassedSlugsFromLocalStorage = vi.mocked(
  readPassedSlugsFromLocalStorage,
);
const mockReadStreakDates = vi.mocked(readStreakDates);

describe("fetchProgressData - dual-mode data source", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Guest mode (unauthenticated)", () => {
    it("should read from localStorage when getUser returns null", async () => {
      // Arrange: Supabase returns no user
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
      };
      mockCreateSupabaseClient.mockReturnValue(mockSupabase as any);

      mockReadPassedSlugsFromLocalStorage.mockReturnValue(
        new Set(["addition-and-subtraction", "multiplication"]),
      );
      mockReadStreakDates.mockReturnValue(["2025-01-10", "2025-01-11"]);

      // Act
      const result = await fetchProgressData();

      // Assert
      expect(result.isAuthenticated).toBe(false);
      expect(result.error).toBeNull();
      expect(result.streakDates).toEqual(["2025-01-10", "2025-01-11"]);
      expect(mockReadPassedSlugsFromLocalStorage).toHaveBeenCalled();
      expect(mockReadStreakDates).toHaveBeenCalled();
      // Supabase data fetchers should NOT be called
      expect(mockReadStreakDatesFromSupabase).not.toHaveBeenCalled();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("should return progress data computed from localStorage slugs", async () => {
      // Arrange: No authenticated user
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
        },
        from: vi.fn(),
      };
      mockCreateSupabaseClient.mockReturnValue(mockSupabase as any);

      // No passed slugs
      mockReadPassedSlugsFromLocalStorage.mockReturnValue(new Set());
      mockReadStreakDates.mockReturnValue([]);

      // Act
      const result = await fetchProgressData();

      // Assert
      expect(result.isAuthenticated).toBe(false);
      expect(result.progress.totalPassed).toBe(0);
      expect(result.progress.overallPercentage).toBe(0);
      expect(result.streakDates).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe("Authenticated mode (Supabase data)", () => {
    it("should return Supabase data when user is authenticated and queries succeed", async () => {
      // Arrange: Supabase returns a user and successful data
      const mockUser = { id: "user-123", email: "test@example.com" };
      const mockProgressRows = [
        { lesson_slug: "addition-and-subtraction" },
        { lesson_slug: "multiplication" },
        { lesson_slug: "division" },
      ];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockProgressRows,
              error: null,
            }),
          }),
        }),
      });

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: mockFrom,
      };
      mockCreateSupabaseClient.mockReturnValue(mockSupabase as any);

      mockReadStreakDatesFromSupabase.mockResolvedValue([
        "2025-01-09",
        "2025-01-10",
        "2025-01-11",
      ]);

      // Act
      const result = await fetchProgressData();

      // Assert
      expect(result.isAuthenticated).toBe(true);
      expect(result.error).toBeNull();
      expect(result.streakDates).toEqual([
        "2025-01-09",
        "2025-01-10",
        "2025-01-11",
      ]);
      // Progress should reflect the Supabase slugs
      expect(result.progress.totalPassed).toBe(3);
      // Should NOT call localStorage readers
      expect(mockReadPassedSlugsFromLocalStorage).not.toHaveBeenCalled();
      expect(mockReadStreakDates).not.toHaveBeenCalled();
    });
  });

  describe("Fallback on Supabase failure", () => {
    it("should fall back to localStorage when Supabase query fails", async () => {
      // Arrange: User is authenticated but Supabase query throws
      const mockUser = { id: "user-456", email: "fail@example.com" };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database connection failed" },
            }),
          }),
        }),
      });

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
        },
        from: mockFrom,
      };
      mockCreateSupabaseClient.mockReturnValue(mockSupabase as any);

      mockReadPassedSlugsFromLocalStorage.mockReturnValue(
        new Set(["addition-and-subtraction"]),
      );
      mockReadStreakDates.mockReturnValue(["2025-01-10"]);

      // Act
      const result = await fetchProgressData();

      // Assert: falls back to localStorage
      expect(result.isAuthenticated).toBe(false);
      expect(result.error).toBe("Showing local progress only.");
      expect(result.streakDates).toEqual(["2025-01-10"]);
      expect(result.progress.totalPassed).toBe(1);
      expect(mockReadPassedSlugsFromLocalStorage).toHaveBeenCalled();
      expect(mockReadStreakDates).toHaveBeenCalled();
    });

    it("should fall back to localStorage when createSupabaseClient throws", async () => {
      // Arrange: Supabase client creation throws
      mockCreateSupabaseClient.mockImplementation(() => {
        throw new Error("Supabase not configured");
      });

      mockReadPassedSlugsFromLocalStorage.mockReturnValue(new Set());
      mockReadStreakDates.mockReturnValue([]);

      // Act
      const result = await fetchProgressData();

      // Assert: falls back gracefully to guest mode
      expect(result.isAuthenticated).toBe(false);
      expect(result.error).toBeNull();
      expect(result.progress.totalPassed).toBe(0);
      expect(result.streakDates).toEqual([]);
      expect(mockReadPassedSlugsFromLocalStorage).toHaveBeenCalled();
      expect(mockReadStreakDates).toHaveBeenCalled();
    });
  });
});
