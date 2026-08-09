/**
 * Bounding volumes, and the tests that ask whether two of them touch.
 *
 * **Every test in this file returns one number: the separation.** Negative means the shapes
 * overlap, zero means they are exactly touching, positive is the gap between them. So
 * "are we colliding" is `separation < 0` for all of them, and the number itself is useful -
 * it is how far apart they are, or how deep they are in, which is what Section 6.3 needs.
 *
 * That is Section 6.1's signed distance again, applied to pairs of shapes instead of to a
 * point and a shape, and it is the reason these tests are short. Two spheres reduce to a
 * distance minus two radii. A sphere and a box reduce to `closestOnBox` plus that same
 * subtraction. Two capsules reduce to the distance between two segments, minus two radii.
 *
 * Ray-sphere lives in `projection.ts`, where picking needed it in Section 5.2, and is not
 * repeated here.
 */
import type { Vec3 } from "./matrices.ts";
import { closestOnBox, closestOnSegment, magnitude } from "./geometry.ts";

const sub = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});
const add = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});
const mul = (a: Vec3, k: number): Vec3 => ({
  x: a.x * k,
  y: a.y * k,
  z: a.z * k,
});
const dot3 = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** A ball. The cheapest volume there is, and rotation-proof: turning it changes nothing. */
export type Sphere = { centre: Vec3; radius: number };

/** An axis-aligned box, stored as two opposite corners. Cannot be rotated. */
export type Aabb = { min: Vec3; max: Vec3 };

/** A segment with a radius: a cylinder with a hemisphere on each end. */
export type Capsule = { a: Vec3; b: Vec3; radius: number };

/** A box that can be turned. Its own three axes, plus half-widths along each of them. */
export type Obb = { centre: Vec3; axes: [Vec3, Vec3, Vec3]; half: Vec3 };

// ---- Volume against volume ---------------------------------------------------------------

/**
 * Two spheres: the distance between the centres, minus both radii.
 *
 * Nothing else needs saying, which is exactly why spheres are the first thing a broad phase
 * reaches for. Note that a real broad phase compares **squared** distance against the
 * squared radius sum, as Section 1.2 argued, and only takes the square root when it needs
 * the separation as a number rather than a yes or no.
 */
export function sphereSphere(a: Sphere, b: Sphere): number {
  return magnitude(sub(b.centre, a.centre)) - a.radius - b.radius;
}

/**
 * A sphere against an axis-aligned box: the closest point on the box, minus the radius.
 *
 * This is Section 6.1's three clamps and one subtraction. It is worth noticing that the
 * result is only correct **outside** the box - once the centre is inside, `closestOnBox`
 * returns the centre itself and the answer saturates at `-radius` instead of continuing to
 * grow. For a test against zero that does not matter. For a push-out depth it does, and
 * Section 6.3 uses the signed distance instead for that reason.
 */
export function sphereAabb(s: Sphere, box: Aabb): number {
  return (
    magnitude(sub(s.centre, closestOnBox(box.min, box.max, s.centre))) -
    s.radius
  );
}

/**
 * Two axis-aligned boxes, and **which axis separated them**.
 *
 * The gap along one axis is whichever box starts after the other one ends. Do that three
 * times and take the largest: if any axis has a positive gap the boxes cannot be touching,
 * no matter what the other two say, and that axis is the proof.
 *
 * This is the separating-axis idea in its simplest possible form. An axis on which the two
 * shadows do not overlap is a **separating axis**, and one is enough to rule out contact.
 * When all three overlap, the largest gap is the negative number closest to zero, which is
 * the shallowest direction - the cheapest way back out.
 */
export function aabbAabb(
  a: Aabb,
  b: Aabb,
): { separation: number; axis: "x" | "y" | "z" } {
  const axes: Array<"x" | "y" | "z"> = ["x", "y", "z"];
  let worst = -Infinity;
  let which: "x" | "y" | "z" = "x";
  for (const k of axes) {
    const gap = Math.max(a.min[k] - b.max[k], b.min[k] - a.max[k]);
    if (gap > worst) {
      worst = gap;
      which = k;
    }
  }
  return { separation: worst, axis: which };
}

