/**
 * Site-wide facts that appear in more than one place.
 *
 * These live in one file because they are the sort of thing that goes stale silently. The
 * contact address in particular is referenced by the Privacy Policy, the Terms and the
 * Contact page - so it needs to be correct in one place rather than nearly correct in
 * three.
 */

/** The public name, spelled the way it should appear in copy. */
export const SITE_NAME = "Mom's Basement University";

/** Short form, used where the full name will not fit. */
export const SITE_SHORT = "MBU";

export const SITE_URL = "https://momsbasementuniversity.com";

/**
 * The published contact address. **A real inbox, deliberately.**
 *
 * Readers report broken math here and ask for account deletion here, so an address that
 * bounces is worse than none at all. A working mailbox on a different domain beats a
 * tidy-looking `contact@` on this one that nobody reads; it does not need to match the
 * site's domain.
 *
 * Being a personal address, it is public the moment this ships: expect spam and expect
 * students. If that becomes tiresome, the upgrade path does not touch any page - register
 * `contact@momsbasementuniversity.com`, forward it here, and change this one line. Same
 * inbox, and every page that quotes it follows automatically.
 */
export const CONTACT_EMAIL = "echoesOTV@gmail.com";

/** The year to show in the footer. Computed, so it cannot go stale. */
export const COPYRIGHT_YEAR = new Date().getFullYear();

/** One line, used under the footer links. */
export const DISCLAIMER =
  "Unofficial free resource. Not an accredited university.";

/**
 * The footer's license line, split so the license names can be links.
 *
 * Two licenses because they cover two different things: the lessons are CC BY 4.0 and the
 * code samples inside them are MIT. `/license` carries the detail, the attribution line
 * teachers can copy, and the pointers to the canonical texts.
 */
export const LICENSE_LESSONS = "CC BY 4.0";
export const LICENSE_CODE = "MIT";
