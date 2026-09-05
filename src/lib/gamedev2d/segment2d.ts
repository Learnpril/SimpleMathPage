/**
 * Rays, segments and lines: **one equation, three different answers about how far `t` may go.**
 *
 * $$P(t) = A + t\,(B - A)$$
 *
 * A line lets $t$ be anything. A ray starts somewhere and never comes back, so $t \ge 0$. A segment has
 * two ends, so $0 \le t \le 1$. That is the whole difference between them, and nearly every bug in this
 * Section is a place where the wrong one of those three was used.
 *
 * The other idea here is one you have already met. Section 5.1 found the closest point on a box by
 * **clamping a coordinate** into a range. This Section finds the closest point on a segment by
 * **clamping a parameter** into a range. Same move, one dimension over.
 */
import { cross } from "./cross2d.ts";
import { dot } from "./dot2d.ts";
import { distance, length, lengthSquared } from "./length2d.ts";
import { displacement, movedBy, scaled, type Point } from "./vectors2d.ts";

export type Segment = {
  a: Point;
  b: Point;
};

/** Which of the three shapes a parametric equation is being read as. The only thing that differs. */
export type Kind = "line" | "ray" | "segment";

/** The displacement from one end to the other. `t` is measured in whole multiples of this. */
export function direction(seg: Segment): Point {
  return displacement(seg.a, seg.b);
}

/** How long the segment is. Also the scale `t` is measured against, which is worth being aware of. */
export function segmentLength(seg: Segment): number {
  return distance(seg.a, seg.b);
}

/**
 * The point at parameter `t`. Not clamped, on purpose: `t = 2` is a real place, past the far end.
 *
 * $$P(t) = A + t\,(B - A)$$
 *
 * Worth noticing that this is `lerp` from Section 4.2, applied to a point. A segment **is** an
 * interpolation between its ends, and `t` is exactly the same unclamped fraction - which is why the same
 * caution applies.
 */
export function pointOn(seg: Segment, t: number): Point {
  return movedBy(seg.a, scaled(direction(seg), t));
}

/**
 * The legal range of `t`, which is the only thing separating the three shapes.
 *
 * Stated as a function so the three cases live in one place and the Section can point at it. A ray's
 * upper bound is genuinely infinite rather than "some big number", and using a big number instead is a
 * real source of bugs at scale - a sight line across a large level quietly stops working.
 */
export function clampT(t: number, kind: Kind): number {
  if (kind === "line") return t;
  if (kind === "ray") return Math.max(t, 0);
  return Math.min(Math.max(t, 0), 1);
}

/** Is this value of `t` on the shape at all? The same three cases, asked the other way. */
export function containsT(t: number, kind: Kind): boolean {
  if (kind === "line") return true;
  if (kind === "ray") return t >= 0;
  return t >= 0 && t <= 1;
}

/**
 * The parameter of the perpendicular foot: where along the infinite line `p` projects to.
 *
 * $$t = \frac{(P - A) \cdot (B - A)}{|B - A|^2}$$
 *
 * A dot product over a squared length, which is Section 1.4's projection with the division that turns
 * it into a fraction of the way along. **Unclamped**, so the answer can be negative or greater than one,
 * and that is information rather than a problem - it says which side of the segment you are past.
 *
 * Returns `null` for a segment with no length, where there is no direction to project onto and the
 * division would be $0/0$. That is the guard this function exists for: without it the `NaN` flows into a
 * position and a sprite disappears with nothing logged.
 */
export function projectionT(seg: Segment, p: Point): number | null {
  const d = direction(seg);
  const lengthSq = lengthSquared(d);
  if (lengthSq < 1e-12) return null;
  return dot(displacement(seg.a, p), d) / lengthSq;
}

/**
 * The closest point on a line, ray or segment: **project, then clamp the parameter.**
 *
 * Two steps, and the second one is the one people leave out. Without the clamp you get the closest point
 * on the infinite **line**, which is a different place as soon as you are past either end - so a guard
 * measures its distance to a wall that is not there, and a character slides along the imaginary
 * continuation of a platform.
 *
 * For a zero-length segment the answer is its single point, which is the sensible reading of "the
 * nearest part of a shape that is one point".
 */
