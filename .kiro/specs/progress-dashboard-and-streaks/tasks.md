# Implementation Plan: Progress Dashboard and Streaks

## Overview

This plan implements a dedicated `/progress/` page with subject progress cards, color-coded progress bars, and a consecutive-day streak counter. The architecture uses pure TypeScript utility modules for testable logic, a dual-mode data source (localStorage for guests, Supabase for signed-in users), and a client-side rendered Astro page. All tasks use TypeScript.

## Tasks

- [x] 1. Create static slug-to-subject mapping module
  - [x] 1.1 Create `src/lib/progress-map.ts` with the `SubjectInfo` interface, the `SUBJECTS` array (all 12 subjects in curriculum order with their lesson slugs), `TOTAL_LESSONS` constant (268), and `SLUG_TO_SUBJECT` lookup map
    - Enumerate all lesson slugs from `src/content/docs/{subject}/` directories
    - Export `SubjectInfo` interface, `SUBJECTS` array, `TOTAL_LESSONS` number, `SLUG_TO_SUBJECT` Map
    - _Requirements: 4.2, 1.5_

- [x] 2. Implement progress calculation module
  - [x] 2.1 Create `src/lib/progress-calc.ts` with `computeProgress`, `readPassedSlugsFromLocalStorage`, and `getProgressColor` functions
    - `computeProgress` accepts a set of passed slugs, the subjects array, and total lessons count; returns `OverallProgress` with per-subject counts and floored overall percentage
    - `readPassedSlugsFromLocalStorage` reads all `mbu-perfect-*` keys, filters against `SLUG_TO_SUBJECT`, returns the valid slug set; returns empty set on localStorage error
    - `getProgressColor` returns null for 0%, `#f0883e` for (0,50%), `#58a6ff` for [50,100%), `#7ee787` for exactly 100%
    - _Requirements: 4.1, 4.3, 4.5, 3.1, 3.2, 3.3, 3.4, 3.6_

  - [x]\* 2.2 Write property test for progress color mapping
    - **Property 1: Progress bar color mapping**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6**

  - [x]\* 2.3 Write property test for subject completion count correctness
    - **Property 2: Subject completion count correctness**
    - **Validates: Requirements 4.1, 4.5**

  - [x]\* 2.4 Write property test for overall completion percentage
    - **Property 3: Overall completion percentage calculation**
    - **Validates: Requirements 4.3**

- [x] 3. Implement streak recording module
  - [x] 3.1 Create `src/lib/streak-record.ts` with `readStreakDates`, `recordStreakDate`, `getTodayDateStr`, and `isValidDateStr` functions
    - `readStreakDates` reads and parses `mbu-streak-dates` from localStorage, filters invalid entries, returns sorted array; returns empty array on error
    - `recordStreakDate` appends a date to the sorted array maintaining uniqueness, chronological order, and max 365 entries; no-op on localStorage error
    - `getTodayDateStr` returns current date as YYYY-MM-DD in local timezone
    - `isValidDateStr` validates YYYY-MM-DD format and that the date is real
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x]\* 3.2 Write property test for streak record structural invariants
    - **Property 4: Streak record structural invariants**
    - **Validates: Requirements 5.2, 5.4, 5.5**

- [x] 4. Implement streak calculation module
  - [x] 4.1 Create `src/lib/streak-calc.ts` with `calculateStreak` and `formatStreak` functions
    - `calculateStreak` accepts sorted date array and reference today string; returns consecutive day count per the rules (include today if present, else yesterday, else 0)
    - `formatStreak` returns `{value, label, hasStreak}` with correct pluralization ("day streak" for 1, "days streak" otherwise)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.2, 7.3_

  - [x]\* 4.2 Write property test for streak calculation correctness
    - **Property 5: Streak calculation correctness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

  - [x]\* 4.3 Write property test for streak display pluralization
    - **Property 7: Streak display pluralization**
    - **Validates: Requirements 7.2, 7.3**

- [x] 5. Checkpoint - Core logic modules
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement dual-mode data source module
  - [x] 6.1 Create `src/lib/progress-data.ts` with `fetchProgressData` function
    - Check auth state via Supabase client
    - If signed in: fetch from `user_progress` and `user_streak_dates` tables, compute progress
    - If guest: read from localStorage using `readPassedSlugsFromLocalStorage` and `readStreakDates`
    - On Supabase error: fall back to localStorage and set error message
    - Return `ProgressDataResult` with progress, streakDates, isAuthenticated flag, and error
    - _Requirements: 4.4, 1.7_

  - [x]\* 6.2 Write unit tests for dual-mode data source
    - Test guest mode returns localStorage data
    - Test authenticated mode returns Supabase data
    - Test Supabase failure falls back to localStorage
    - _Requirements: 4.4, 1.7_

- [x] 7. Implement Supabase streak module
  - [x] 7.1 Create `src/lib/supabase/streak.ts` with `readStreakDatesFromSupabase` and `recordStreakDateToSupabase` functions
    - `readStreakDatesFromSupabase` queries `user_streak_dates` table for current user, returns sorted YYYY-MM-DD array
    - `recordStreakDateToSupabase` upserts a streak date row for current user
    - _Requirements: 5.1 (signed-in path)_

