/**
 * Streak calculation utilities.
 *
 * Pure functions for computing the current consecutive-day streak
 * and formatting it for display.
 */

/**
 * Subtract one day from a YYYY-MM-DD date string and return the previous day
 * as a YYYY-MM-DD string.
 */
function subtractOneDay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Validate that a string is a valid YYYY-MM-DD date representing a real calendar day.
 */
function isValidDate(str: string): boolean {
  if (typeof str !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [year, month, day] = str.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Calculate the current streak given an array of valid date strings
 * and a reference "today" date.
 *
 * Rules:
 * - If today is in the array, count consecutive days backwards from today
 * - If today is NOT but yesterday IS, count from yesterday backwards
 * - Otherwise return 0
 *
 * Invalid date entries in the input are filtered out before calculation.
 * Each day in the consecutive sequence must differ by exactly one calendar day.
 */
export function calculateStreak(dates: string[], today: string): number {
  // Filter to only valid dates and deduplicate
  const validDates = new Set(dates.filter(isValidDate));

  if (validDates.size === 0) return 0;

  const yesterday = subtractOneDay(today);

  let startDate: string;

  if (validDates.has(today)) {
    startDate = today;
  } else if (validDates.has(yesterday)) {
    startDate = yesterday;
  } else {
    return 0;
  }

  // Count consecutive days backwards from startDate
  let streak = 1;
  let current = startDate;

  while (true) {
    const prev = subtractOneDay(current);
    if (validDates.has(prev)) {
      streak++;
      current = prev;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Format streak for display.
 *
 * Returns an object with:
 * - value: the raw streak number
 * - label: "day streak" when value is 1, "days streak" otherwise
 * - hasStreak: true when streak >= 1
 */
export function formatStreak(streak: number): {
  value: number;
  label: string;
  hasStreak: boolean;
} {
  return {
    value: streak,
    label: streak === 1 ? "day streak" : "days streak",
    hasStreak: streak >= 1,
  };
}
