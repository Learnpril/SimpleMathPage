import { describe, it, expect, beforeEach } from "vitest";
import {
  isValidDateStr,
  getTodayDateStr,
  readStreakDates,
  recordStreakDate,
} from "./streak-record";

describe("isValidDateStr", () => {
  it("accepts valid dates", () => {
    expect(isValidDateStr("2024-01-15")).toBe(true);
    expect(isValidDateStr("2024-02-29")).toBe(true); // 2024 is leap year
    expect(isValidDateStr("2023-12-31")).toBe(true);
    expect(isValidDateStr("2000-01-01")).toBe(true);
  });

  it("rejects invalid format", () => {
    expect(isValidDateStr("2024-1-15")).toBe(false);
    expect(isValidDateStr("2024/01/15")).toBe(false);
    expect(isValidDateStr("01-15-2024")).toBe(false);
    expect(isValidDateStr("not-a-date")).toBe(false);
    expect(isValidDateStr("")).toBe(false);
    expect(isValidDateStr("2024-00-15")).toBe(false);
    expect(isValidDateStr("2024-13-15")).toBe(false);
  });

  it("rejects impossible dates", () => {
    expect(isValidDateStr("2024-02-30")).toBe(false); // Feb 30 doesn't exist
    expect(isValidDateStr("2023-02-29")).toBe(false); // 2023 is not a leap year
    expect(isValidDateStr("2024-04-31")).toBe(false); // April has 30 days
    expect(isValidDateStr("2024-01-00")).toBe(false); // Day 0
  });

  it("rejects non-string input", () => {
    expect(isValidDateStr(null as any)).toBe(false);
    expect(isValidDateStr(undefined as any)).toBe(false);
    expect(isValidDateStr(123 as any)).toBe(false);
  });
});

describe("getTodayDateStr", () => {
  it("returns a valid YYYY-MM-DD string", () => {
    const result = getTodayDateStr();
    expect(isValidDateStr(result)).toBe(true);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches the current local date", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    expect(getTodayDateStr()).toBe(expected);
  });
});

describe("readStreakDates", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty array when key does not exist", () => {
    expect(readStreakDates()).toEqual([]);
  });

  it("returns parsed and sorted valid dates", () => {
    localStorage.setItem(
      "mbu-streak-dates",
      JSON.stringify(["2024-03-01", "2024-01-15", "2024-02-20"]),
    );
    expect(readStreakDates()).toEqual([
      "2024-01-15",
      "2024-02-20",
      "2024-03-01",
    ]);
  });

  it("filters out invalid entries", () => {
    localStorage.setItem(
      "mbu-streak-dates",
      JSON.stringify(["2024-01-15", "invalid", "2024-02-30", "2024-03-01"]),
    );
    expect(readStreakDates()).toEqual(["2024-01-15", "2024-03-01"]);
  });

  it("returns empty array for malformed JSON", () => {
    localStorage.setItem("mbu-streak-dates", "not json");
    expect(readStreakDates()).toEqual([]);
  });

  it("returns empty array for non-array JSON", () => {
    localStorage.setItem("mbu-streak-dates", JSON.stringify({ foo: "bar" }));
    expect(readStreakDates()).toEqual([]);
  });

  it("deduplicates entries", () => {
    localStorage.setItem(
      "mbu-streak-dates",
      JSON.stringify(["2024-01-15", "2024-01-15", "2024-01-15"]),
    );
    expect(readStreakDates()).toEqual(["2024-01-15"]);
  });
});

describe("recordStreakDate", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("records a date to empty storage", () => {
    recordStreakDate("2024-06-15");
    expect(readStreakDates()).toEqual(["2024-06-15"]);
  });

  it("maintains chronological order", () => {
    recordStreakDate("2024-06-15");
    recordStreakDate("2024-06-10");
    recordStreakDate("2024-06-20");
    expect(readStreakDates()).toEqual([
      "2024-06-10",
      "2024-06-15",
      "2024-06-20",
    ]);
  });

  it("does not duplicate existing dates (idempotent)", () => {
    recordStreakDate("2024-06-15");
    recordStreakDate("2024-06-15");
    expect(readStreakDates()).toEqual(["2024-06-15"]);
  });

  it("enforces max 365 entries by removing oldest", () => {
    // Fill with 365 dates
    const dates: string[] = [];
    for (let i = 0; i < 365; i++) {
      const day = String((i % 28) + 1).padStart(2, "0");
      const month = String(Math.floor(i / 28) + 1).padStart(2, "0");
      // Use a simple sequential approach
      const dayNum = i + 1;
      const date = new Date(2020, 0, dayNum); // Start from 2020-01-01
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      dates.push(dateStr);
    }
    localStorage.setItem("mbu-streak-dates", JSON.stringify(dates));

    // Adding one more should remove the oldest
    recordStreakDate("2025-01-01");
    const result = readStreakDates();
    expect(result.length).toBe(365);
    expect(result[result.length - 1]).toBe("2025-01-01");
    expect(result).not.toContain(dates[0]); // Oldest removed
  });

  it("does not record invalid date strings", () => {
    recordStreakDate("not-a-date");
    recordStreakDate("2024-02-30");
    expect(readStreakDates()).toEqual([]);
  });
});

