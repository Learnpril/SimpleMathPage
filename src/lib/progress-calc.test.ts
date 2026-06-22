// Feature: progress-dashboard-and-streaks, Property 3: Overall completion percentage calculation
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { computeProgress } from "./progress-calc";
import { SUBJECTS, TOTAL_LESSONS } from "./progress-map";

/**
 * **Validates: Requirements 4.3**
 *
 * Property 3: Overall completion percentage calculation
 * For any integer totalPassed in the range [0, TOTAL_LESSONS], the overall
 * completion percentage SHALL equal Math.floor((totalPassed / TOTAL_LESSONS) * 100),
 * yielding a value between 0 and 100 inclusive.
 */
describe("Property 3: Overall completion percentage calculation", () => {
  // Collect all unique valid lesson slugs from SUBJECTS
  const allUniqueSlugs: string[] = [
    ...new Set(SUBJECTS.flatMap((s) => s.lessons)),
  ];

  it("overallPercentage equals Math.floor((totalPassed / TOTAL_LESSONS) * 100) for random subsets of valid slugs", () => {
    fc.assert(
      fc.property(
        fc.subarray(allUniqueSlugs, {
          minLength: 0,
          maxLength: allUniqueSlugs.length,
        }),
        (slugSubset) => {
          const passedSlugs = new Set(slugSubset);
          const result = computeProgress(passedSlugs, SUBJECTS, TOTAL_LESSONS);

          // The overall percentage must match the formula using the result's totalPassed
          const expectedPercentage = Math.floor(
            (result.totalPassed / TOTAL_LESSONS) * 100,
          );
          expect(result.overallPercentage).toBe(expectedPercentage);

          // The percentage must be between 0 and 100 inclusive
          expect(result.overallPercentage).toBeGreaterThanOrEqual(0);
          expect(result.overallPercentage).toBeLessThanOrEqual(100);
        },
      ),
      { numRuns: 200 },
    );
  });

  it("overallPercentage is 0 when no slugs are passed", () => {
    const result = computeProgress(new Set(), SUBJECTS, TOTAL_LESSONS);
    expect(result.overallPercentage).toBe(0);
    expect(result.totalPassed).toBe(0);
  });

  it("overallPercentage is 100 when all slugs are passed", () => {
    const allSlugs = new Set(SUBJECTS.flatMap((s) => s.lessons));
    const result = computeProgress(allSlugs, SUBJECTS, TOTAL_LESSONS);

    // totalPassed equals TOTAL_LESSONS (sum of all subject lesson counts, including duplicates counted per-subject)
    expect(result.totalPassed).toBe(TOTAL_LESSONS);
    expect(result.overallPercentage).toBe(
      Math.floor((TOTAL_LESSONS / TOTAL_LESSONS) * 100),
    );
    expect(result.overallPercentage).toBe(100);
  });

  it("overallPercentage is always an integer (floored) for any random totalPassed count", () => {
    fc.assert(
      fc.property(
        fc.subarray(allUniqueSlugs, {
          minLength: 0,
          maxLength: allUniqueSlugs.length,
        }),
        (slugSubset) => {
          const passedSlugs = new Set(slugSubset);
          const result = computeProgress(passedSlugs, SUBJECTS, TOTAL_LESSONS);

          // Must be an integer (floored)
          expect(result.overallPercentage).toBe(
            Math.floor(result.overallPercentage),
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
