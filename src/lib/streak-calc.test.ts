import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { calculateStreak, formatStreak } from "./streak-calc";

describe("calculateStreak", () => {
  it("returns 0 when dates array is empty", () => {
    expect(calculateStreak([], "2024-01-15")).toBe(0);
  });

  it("returns 0 when neither today nor yesterday is in the array", () => {
    expect(calculateStreak(["2024-01-10", "2024-01-11"], "2024-01-15")).toBe(0);
  });

  it("returns 1 when only today is in the array", () => {
    expect(calculateStreak(["2024-01-15"], "2024-01-15")).toBe(1);
  });

  it("returns 1 when only yesterday is in the array", () => {
    expect(calculateStreak(["2024-01-14"], "2024-01-15")).toBe(1);
  });

  it("counts consecutive days backwards from today", () => {
    const dates = ["2024-01-12", "2024-01-13", "2024-01-14", "2024-01-15"];
    expect(calculateStreak(dates, "2024-01-15")).toBe(4);
  });

  it("counts consecutive days backwards from yesterday when today is missing", () => {
    const dates = ["2024-01-12", "2024-01-13", "2024-01-14"];
    expect(calculateStreak(dates, "2024-01-15")).toBe(3);
  });

  it("stops counting at a gap", () => {
    const dates = ["2024-01-10", "2024-01-13", "2024-01-14", "2024-01-15"];
    expect(calculateStreak(dates, "2024-01-15")).toBe(3);
  });

  it("ignores invalid date entries", () => {
    const dates = ["not-a-date", "2024-01-14", "2024-13-01", "2024-01-15"];
    expect(calculateStreak(dates, "2024-01-15")).toBe(2);
  });

  it("handles month boundaries correctly", () => {
    const dates = ["2024-01-30", "2024-01-31", "2024-02-01"];
    expect(calculateStreak(dates, "2024-02-01")).toBe(3);
  });

  it("handles year boundaries correctly", () => {
    const dates = ["2023-12-30", "2023-12-31", "2024-01-01"];
    expect(calculateStreak(dates, "2024-01-01")).toBe(3);
  });

  it("handles leap year Feb 29", () => {
    const dates = ["2024-02-27", "2024-02-28", "2024-02-29", "2024-03-01"];
    expect(calculateStreak(dates, "2024-03-01")).toBe(4);
  });

  it("prefers today over yesterday when both present", () => {
    // If today is present, count from today (which includes yesterday in the streak)
    const dates = ["2024-01-14", "2024-01-15"];
    expect(calculateStreak(dates, "2024-01-15")).toBe(2);
  });

  it("handles duplicate dates in input", () => {
    const dates = ["2024-01-14", "2024-01-14", "2024-01-15", "2024-01-15"];
    expect(calculateStreak(dates, "2024-01-15")).toBe(2);
  });
});

describe("formatStreak", () => {
  it("returns 'day streak' for value 1", () => {
    const result = formatStreak(1);
    expect(result.value).toBe(1);
    expect(result.label).toBe("day streak");
    expect(result.hasStreak).toBe(true);
  });

  it("returns 'days streak' for value 0", () => {
    const result = formatStreak(0);
    expect(result.value).toBe(0);
    expect(result.label).toBe("days streak");
    expect(result.hasStreak).toBe(false);
  });

  it("returns 'days streak' for value 2", () => {
    const result = formatStreak(2);
    expect(result.value).toBe(2);
    expect(result.label).toBe("days streak");
    expect(result.hasStreak).toBe(true);
  });

  it("returns 'days streak' for large values", () => {
    const result = formatStreak(365);
    expect(result.value).toBe(365);
    expect(result.label).toBe("days streak");
    expect(result.hasStreak).toBe(true);
  });

  it("hasStreak is false only for 0", () => {
    expect(formatStreak(0).hasStreak).toBe(false);
    expect(formatStreak(1).hasStreak).toBe(true);
    expect(formatStreak(100).hasStreak).toBe(true);
  });
});

// Feature: progress-dashboard-and-streaks, Property 5: Streak calculation correctness

/**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**
 *
 * Property 5: Streak calculation correctness
 * For any array of valid date strings sorted chronologically, and any reference
 * date "today", the calculateStreak function SHALL return: 0 if neither today nor
 * the day before today appears in the array; otherwise, the count of consecutive
 * calendar days ending at the most recent qualifying date (today if present, else
 * yesterday) counting backwards. Each day in the consecutive sequence must differ
 * from the next by exactly one calendar day. Invalid date entries in the input
 * SHALL be ignored.
 */

