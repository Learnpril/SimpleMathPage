---
inclusion: fileMatch
fileMatchPattern: "src/content/docs/applied/**"
---

# Applied Mathematics: visual standards

Applied is a **guide and reference**, not a lesson sequence. No quizzes, no
`## Quiz` section, no `SUBJECTS` entry unless progress tracking is wanted. The
default unit is "here is the thing, here is the math that makes it work", and the
reader should be able to _see_ the math rather than read a description of it.

Prose exists to label and connect the visuals. If a paragraph runs longer than about
four sentences without a figure, table or diagram, that is a signal to draw something
instead.

## The figure ladder

Pick the cheapest rung that actually explains the idea. Climbing higher than needed
costs load time and maintenance for no gain.

1. **Computed static SVG** - the default. Same conventions as the Core sections: the
   component calculates its own numbers so the picture can never drift from the
   caption. Covers 2D vectors, graphs, grids, payoff matrices, UV layouts, curves.
2. **Three.js scene with orbit + zoom** - when the idea is genuinely three
   dimensional. Camera frustums, quaternion rotation, surface normals, 3D transform
   composition, noise-driven terrain. This is the established pattern; 32 components
   already do it.
3. **Live parameter controls** - only when _changing the value is the lesson_. A
   slider on an interpolation factor, a rotation angle, a noise frequency, a payoff
   weight. If the reader would learn the same thing from two labelled side-by-side
   states, draw the two states instead and skip the control.
4. **Draggable points** - reserve for cases where placement is the concept: dragging a
   control point on a Bezier, moving a light to see the dot product change. Costs the
   most to build and to make accessible.

Rungs 3 and 4 are optional by explicit instruction. A track built entirely on rungs 1
and 2 is a success, not a shortfall.

## Three.js rules

- One `import * as THREE from "three"` per component. Multiple figures on a page share
  the same chunk, so a lesson with five scenes is not five payloads.
- Always lazy-init behind an `IntersectionObserver` at `threshold: 0.05`, matching the
  existing components. Never build a scene at module scope.
- Return a teardown that calls `cancelAnimationFrame` and `renderer.dispose()`. Wire
  it to `astro:page-load` re-init so client-side navigation does not leak contexts.
- Cap `setPixelRatio` at 2. Fix canvas height, cap width at 480 unless the figure
  genuinely needs more.
- Read the theme from `document.documentElement.dataset.theme` and set the scene
  background to `0x121212` dark / `0xf8f9fa` light, as the existing scenes do.

## Interaction rules

- Controls are `<input type="range">` with a visible `<label>` and a live numeric
  readout. No bare unlabelled sliders.
- Every control needs a keyboard path. A native range input gives this for free, which
  is the main reason to prefer it over a custom drag handle.
- Draggable points must also be reachable by keyboard, or be paired with sliders that
  drive the same values.
- State the current values as text somewhere in the figure. A reader who cannot use
  the control still needs the numbers.
- Respect `prefers-reduced-motion`: no autoplaying spin or looping animation when it
  is set. Render one static frame and let interaction drive changes. **This is
  currently unhandled in all 32 existing 3D figures** - do not copy that gap forward.

## Palette and type

Identical to the Core figure conventions, so the two halves of the site look like one
site:

- Dark palette `#7ee787` green, `#58a6ff` blue, `#d2a8ff` purple, `#f0883e` orange,
  `#ff7b72` red, with `:global([data-theme="light"])` overrides.
- Applied's own accent is `#39d3c3` teal (`#0d7d72` light). Use it for track chrome,
  not for data in figures, so figures stay readable against Core's conventions.
- Font `'Libre Baskerville',Georgia,serif`. Minimum font size 9.5.
- `<figure role="img" aria-label="...">` with a scoped `<style>`, and
  `svg { width:100%; max-width:100%; height:auto; }`.

## Engine-agnostic, with concrete examples

The math belongs to nobody. Godot and Blender are the worked examples because they are
free and good to learn in, not because the material is about them. A reader on Unity,
Unreal or a custom engine must never feel this track is not for them.

**Lesson shape, in this order:**

1. **The mathematics.** Stated and shown on its own terms, with a figure. No tool
   mentioned yet. This part must stand alone.
2. **The same thing in a tool.** A `:::note[In Godot]` or `:::note[In Blender]` aside.
   Use that exact naming so readers can seek it or skip it, and so the boundary
   between math and tool is visible at a glance.
3. **Cross-engine note, only where the difference bites.** A
   `:::note[In other engines]` aside. Do not add one out of habit - add it where a
   reader would otherwise get a wrong sign or a sideways object.

**Handedness makes this load-bearing, not decorative.** Godot is right-handed, Y-up,
−Z forward. Unity is left-handed, Y-up, +Z forward. Blender is Z-up. So any lesson
touching transforms, look-at, cross products or camera basis vectors _will_ mislead a
Unity reader unless the convention is stated. Keep one conventions reference table
(handedness, up axis, forward axis, row vs column vectors) in the transforms module and
link back to it rather than repeating the caveat in every lesson.

**Pin the versions.** Godot 3 and 4 differ enough to invalidate examples - node names,
`Transform2D`/`Transform3D`, the `move_and_slide` signature - and Blender moves its UI
between releases. State the version a track's examples were written against on its
about page, so material that has rotted is identifiable instead of merely confusing.

**Hub copy stays generic.** `/applied-mathematics/` and `/about/` name no tools in the
card, tagline or description; the hub body carries the engine-agnostic positioning
statement. Tool-specific material lives on track and lesson pages. That way a change of
tool never forces a rewrite of the site's front door.

## Tool screenshots: read this before promising any

**I cannot produce Godot or Blender screenshots.** Capturing them means running the
software, which is not something I can do. Two workable options:

1. **You supply them.** Drop PNGs in `public/` or `src/assets/`. Prefer `src/assets/`
   so Astro optimises them. Both tools are free software and UI screenshots are
   normally fine to publish, but confirm that yourself for anything you redistribute.
2. **I draw the UI as SVG instead.** An inspector panel, a shader node graph, a
   transform gizmo, a rig hierarchy - these recreate cleanly as SVG and are arguably
   better here: they match the dark palette exactly, stay legible at any width, do not
   blur on high-DPI screens, and do not go stale when the tool ships a UI refresh.

Default to option 2 unless a screenshot is specifically requested, and never leave an
`<img>` pointing at a file that does not exist. Either way, an `:::note[In Godot]`
aside is still worth writing without a picture - naming the class, method or panel is
most of the value, and the math figure above it is doing the explaining.

## Verification

- `node scripts/audit-figures.mjs dist/<section> 3` only parses **static SVG
  geometry**. Three.js and canvas figures are invisible to it, so a clean audit is not
  evidence an interactive figure is correct.
- The auditor does not apply SVG `transform` attributes. Emit absolute coordinates in
  static figures or it will report phantom clipping.
- `node scripts/check-section.mjs <section>` counts quizzes. Applied sections have
  none, so expect a zero-quiz report and do not "fix" it by adding quizzes.
- For anything computed, verify the numbers in Node before shipping and state what was
  checked. Rendered appearance cannot be eyeballed in this environment, so say so
  rather than implying a visual check happened.
