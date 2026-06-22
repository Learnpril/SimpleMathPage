import { createSupabaseClient } from "./client";

/**
 * Read streak dates for the current user from Supabase.
 * Returns sorted array of YYYY-MM-DD date strings (oldest first).
 * Returns empty array on error or if user is not authenticated.
 */
export async function readStreakDatesFromSupabase(): Promise<string[]> {
  try {
    const supabase = createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("user_streak_dates")
      .select("streak_date")
      .eq("user_id", user.id)
      .order("streak_date", { ascending: true });

    if (error) {
      console.error("Failed to read streak dates:", error);
      return [];
    }

    // Map rows to YYYY-MM-DD strings
    return (data ?? []).map((row) => row.streak_date as string);
  } catch (err) {
    console.error("Failed to read streak dates:", err);
    return [];
  }
}

/**
 * Record a streak date to Supabase for the current user.
 * Upserts to avoid duplicates (relies on unique constraint on user_id + streak_date).
 * Returns true on success, false on error or if user is not authenticated.
 */
export async function recordStreakDateToSupabase(
  dateStr: string,
): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { error } = await supabase.from("user_streak_dates").upsert(
      {
        user_id: user.id,
        streak_date: dateStr,
      },
      { onConflict: "user_id,streak_date" },
    );

    if (error) {
      console.error("Failed to record streak date:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Failed to record streak date:", err);
    return false;
  }
}
