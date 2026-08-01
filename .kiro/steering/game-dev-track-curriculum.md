---
inclusion: fileMatch
fileMatchPattern: "src/content/docs/applied/game-development/**"
---

# Math for Game Development: settled curriculum

Reviewed and agreed. Build from this rather than re-deriving it. Visual and figure
standards live in `applied-math-visuals.md`, which also governs this track.

## Settled decisions

- **Godot 4.x** for every code example. State the version on the about page and again
  in the first lesson containing code. Godot 3 examples age badly: node names,
  `Transform2D`/`Transform3D` and the `move_and_slide` signature all changed.
- **25 pages**: about + 23 lessons + capstone. Not compressed to 21; the added
  material is the high-value part. In line with Arithmetic (28) and Algebra 2 (37).
- **3D only.** 2D gets asides, not coverage. A dedicated 2D track may come later,
  after the other Applied tracks are underway.
- **No quizzes.** Applied is a guide and reference. Expect `check-section.mjs` to
  report zero quizzes and do not "fix" it.
- The capstone occupies the slot where Core sections put a review page.

## Prerequisites, to state on the about page

Trigonometry throughout; Linear Algebra for Modules 2 and 3; Algebra 2 quadratics for
jump arcs; Calculus 1 optional, for velocity and acceleration as derivatives.

## Lesson list

Slugs are final. `order` matches the number.

### Module 1 - Vectors and Spatial Reasoning

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

### Module 2 - Matrices and Transformations

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

### Module 3 - Rotations Done Right

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

### Module 4 - Time, Interpolation and Feel

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

### Module 5 - Cameras and Screen Space

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

### Module 6 - Geometry and Collision

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

### Module 7 - Physics Integration

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

1. Sidebar group under the existing `Applied Mathematics` block in `astro.config.mjs`,
   replacing the commented-out placeholder:
   `{ label: "Game Development", autogenerate: { directory: "applied/game-development" } }`
2. Turn the `game-development` card on `/applied-mathematics/` from a
   `subject-card coming-soon` `<div>` into a real `<a>` and drop the
   `coming-soon-badge`.
3. Section-label maps in `astro.config.mjs` key off `path.split('/')[0]`, which is
   `applied` for every track. Either add `applied` handling that reads the **second**
   segment, or accept no section badge on Applied pages. Decide before writing lessons.
4. Level map: Applied uses `data-level="applied"` (teal `#39d3c3`).
5. `SUBJECTS` in `src/lib/progress-map.ts` only if progress tracking is wanted for a
   track with no quizzes.