- [x] 8. Implement sync-on-login module
  - [x] 8.1 Create `src/lib/supabase/sync.ts` with `syncLocalProgressToSupabase` function
    - Read all `mbu-perfect-*` keys and `mbu-streak-dates` from localStorage
    - Upsert lesson progress into `user_progress` (do not overwrite higher scores)
    - Merge streak dates into `user_streak_dates` (union, no duplicates)
    - Optionally clear localStorage progress keys after successful sync
    - Return `{synced, errors}` counts
    - _Requirements: Sync-on-login design requirement_

  - [x]\* 8.2 Write unit tests for sync merge logic
    - Test no-overwrite of higher Supabase scores
    - Test union of streak dates without duplicates
    - Test partial failure does not clear localStorage
    - **Property 9: Sync merge correctness**
    - **Validates: Sync-on-login requirement**

- [x] 9. Checkpoint - Data layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Create the Progress Dashboard page and component
  - [x] 10.1 Create `src/pages/progress.astro` page route
    - Import a layout that includes the site header/footer (Starlight base layout or custom)
    - Set page title to "Your Progress"
    - Render static skeleton HTML: title, stats section, 12 subject cards in curriculum order, error message (hidden), sign-in prompt (hidden)
    - Include `<script>` block that imports `fetchProgressData` and hydrates the DOM
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 10.2 Implement the client-side hydration script in the progress page
    - Call `fetchProgressData()` on load
    - Populate Total_Stats: total passed, total available, overall percentage, streak
    - Populate each Subject_Card: passed count, total count, progress bar width, color, percentage label
    - Show completion indicator (e.g., checkmark/star) for 100% subjects
    - Show sign-in prompt for guests, hide for authenticated users
    - Show error message if data could not be loaded
    - Apply streak display: fire emoji + orange text for streak ≥ 1, motivational prompt for streak = 0
    - _Requirements: 1.3, 1.6, 1.7, 2.2, 2.3, 2.5, 2.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 10.3 Add responsive CSS styles for the dashboard
    - Single column below 640px, two columns 640px–1024px, three columns above 1024px
    - Stack Total_Stats vertically below 640px
    - Minimum 14px body text, 44px touch targets
    - Progress bar styling with background track, fill colors, and percentage label
    - Dark mode support using site's CSS custom properties
    - Subject card dark background (#1e1e1e to #2d2d2d range) with 4.5:1 text contrast
    - Progress bar track with 3:1 contrast against fill colors
    - No layout shift on theme toggle
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4_

  - [x] 10.4 Implement accessibility attributes on the dashboard
    - Progress bars: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax`, `aria-label` with format "{subject}: {passed} of {total} lessons complete ({pct}%)"
    - Subject names as semantic heading elements
    - Total_Stats section with ARIA landmark or heading
    - All interactive elements keyboard-focusable with visible focus indicators
    - Focus order follows visual layout (stats first, then cards in curriculum order)
    - Visible percentage text label on each progress bar
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 10.5 Add Subject_Card link to each subject's about page
    - Each card links to the subject's `aboutPath` from the mapping
    - _Requirements: 2.4_

- [x] 11. Integrate streak recording into Quiz.astro
  - [x] 11.1 Modify `src/components/Quiz.astro` to call `recordStreakDate(getTodayDateStr())` when a quiz is passed
    - Import `recordStreakDate` and `getTodayDateStr` from `src/lib/streak-record.ts`
    - Call in the existing `showScore()` function after a passing score
    - If signed in, also call `recordStreakDateToSupabase(getTodayDateStr())` (fire-and-forget)
    - _Requirements: 5.1, 5.6_

- [x] 12. Add dashboard navigation link
  - [x] 12.1 Add a "Progress" link to the site header/navigation that is visible on all pages
    - Link to `/progress/` with text "Progress"
    - Include `aria-label="Progress"` if using an icon
    - Show active state when on the dashboard page
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 12.2 Add a link or call-to-action to the Dashboard_Page on the homepage main content area
    - _Requirements: 8.4_

- [x] 13. Integrate sync-on-login into auth flow
  - [x] 13.1 Call `syncLocalProgressToSupabase()` after successful sign-in in the auth modal callback
    - Fire-and-forget, non-blocking
    - _Requirements: Sync-on-login design requirement_

- [x] 14. Checkpoint - Full integration
  - Ensure all tests pass, ask the user if questions arise.

- [x]\* 15. Write integration tests
  - [x]\* 15.1 Write integration test: quiz pass records streak date and dashboard shows streak of 1
    - **Property 6: Subject card rendering invariants** (validate rendered attributes)
    - **Validates: Requirements 5.1, 7.1, 7.2, 7.4, 11.1, 11.2, 11.6**

  - [x]\* 15.2 Write integration test: navigation link present in header on all pages
    - **Validates: Requirements 8.1, 8.3**

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The static slug mapping (task 1.1) must be populated by enumerating the actual content files in `src/content/docs/`
- All Supabase interactions are wrapped in try/catch with localStorage fallback
- The design supports dual-mode (guest/authenticated) but the core dashboard works with localStorage alone

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "4.2", "4.3", "7.1"] },
    { "id": 3, "tasks": ["6.1", "8.1"] },
    { "id": 4, "tasks": ["6.2", "8.2"] },
    { "id": 5, "tasks": ["10.1"] },
    { "id": 6, "tasks": ["10.2", "10.3", "10.4", "10.5"] },
    { "id": 7, "tasks": ["11.1", "12.1", "12.2", "13.1"] },
    { "id": 8, "tasks": ["15.1", "15.2"] }
  ]
}
```