/**
 * The closest pair of points on two segments.
 *
 * This is the only routine here that is genuinely fiddly, and it is worth the trouble
 * because it is what makes capsules cheap. Solve for the closest points as if both were
 * infinite lines, clamp one parameter to its segment, then **re-solve the other** against
 * the clamped value. Skipping that re-solve is the classic bug: it gives a point that is
 * closest to the wrong line and it is only wrong near the ends.
 *
 * The parallel case has no unique answer - every pair along the overlap ties - so a zero
 * denominator picks one rather than dividing by it.
 */
export function closestBetweenSegments(
  p1: Vec3,
  q1: Vec3,
  p2: Vec3,
  q2: Vec3,
): { c1: Vec3; c2: Vec3 } {
  const d1 = sub(q1, p1);
  const d2 = sub(q2, p2);
  const r = sub(p1, p2);
  const a = dot3(d1, d1);
  const e = dot3(d2, d2);
  const f = dot3(d2, r);
  const tiny = 1e-12;

  // Degenerate segments are points, and a point against a segment is Section 6.1's clamp.
  if (a <= tiny && e <= tiny) return { c1: p1, c2: p2 };
  if (a <= tiny) return { c1: p1, c2: add(p2, mul(d2, clamp01(f / e))) };
  const c = dot3(d1, r);
  if (e <= tiny) return { c1: add(p1, mul(d1, clamp01(-c / a))), c2: p2 };

  const b = dot3(d1, d2);
  const denominator = a * e - b * b;
  let s = denominator !== 0 ? clamp01((b * f - c * e) / denominator) : 0;
  let t = (b * s + f) / e;

  // t left its segment, so pin it and solve s again against the pinned value.
  if (t < 0) {
    t = 0;
    s = clamp01(-c / a);
  } else if (t > 1) {
    t = 1;
    s = clamp01((b - c) / a);
  }
  return { c1: add(p1, mul(d1, s)), c2: add(p2, mul(d2, t)) };
}

/**
 * Two capsules: the distance between their segments, minus both radii.
 *
 * Structurally identical to two spheres, with a segment where each centre was. That is the
 * whole reason a capsule is the shape almost every character uses - it covers a standing
 * body far better than a sphere, it has no corners to catch on stairs the way a box does,
 * and it stays this cheap.
 */
export function capsuleCapsule(a: Capsule, b: Capsule): number {
  const { c1, c2 } = closestBetweenSegments(a.a, a.b, b.a, b.b);
  return magnitude(sub(c2, c1)) - a.radius - b.radius;
}

/** A sphere against a capsule: distance from the centre to the segment, minus both radii. */
export function sphereCapsule(s: Sphere, c: Capsule): number {
  return (
    magnitude(sub(s.centre, closestOnSegment(c.a, c.b, s.centre))) -
    s.radius -
    c.radius
  );
}

// ---- Ray against an axis-aligned box, by slabs -------------------------------------------

/**
 * The stretch of the ray that lies between one pair of parallel planes.
 *
 * A box is three of these overlapping. Each pair of faces defines a **slab**, the ray enters
 * it at one `t` and leaves at another, and the ray is inside the box only where all three
 * stretches overlap at once.
 *
 * A ray parallel to a slab never crosses either plane, so the interval is everything or
 * nothing depending on which side it started - and that is the case that produces
 * `0 / 0` if the division is done blindly. Note the swap: a negative direction component
 * makes the far face the entry.
 */
export function slabInterval(
  origin: number,
  direction: number,
  lo: number,
  hi: number,
): { enter: number; exit: number } | null {
  if (Math.abs(direction) < 1e-12) {
    return origin >= lo && origin <= hi
      ? { enter: -Infinity, exit: Infinity }
      : null;
  }
  const t1 = (lo - origin) / direction;
  const t2 = (hi - origin) / direction;
  return t1 <= t2 ? { enter: t1, exit: t2 } : { enter: t2, exit: t1 };
}

