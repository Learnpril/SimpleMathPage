# Implementation Plan: Math Website

## Overview

Build a static math learning website using Astro + Starlight with Obsidian content sync, KaTeX math rendering, and interactive quiz components. Implementation proceeds from project scaffolding through theming, quiz logic, content structure, and deployment config, with property-based and unit tests validating quiz correctness throughout.

## Tasks

- [x] 1. Scaffold Astro + Starlight project with plugins
  - [x] 1.1 Initialize Astro project with Starlight starter and install dependencies
    - Create `package.json` with dependencies: `astro`, `@astrojs/starlight`, `starlight-obsidian`, `starlight-katex`
    - Add dev dependencies: `vitest`, `fast-check`, `@testing-library/dom`, `jsdom`
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 Create `astro.config.mjs` with Starlight, starlight-obsidian, and starlight-katex configured
    - Configure Starlight title as "Math Made Clear"
    - Register starlight-obsidian plugin pointing to `./obsidian-vault`
    - Register starlight-katex plugin
    - Reference custom CSS at `./src/styles/custom.css`
    - _Requirements: 1.3, 1.5, 2.5_
  - [x] 1.3 Create Vitest configuration (`vitest.config.ts`)
    - Configure jsdom environment for DOM tests
    - Set up test file patterns
    - _Requirements: 1.2_

- [x] 2. Implement custom theme CSS
  - [x] 2.1 Create `src/styles/custom.css` with Starlight CSS custom property overrides
    - Set cool gray palette for light mode (`--sl-color-bg: #f8f9fa`, `--sl-color-bg-sidebar: #f1f3f5`)
    - Set dark mode overrides (`:root[data-theme="dark"]` with `--sl-color-bg: #121212`, `--sl-color-bg-sidebar: #1e1e1e`)
    - Set accent color (`--sl-color-accent: #0d6efd`)
    - Set Inter as default font (`--sl-font: "Inter", sans-serif`)
    - Add quiz-specific CSS tokens (`--quiz-correct`, `--quiz-incorrect`, `--quiz-highlight`, `--quiz-special`)
    - Style quiz component elements (fieldset, options, feedback, buttons)
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6_

- [x] 3. Implement quiz data validation
  - [x] 3.1 Create `src/lib/quiz-validation.ts` with validation functions
    - Implement `validateQuizData(data: QuizData): ValidationResult` that checks:
      - Quiz has 3–8 questions
      - Each question has exactly 4 options
      - Each question's `correctIndex` is in [0, 3]
      - All required fields (`id`, `text`, `options`, `correctIndex`, `explanation`) are present and non-empty
    - Return structured error messages for each validation failure
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ]\* 3.2 Write property test: Quiz data validation (Property 1)
    - **Property 1: Quiz data validation**
    - Generate random quiz data with valid and invalid shapes using fast-check
    - Verify validation accepts valid data and rejects invalid data
    - **Validates: Requirements 5.1, 5.2, 5.3**
  - [ ]\* 3.3 Write unit tests for quiz data validation edge cases
    - Test quiz with 0 questions rejected, quiz with 9 questions rejected
    - Test `correctIndex: -1` rejected, `correctIndex: 4` rejected
    - Test question with 3 options rejected
    - Test question with empty `text` field
    - Test quiz with exactly 3 and exactly 8 questions accepted
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 4. Implement quiz state manager
  - [x] 4.1 Create `src/lib/quiz-state.ts` with localStorage read/write utilities
    - Implement `getStorageKey(quizId: string): string` returning `"quiz-state:{quizId}"`
    - Implement `loadQuizState(quizId: string): QuizState | null` with JSON parse and shape validation
    - Implement `saveQuizState(quizId: string, state: QuizState): void` with error handling for quota/unavailability
    - Implement `clearQuizState(quizId: string): void`
    - Gracefully handle localStorage unavailability (private browsing) by falling back silently
    - Log console warnings on storage errors
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]\* 4.2 Write property test: Quiz state round-trip (Property 4)
    - **Property 4: Quiz state round-trip through localStorage**
    - Generate random QuizState objects, save then load, verify equivalence
    - **Validates: Requirements 6.1, 6.2**
  - [ ]\* 4.3 Write property test: Retry clears all state (Property 5)
    - **Property 5: Retry clears all state**
    - Save state for random quizIds, clear one, verify load returns null and others unaffected
    - **Validates: Requirements 5.7, 6.3**
  - [ ]\* 4.4 Write unit tests for quiz state manager
    - Test `loadQuizState` returns null for non-existent quizId
    - Test `clearQuizState` on non-existent quizId does not throw
    - Test localStorage unavailable (mock throws) falls back gracefully
    - Test malformed stored JSON is discarded
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement quiz scoring logic
  - [x] 6.1 Create `src/lib/quiz-scoring.ts` with score computation
    - Implement `computeScore(questions: QuizQuestion[], answers: Record<string, number>): { score: number; total: number }`
    - Score equals count of questions where `answers[question.id] === question.correctIndex`
    - Total equals number of questions
    - _Requirements: 5.6, 13.2_
  - [x] 6.2 Create `src/lib/quiz-feedback.ts` with answer feedback logic
    - Implement `getAnswerFeedback(question: QuizQuestion, selectedIndex: number): { correct: boolean; explanation: string }`
    - Return `correct: true` if `selectedIndex === question.correctIndex`, else `correct: false`
    - Always include the question's explanation text
    - _Requirements: 5.4, 5.5_
  - [ ]\* 6.3 Write property test: Score computation (Property 3)
    - **Property 3: Score computation**
    - Generate random quizzes and answer sets, verify score equals count of matching indices
    - **Validates: Requirements 5.6, 13.2**
  - [ ]\* 6.4 Write property test: Answer feedback correctness (Property 2)
    - **Property 2: Answer feedback correctness**
    - For random questions and selected indices, verify feedback matches correctIndex comparison
    - **Validates: Requirements 5.4, 5.5**

