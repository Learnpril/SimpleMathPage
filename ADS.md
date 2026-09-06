# Advertising

Advertising on this site is **off**, and off is the committed state. With the flag unset
the site makes no third-party advertising request, loads no Google script, and renders no
reserved boxes. Nothing about the page changes.

This document is how to turn it on, and what not to do afterwards.

## Flipping the flag

Two environment variables, both required. Setting one without the other does nothing,
which is deliberate — a flag with no publisher ID would emit an ad element with no account
attached and render as a blank frame.

| Variable                | Off (committed) | On                        |
| :---------------------- | :-------------- | :------------------------ |
| `PUBLIC_ADS_ENABLED`    | `false`         | `true`                    |
| `PUBLIC_ADSENSE_CLIENT` | empty           | `ca-pub-0000000000000000` |

Locally, put them in `.env`. On Netlify, set them under **Site configuration →
Environment variables** and redeploy — Astro inlines `PUBLIC_` variables at build time, so
changing them requires a rebuild, not just a restart.

The logic is in `src/lib/site.ts`:

```ts
export const ADS_LIVE = ADS_ENABLED && ADSENSE_CLIENT.length > 0;
```

## Where the publisher ID goes

**Three places, and one of them is spelled differently.**

1. `PUBLIC_ADSENSE_CLIENT` — **with** the `ca-` prefix: `ca-pub-0000000000000000`.
2. `public/ads.txt` — **without** it: `google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0`.
3. Each ad unit's slot ID goes on the `AdSlot` component's `slot` prop. Those are created
   per-unit in the AdSense dashboard and are not the same thing as the publisher ID.

Mixing up 1 and 2 is the usual reason `ads.txt` reads as invalid while everything else
looks fine.

## Where ads can appear

Manual slots only. **There is no Auto Ads tag in this codebase and there should not be** —
automatic placement is what drops an ad on top of a quiz button or between a question and
its answer key, and this site is full of both.

Currently wired:

- **After the lesson body, before previous/next.** Rendered by
  `src/components/Footer.astro`, which places `AdSlot` above Starlight's default footer.
  Starlight's footer is what draws the pagination, so this position is after the content and
  before the navigation on every page at once.

Available but not wired, because it needs a decision per lesson:

- **After the intro, before the first quiz.** Drop `<AdSlot slot="..." />` into a lesson
  `.mdx` after the `## What You'll Learn` section. Not applied in bulk: there are 440-odd
  pages and an ad two paragraphs into a short lesson is worse than no ad.

### Never

Enforced in code by `NO_AD_ROUTES` in `src/lib/site.ts`, checked by both `AdSlot` and
`Head.astro`:

- `/privacy`, `/terms`, `/contact` — an ad beside a privacy policy undermines the document
- `/progress`, `/login`, `/account` — an accidental click next to a sign-in form is the
  worst place for one
- the homepage — it has no lesson body to sit an ad inside

Also, by design and not by config: never in the sticky header, never inside an answer key,
and never overlapping the quiz controls or the prev/next links.

## Layout stability

`AdSlot` reserves its height (`min-height`, 100px in-article and 120px after content) so
the content below does not jump when an ad fills. That shift is the main layout cost of
display advertising and it is avoidable with one property. If you add a slot, give it a
reserved height too.

## Consent

There is **no consent interface yet**. `src/content/docs/privacy.mdx` says so plainly and
carries the Google and industry opt-out links.

Before enabling ads for readers in the EEA, UK or Switzerland, a consent mechanism has to
come first — a Google-certified CMP is the low-effort route, since AdSense can serve one.
Until then, either leave ads off or restrict them to regions that do not require prior
consent. Do not quietly enable ads and leave that note in the Privacy Policy saying
otherwise.

## Do not click your own ads

Not a joke and not a formality. Clicking your own ads, asking anyone else to, or viewing
your own pages repeatedly to inflate impressions is invalid traffic, and the penalty is
account termination rather than a warning.

When testing that a slot renders:

- confirm the **element** is present, not that an ad filled it
- use a build with the flag on locally, and do not click the result
- if you must verify live behaviour, use AdSense's own preview tooling rather than the real
  page

The safest test is the one the build already does: check the `ins.adsbygoogle` element
exists in the HTML with the right attributes, and stop there.

## Before applying to AdSense

- [ ] `PUBLIC_ADS_ENABLED` may stay `false` — a site does not need live ads to be reviewed
- [x] `CONTACT_EMAIL` in `src/lib/site.ts` is a mailbox that actually receives mail. It is a
      personal Gmail rather than an address on this domain, which is fine — reviews check
      that a human is reachable, not that the address matches the site. To make it look more
      like a publisher later without changing any page, register
      `contact@momsbasementuniversity.com`, forward it to the same inbox, and edit that one
      constant.
- [ ] `/privacy`, `/terms`, `/contact`, `/about` all reachable from the footer on every page
- [ ] `ads.txt` served at the domain root (it is, as a stub, authorising nobody)
- [ ] no copy anywhere claiming the site is ad-free
