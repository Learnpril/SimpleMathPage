---
inclusion: fileMatch
fileMatchPattern: "src/content/docs/applied/2d-game-development/**"
---

# Math for 2D Game Development: settled curriculum

Visual and figure standards live in `applied-math-visuals.md`, which governs this track
too - including the no-Run-button, scene-plus-code, under-eight-rows rules.

## Why this track exists

Most game-math resources throw a beginner into three dimensions immediately: handedness,
basis vectors, a cross product that returns a vector, and a forward convention that points
along negative Z, all on page one. That is a lot of bookkeeping before you have written a
single movement loop.

2D has none of that bookkeeping. A direction is two numbers. A rotation is one angle. The
cross product is one number, and its sign just tells you "which side". Collision is two
shapes overlapping in a picture you can draw on paper. Nothing is hidden behind a
convention.

This track teaches the reasoning where it can be **seen**, which is a better starting
point whether the reader goes on to 3D or stays in 2D.

## Settled decisions

- **Canvas 2D, not Three.js.** A deliberate difference from the 3D track. The demo code is
  the thing a beginner reads, and `ctx.fillRect(x, y, w, h)` is readable to someone who has
  never seen a scene graph, a camera or a mesh. It also keeps the 500 KB Three.js chunk out
  of a beginner track entirely. Add a `makeCanvas2D` helper to `ui.ts` rather than pulling
  in a rendering library.
- **The Y-axis-points-down problem is lesson 1**, not a footnote. It is the single most
  common source of confusion in 2D and it has no 3D equivalent, so it earns the opening
  slot the way handedness does in the 3D track.
- **No handedness, no quaternions, no gimbal lock.** Those are the 3D track's problems.
  Mentioning them here would be borrowing trouble.
- **Engine names stay, engine setup goes.** Same rule as other Applied tracks: short
  `:::note[In an engine]` asides naming methods - `Vector2.angle_to()`, `move_and_slide()`,
  `Rect2.intersects()` - and no project instructions.
- **Self-contained.** The track stands alone. Lessons may mention that a 3D version of the
  idea exists - a single sentence at the end, not a section - but the 2D lesson is complete
  without it. A reader who never touches 3D must never feel they are reading half a track.
- **20 pages**: about + 18 lessons + capstone. Shorter than many Core sections on
  purpose; brevity is a feature at the front door.
- **No quizzes.** Applied is a guide and reference.

## Prerequisites, to state on the about page

Deliberately light, and this is the selling point. Algebra Basics for solving an equation,
Geometry for the Pythagorean theorem and coordinates, and the first half of Trigonometry
for sine, cosine and the unit circle. Nothing else. No Linear Algebra, no Calculus.

## Lesson list

Slugs are final. `order` matches the number. Nothing here is written yet.

### Module 1 - The Screen and Its Coordinates

1. `pixels-coordinates-and-the-y-axis` - screen space versus world space, the origin in
   the top-left, **why Y points down** and what that does to every angle and every
   "up" you write. Resolution independence and why you should not think in pixels.
   Visual: one point shown in both conventions at once, with a toggle.
2. `points-vectors-and-directions` - a place versus a displacement, adding, subtracting,
   scaling. Point minus point is a vector; point plus vector is a point. Visual: draggable
   pair of points with the arrow between them.
3. `length-distance-and-normalizing` - magnitude by Pythagoras, unit vectors, distance,
   squared distance and when to skip the square root, guarding a zero-length normalize.
   **Hosts the diagonal speed bug**, which is the clearest first lesson in the track.
   Visual: the input square versus the input circle, direction on a slider.
4. `the-dot-product` - sign as a facing test, projection, angle between. Clamping before
   `acos`. Visual: a guard's vision cone in plan view.

### Module 2 - Turning and Aiming

5. `the-2d-cross-product-and-which-side` - the single number $a_x b_y - a_y b_x$, its sign
   as "which side of this line", its magnitude as parallelogram area, and winding order for
   polygons. Much easier than its 3D counterpart and does most of the same work.
   Visual: a point crossing a line, the sign flipping.
