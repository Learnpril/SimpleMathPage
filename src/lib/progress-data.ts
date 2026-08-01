import type { OverallProgress } from "./progress-calc";
import {
  computeProgress,
  readPassedSlugsFromLocalStorage,
} from "./progress-calc";
import { SUBJECTS, TOTAL_LESSONS } from "./progress-map";
import { readStreakDates } from "./streak-record";
import { readStreakDatesFromSupabase } from "./supabase/streak";
import { createSupabaseClient } from "./supabase/client";

export interface ProgressDataResult {
  progress: OverallProgress;
  streakDates: string[];
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * Fetch progress data from the appropriate source based on auth state.
 * - If signed in: reads from Supabase user_progress + user_streak_dates
 * - If guest: reads from localStorage
 * - Falls back to localStorage if Supabase call fails
 */
export async function fetchProgressData(): Promise<ProgressDataResult> {
  // Try to check auth state
  let isAuthenticated = false;
  try {
    const supabase = createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      isAuthenticated = true;

      // Signed in: fetch from Supabase
      try {
        // Fetch passed slugs from user_progress where is_perfect = true
        const { data: progressRows, error: progressError } = await supabase
          .from("user_progress")
          .select("lesson_slug")
          .eq("user_id", user.id)
          .eq("is_perfect", true);

        if (progressError) {
          throw progressError;
        }

        const passedSlugs = new Set<string>(
          (progressRows ?? []).map((row) => row.lesson_slug as string),
        );

        // Also merge localStorage progress (covers cases where Supabase write failed)
        const localSlugs = readPassedSlugsFromLocalStorage();
        for (const slug of localSlugs) {
          passedSlugs.add(slug);
        }

        // Fetch streak dates from Supabase
        const streakDates = await readStreakDatesFromSupabase();

        // Compute progress
        const progress = computeProgress(passedSlugs, SUBJECTS, TOTAL_LESSONS);

        return {
          progress,
          streakDates,
          isAuthenticated: true,
          error: null,
        };
      } catch {
        // Supabase fetch failed - fall back to localStorage but keep auth state
        const passedSlugs = readPassedSlugsFromLocalStorage();
        const streakDates = readStreakDates();
        const progress = computeProgress(passedSlugs, SUBJECTS, TOTAL_LESSONS);

        return {
          progress,
          streakDates,
          isAuthenticated: true,
          error: "Showing local progress only.",
        };
      }
    }
  } catch {
    // Supabase client creation or auth check failed - treat as guest
    // Fall through to guest flow below
  }

  // Guest flow: read from localStorage
  const passedSlugs = readPassedSlugsFromLocalStorage();
  const streakDates = readStreakDates();
  const progress = computeProgress(passedSlugs, SUBJECTS, TOTAL_LESSONS);

  return {
    progress,
    streakDates,
    isAuthenticated: false,
    error: null,
  };
}