/**
 * Ray against a box: intersect the three slab intervals.
 *
 * `enter` is the largest of the three entries and `exit` the smallest of the three exits.
 * If the entry ends up past the exit, the ray misses - it was inside two slabs at one
 * moment and the third at another, never all three together.
 *
 * A negative `enter` with a positive `exit` means the ray started **inside** the box, which
 * callers usually want to know about rather than treat as a hit at a negative distance.
 */
export function rayAabb(
  origin: Vec3,
  direction: Vec3,
  box: Aabb,
): { enter: number; exit: number; startedInside: boolean } | null {
  let enter = -Infinity;
  let exit = Infinity;
  for (const k of ["x", "y", "z"] as const) {
    const slab = slabInterval(origin[k], direction[k], box.min[k], box.max[k]);
    if (slab === null) return null;
    enter = Math.max(enter, slab.enter);
    exit = Math.min(exit, slab.exit);
    if (enter > exit) return null;
  }
  if (exit < 0) return null;
  return { enter, exit, startedInside: enter < 0 };
}

// ---- Oriented boxes, and the general form of the same idea -------------------------------

/**
 * The shadow an oriented box casts on a direction, as an interval.
 *
 * Project the centre for the middle of the interval, and add up how far each half-width
 * reaches along the axis for its width. The absolute values are there because it does not
 * matter which way each of the box's own axes happens to point.
 */
export function obbInterval(box: Obb, axis: Vec3): { lo: number; hi: number } {
  const middle = dot3(box.centre, axis);
  const reach =
    Math.abs(dot3(box.axes[0], axis)) * box.half.x +
    Math.abs(dot3(box.axes[1], axis)) * box.half.y +
    Math.abs(dot3(box.axes[2], axis)) * box.half.z;
  return { lo: middle - reach, hi: middle + reach };
}

/** The gap between two shadows on one axis. Positive means that axis separates them. */
export function intervalGap(
  a: { lo: number; hi: number },
  b: { lo: number; hi: number },
): number {
  return Math.max(a.lo - b.hi, b.lo - a.hi);
}

/**
 * Two oriented boxes, tested along one axis you supply.
 *
 * The full test needs **fifteen** axes: the three of each box, plus the nine cross products
 * of one box's axis with the other's. Find a positive gap on any of them and you are done -
 * the boxes are apart, and you can stop. Only when all fifteen overlap do they touch.
 *
 * Two boxes can be clear of each other while overlapping on all six of their own axes, and
 * the nine cross-product axes are what catch that: an edge of one crossing an edge of the
 * other. This function is the piece the loop calls, kept separate so the idea is visible
 * without the bookkeeping around it.
 */
export function obbSeparationAlong(a: Obb, b: Obb, axis: Vec3): number {
  const length = magnitude(axis);
  if (length < 1e-9) return -Infinity; // A degenerate axis proves nothing either way.
  const unit = mul(axis, 1 / length);
  return intervalGap(obbInterval(a, unit), obbInterval(b, unit));
}

// ---- Broad phase -------------------------------------------------------------------------

/** The box that contains a sphere. What a broad phase stores instead of the sphere. */
export function aabbOfSphere(s: Sphere): Aabb {
  const r = { x: s.radius, y: s.radius, z: s.radius };
  return { min: sub(s.centre, r), max: add(s.centre, r) };
}

/** The box that contains a capsule: both end spheres, combined. */
export function aabbOfCapsule(c: Capsule): Aabb {
  const r = { x: c.radius, y: c.radius, z: c.radius };
  return {
    min: sub(
      {
        x: Math.min(c.a.x, c.b.x),
        y: Math.min(c.a.y, c.b.y),
        z: Math.min(c.a.z, c.b.z),
      },
      r,
    ),
    max: add(
      {
        x: Math.max(c.a.x, c.b.x),
        y: Math.max(c.a.y, c.b.y),
        z: Math.max(c.a.z, c.b.z),
      },
      r,
    ),
  };
}

/**
 * How many pairs `n` objects have. This is the number that forces a broad phase to exist.
 *
 * It grows as the square, so it is not a constant factor you can optimise away by making
 * the narrow test faster - it is the reason the narrow test must not run on most pairs.
 */
export function pairCount(n: number): number {
  return (n * (n - 1)) / 2;
}
