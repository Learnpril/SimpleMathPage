/**
 * Site-wide facts that appear in more than one place.
 *
 * These live in one file because they are the sort of thing that goes stale silently. The
 * contact address in particular is referenced by the Privacy Policy, the Terms and the
 * Contact page, and an advertising review will follow it - so it needs to be correct in
 * one place rather than nearly correct in three.
 */

/** The public name, spelled the way it should appear in copy. */
export const SITE_NAME = "Mom's Basement University";

/** Short form, used where the full name will not fit. */
export const SITE_SHORT = "MBU";

export const SITE_URL = "https://momsbasementuniversity.com";

/**
 * The published contact address. **A real inbox, deliberately.**
 *
 * An advertising review follows this address, and one that bounces is worse than none at
 * all - so a working mailbox on a different domain beats a tidy-looking `contact@` on this
 * one that nobody reads. It does not need to match the site's domain.
 *
 * Being a personal address, it is public the moment this ships: expect spam and expect
 * students. If that becomes tiresome, the upgrade path does not touch any page - register
 * `contact@momsbasementuniversity.com`, forward it here, and change this one line. Same
 * inbox, publisher-shaped address, and every page that quotes it follows automatically.
 */
export const CONTACT_EMAIL = "echoesOTV@gmail.com";

/** The year to show in the footer. Computed, so it cannot go stale. */
export const COPYRIGHT_YEAR = new Date().getFullYear();

/** One line, used under the footer links. */
export const DISCLAIMER =
  "Unofficial free resource. Not an accredited university.";

/**
 * Routes that must never carry advertising.
 *
 * Legal and contact pages stay clean because an ad beside a privacy policy undermines the
 * document, and the account screens stay clean because an accidental click next to a sign-in
 * form is the worst possible place for one. Matched as a prefix against the pathname.
 */
export const NO_AD_ROUTES: readonly string[] = [
  "/privacy",
  "/terms",
  "/contact",
  "/progress",
  "/login",
  "/account",
];

/** Should this path show advertising, ignoring whether ads are switched on at all? */
export function routeAllowsAds(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  // The homepage and the two hub pages are content, but they carry no lesson body to sit an ad inside.
  if (path === "/") return false;
  return !NO_AD_ROUTES.some(
    (blocked) => path === blocked || path.startsWith(`${blocked}/`),
  );
}

/**
 * Whether advertising is switched on for this build.
 *
 * Read from `PUBLIC_ADS_ENABLED`, which is a string because environment variables always
 * are - so this compares against `"true"` rather than trusting truthiness. An unset
 * variable means off, which is the safe default and the one committed to the repository.
 */
export const ADS_ENABLED =
  import.meta.env.PUBLIC_ADS_ENABLED === "true" ||
  import.meta.env.PUBLIC_ADS_ENABLED === true;

/** The AdSense publisher ID, e.g. `ca-pub-0000000000000000`. Set in `netlify.toml`. */
export const ADSENSE_CLIENT = import.meta.env.PUBLIC_ADSENSE_CLIENT ?? "";

/**
 * **Two switches, deliberately separate.** This one puts the AdSense loader script in the
 * head of every page, and it needs only a publisher ID.
 *
 * Google requires the script site-wide to review the site, and it has to be there before
 * any ad exists - so it cannot be tied to `PUBLIC_ADS_ENABLED`, which governs whether
 * visible ad units render. Setting only the ID gives the reviewer what it needs and changes
 * nothing a reader sees.
 *
 * **The script alone does not place ads, but it is the same script Auto ads uses.** Whether
 * ads appear automatically is a toggle in the AdSense dashboard, not something this codebase
 * controls. Keeping Auto ads off there is the only thing standing between this script and an
 * ad landing on top of a quiz button, so leave it off.
 */
export const ADSENSE_SCRIPT_ENABLED = ADSENSE_CLIENT.length > 0;

/**
 * And this one governs **visible ad units**: reserved slots, `ins.adsbygoogle` elements.
 *
 * Needs the flag *and* an ID. Both halves matter: flipping the flag without an ID would emit
 * an `ins` element with no client attribute, which renders as a blank reserved box and fails
 * the "no empty giant boxes" rule for nothing.
 */
export const ADS_LIVE = ADS_ENABLED && ADSENSE_CLIENT.length > 0;
