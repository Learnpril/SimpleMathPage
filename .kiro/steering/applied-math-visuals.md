---
inclusion: fileMatch
fileMatchPattern: "src/content/docs/applied/**"
---

# Applied Mathematics: visual standards

## Vocabulary, in order of nesting

Four levels, and each has exactly one name. An earlier rename used "Module" at two levels
at once, which confused a reader looking at a topic map: the page was a Module and the boxes
inside it were also Modules.

| Level | Name        | Example                               | Has its own page?            |
| :---- | :---------- | :------------------------------------ | :--------------------------- |
| 1     | (the hub)   | Applied Mathematics                   | yes, `/applied-mathematics/` |
| 2     | **Module**  | Math for 3D Game Development          | yes, an about page           |
| 3     | **Part**    | Part 2 - Matrices and Transformations | no, a grouping only          |
| 4     | **Section** | `the-dot-product`                     | yes, one page                |

So: a Module contains Parts, and a Part contains Sections. Never write "lesson" or "track"
in Applied copy.

**A Part has no page of its own**, which means it is invisible unless you label it. Two
places do that, and a new Section needs both:

1. **A numbered `sidebar.label`** in the Section's frontmatter, as `PART.SECTION` - so
   `label: "1.3  The Dot Product"` for the third Section of Part 1. Two spaces after the
   number. This is what makes the grouping legible in a flat sidebar without adding a fourth
   level of nesting, which was rejected as too deep.
2. **An entry in the `partOf` map** in `astro.config.mjs`, keyed by module then slug, giving
   `[partNumber, partName]`. That appends `Part 1: Vectors and Spatial Reasoning` to the
   badge above the page title, so a reader arriving from search knows where they landed.

Keep `sidebar.order` as the flat 1-24 sequence. It drives ordering; the label only drives
display, and the two are deliberately separate.

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

## Engine-agnostic, with runnable examples

The math belongs to nobody. **Three.js is the example environment** because it runs
embedded in the page: no download, no project setup, and the version is pinned by us so
the reader never has one to mismatch. A reader on Godot, Unity, Unreal or a custom engine
must never feel this track is not for them.

**Lesson shape, in this order:**

1. **The mathematics.** Stated and shown on its own terms, with a figure. No library
   mentioned yet. This part must stand alone.
2. **The same thing in code.** Plain JavaScript or Three.js, inline. Where the figure
   above is driven by a real module, show it with `CodePanel`.
3. **Engine aside, naming methods only.** A `:::note[In an engine]` aside giving the
   Godot and Unity spellings - `move_and_slide()`, `Vector3.slide()`,
   `signed_angle_to()`. Method names are far more stable than project setup, so they age
   well. **Do not** write engine install steps, node trees or Inspector instructions.
   Add the aside where a reader would otherwise get a wrong sign, not out of habit.

**Show the code that ran, not a copy of it.** Lesson maths goes in
`src/lib/gamedev/*.ts`. The figure imports it; the page displays it with `CodePanel` fed
by a Vite `?raw` import of the same file. That way the panel cannot drift from the
behaviour above it, and the lesson can say so honestly. Never pass `CodePanel` a
hand-typed string.

## Visual first. This is the governing rule.

**Whenever a piece of code can be shown as something moving on screen, show it that way.**
Text output is the exception, not the default, and it has to earn its place.

The audience is not assumed to be fluent in JavaScript. They are here for the maths. A
column of printed numbers asks them to simulate the program in their head; a moving picture
does that work for them. The turret demo is the reference: a scene they can point at, a
checkbox that switches the bug on and off, and the code beside it.

Reach for text output only when:

- the point **is** a value - a NaN appearing, a sign flipping, two numbers that should
  agree and do not
- you are describing what a specific function or block does, line by line
- the idea has no spatial meaning at all

Everything else gets a scene. Concretely, prefer:

| Instead of printing    | Show                                    |
| :--------------------- | :-------------------------------------- |
| a vector's components  | the arrow, with a slider                |
| a length or distance   | the arrow changing length               |
| a dot product's sign   | a shape crossing the perpendicular line |
| a cross product        | the perpendicular arrow in 3D           |
| an angle or a rotation | the thing rotating                      |
| an interpolation table | the object moving along the path        |
| a collision result     | the shapes overlapping                  |

**Two things on screen beat one plus a paragraph.** The strongest pattern found so far is a
correct version and a broken version side by side, or one object with a toggle that
introduces the bug. The reader sees the difference rather than being told about it.

**Give every scene a control.** A slider or a checkbox turns a picture into an experiment.
Native `<input>` elements only, with visible labels, so they work by keyboard.

**Never ask the reader to leave the page.** No "save this as index.html". This is a
Three.js site; the demo belongs in the lesson. If a scene is worth describing, it is worth
mounting.

## Restraint is the point. Read this before adding to a panel.

The instinct to show everything that was verified is wrong for a reader. A panel that
carried a scene, the scene's source, a second "the maths, checked at build time" source, a
twenty-row value table and a Run button was rejected as overwhelming, and correctly.
**This material gets complicated fast, so the page has to stay simple.** Settled rules:

- **No Run button.** Everything executes during the build. A button asking the reader to
  confirm that taught nothing and added a step.
- **No "open the console" or F12 instructions.** Every exercise runs in the page.
- **A visual demo shows no numbers.** Scene, then the one file that drew it. That is all.
  The picture is the explanation; a value table under it competes with the thing it was
  meant to support.
- **A values demo is under about eight rows.** If it wants more, it is two ideas.
- **Explanation lives in the prose, not in the code block.** A ten-line doc comment at the
  top of a demo file fills the viewport before a reader reaches a line of code. Demo files
  get a one-line comment; the lesson does the explaining.
- **Exhaustive sweeps go in `demos/checks.ts`**, run via a registry `check`, and are never
  displayed. Checking 90,601 points is worth doing and not worth reading. A single summary
  row is the most a sweep should ever cost the reader.
- **Scene boilerplate goes in `demos/ui.ts`** - `makeCanvas`, `addSlider`, `addCheckbox`,
  `addReadout`, `addArrowPad`, `addButton`. A scene file should read as maths and meshes,
  not as `document.createElement`.
- Section heading is `## See It Work`, not `## Try It Yourself`. Nothing is being assigned.

## Never hand-write expected output: use DemoPanel

Any "what you should see" block written by hand is a liability. Two such blocks in
Part 1 were wrong when first written - `lerpAngle` at t=1 prints 370, not 10, and the
vision-cone edge returns `true` at 140 degrees where the text claimed `false`. Both were
caught only by going looking.

`DemoPanel` removes the whole class of error. Write the example as a demo module and it is
**executed during the build**, so the output on the page is the output the code produced:

1. Add `src/lib/gamedev/demos/<name>.ts` exporting a default `Demo` - a function taking
   `log(expr, value, note?)`.
2. Register it in `src/lib/gamedev/demos/index.ts` with a title and file path.
3. Drop `<DemoPanel name="<name>" />` into the lesson. Nothing else.

**A values panel is code first, then its rows.** The source is the thing being taught and is
always visible; the values sit under it. An early version had this inverted - output
prominent, source collapsed - which put the conclusion before the premise.

Guarantees this buys, all verified:

- **A broken demo fails the build.** `runDemo` and `runCheck` deliberately let exceptions
  escape, so a throwing demo aborts `astro build` with a non-zero exit rather than
  publishing a page that documents its own failure. Tested by breaking one on purpose.
- **Output cannot drift.** Change `wrapDeg` and every panel using it changes with it.
- **No `eval`, no iframe, no sandbox, no button.** A demo is a module we wrote and Vite
  bundled, executed at build time, so there is nothing to isolate and nothing to trigger.
- **Values work without JavaScript**, because the rows are static HTML. Only a scene needs
  script, and it carries a `<noscript>` pointing at the code below it.

**Demos must be deterministic.** Their output is committed to the repository, so
`Math.random`, `Date.now` and Map iteration order will churn the diff on every build.
Seed randomness or keep it out.

**Show the whole file, but make the file worth showing.** Do not trim displayed code down to
its "interesting" lines - the plumbing is not noise to someone who wants to build one of
these, and hiding it makes the demo feel like a magic trick. The right lever is the other
one: keep the file short. Push DOM boilerplate to `ui.ts`, push assertions to `checks.ts`,
and keep the header comment to one line.

## DemoPanel can also host a live scene

A demo may add a **visual** as well as values, which is how a lesson shows something
moving without asking the reader to save an `index.html` and open it themselves. Never
tell a reader to save a file: this is a Three.js site, so the demo belongs on the page.

Structure, using the turret as the reference. **A visual demo displays exactly two things:
the scene and the file that drew it.** Three files, only one of them shown:

- `demos/<name>.scene.ts` - the `MountFn`, `(el, { reduced }) => teardown`. The only file
  that imports Three.js, and **the only one the reader sees**. Keep it short: canvas and
  controls come from `ui.ts`, and the header comment is one line.
- `demos/<name>-shared.ts` - the pure geometry and any conversion the scene relies on. No
  Three.js, so the build can exercise it.
- `demos/checks.ts` - the assertions over that shared module, exported as a named `check`.
  Runs during the build, never rendered.

Registry entry is `visual`, `visualFile`, an optional `hint`, and `check`. No `demo` and no
`file`: a scene with a value table under it was the arrangement that got rejected. The
**lazy** `visual` import matters - it keeps Three.js out of the build-time module graph and
gives the scene its own chunk, fetched only when the panel scrolls into view.

Requirements for a scene:

- Lazy-mount behind an `IntersectionObserver`, return a teardown, and dispose on
  `astro:before-swap`. DemoPanel handles all three; the mount just returns the cleanup.
- Honour the `reduced` flag: render one frame and let interaction drive updates. A scene
  driven only by sliders needs nothing here, since it never animates on its own.