// Feature: progress-dashboard-and-streaks, Property 4: Streak record structural invariants
import * as fc from "fast-check";

describe("Property 4: Streak record structural invariants", () => {
  // **Validates: Requirements 5.2, 5.4, 5.5**

  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * Generator for valid YYYY-MM-DD date strings within a reasonable range.
   */
  const validDateArb = fc
    .record({
      year: fc.integer({ min: 2000, max: 2030 }),
      month: fc.integer({ min: 1, max: 12 }),
      day: fc.integer({ min: 1, max: 28 }), // 1-28 always valid for any month
    })
    .map(
      ({ year, month, day }) =>
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );

  /**
   * Generator for arbitrary strings that may or may not be valid dates.
   * Mixes valid dates with invalid/random strings to stress-test filtering.
   */
  const mixedDateArb = fc.oneof(
    { weight: 3, arbitrary: validDateArb },
    { weight: 1, arbitrary: fc.string({ minLength: 0, maxLength: 20 }) },
    {
      weight: 1,
      arbitrary: fc.constantFrom(
        "not-a-date",
        "2024-13-01",
        "2024-02-30",
        "",
        "9999-99-99",
      ),
    },
  );

  it("all entries are valid YYYY-MM-DD date strings after arbitrary recordStreakDate calls", () => {
    fc.assert(
      fc.property(
        fc.array(mixedDateArb, { minLength: 1, maxLength: 50 }),
        (dateInputs) => {
          localStorage.clear();

          for (const dateStr of dateInputs) {
            recordStreakDate(dateStr);
          }

          const result = readStreakDates();
          for (const entry of result) {
            expect(isValidDateStr(entry)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("entries are in chronological order (oldest first)", () => {
    fc.assert(
      fc.property(
        fc.array(mixedDateArb, { minLength: 1, maxLength: 50 }),
        (dateInputs) => {
          localStorage.clear();

          for (const dateStr of dateInputs) {
            recordStreakDate(dateStr);
          }

          const result = readStreakDates();
          for (let i = 0; i < result.length - 1; i++) {
            expect(result[i] <= result[i + 1]).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("no duplicate entries exist", () => {
    fc.assert(
      fc.property(
        fc.array(mixedDateArb, { minLength: 1, maxLength: 50 }),
        (dateInputs) => {
          localStorage.clear();

          for (const dateStr of dateInputs) {
            recordStreakDate(dateStr);
          }

          const result = readStreakDates();
          const unique = new Set(result);
          expect(result.length).toBe(unique.size);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("array length never exceeds 365", () => {
    fc.assert(
      fc.property(
        fc.array(validDateArb, { minLength: 1, maxLength: 400 }),
        (dateInputs) => {
          localStorage.clear();

          for (const dateStr of dateInputs) {
            recordStreakDate(dateStr);
          }

          const result = readStreakDates();
          expect(result.length).toBeLessThanOrEqual(365);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("calling recordStreakDate with an existing date does not change the array (idempotence)", () => {
    fc.assert(
      fc.property(
        fc.array(validDateArb, { minLength: 1, maxLength: 30 }),
        fc.integer({ min: 0, max: 29 }),
        (dateInputs, pickIndex) => {
          localStorage.clear();

          // Record all dates
          for (const dateStr of dateInputs) {
            recordStreakDate(dateStr);
          }

          const before = readStreakDates();

          // If the array is non-empty, call recordStreakDate with an existing date
          if (before.length > 0) {
            const existingDate = before[pickIndex % before.length];
            recordStreakDate(existingDate);

            const after = readStreakDates();
            expect(after).toEqual(before);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