export function closestPoint(
  seg: Segment,
  p: Point,
  kind: Kind = "segment",
): Point {
  const t = projectionT(seg, p);
  return t === null ? seg.a : pointOn(seg, clampT(t, kind));
}

/** How far `p` is from the nearest part of the segment. */
export function distanceToSegment(seg: Segment, p: Point): number {
  return distance(p, closestPoint(seg, p, "segment"));
}

/** The same without the square root, for comparisons. Section 1.3's shortcut, still applicable. */
export function distanceSquaredToSegment(seg: Segment, p: Point): number {
  const q = closestPoint(seg, p, "segment");
  return lengthSquared(displacement(q, p));
}

/**
 * The perpendicular distance to the **infinite line** through the segment. The unclamped answer.
 *
 * Here so the build can price the missing clamp rather than describe it. It is also the right function
 * sometimes - "how far off the road's centreline am I" is a question about a line - so the point is not
 * that it is wrong but that the two are different questions.
 */
export function distanceToLine(seg: Segment, p: Point): number {
  const d = direction(seg);
  const len = length(d);
  if (len < 1e-12) return distance(seg.a, p);
  // The cross product's magnitude is the parallelogram's area, and area over base is height.
  return Math.abs(cross(d, displacement(seg.a, p))) / len;
}

// ---- Where two of them cross ------------------------------------------------------------------

export type Crossing = {
  /** How far along the first shape, in its own parameter. */
  t: number;
  /** How far along the second. Both are needed: either can be out of range. */
  u: number;
  point: Point;
};

/**
 * Where two lines cross, using the 2D cross product from Section 2.1.
 *
 * With $r = B - A$ and $s = D - C$:
 *
 * $$t = \frac{(C - A) \times s}{r \times s} \qquad u = \frac{(C - A) \times r}{r \times s}$$
 *
 * Both parameters come out of one division, which is why this is the standard form. **Returns `null`
 * when the denominator is zero**, which means the two are parallel - and that case has to be handled
 * rather than divided through, because the formula produces `Infinity` or `NaN` and both propagate.
 *
 * The caller decides what counts as a hit by testing `t` and `u` against the ranges of the two shapes
 * it actually has. That is the whole reason the parameters are returned rather than a boolean.
 */
export function lineCrossing(first: Segment, second: Segment): Crossing | null {
  const r = direction(first);
  const s = direction(second);
  const denominator = cross(r, s);
  if (Math.abs(denominator) < 1e-12) return null;
  const ac = displacement(first.a, second.a);
  const t = cross(ac, s) / denominator;
  const u = cross(ac, r) / denominator;
  return { t, u, point: pointOn(first, t) };
}

/** Are the two parallel? Then `lineCrossing` cannot answer, whatever else is true of them. */
export function areParallel(first: Segment, second: Segment): boolean {
  return Math.abs(cross(direction(first), direction(second))) < 1e-12;
}

/** Parallel **and** on the same line, which is the case that needs its own answer entirely. */
export function areCollinear(first: Segment, second: Segment): boolean {
  if (!areParallel(first, second)) return false;
  return (
    Math.abs(cross(direction(first), displacement(first.a, second.a))) < 1e-12
  );
}

/**
 * Do two **collinear** segments overlap? The case the cross-product formula cannot reach.
 *
 * When two segments lie along the same line they either share infinitely many points or none, and
 * "where do they cross" has no single answer - so the general formula divides by zero and returns
 * `null`. Left there, two segments lying exactly on top of each other are reported as not touching,
 * which is a wall a character can walk through only when perfectly aligned with it. Rare, reproducible,
 * and maddening.
 *
 * Solved by projecting both onto the shared direction and comparing the two ranges - which is Section
 * 5.1's range check, doing its third job.
 */
export function collinearOverlap(first: Segment, second: Segment): boolean {
  if (!areCollinear(first, second)) return false;
  const d = direction(first);
  const lengthSq = lengthSquared(d);
  if (lengthSq < 1e-12) {
    // A degenerate first segment is a point: it overlaps if it lies on the second.
    return distanceToSegment(second, first.a) < 1e-9;
  }
  const at = (p: Point) => dot(displacement(first.a, p), d) / lengthSq;
  const lo = Math.min(at(second.a), at(second.b));
  const hi = Math.max(at(second.a), at(second.b));
  return hi >= 0 && lo <= 1;
}

