---
inclusion: fileMatch
fileMatchPattern: "src/content/docs/applied/3d-game-development/**"
---

# Math for 3D Game Development: settled curriculum

Reviewed and agreed. Build from this rather than re-deriving it. Visual and figure
standards live in `applied-math-visuals.md`, which also governs this track.

## Settled decisions

- **Three.js is the example environment**, not Godot. Superseded the earlier Godot 4.x
  decision. Reasons: examples run embedded in the page so there is no download, project
  setup or editor tour before a reader sees a dot product; the figure and the example
  become one artifact instead of two implementations of the same idea; and the version is
  pinned by us, so the reader never has a version to mismatch. Three.js agrees with Godot
  on every convention (right-handed, +Y up, -Z forward, `M * v` column vectors), so
  nothing already written became wrong.
- **Engine names stay, engine setup goes.** Keep short `:::note[In an engine]` asides
  naming methods - `move_and_slide()`, `Vector3.slide()`, `look_at()`,
  `signed_angle_to()` - because method names churn far less than project setup and
  signatures. Do not write Godot project instructions, node trees or Inspector steps.
- **Parts 6, 7 and the capstone build from scratch.** Three.js has no physics, no
  collision and no character controller, so those lessons implement the maths directly
  rather than calling an engine method. This is a feature for a maths track: you cannot
  hide behind `move_and_slide` if you have to write it.
- **Exercises run in the browser console** where they are print-based, and as a pinned
  single-file Three.js page where they are visual. Zero install either way.
- **Code shown must be code that ran.** Put lesson maths in `src/lib/gamedev/*.ts`, have
  the figure import it, and display it with `CodePanel` fed by a Vite `?raw` import.
  Never hand `CodePanel` a hand-typed string; drift is the thing it exists to prevent.
- **25 pages**: about + 23 lessons + capstone. Not compressed to 21; the added
  material is the high-value part. In line with Arithmetic (28) and Algebra 2 (37).
- **3D only, and 2D is now a separate track that comes first.** Superseded the earlier
  "2D gets asides, not coverage" decision. This track was judged to move too fast for a
  reader who has never written a movement loop - page one asks for handedness, basis
  vectors and the $-Z$ convention at once - so `applied/2d-game-development` was created
  as the prerequisite. See `2d-game-dev-curriculum.md`.

  What that changes here: keep the existing 2D asides, but treat 2D as **assumed
  background** rather than a digression. Where a lesson has a 2D counterpart, link back to
  it instead of re-teaching the idea. Do not add new 2D coverage to this track.

- **This track is `applied/3d-game-development`**, moved from `applied/game-development`
  when the split happened. Redirects for the six original URLs live in `astro.config.mjs`;
  leave them in place.
- **No quizzes.** Applied is a guide and reference. Expect `check-section.mjs` to
  report zero quizzes and do not "fix" it.
- The capstone occupies the slot where Core sections put a review page.

## Prerequisites, to state on the about page

**Math for 2D Game Development** first, or equivalent experience. It is not formally
required - the maths here stands on its own - but it is strongly recommended, and the about
page should say so plainly rather than burying it.

Then: Trigonometry throughout; Linear Algebra for Parts 2 and 3; Algebra 2 quadratics for
jump arcs; Calculus 1 optional, for velocity and acceleration as derivatives.

## Lesson list

Slugs are final. `order` matches the number.

### Part 1 - Vectors and Spatial Reasoning

1. `points-vectors-and-coordinate-conventions` - points vs vectors, basis vectors,
   handedness, up axis, forward axis, degrees vs radians. **Hosts the conventions
   reference table** (Godot right-handed Y-up −Z-forward, Unity left-handed Y-up
   +Z-forward, Blender Z-up, row vs column vectors); every later transform lesson links
   back here instead of repeating the caveat. Visual: three axis triads side by side.
2. `length-normalization-and-distance` - magnitude, unit vectors, distance, squared
   distance and when to skip the sqrt, guarding a zero-length normalize. Visual: slider
   scaling a vector with live length and normalized components.
