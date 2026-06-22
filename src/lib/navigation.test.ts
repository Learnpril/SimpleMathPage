// Feature: progress-dashboard-and-streaks, Integration Test: Navigation link present in header
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * **Validates: Requirements 8.1, 8.3**
 *
 * Integration test: navigation link present in header on all pages.
 *
 * Since Astro components cannot be rendered directly in vitest without a full build,
 * this test verifies the Header.astro source contains the expected Progress navigation
 * link markup. The Header is included on every page via Starlight's layout, ensuring
 * the link is visible site-wide.
 */
describe("Navigation link present in header", () => {
  const headerPath = resolve(__dirname, "../components/Header.astro");
  const headerContent = readFileSync(headerPath, "utf-8");

  it("contains an anchor element with href='/progress/' and text 'Progress'", () => {
    // Verify the link points to /progress/
    expect(headerContent).toContain('href="/progress/"');
    // Verify the link text is "Progress"
    expect(headerContent).toMatch(/>Progress<\/a>/);
  });

  it("has the data-progress-link attribute on the navigation link", () => {
    expect(headerContent).toContain("data-progress-link");
  });

  it("has accessible labeling via aria-label on the nav element", () => {
    // The nav wrapping the link has aria-label="Progress navigation"
    expect(headerContent).toContain('aria-label="Progress navigation"');
  });

  it("link is inside a nav element for semantic navigation structure", () => {
    // Verify the Progress link is wrapped in a <nav> element
    const navMatch = headerContent.match(
      /<nav[^>]*class="progress-nav"[^>]*>[\s\S]*?<a[^>]*href="\/progress\/"[^>]*>Progress<\/a>[\s\S]*?<\/nav>/,
    );
    expect(navMatch).not.toBeNull();
  });

  it("link is placed in the header's right group so it's visible on all pages", () => {
    // The progress-nav should be inside the right-group div which renders on desktop
    const rightGroupMatch = headerContent.match(
      /class="[^"]*right-group[^"]*"[\s\S]*?<nav[^>]*class="progress-nav"/,
    );
    expect(rightGroupMatch).not.toBeNull();
  });
});