- Include a `<noscript>` fallback pointing at the code below. DemoPanel supplies one.
- Build controls with `ui.ts`, which gives every one of them a label and a keyboard path.
- **One control at a time, and never a held one.** A reader with a mouse has a single pointer,
  so "hold two arrow keys" is impossible for most of them. The movement demo originally shipped
  an on-screen arrow pad for exactly that and it could not be used; it became a single
  direction slider, which turned out to teach better anyway. A slider or a checkbox is enough
  for any scene in this track.
- **Put the live numbers in the scene, not under the panel.** One `addReadout` line showing
  the value that decides what you are looking at - `dot 0.42 vs threshold 0.71 → not seen` -
  does the job a whole table was failing to do.

**The scene itself is not verified and cannot be**, because a build step has no GPU. Say so
if a lesson makes a claim that depends on appearance. What _is_ verified is the arithmetic
that positions everything, via `checks.ts`.

**Push coordinate mapping out of the scene so it becomes testable.** The turret's first
version aimed exactly backwards: forward is local `-Z`, so facing a target at `(x, z)`
needs `atan2(-x, -z)`, and `atan2(x, z)` is half a turn wrong. Every build-time row passed,
because the bug was in the mapping rather than the maths being logged.

The fix generalises. Any time a scene converts between a direction and an angle, or between
world and local space, put that conversion in a pure function in the shared file and add a
**round-trip assertion** in `checks.ts`: aim at a target, then measure where you ended up
pointing, and assert the alignment is 1. The old code scored -1 on every case, so the check
has teeth. A test only catches what it looks at, so when the visible thing cannot be tested,
test the arithmetic that positions it.

**Orthonormal is not the same as right-handed, and only one of them is easy to check.**
`buildBasis` in `cross.ts` shipped with `right = cross(worldUp, forward)`, which for a
-Z-forward system returns the object's **left**. All six obvious checks passed - three unit
lengths, three zero dot products - because the triple was still orthonormal. It was just
left-handed, so anything oriented by it came out mirrored, with no error and no NaN. The
correct form is `right = cross(forward, worldUp)` then `up = cross(right, forward)`, verified
by a **determinant row**: `dot(cross(right, up), -forward)` must be `+1`, checked across a
grid of directions rather than one. Add that row to any basis-building demo. Symptoms that
are neither a crash nor a wrong number are the ones a build cannot catch by accident.

**Give a scene a `hint` only when it needs one.** `DemoEntry.hint` renders one line under the
canvas. Use it when the control is not visible - pointer movement, arrow keys - and omit it
when there is a labelled `<input>` doing the explaining, because a redundant instruction reads
as clutter. Do not hard-code a hint in `DemoPanel`; an early version told every scene's reader
to move their pointer, including one driven by a slider.

**Exercises need nothing installed and nothing opened.** Everything is a `DemoPanel` on the
page - a scene where the idea moves, a short value list where the idea is a number. No
`index.html` to save, no console to open, no button to press.

**Handedness makes this load-bearing, not decorative.** Godot is right-handed, Y-up,
−Z forward. Unity is left-handed, Y-up, +Z forward. Blender is Z-up. So any lesson
touching transforms, look-at, cross products or camera basis vectors _will_ mislead a
Unity reader unless the convention is stated. Keep one conventions reference table
(handedness, up axis, forward axis, row vs column vectors) in the transforms module and
link back to it rather than repeating the caveat in every lesson.

**Pin the versions.** Three.js is churnier than most libraries: revisions remove APIs and
move `examples/jsm` paths. Site figures are safe because `package.json` pins the version,
but any Three.js URL written into lesson prose must be pinned too - never `three@latest`.
State the pinned revision on the about page.

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

**The dev server on port 4325 is the review surface.** Not `astro preview`. Get the order
right, because it caused a long false hunt once:

1. `npx astro build` first - it runs the build-time `check`s, and it also runs **Prettier over
   the source files**.
2. Restart the dev server _after_ that, so it starts from already-formatted files.

Reverse those and Prettier rewrites files while the dev server is watching them. HMR
invalidates the module, the browser re-fetches it as
`/src/lib/gamedev/demos/<name>.scene.ts?t=<timestamp>`, the fetch lands mid-rewrite and fails,
and the scene never mounts. The symptom is a panel that looks exactly like one that has not
scrolled into view yet.

Two tells that a blank panel is this and not a broken scene: the failing URL is an
**unbundled `/src/...` path with a `?t=` query** (only the dev server serves those - preview
serves hashed `_astro/*.js`), and the port is the dev server's rather than preview's. Confirm
by requesting the module directly: `Invoke-WebRequest http://127.0.0.1:4325/src/lib/gamedev/demos/<name>.scene.ts`
should return 200 and contain identifiers from the current version of the file.

`DemoPanel` catches mount failures and prints them in the panel. Before that it swallowed
them, and since `.demo-stage` has `min-height: 300px` a dead scene was pixel-identical to an
unmounted one. Keep that `catch`: a scene throwing in a real browser is the one class of
broken demo the build genuinely cannot catch, because checking it needs a GPU.

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