- [x] 7. Implement Quiz Astro component
  - [x] 7.1 Create shared TypeScript types in `src/lib/quiz-types.ts`
    - Define `QuizQuestion`, `QuizData`, `QuizState`, `ValidationResult` interfaces
    - Export all types for use across quiz modules
    - _Requirements: 13.1, 13.2_
  - [x] 7.2 Create `src/components/Quiz.astro` island component
    - Accept `quizId` and `questions` props
    - Validate quiz data on render; show error message if invalid
    - Render each question as a `<fieldset>` with `<legend>` for question text
    - Render 4 options per question as `<label>` elements with radio-button-style interaction
    - Use `client:load` directive for hydration
    - Wire vanilla JS event handlers for option selection, feedback display, score summary, and retry
    - On answer selection: show correct/incorrect feedback with explanation in an `aria-live` region
    - On quiz completion: display score summary
    - On retry: call `clearQuizState` and reset UI
    - Load saved state on mount via `loadQuizState`; save state on each interaction via `saveQuizState`
    - Include ARIA labels on all interactive elements, visible focus indicators, keyboard navigation (Tab, Enter, Space, arrow keys)
    - _Requirements: 5.1–5.9, 6.1–6.4, 7.1–7.5, 12.5, 13.1_
  - [ ]\* 7.3 Write property test: Quiz accessible markup (Property 6)
    - **Property 6: Quiz renders with accessible markup**
    - For random valid quiz data, verify rendered HTML contains fieldset, legend, label, ARIA attributes, and aria-live region
    - **Validates: Requirements 7.2, 7.4**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Create homepage and content structure
  - [x] 9.1 Create `src/content/docs/index.mdx` homepage
    - Add hero section with tagline "Math Made Clear for Adults – Start Fresh, No Judgment"
    - Add grid of subject area cards linking to: Arithmetic, Algebra Basics, Linear Algebra, Graphics Math, AI Art Math, Esoteric Patterns
    - Set supportive, non-intimidating introductory copy
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 9.2 Create Obsidian vault directory structure and sample lesson
    - Create `obsidian-vault/` with subdirectories: `Arithmetic/`, `Algebra Basics/`, `Linear Algebra/`, `Graphics Math/`, `AI Art Math/`, `Esoteric Patterns/`
    - Create a sample lesson `obsidian-vault/Arithmetic/adding-fractions.md` following the lesson structure convention:
      - "What You'll Learn" section
      - "The Concept" section with inline and display KaTeX math
      - "Worked Example" section
      - "Real-World Application" section
      - Encouraging note using `:::note[You've Got This]`
      - Quiz section importing and using the Quiz component with 3+ sample questions
    - Include YAML frontmatter with `title`, `description`, `sidebar.order`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1–3.6, 4.1, 4.2, 9.1, 9.2_

- [x] 10. Create Netlify configuration
  - [x] 10.1 Create `netlify.toml` with build settings
    - Set build command to `npm run build`
    - Set publish directory to `dist`
    - Set `NODE_VERSION = "20"` in build environment
    - _Requirements: 11.1, 11.2_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check with generators defined in the design document
- Checkpoints ensure incremental validation
- The Quiz component is the only hydrated island; everything else is static HTML