6. `angles-radians-and-atan2` - degrees versus radians, `atan2` and why plain `atan`
   almost never works, aiming at a target, the unit circle as the source of both. Visual:
   a turret aiming at a draggable target with the angle drawn.
7. `rotating-a-point-and-turning-smoothly` - the rotation formula, rotating about an
   arbitrary pivot, wrapping an angle difference to $\pm 180$, turning the short way at a
   limited rate. Visual: the turret again, with wrapping on a checkbox.

### Module 3 - Transforms and Cameras

8. `translate-rotate-and-scale` - the three operations, why order matters, and the 3×3
   matrix that packages them. Introduces homogeneous coordinates in the setting where the
   matrix is small enough to read. Visual: a sprite under all six orderings.
9. `parents-children-and-local-space` - hierarchies, a turret on a tank, converting a
   point between local and world space. Visual: a two-level hierarchy with both frames
   drawn.
10. `cameras-panning-zooming-and-screen-to-world` - the camera as an inverse transform,
    zoom about a point rather than the origin, converting a click into a world position,
    and parallax layers. Visual: a pannable, zoomable scene with the cursor's world
    position shown.

### Module 4 - Time, Motion and Feel

11. `delta-time-and-frame-rate-independence` - **the highest-value lesson in the track**,
    same as in 3D and easier to see here. Why `lerp(current, target, 0.1)` per frame
    converges faster on a 144 Hz screen, and exponential decay as the fix. Comes before
    anything that moves. Visual: two followers at simulated 30 and 144 fps.
12. `lerp-easing-and-smoothing` - lerp, inverse lerp, remap, clamp, smoothstep, the
    standard easing families and what each one communicates. Visual: an easing gallery,
    each curve paired with a moving sprite.
13. `bezier-curves-and-following-a-path` - quadratic and cubic, control points, de
    Casteljau, using the tangent as a facing direction, and chaining curves. Visual:
    draggable control points with a sprite travelling the path.

### Module 5 - Collision

14. `circles-and-boxes` - circle-circle, AABB-AABB, circle-AABB. The two shapes almost
    every 2D game actually ships. Visual: two draggable shapes with the overlap drawn.
15. `rays-segments-and-closest-points` - parametric segments, segment intersection,
    closest point on a segment, line of sight. Visual: a draggable segment pair with the
    intersection marked.
16. `polygons-and-the-separating-axis` - convex polygons, the separating axis test, and
    why 2D is where this idea is genuinely learnable. Visual: two rotatable polygons with
    the separating axis drawn when they miss.
17. `collision-response-and-sliding` - detection is half the job. Penetration depth, the
    minimum translation vector, removing the normal component of velocity to slide along a
    wall, and tunneling at speed. Visual: velocity splitting against a wall, angle on a
    slider.

### Module 6 - Physics

18. `velocity-gravity-and-jump-arcs` - position, velocity and acceleration without
    calculus, gravity, terminal velocity, and solving a jump backwards from the height and
    airtime you want. Visual: a jump arc with height and airtime as sliders.

### Capstone

19. `capstone-2d-platformer-character` - input to a normalized direction, semi-implicit
    velocity on a fixed timestep, move-and-slide against tiles with an AABB, coyote time
    and jump buffering as interpolation problems, and a camera that follows without
    jitter. Names the lesson each piece comes from.

## Registration checklist

1. Sidebar group in `astro.config.mjs`, **before** the 3D group. Done.
2. Section-label maps in `astro.config.mjs` - both the badge map and the pagination map
   need `'applied/2d-game-development': '2D Game Development'`. Done.
3. Mobile FAB `subjects` array needs a matching entry with
   `about:'about-2d-game-development'`. Done.
4. A real `<a>` card on `/applied-mathematics/`, placed before the 3D card. Done.
5. Level map already keys off the first segment, `applied`, so teal `#39d3c3` needs no
   change.
6. `GameDev2DTopicMap.astro` for the about page's module map. Done.
