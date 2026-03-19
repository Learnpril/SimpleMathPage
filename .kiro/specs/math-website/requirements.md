# Requirements Document

## Introduction

A self-paced math learning website for adults re-learning math from the basics. Built with Astro and the Starlight documentation theme, content is authored in Obsidian (Markdown/MDX) using the starlight-obsidian plugin for seamless publishing. Each lesson is a single page with explanatory text, worked examples, KaTeX-rendered equations, real-world applications, encouraging notes, and a multiple-choice quiz for self-assessment. The site deploys to Netlify as a static build. Version 1 requires no accounts or backend, but components are designed to support future progress tracking.

## Glossary

- **Site**: The Astro + Starlight math website application
- **Content_Author**: A person who writes and manages math content using Obsidian
- **Reader**: An adult learner who visits the website to study math content
- **Content_Page**: A Markdown or MDX file representing a single math lesson
- **Lesson**: A single Content_Page containing explanatory text, examples, equations, real-world applications, encouraging notes, and a Quiz
- **Quiz**: A multiple-choice self-assessment component rendered at the end of a Lesson, containing 3 to 8 questions
- **Quiz_Question**: A single question within a Quiz, consisting of question text, 4 answer options, and exactly 1 correct answer
- **Quiz_Component**: The reusable Astro island component (MDX/Astro with vanilla JS) that renders and manages Quiz interactions
- **Math_Renderer**: The KaTeX-based component (via starlight-katex plugin) responsible for rendering LaTeX mathematical notation into visual formulas
- **Navigation_Sidebar**: The Starlight-provided sidebar that organizes content into sections auto-grouped by Obsidian folder structure
- **Search_Engine**: The built-in Starlight search functionality for finding content
- **Build_Pipeline**: The Astro build process that compiles the site for deployment
- **Deployment_Target**: The Netlify hosting platform where the site is published
- **Homepage**: The landing page with a hero section, welcoming message, and subject links
- **Theme_Toggle**: The Starlight built-in light/dark mode switcher

## Requirements

### Requirement 1: Project Scaffolding and Tech Stack

**User Story:** As a Content_Author, I want the project initialized with Astro, Starlight, starlight-obsidian, and starlight-katex, so that I have a working foundation with Obsidian sync and math rendering out of the box.

#### Acceptance Criteria

1. THE Site SHALL be initialized as an Astro project using the Starlight starter template
2. THE Site SHALL include a `package.json` with dependencies for Astro, Starlight, starlight-obsidian, and starlight-katex
3. THE Site SHALL include an `astro.config.mjs` file with Starlight integration configured, including starlight-obsidian and starlight-katex plugins
4. WHEN the `npm run dev` command is executed, THE Site SHALL start a local development server and serve the site without errors
5. THE Site SHALL use KaTeX via the starlight-katex plugin as the Math_Renderer implementation

### Requirement 2: Content Authoring with Obsidian Integration

**User Story:** As a Content_Author, I want to write math lessons in Obsidian using Markdown/MDX and have them publish seamlessly via starlight-obsidian, so that I can use a familiar editor with live preview.

#### Acceptance Criteria

1. THE Site SHALL store all Content_Pages as Markdown (`.md`) or MDX (`.mdx`) files inside the content directory managed by starlight-obsidian
2. THE Site SHALL support standard Markdown syntax including headings, lists, links, images, code blocks, and tables
3. THE Site SHALL support YAML frontmatter for metadata including `title`, `description`, and `sidebar` properties
4. WHEN a Content_Author opens the content directory in Obsidian, THE Content_Page files SHALL be readable and editable as a standard Obsidian vault
5. THE Site SHALL use the starlight-obsidian plugin to sync Obsidian vault content to the Starlight site structure

### Requirement 3: Lesson Structure

**User Story:** As a Reader, I want each lesson to follow a consistent structure with explanations, examples, equations, real-world applications, and encouragement, so that I can learn math concepts in a supportive, clear format.

#### Acceptance Criteria

