import { createSupabaseClient } from "./client";
import { SLUG_TO_SUBJECT } from "../progress-map";
import { readStreakDates } from "../streak-record";

/**
 * Merge localStorage progress into the signed-in user's Supabase account.
 * - Reads all mbu-perfect-* keys and upserts into user_progress
 * - Reads mbu-streak-dates and merges into user_streak_dates
 * - Does NOT overwrite higher scores already in Supabase
 * - Optionally clears localStorage progress keys after successful sync
 *
 * Should be called once after sign-in (e.g., from the auth modal callback).
 */
export async function syncLocalProgressToSupabase(options?: {
  clearLocalAfterSync?: boolean;
}): Promise<{ synced: number; errors: number }> {
  try {
    const supabase = createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { synced: 0, errors: 0 };
    }

    let synced = 0;
    let errors = 0;

    // --- Sync lesson progress from mbu-perfect-* keys ---
    const localSlugs = readLocalProgressSlugs();
    for (const slug of localSlugs) {
      try {
        const sectionSlug = SLUG_TO_SUBJECT.get(slug);
        if (!sectionSlug) continue; // Unknown slug, skip

        // Check if a row already exists with a higher score
        const { data: existing } = await supabase
          .from("user_progress")
          .select("score")
          .eq("user_id", user.id)
          .eq("lesson_slug", slug)
          .single();

        // Only upsert if no existing row or existing score is lower
        if (existing && existing.score >= 100) {
          // Already has a perfect score, no need to overwrite
          synced++;
          continue;
        }

        const { error } = await supabase.from("user_progress").upsert(
          {
            user_id: user.id,
            lesson_slug: slug,
            section_slug: sectionSlug,
            completed: true,
            score: 100,
            is_perfect: true,
          },
          { onConflict: "user_id,lesson_slug" },
        );

        if (error) {
          console.error(`Failed to sync progress for ${slug}:`, error);
          errors++;
        } else {
          synced++;
        }
      } catch (err) {
        console.error(`Failed to sync progress for ${slug}:`, err);
        errors++;
      }
    }

    // --- Sync streak dates ---
    const streakDates = readStreakDates();
    for (const dateStr of streakDates) {
      try {
        const { error } = await supabase.from("user_streak_dates").upsert(
          {
            user_id: user.id,
            streak_date: dateStr,
          },
          { onConflict: "user_id,streak_date" },
        );

        if (error) {
          console.error(`Failed to sync streak date ${dateStr}:`, error);
          errors++;
        } else {
          synced++;
        }
      } catch (err) {
        console.error(`Failed to sync streak date ${dateStr}:`, err);
        errors++;
      }
    }

    // --- Optionally clear localStorage after successful sync ---
    if (options?.clearLocalAfterSync && errors === 0) {
      clearLocalProgressKeys();
    }

    return { synced, errors };
  } catch (err) {
    console.error("syncLocalProgressToSupabase failed:", err);
    return { synced: 0, errors: 1 };
  }
}

/**
 * Read all localStorage keys matching `mbu-perfect-*` and return the slug portions.
 * Returns empty array if localStorage is unavailable.
 */
function readLocalProgressSlugs(): string[] {
  try {
    const slugs: string[] = [];
    const prefix = "mbu-perfect-";
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        slugs.push(key.slice(prefix.length));
      }
    }
    return slugs;
  } catch {
    return [];
  }
}

/**
 * Clear all mbu-perfect-* keys and mbu-streak-dates from localStorage.
 */
function clearLocalProgressKeys(): void {
  try {
    const keysToRemove: string[] = [];
    const prefix = "mbu-perfect-";
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    localStorage.removeItem("mbu-streak-dates");
  } catch {
    // Silently ignore localStorage errors
  }
}
