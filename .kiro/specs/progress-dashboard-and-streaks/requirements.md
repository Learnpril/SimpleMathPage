# Requirements Document

## Introduction

Phase 2 of Mom's Basement University adds a dedicated Progress Dashboard page and a streak tracking system. The Progress Dashboard gives learners a single view of their completion status across all 12 subjects (268 total pages), with visual progress bars and aggregate stats. Streak tracking motivates daily practice by counting consecutive days where the learner completes at least one quiz. Both features build on the existing localStorage-based progress system (Phase 1) which stores `mbu-perfect-{slug}` keys for passed quizzes and `mbu-last-lesson` for resume navigation.

## Glossary

- **Dashboard_Page**: A dedicated Astro page at `/progress/` that displays the learner's completion data across all subjects
- **Subject_Card**: A card element on the Dashboard_Page representing one of the 12 math subjects, showing title, lesson count, and a completion progress bar
- **Progress_Bar**: A horizontal bar that fills proportionally to the number of passed quizzes within a subject, color-coded by completion percentage
- **Streak_Counter**: A numeric display showing the learner's current consecutive-day practice streak
- **Streak_Record**: The data stored in localStorage representing daily quiz completion timestamps used to calculate the current streak
- **Quiz_Day**: A calendar day (midnight to midnight in the learner's local timezone) during which at least one quiz was passed
- **Total_Stats**: Aggregate numbers displayed on the Dashboard_Page including total quizzes passed, total quizzes available, overall completion percentage, and current streak
- **Reader**: An adult learner who visits the website to study math content
- **Site**: The Astro + Starlight math website application
- **Quiz_Component**: The existing reusable Astro component that renders and manages quiz interactions, saving `mbu-perfect-{slug}` to localStorage on pass

## Requirements

### Requirement 1: Progress Dashboard Page Layout

**User Story:** As a Reader, I want a dedicated progress page that shows all my completion data in one place, so that I can see how far I have come across all subjects.

#### Acceptance Criteria

1. THE Site SHALL serve the Dashboard_Page at the `/progress/` URL path
2. THE Dashboard_Page SHALL display a page title of "Your Progress"
3. THE Dashboard_Page SHALL display Total_Stats above the Subject_Cards grid, including total quizzes passed, total quizzes available, overall completion percentage displayed as a rounded integer followed by a percent sign, and current streak value
4. THE Dashboard_Page SHALL display 12 Subject_Cards arranged in a responsive grid, one for each subject
5. THE Dashboard_Page SHALL order Subject_Cards in curriculum sequence: Arithmetic, Pre-Algebra, Algebra Basics, Geometry, Algebra 2, Trigonometry, Pre-Calculus, Calculus 1, Calculus 2, Calculus 3, Linear Algebra, Differential Equations
6. WHEN no localStorage keys matching the pattern `mbu-perfect-*` exist and no `mbu-streak-dates` key exists, THE Dashboard_Page SHALL display all Progress_Bars at zero percent, Total_Stats showing 0 quizzes passed, 0% overall completion, and a streak of 0
7. IF localStorage is unavailable or throws an error on read, THEN THE Dashboard_Page SHALL display all values at zero and show a message indicating that progress data could not be loaded

### Requirement 2: Subject Card Display

**User Story:** As a Reader, I want each subject card on the dashboard to show me the subject name, how many lessons I have passed, and a visual progress bar, so that I can quickly gauge my progress in each area.

#### Acceptance Criteria

1. THE Subject_Card SHALL display the subject name as a heading
2. THE Subject_Card SHALL display the count of passed quizzes and the total quiz count for that subject in the format "{passed} / {total} lessons", where "passed" is the number of quizzes the Reader has scored at or above the passing threshold and "total" is the number of quizzes available in that subject
3. THE Subject_Card SHALL display a Progress_Bar whose filled width represents the completion percentage calculated as (passed quizzes / total quizzes) x 100, rounded to the nearest whole number
4. THE Subject_Card SHALL link to the subject's "about" page so the Reader can navigate to that subject
5. WHEN all quizzes in a subject are passed, THE Subject_Card SHALL display a visible completion indicator that is distinct from the partially-filled Progress_Bar state
6. IF the Reader has not passed any quizzes in a subject, THEN THE Subject_Card SHALL display "0 / {total} lessons" and the Progress_Bar SHALL have zero filled width

### Requirement 3: Progress Bar Color Coding

**User Story:** As a Reader, I want progress bars to change color based on how much I have completed, so that I can visually distinguish between subjects I have barely started and ones I am close to finishing.

#### Acceptance Criteria

1. WHILE the completion percentage is greater than 0% and less than 50%, THE Progress_Bar SHALL render its filled portion with the orange color (#f0883e)
2. WHILE the completion percentage is at least 50% and less than 100%, THE Progress_Bar SHALL render its filled portion with the blue color (#58a6ff)
3. WHILE the completion percentage is exactly 100%, THE Progress_Bar SHALL render its filled portion with the green color (#7ee787)
4. WHILE the completion percentage is exactly 0%, THE Progress_Bar SHALL render with no visible fill and display only the background track
5. THE Progress_Bar background track SHALL maintain a minimum contrast ratio of 3:1 against the page background in both light and dark mode
6. THE Progress_Bar SHALL determine its color based on the ratio of passed quizzes to total quizzes in the subject, where the percentage equals (passed / total) x 100 compared as a real number (not rounded) against the threshold values

### Requirement 4: Progress Data Calculation

**User Story:** As a Reader, I want the dashboard to accurately count my passed quizzes from localStorage, so that the progress displayed reflects my actual achievements.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL calculate completion for each subject by counting localStorage keys matching the pattern `mbu-perfect-{slug}` where the slug belongs to that subject, excluding keys whose slug does not appear in the known mapping
2. THE Dashboard_Page SHALL use a static mapping of lesson slugs to subjects, containing all 268 lesson slugs distributed across the 12 subjects (Arithmetic, Pre-Algebra, Algebra Basics, Geometry, Algebra 2, Trigonometry, Pre-Calculus, Calculus 1, Calculus 2, Calculus 3, Linear Algebra, Differential Equations), so that progress calculation does not depend on DOM elements such as sidebar navigation links
3. THE Dashboard_Page SHALL calculate overall completion percentage as the total passed quizzes divided by the total available quizzes (268) multiplied by 100, rounded down to the nearest integer, yielding a value between 0 and 100 inclusive
4. WHEN a Reader passes a quiz on a lesson page and then navigates to the Dashboard_Page, THE Dashboard_Page SHALL reflect the updated completion count by reading localStorage at page load time without requiring a full page reload beyond navigation
5. IF a localStorage key matching `mbu-perfect-{slug}` exists but the slug does not appear in the known mapping, THEN THE Dashboard_Page SHALL ignore that key and not include it in any subject or overall completion count

### Requirement 5: Streak Recording

**User Story:** As a Reader, I want the site to automatically record when I complete a quiz each day, so that my daily practice streak is tracked without extra effort.

#### Acceptance Criteria

1. WHEN a Reader passes a quiz, THE Quiz_Component SHALL record the current date (YYYY-MM-DD in local timezone) to the Streak_Record in localStorage
2. THE Streak_Record SHALL be stored as a JSON-serialized array of unique date strings in chronological order (oldest first), where each entry is a date on which at least one quiz was passed
3. THE Streak_Record SHALL be stored under the localStorage key `mbu-streak-dates`
4. WHEN a Reader passes multiple quizzes on the same day, THE Quiz_Component SHALL store that date only once in the Streak_Record
5. THE Streak_Record SHALL retain a maximum of 365 date entries; WHEN a new date would exceed this limit, THE Quiz_Component SHALL remove the oldest entry before appending the new date
6. IF localStorage is unavailable or the write operation fails, THEN THE Quiz_Component SHALL continue normal quiz functionality without recording the streak date and without displaying an error to the Reader

### Requirement 6: Streak Calculation

**User Story:** As a Reader, I want my streak to count consecutive days of quiz completion, so that I am motivated to maintain a daily practice habit.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL calculate the current streak as the number of consecutive calendar days (ending today or yesterday) where the Streak_Record contains an entry, with no artificial upper limit on the streak value
2. IF today's date is present in the Streak_Record, THEN THE Dashboard_Page SHALL include today in the streak count and count backwards through consecutive days, displaying a streak of 1 when today is the only entry with no preceding consecutive day
3. IF today's date is not present but yesterday's date is present in the Streak_Record, THEN THE Dashboard_Page SHALL count the streak starting from yesterday and backwards through consecutive days
4. IF neither today nor yesterday is present in the Streak_Record, THEN THE Dashboard_Page SHALL display a streak of 0
5. IF the Streak_Record contains no entries, THEN THE Dashboard_Page SHALL display a streak of 0
6. IF the Streak_Record contains entries that are not valid dates in YYYY-MM-DD format, THEN THE Dashboard_Page SHALL ignore those invalid entries and calculate the streak using only valid date entries

### Requirement 7: Streak Display

**User Story:** As a Reader, I want to see my current streak prominently on the dashboard, so that I feel motivated to keep my streak going.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL display the Streak_Counter within the Total_Stats section
2. THE Streak_Counter SHALL display the numeric streak value followed by the label "day streak" (or "days streak" for values other than 1)
3. WHEN the current streak is 0, THE Streak_Counter SHALL display "0 days streak" followed by a motivational prompt containing the text "Complete a quiz today" to indicate how to start or resume a streak
4. WHEN the current streak is 1 or more, THE Streak_Counter SHALL display a fire emoji (🔥) immediately before the numeric streak value
5. IF the current streak is 1 or more, THEN THE Streak_Counter SHALL render the numeric streak value and fire emoji in orange text color (#f0883e)
6. IF the current streak is 0, THEN THE Streak_Counter SHALL render the numeric streak value in the default body text color of the current theme

### Requirement 8: Dashboard Navigation Access

**User Story:** As a Reader, I want to easily navigate to the progress dashboard from anywhere on the site, so that I can check my stats at any time.

#### Acceptance Criteria

1. THE Site SHALL display a link to the Dashboard_Page (`/progress/`) in the site header or top navigation area
2. THE Dashboard_Page link SHALL be labeled with the text "Progress" and, if an icon is used in place of or alongside the text, SHALL include an `aria-label` or equivalent accessible name of "Progress"
3. THE Dashboard_Page link SHALL be visible on all pages of the site
4. THE Homepage SHALL include a link or call-to-action element that directs the Reader to the Dashboard_Page, placed within the main content area of the page
5. WHEN the Reader is currently on the Dashboard_Page, THE Dashboard_Page link in the navigation SHALL display a visual active-state indicator distinguishing it from inactive navigation links

### Requirement 9: Dashboard Responsive Design

**User Story:** As a Reader, I want the progress dashboard to look good on my phone, tablet, and desktop, so that I can check my progress on any device.

#### Acceptance Criteria

1. THE Dashboard_Page SHALL render the Subject_Card grid as a single column on screen widths below 640px
2. THE Dashboard_Page SHALL render the Subject_Card grid as two columns on screen widths from 640px up to 1024px
3. THE Dashboard_Page SHALL render the Subject_Card grid as three columns on screen widths above 1024px
4. THE Total_Stats section SHALL stack vertically on screen widths below 640px
5. THE Dashboard_Page SHALL maintain readable text sizes (minimum 14px body text) and adequate touch targets (minimum 44px) on all supported screen widths

### Requirement 10: Dashboard Dark Mode Support

**User Story:** As a Reader who uses dark mode, I want the progress dashboard to respect my theme preference, so that the page is comfortable to read in low-light conditions.

#### Acceptance Criteria

1. WHEN the site-wide theme toggle is set to dark mode, THE Dashboard_Page SHALL render all components using the dark theme color variables defined by the site's dark theme selector, and WHEN set to light mode, SHALL render using the light theme color variables
2. WHILE dark mode is active, THE Subject_Card SHALL use a dark background color consistent with the site's dark theme (#1e1e1e to #2d2d2d range), and all text within the card SHALL maintain a minimum contrast ratio of 4.5:1 against the card background
3. WHILE dark mode is active, THE Progress_Bar background track SHALL use a color that provides a minimum contrast ratio of 3:1 against each of the fill colors (#f0883e, #58a6ff, #7ee787)
4. WHEN the user toggles between light and dark mode, THE Dashboard_Page SHALL apply the theme change without layout shifts

### Requirement 11: Dashboard Accessibility

**User Story:** As a Reader using assistive technology, I want the progress dashboard to be fully accessible, so that I can understand my progress regardless of how I interact with the site.

#### Acceptance Criteria

1. THE Progress_Bar SHALL include an `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` attribute reflecting the current completion count, zero, and total lesson count respectively
2. THE Progress_Bar SHALL include an `aria-label` attribute with the format "{subject name}: {passed count} of {total count} lessons complete ({percentage}%)"
3. THE Subject_Card SHALL use semantic HTML heading elements for subject names
4. THE Total_Stats section SHALL use an ARIA landmark or heading to identify it as a summary region
5. THE Dashboard_Page SHALL allow all interactive elements (links, buttons) to receive keyboard focus via the Tab key, with a visible focus indicator, and focus order SHALL follow the visual layout sequence (Total_Stats first, then Subject_Cards in curriculum order)
6. THE Progress_Bar SHALL convey completion status through both color and a visible text label showing the completion percentage, so that color is not the sole means of communicating progress