1. THE Lesson SHALL contain explanatory text that introduces and explains the math concept
2. THE Lesson SHALL contain at least one worked example demonstrating the concept
3. THE Lesson SHALL contain KaTeX-rendered equations for all mathematical notation
4. THE Lesson SHALL contain at least one real-world application section showing how the concept applies in practice
5. THE Lesson SHALL contain encouraging notes to support the Reader through difficult material
6. THE Lesson SHALL include a Quiz at the end of the page for self-assessment

### Requirement 4: Mathematical Notation Rendering

**User Story:** As a Reader, I want mathematical formulas displayed correctly using KaTeX, so that I can understand the math content clearly.

#### Acceptance Criteria

1. THE Math_Renderer SHALL render inline LaTeX notation delimited by single dollar signs (`$...$`) into formatted math expressions
2. THE Math_Renderer SHALL render block-level LaTeX notation delimited by double dollar signs (`$$...$$`) into centered, display-style math expressions
3. WHEN a Content_Page contains LaTeX notation, THE Math_Renderer SHALL render the notation on page load without requiring user interaction
4. IF a LaTeX expression contains a syntax error, THEN THE Math_Renderer SHALL display the raw LaTeX source text instead of a blank or broken element

### Requirement 5: Quiz Component

**User Story:** As a Reader, I want a multiple-choice quiz at the end of each lesson with immediate feedback, so that I can test my understanding without needing to log in.

#### Acceptance Criteria

1. THE Quiz_Component SHALL render 3 to 8 Quiz_Questions per Quiz
2. THE Quiz_Question SHALL display question text and exactly 4 answer options as radio buttons or clickable elements
3. THE Quiz_Question SHALL have exactly 1 correct answer among the 4 options
4. WHEN a Reader selects an answer, THE Quiz_Component SHALL immediately display whether the answer is correct or incorrect
5. WHEN a Reader selects an answer, THE Quiz_Component SHALL display a brief explanation for the question
6. WHEN a Reader completes all Quiz_Questions, THE Quiz_Component SHALL display a total score summary
7. THE Quiz_Component SHALL display a "Retry" button that allows the Reader to reset and retake the Quiz
8. THE Quiz_Component SHALL be implemented as a reusable Astro island component using vanilla JavaScript without heavy frontend frameworks
9. THE Quiz_Component SHALL be usable from MDX content files by Content_Authors

### Requirement 6: Quiz State Persistence

**User Story:** As a Reader, I want my quiz scores and progress to persist within my browser session, so that I can retry quizzes and see my previous scores without losing data on page refresh.

#### Acceptance Criteria

1. THE Quiz_Component SHALL store quiz state (selected answers, score, completion status) in the browser using localStorage or sessionStorage
2. WHEN a Reader returns to a previously completed Quiz within the same session, THE Quiz_Component SHALL restore the previous score and completion state
3. WHEN a Reader clicks the "Retry" button, THE Quiz_Component SHALL clear the stored state for that Quiz and reset all questions
4. THE Quiz_Component SHALL function without any backend server or user authentication

### Requirement 7: Quiz Accessibility

**User Story:** As a Reader using assistive technology, I want the quiz to be fully keyboard-navigable and screen-reader friendly, so that I can complete quizzes regardless of how I interact with the site.

#### Acceptance Criteria

1. THE Quiz_Component SHALL be fully navigable using keyboard controls (Tab, Enter, Space, arrow keys)
2. THE Quiz_Component SHALL include ARIA labels on all interactive elements (options, buttons, feedback regions)
3. WHEN a Reader selects an answer, THE Quiz_Component SHALL announce the correct/incorrect feedback to screen readers using an ARIA live region
4. THE Quiz_Component SHALL use semantic HTML elements (fieldset, legend, label, button) for quiz structure
5. THE Quiz_Component SHALL maintain visible focus indicators on all interactive elements

### Requirement 8: Homepage

**User Story:** As a Reader, I want a welcoming homepage that introduces the site and links to subject areas, so that I feel encouraged to start learning and can quickly find topics.

#### Acceptance Criteria