/** Helper: subtract N days from a YYYY-MM-DD date string */
function subtractDays(dateStr: string, n: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** Helper: generate a consecutive date sequence ending at endDate */
function buildConsecutiveSequence(endDate: string, length: number): string[] {
  const result: string[] = [];
  for (let i = length - 1; i >= 0; i--) {
    result.push(subtractDays(endDate, i));
  }
  return result;
}

/** Arbitrary: generate a valid YYYY-MM-DD date string within a reasonable range */
const arbDateStr = fc
  .integer({ min: 0, max: 3650 }) // ~10 years of days from epoch 2020-01-01
  .map((offset) => {
    const d = new Date(2020, 0, 1);
    d.setDate(d.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  });

describe("Property 5: Streak calculation correctness", () => {
  it("returns 0 when neither today nor yesterday is in the dates array", () => {
    fc.assert(
      fc.property(
        arbDateStr,
        fc.array(arbDateStr, { minLength: 0, maxLength: 50 }),
        (today, dates) => {
          const yesterday = subtractDays(today, 1);
          // Filter out today and yesterday from generated dates
          const filteredDates = dates.filter(
            (d) => d !== today && d !== yesterday,
          );

          const result = calculateStreak(filteredDates, today);
          expect(result).toBe(0);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("returns correct consecutive count when today is present with a known sequence", () => {
    fc.assert(
      fc.property(
        arbDateStr,
        fc.integer({ min: 1, max: 100 }),
        (today, streakLength) => {
          // Build a known consecutive sequence ending at today
          const consecutiveDates = buildConsecutiveSequence(
            today,
            streakLength,
          );

          const result = calculateStreak(consecutiveDates, today);
          expect(result).toBe(streakLength);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("returns correct consecutive count when yesterday is the latest qualifying date", () => {
    fc.assert(
      fc.property(
        arbDateStr,
        fc.integer({ min: 1, max: 100 }),
        (today, streakLength) => {
          const yesterday = subtractDays(today, 1);
          // Build a known consecutive sequence ending at yesterday
          const consecutiveDates = buildConsecutiveSequence(
            yesterday,
            streakLength,
          );

          // Ensure today is NOT in the array
          const filtered = consecutiveDates.filter((d) => d !== today);

          const result = calculateStreak(filtered, today);
          expect(result).toBe(streakLength);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("the result is always non-negative", () => {
    fc.assert(
      fc.property(
        arbDateStr,
        fc.array(arbDateStr, { minLength: 0, maxLength: 50 }),
        (today, dates) => {
          const result = calculateStreak(dates, today);
          expect(result).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("invalid date entries do not affect the result", () => {
    const invalidDateArb = fc.oneof(
      fc.constant("not-a-date"),
      fc.constant("2024-13-01"),
      fc.constant("2024-02-30"),
      fc.constant("abcd-ef-gh"),
      fc.constant(""),
      fc.constant("2024/01/15"),
      fc.constant("20240115"),
    );

    fc.assert(
      fc.property(
        arbDateStr,
        fc.array(arbDateStr, { minLength: 0, maxLength: 30 }),
        fc.array(invalidDateArb, { minLength: 1, maxLength: 20 }),
        (today, validDates, invalidDates) => {
          // Compute streak with only valid dates
          const resultWithoutInvalid = calculateStreak(validDates, today);

          // Mix invalid dates into the array at random positions
          const mixedDates = [...validDates, ...invalidDates];

          const resultWithInvalid = calculateStreak(mixedDates, today);

          // Invalid entries should not change the result
          expect(resultWithInvalid).toBe(resultWithoutInvalid);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("streak count matches the length of the consecutive sequence ending at qualifying date", () => {
    fc.assert(
      fc.property(
        arbDateStr,
        fc.integer({ min: 1, max: 50 }),
        fc.integer({ min: 2, max: 30 }),
        fc.boolean(),
        (today, streakLength, gapSize, includesToday) => {
          const startDate = includesToday ? today : subtractDays(today, 1);
          // Build consecutive sequence ending at startDate
          const consecutiveDates = buildConsecutiveSequence(
            startDate,
            streakLength,
          );

          // Add some older dates with a gap (should not count toward streak)
          const olderDate = subtractDays(
            consecutiveDates[0],
            gapSize + 1, // Ensure at least 2-day gap
          );
          const olderDates = buildConsecutiveSequence(olderDate, 3);

          const allDates = [...olderDates, ...consecutiveDates];

          const result = calculateStreak(allDates, today);
          expect(result).toBe(streakLength);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("today takes priority over yesterday as the starting point", () => {
    fc.assert(
      fc.property(
        arbDateStr,
        fc.integer({ min: 2, max: 50 }),
        (today, streakLength) => {
          // Build consecutive sequence ending at today
          const consecutiveDates = buildConsecutiveSequence(
            today,
            streakLength,
          );

          // Result starting from today should be streakLength
          const result = calculateStreak(consecutiveDates, today);
          expect(result).toBe(streakLength);

          // Removing today should give streakLength - 1 (starting from yesterday)
          const withoutToday = consecutiveDates.filter((d) => d !== today);
          const resultWithoutToday = calculateStreak(withoutToday, today);
          expect(resultWithoutToday).toBe(streakLength - 1);
        },
      ),
      { numRuns: 200 },
    );
  });
});

// Feature: progress-dashboard-and-streaks, Property 7: Streak display pluralization

/**
 * **Validates: Requirements 7.2, 7.3**
 *
 * Property 7: Streak display pluralization
 * For any non-negative integer streak value, the formatStreak function SHALL
 * return "day streak" when the value is exactly 1, and "days streak" for all
 * other values (including 0).
 */
describe("Property 7: Streak display pluralization", () => {
  it("returns 'day streak' only when value is exactly 1", () => {
    fc.assert(
      fc.property(fc.nat(), (streak) => {
        const result = formatStreak(streak);

        if (streak === 1) {
          expect(result.label).toBe("day streak");
        } else {
          expect(result.label).toBe("days streak");
        }
      }),
      { numRuns: 200 },
    );
  });

  it("hasStreak is true when value >= 1, false when 0", () => {
    fc.assert(
      fc.property(fc.nat(), (streak) => {
        const result = formatStreak(streak);

        if (streak >= 1) {
          expect(result.hasStreak).toBe(true);
        } else {
          expect(result.hasStreak).toBe(false);
        }
      }),
      { numRuns: 200 },
    );
  });

  it("value field always matches the input", () => {
    fc.assert(
      fc.property(fc.nat(), (streak) => {
        const result = formatStreak(streak);
        expect(result.value).toBe(streak);
      }),
      { numRuns: 200 },
    );
  });
});