/**
 * Do two **segments** cross, and where? The parameters checked against $0 \le t,u \le 1$.
 *
 * Note both must be in range. Testing only `t` answers a different question - "does the first segment
 * cross the infinite line of the second" - and that is the bug that makes a short wall block a sight
 * line across the whole level.
 */
export function segmentCrossing(
  first: Segment,
  second: Segment,
): Crossing | null {
  const crossing = lineCrossing(first, second);
  if (crossing === null) return null;
  return containsT(crossing.t, "segment") && containsT(crossing.u, "segment")
    ? crossing
    : null;
}

/**
 * Where a ray first meets a segment: $t \ge 0$ on the ray, $0 \le u \le 1$ on the segment.
 *
 * The asymmetry is the point. One shape is unbounded ahead and bounded behind; the other is bounded at
 * both ends. Using the same test for both is how a ray ends up hitting things behind the shooter.
 */
export function rayHitsSegment(
  origin: Point,
  through: Point,
  wall: Segment,
): Crossing | null {
  const crossing = lineCrossing({ a: origin, b: through }, wall);
  if (crossing === null) return null;
  return containsT(crossing.t, "ray") && containsT(crossing.u, "segment")
    ? crossing
    : null;
}

// ---- Line of sight ---------------------------------------------------------------------------

/**
 * The first wall a sight line meets, or `null` for a clear view.
 *
 * "First" means smallest `t`, and taking the smallest is what makes this usable for anything beyond a
 * yes-or-no answer - a laser that stops at the wall it hit, a bullet hole in the right surface. The
 * collinear case is folded in: a sight line running exactly along a wall is blocked by it, which the
 * general formula cannot report.
 */
export function firstBlocker(
  from: Point,
  to: Point,
  walls: readonly Segment[],
): { wall: Segment; crossing: Crossing } | null {
  const sight: Segment = { a: from, b: to };
  let best: { wall: Segment; crossing: Crossing } | null = null;
  for (const wall of walls) {
    const crossing = segmentCrossing(sight, wall);
    if (crossing === null) {
      // Lying along a wall counts as blocked, and has no single crossing point to report.
      if (collinearOverlap(sight, wall)) {
        const grazing: Crossing = { t: 0, u: 0, point: from };
        if (best === null) best = { wall, crossing: grazing };
      }
      continue;
    }
    if (best === null || crossing.t < best.crossing.t)
      best = { wall, crossing };
  }
  return best;
}

/** Can one point see another, given some walls? The question a guard actually asks. */
export function hasLineOfSight(
  from: Point,
  to: Point,
  walls: readonly Segment[],
): boolean {
  return firstBlocker(from, to, walls) === null;
}

/**
 * The first wall a sight line meets **if every wall is read as an infinite line**, or `null`.
 *
 * A wall is a segment. Read it as the line it lies on and it goes on for ever in both directions, so it
 * blocks views that pass nowhere near it. Kept here beside the correct version so the build can count
 * what that costs rather than the page asserting it matters.
 *
 * Returns the crossing rather than a boolean so a picture can mark **where** the phantom wall stopped
 * the view - which is a more useful thing to see than the absence of a line.
 */
export function firstBlockerWrong(
  from: Point,
  to: Point,
  walls: readonly Segment[],
): { wall: Segment; crossing: Crossing } | null {
  const sight: Segment = { a: from, b: to };
  let best: { wall: Segment; crossing: Crossing } | null = null;
  for (const wall of walls) {
    const crossing = lineCrossing(sight, wall);
    // Only `t` is tested, so the wall's own ends are ignored entirely. That is the bug.
    if (crossing === null || !containsT(crossing.t, "segment")) continue;
    if (best === null || crossing.t < best.crossing.t)
      best = { wall, crossing };
  }
  return best;
}

/** The same question as a boolean, for sweeping. */
export function hasLineOfSightWrong(
  from: Point,
  to: Point,
  walls: readonly Segment[],
): boolean {
  return firstBlockerWrong(from, to, walls) === null;
}
