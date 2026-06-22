import type { SubjectInfo } from "./progress-map";
import { SUBJECTS, TOTAL_LESSONS, SLUG_TO_SUBJECT } from "./progress-map";

export interface SubjectProgress {
  subject: SubjectInfo;
  passed: number;
  total: number;
  percentage: number; // (passed/total)*100 as float, for color thresholds
}

export interface OverallProgress {
  totalPassed: number;
  totalAvailable: number; // 268
  overallPercentage: number; // floor((totalPassed/totalLessons)*100)
  subjects: SubjectProgress[];
}

/**
 * Given a set of passed lesson slugs and the subject mapping,
 * compute per-subject and overall progress.
 *
 * Only counts slugs that appear in the subject's lessons array.
 * Overall percentage is Math.floor((totalPassed / totalLessons) * 100).
 */
export function computeProgress(
  passedSlugs: Set<string>,
  subjects: SubjectInfo[],
  totalLessons: number,
): OverallProgress {
  let totalPassed = 0;

  const subjectResults: SubjectProgress[] = subjects.map((subject) => {
    const total = subject.lessons.length;
    let passed = 0;

    for (const lesson of subject.lessons) {
      if (passedSlugs.has(lesson)) {
        passed++;
      }
    }

    totalPassed += passed;

    const percentage = total > 0 ? (passed / total) * 100 : 0;

    return {
      subject,
      passed,
      total,
      percentage,
    };
  });

  const overallPercentage =
    totalLessons > 0 ? Math.floor((totalPassed / totalLessons) * 100) : 0;

  return {
    totalPassed,
    totalAvailable: totalLessons,
    overallPercentage,
    subjects: subjectResults,
  };
}

/**
 * Read all mbu-perfect-* keys from localStorage and return the set of valid slugs.
 * Strips the "mbu-perfect-" prefix, filters against SLUG_TO_SUBJECT map.
 * Returns empty set if localStorage is unavailable or throws an error.
 */
export function readPassedSlugsFromLocalStorage(): Set<string> {
  try {
    const slugs = new Set<string>();
    const prefix = "mbu-perfect-";

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const slug = key.slice(prefix.length);
        if (SLUG_TO_SUBJECT.has(slug)) {
          slugs.add(slug);
        }
      }
    }

    return slugs;
  } catch {
    return new Set<string>();
  }
}

/**
 * Determine the progress bar color based on exact percentage.
 * 0% → null (no fill)
 * (0, 50) → "#f0883e" (orange)
 * [50, 100) → "#58a6ff" (blue)
 * 100% → "#7ee787" (green)
 */
export function getProgressColor(percentage: number): string | null {
  if (percentage === 0) {
    return null;
  }
  if (percentage > 0 && percentage < 50) {
    return "#f0883e";
  }
  if (percentage >= 50 && percentage < 100) {
    return "#58a6ff";
  }
  if (percentage === 100) {
    return "#7ee787";
  }
  return null;
}