3. `the-dot-product` - sign as a facing test, projection, angle, clamping `acos` input
   to [−1, 1] before it returns NaN. Visual: second vector on a slider, dot and angle
   live, colour flipping at perpendicular.
4. `the-cross-product-and-building-a-basis` - direction, magnitude as area, surface
   normals, orthonormal basis, look-at as cross products. Visual: orbitable 3D scene.
5. `angles-atan2-and-shortest-rotation` - `atan2` vs `acos`, signed angle from cross
   plus dot, wrapping to ±180, shortest angular distance, turning without spinning the
   long way. Engine aside: **Godot `Vector3.signed_angle_to(to, axis)` and
   `Vector2.angle_to()`**; Unity's equivalent is `Vector3.SignedAngle`. Name the helper
   only after the math is established. Visual: top-down turret with signed error and
   wrapped delta.

### Part 2 - Matrices and Transformations

6. `matrices-as-transformations` - columns as transformed basis vectors, scale,
   rotation, shear in 2×2 and 3×3, determinant as area/volume scale and negative
   determinant as a flip, **row vs column vector convention** and how it reverses
   composition order. Visual: unit square deforming under slider-driven entries.
7. `homogeneous-coordinates-and-4x4-matrices` - why translation needs a fourth
   component, `w = 1` for points vs `w = 0` for directions. Visual: 3D gizmo with the
   4×4 alongside, entries highlighted as they change.
8. `trs-order-and-composing-transforms` - non-commutativity, why scale-rotate-translate
   is standard, what each wrong order looks like. Aside: 2D and `Transform2D`. Visual:
   the same object under all six orderings.
9. `local-world-view-and-clip-space` - the pipeline, parent-child hierarchies, inverse
   transforms, **normals transform by the inverse transpose** under non-uniform scale.
   Visual: parented objects in 3D plus a wrong vs correct normal on a squashed sphere.

### Part 3 - Rotations Done Right

10. `euler-angles-and-gimbal-lock` - order conventions, gimbal lock shown rather than
    asserted, where Euler angles are still right (designer-facing values, turrets).
    Visual: three nested gimbal rings, per-axis sliders, degeneracy visible at 90°.
11. `quaternions` - axis plus half-angle intuition first, multiplication as composition,
    conjugate as inverse, rotating a vector, **double cover and negating when
    `dot < 0`** so slerp takes the short arc. Visual: 3D object driven by a quaternion,
    axis drawn, angle on a slider.
12. `interpolating-rotations-slerp-and-nlerp` - slerp vs lerp vs nlerp and when cheap is
    fine, quaternion/matrix/Euler conversions and where precision goes. Visual: three
    objects rotating the same start to end, one per method, paths traced.

### Part 4 - Time, Interpolation and Feel

13. `delta-time-and-frame-rate-independence` - **the highest-value lesson in the
    track.** Why `lerp(current, target, 0.1)` per frame is a bug: it converges faster at
    144fps than 60fps, so feel changes with hardware. Exponential decay
    `t = 1 − exp(−k·dt)` as the fix, half-life as the designer-facing parameter. Comes
    before anything that moves. Visual: two followers at simulated 30 and 144fps, naive
    diverging, corrected identical.
14. `easing-smoothstep-and-damping` - lerp, inverse lerp, remap, clamp, smoothstep,
    smootherstep, standard easing families and what each communicates, critically damped
    spring smoothing. Visual: easing gallery, each curve paired with a moving dot.
15. `bezier-curves` - quadratic and cubic, control points, de Casteljau, tangents as
    derivatives, continuity when chaining, jump arcs as quadratics. Visual: draggable
    control points with de Casteljau drawn live.
16. `hermite-catmull-rom-and-constant-speed-paths` - splines through placed points,
    tangents, C0/C1/C2, **arc-length reparametrization**: uniform `t` is not uniform
    speed, so an even-rate camera needs a lookup table. Visual: two dots on one spline,
    uniform `t` vs uniform arc length, visibly separating.

