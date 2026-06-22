const STORAGE_KEY = "mbu-streak-dates";
const MAX_ENTRIES = 365;

/**
 * Validate a date string is in YYYY-MM-DD format and represents a real date.
 */
export function isValidDateStr(str: string): boolean {
  if (typeof str !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(str)) return false;

  const [yearStr, monthStr, dayStr] = str.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // Month must be 1-12
  if (month < 1 || month > 12) return false;
  // Day must be at least 1
  if (day < 1) return false;

  // Check the date is real by constructing it and comparing components
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Get today's date in YYYY-MM-DD format (local timezone).
 */
export function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Read the streak dates array from localStorage.
 * Returns empty array if key doesn't exist or localStorage is unavailable.
 * Filters out invalid date entries.
 */
export function readStreakDates(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter to only valid date strings and deduplicate
    const seen = new Set<string>();
    const valid: string[] = [];
    for (const entry of parsed) {
      if (
        typeof entry === "string" &&
        isValidDateStr(entry) &&
        !seen.has(entry)
      ) {
        seen.add(entry);
        valid.push(entry);
      }
    }

    // Return sorted in chronological order (oldest first)
    valid.sort();
    return valid;
  } catch {
    return [];
  }
}

/**
 * Record a date string to the streak dates array in localStorage.
 * Maintains sorted order, uniqueness, and max 365 entries.
 * No-op if localStorage is unavailable or dateStr is invalid.
 */
export function recordStreakDate(dateStr: string): void {
  if (!isValidDateStr(dateStr)) return;

  try {
    const dates = readStreakDates();

    // If already present, no-op (idempotent)
    if (dates.includes(dateStr)) return;

    // Insert in sorted position
    const insertIdx = dates.findIndex((d) => d > dateStr);
    if (insertIdx === -1) {
      dates.push(dateStr);
    } else {
      dates.splice(insertIdx, 0, dateStr);
    }

    // Enforce max 365 entries by removing oldest
    while (dates.length > MAX_ENTRIES) {
      dates.shift();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
  } catch {
    // No-op on localStorage error
  }
}