1. THE Homepage SHALL display a hero section with the welcoming text "Math Made Clear for Adults – Start Fresh, No Judgment" or equivalent encouraging message
2. THE Homepage SHALL display links to the main subject areas (Arithmetic, Algebra Basics, Linear Algebra, Graphics Math, AI Art Math, Esoteric Patterns)
3. THE Homepage SHALL set a supportive, non-intimidating tone for adult learners

### Requirement 9: Site Navigation and Content Organization

**User Story:** As a Reader, I want organized sidebar navigation auto-grouped by subject area, so that I can find math topics easily.

#### Acceptance Criteria

1. THE Navigation_Sidebar SHALL display Content_Pages grouped by subject area corresponding to Obsidian folder structure
2. THE Navigation_Sidebar SHALL auto-group content by Obsidian folders including sections such as Arithmetic, Algebra Basics, Linear Algebra, Graphics Math, AI Art Math, and Esoteric Patterns
3. WHEN a Reader clicks a sidebar item, THE Site SHALL navigate to the corresponding Content_Page
4. THE Search_Engine SHALL allow a Reader to search for content by keyword across all Content_Pages

### Requirement 10: Theming and Visual Design

**User Story:** As a Reader, I want a clean, professional, academic design with high readability, so that I can focus on the math content without distraction.

#### Acceptance Criteria

1. THE Site SHALL use a cool gray color palette as the primary base (light mode: #f8f9fa to #dee2e6; dark mode: #121212 to #2d2d2d)
2. THE Site SHALL use accent colors sparingly for emphasis: Red (#dc3545) for incorrect feedback and error callouts, Green (#198754) for correct feedback and success callouts, Blue (#0d6efd) for links and interactive elements, Orange (#fd7e14) for warnings and highlights, Purple (#6f42c1) for special notes and code blocks
3. THE Site SHALL use a sans-serif typeface with high legibility (such as Inter) as the default body font
4. THE Site SHALL use a base font size that prioritizes readability for extended reading sessions
5. THE Site SHALL support both light and dark mode via the Theme_Toggle
6. THE Site SHALL prioritize white space, subtle borders, and subtle shadows over flashy visual elements
7. THE Site SHALL present an academic, professional aesthetic throughout all pages

### Requirement 11: Deployment to Netlify

**User Story:** As a Content_Author, I want the site deployed to Netlify as a static build, so that readers can access it on the web.

#### Acceptance Criteria

1. THE Site SHALL include a `netlify.toml` configuration file specifying the build command and publish directory
2. WHEN the Build_Pipeline runs `npm run build`, THE Site SHALL produce a static output in the `dist/` directory
3. THE Deployment_Target SHALL serve the built site over HTTPS
4. WHEN a commit is pushed to the main branch, THE Deployment_Target SHALL trigger an automatic rebuild and deployment

### Requirement 12: Performance and Accessibility

**User Story:** As a Reader, I want the site to load fast and be accessible, so that I can use it on any device and with assistive technology.

#### Acceptance Criteria

1. THE Site SHALL produce static HTML pages with minimal client-side JavaScript
2. THE Site SHALL be responsive and render correctly on screen widths from 320px to 2560px
3. THE Site SHALL include semantic HTML elements and appropriate ARIA attributes for navigation and content regions
4. THE Site SHALL include `alt` text guidance in content templates for any images used in Content_Pages
5. THE Site SHALL use Astro islands to hydrate only interactive components (such as the Quiz_Component) while keeping the rest of the page static HTML

### Requirement 13: Future Extensibility

**User Story:** As a Content_Author, I want the quiz and component architecture to support future additions like progress tracking, so that the site can grow without a rewrite.

#### Acceptance Criteria

1. THE Quiz_Component SHALL use a structured data format (such as JSON props or frontmatter) for quiz content, separate from rendering logic
2. THE Quiz_Component SHALL expose quiz results (score, answers) through a consistent internal interface that a future backend integration could consume
3. THE Site SHALL maintain a clear separation between content (Markdown/MDX), components (Astro islands), and configuration (astro.config.mjs)