### Part 5 - Cameras and Screen Space

17. `projection-fov-and-the-view-frustum` - perspective vs orthographic, vertical vs
    horizontal FOV, aspect ratio, near/far planes and why a tiny near plane destroys
    depth precision, frustum as six planes leading into culling. Short aside on
    **reverse-Z and infinite far planes** as the actual modern fix for the precision
    problem raised here, flagged as engine-internal rather than gameplay code. Visual:
    orbitable frustum, FOV and near/far on sliders.
18. `screen-space-to-world-space` - unprojecting a cursor into a ray for clicking,
    picking and aiming; projecting a world point to screen for health bars and markers;
    spherical coordinates for orbit cameras, which the capstone needs. Visual:
    click-to-pick with the generated ray drawn in 3D.

### Part 6 - Geometry and Collision

19. `rays-planes-and-closest-points` - parametric rays, plane equations, ray-plane
    intersection and the parallel case where the denominator vanishes, closest point on
    line/segment/plane/box, signed distance as a running idea. Visual: draggable point
    with closest points on several primitives.
20. `bounding-volumes-and-intersection-tests` - sphere, AABB, OBB and **capsule**, the
    shape almost every character actually uses. Sphere-sphere, sphere-AABB, AABB-AABB,
    ray-sphere, ray-AABB by slabs, the separating axis idea for OBBs, broad vs narrow
    phase. Visual: two draggable shapes, test result and separating axis when they miss.
21. `collision-response-penetration-and-sliding` - detection is half the job.
    Penetration depth and minimum translation vector, sliding by removing the normal
    component of velocity (what `move_and_slide` does), restitution and friction,
    tunneling at speed. Covers swept tests, **continuous collision detection and
    speculative contacts** in a paragraph; Godot exposes this as `continuous_cd` on
    RigidBody. Visual: velocity decomposing against a wall into blocked and sliding
    parts, wall angle on a slider.

### Part 7 - Physics Integration

22. `velocity-acceleration-and-forces` - position/velocity/acceleration, gravity, drag,
    impulse vs continuous force, jump height and time-to-apex solved backwards from the
    feel you want. Visual: jump arc with desired height and airtime as sliders, derived
    gravity and initial velocity shown.
23. `integrators-and-the-fixed-timestep` - explicit vs semi-implicit Euler and why
    semi-implicit is what games use, fixed timestep with an accumulator, interpolating
    render state between ticks. Verlet is a short aside only: it earns its keep for
    cloth and rope, not character controllers. Visual: one projectile under each
    integrator at a large timestep with the analytic solution overlaid.

### Capstone

24. `capstone-third-person-character-controller` - input mapped to a world-space
    direction relative to camera yaw, semi-implicit velocity on a fixed timestep,
    move-and-slide against geometry with a capsule, quaternion slerp for turning with
    shortest-arc handling, frame-rate-independent camera follow with spherical-coordinate
    orbit, and a spline camera path for a scripted shot. Names the lesson each piece
    comes from.

## Registration checklist

Applied tracks are new, so registration differs from Core's seven points:

All done, and recorded here so the next Applied track does not have to rediscover it.

1. Sidebar group in `astro.config.mjs`, after the 2D group.
2. A real `<a>` card on `/applied-mathematics/`, not a `coming-soon` `<div>`.
3. Section-label maps key off the **second** segment for Applied, via `sectionKey()`.
   There are three such maps - the badge map, the pagination map, and the mobile FAB's
   `subjects` array - and all three need the track's key.
4. Level map: Applied uses `data-level="applied"` (teal `#39d3c3`), keyed off the first
   segment, so a new track needs no change there.
5. `SUBJECTS` in `src/lib/progress-map.ts` only if progress tracking is wanted for a
   track with no quizzes. Not done, deliberately.
6. Redirects if a track's URLs ever move. Six are in place from the 2D/3D split.
