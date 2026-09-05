/**
 * Circles and boxes: the two shapes almost every 2D game actually ships, and the three tests between them.
 *
 * All three come down to **one distance and one comparison**, and the third one comes down to the
 * second by a single clamp. That is worth saying up front, because a collision chapter can look like a
 * list of unrelated formulas to memorise when it is really one idea applied three times.
 *
 * The tests here are boolean: did they touch. Working out how to *respond* - how deep the overlap is
 * and which way to push - is Section 5.4, and mixing the two together is what makes collision code
 * hard to follow. One question at a time.
 */
import { distanceSquared, length } from "./length2d.ts";
import { displacement, type Point } from "./vectors2d.ts";

export type Circle = {
  centre: Point;
  radius: number;
};

/**
 * An axis-aligned box, stored as its two opposite corners.
 *
 * "Axis-aligned" is the whole reason this shape is cheap: its edges are always parallel to the axes, so
 * a test never has to consider an angle. A box that can rotate is Section 5.3's problem and costs a
 * great deal more.
 */
export type Aabb = {
  min: Point;
  max: Point;
};

/**
 * The same box, stored as a centre and half-widths. Both forms are common and they are not interchangeable.
 *
 * Engines disagree: Godot's `Rect2` is position and size, Unity's `Bounds` is centre and extents, and
 * plenty of code uses min/max. Passing one where the other is expected produces a box of the wrong size
 * in the wrong place, and it still looks like a box, so nothing crashes. Convert deliberately.
 */
export type Box = {
  centre: Point;
  /** Half the width and half the height. **Half**, which is the part people get wrong. */
  half: Point;
};

/** Centre-and-half-extents to min-and-max. */
export function toAabb(box: Box): Aabb {
  return {
    min: { x: box.centre.x - box.half.x, y: box.centre.y - box.half.y },
    max: { x: box.centre.x + box.half.x, y: box.centre.y + box.half.y },
  };
}

/** And back. Note the halving, which is the direction the mistake usually happens in. */
export function toBox(box: Aabb): Box {
  return {
    centre: {
      x: (box.min.x + box.max.x) / 2,
      y: (box.min.y + box.max.y) / 2,
    },
    half: {
      x: (box.max.x - box.min.x) / 2,
      y: (box.max.y - box.min.y) / 2,
    },
  };
}

/** A box from a centre and its **full** width and height, which is what a sprite's size usually is. */
export function boxAround(centre: Point, width: number, height: number): Aabb {
  return toAabb({ centre, half: { x: width / 2, y: height / 2 } });
}

/**
 * Is this box the right way round? A box built from two dragged corners often is not.
 *
 * Every test below assumes `min` really is the smaller corner. Hand one an inverted box and it reports
 * no collision, always, for any other shape - a solid wall that everything walks through, with no error
 * anywhere. Which is why `normalized` exists and why a drag should go through it.
 */
export function isValidAabb(box: Aabb): boolean {
  return box.min.x <= box.max.x && box.min.y <= box.max.y;
}

/** The same box with its corners put in the right order. */
export function normalized(box: Aabb): Aabb {
  return {
    min: {
      x: Math.min(box.min.x, box.max.x),
      y: Math.min(box.min.y, box.max.y),
    },
    max: {
      x: Math.max(box.min.x, box.max.x),
      y: Math.max(box.min.y, box.max.y),
    },
  };
}

export function boxWidth(box: Aabb): number {
  return box.max.x - box.min.x;
}

export function boxHeight(box: Aabb): number {
  return box.max.y - box.min.y;
}

// ---- Test one: two circles ------------------------------------------------------------------

/**
 * Do two circles overlap? Compare the distance between their centres against the sum of their radii.
 *
 * $$(b_x - a_x)^2 + (b_y - a_y)^2 < (r_a + r_b)^2$$
 *
 * **Squared on both sides**, so there is no square root. Section 1.3's shortcut, and this is the place
 * it earns its keep: a broad-phase check runs this thousands of times a frame.
 *
 * Strictly less than, so circles that touch exactly are **not** overlapping. That is a choice rather
 * than a fact, and the one to make: resting on the ground is touching, and a test that calls it a
 * collision leaves a character permanently colliding with the floor it is standing on.
 */
export function circlesOverlap(a: Circle, b: Circle): boolean {
  const reach = a.radius + b.radius;
  return distanceSquared(a.centre, b.centre) < reach * reach;
}

/**
 * The mistake this test invites: squaring the radii **separately** instead of squaring their sum.
 *
 * $$r_a^2 + r_b^2 \quad\text{instead of}\quad (r_a + r_b)^2 = r_a^2 + 2r_ar_b + r_b^2$$
 *
 * The missing $2r_ar_b$ is not a small correction. For two circles of equal radius it shrinks the reach
 * from $2r$ to $r\sqrt{2}$, so contact is not reported until the circles are already $29\%$ past where
 * they should have touched - a gap that reads as "collision feels late" rather than as a bug.
 */
export function circlesOverlapWrongSquare(a: Circle, b: Circle): boolean {
  return (
    distanceSquared(a.centre, b.centre) <
    a.radius * a.radius + b.radius * b.radius
  );
}

/** How far apart their surfaces are. Negative when they overlap. Section 5.4 builds on this. */
export function circleSeparation(a: Circle, b: Circle): number {
  return length(displacement(a.centre, b.centre)) - (a.radius + b.radius);
}

// ---- Test two: two boxes --------------------------------------------------------------------

/**
 * Do two ranges on one axis overlap? The whole box test is this, twice.
 *
 * Pulling it out is not tidiness. It is the idea Section 5.3's separating-axis test generalises, and
 * seeing the box test as "check every axis" here makes that Section a small step rather than a new
 * subject.
 */
export function rangesOverlap(
  minA: number,
  maxA: number,
  minB: number,
  maxB: number,
): boolean {
  return minA < maxB && minB < maxA;
}

/**
 * Do two axis-aligned boxes overlap? Only if they overlap on **both** axes.
 *
 * Easier to get right in its negative form: they miss if there is **any** axis on which one is
 * entirely to one side of the other. One separating axis is enough to prove a miss, and that is the
 * sentence Section 5.3 turns into a general algorithm.
 */
export function aabbsOverlap(a: Aabb, b: Aabb): boolean {
  return (
    rangesOverlap(a.min.x, a.max.x, b.min.x, b.max.x) &&
    rangesOverlap(a.min.y, a.max.y, b.min.y, b.max.y)
  );
}

/**
 * The overlap on each axis, negative when there is a gap. How deep, not just whether.
 *
 * The **smaller** of the two is the one that matters for pushing a shape back out, because it is the
 * shorter way to separate them. That is the minimum translation vector, and it is Section 5.4's
 * subject; here it is only the measurement.
 */
export function aabbOverlapDepth(a: Aabb, b: Aabb): { x: number; y: number } {
  return {
    x: Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x),
    y: Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y),
  };
}

/** Is this point inside the box? The degenerate case of the test above, with a box of no size. */
export function aabbContains(box: Aabb, p: Point): boolean {
  return (
    p.x >= box.min.x && p.x <= box.max.x && p.y >= box.min.y && p.y <= box.max.y
  );
}

/** The box grown outward by the same amount on every side. Used by the corner bug below. */
export function expanded(box: Aabb, by: number): Aabb {
  return {
    min: { x: box.min.x - by, y: box.min.y - by },
    max: { x: box.max.x + by, y: box.max.y + by },
  };
}

// ---- Test three: a circle and a box, which is test one in disguise ---------------------------

/**
 * The point of the box closest to `p`: **clamp the point into the box, one axis at a time.**
 *
 * $$q = \left(\text{clamp}(p_x, \min_x, \max_x),\ \text{clamp}(p_y, \min_y, \max_y)\right)$$
 *
 * Two clamps. That is the entire circle-versus-box test, and it is worth pausing on why it works: the
 * axes are independent, so the nearest allowed $x$ cannot depend on $y$. It handles all three cases -
 * nearest to a face, nearest to a corner, and the point already inside - without a single branch
 * distinguishing them.
 *
 * When `p` is inside the box the answer is `p` itself, which is correct for a containment test and
 * **not** enough for a push-out direction. Section 5.4 needs the nearest point on the boundary, which
 * is a different question and needs the branch this function avoids.
 */
export function closestPointInAabb(box: Aabb, p: Point): Point {
  return {
    x: Math.min(Math.max(p.x, box.min.x), box.max.x),
    y: Math.min(Math.max(p.y, box.min.y), box.max.y),
  };
}

/**
 * Does a circle overlap a box? Clamp the centre into the box, then it is a distance against a radius.
 *
 * Test three collapses into test one, which is the pleasant part of this Section. Still squared on both
 * sides, still no square root.
 */
export function circleAabbOverlap(circle: Circle, box: Aabb): boolean {
  const nearest = closestPointInAabb(box, circle.centre);
  return (
    distanceSquared(circle.centre, nearest) < circle.radius * circle.radius
  );
}

/**
 * The wrong version, and it is the one people reach for: **grow the box by the radius and test the centre.**
 *
 * It is right along the faces and wrong at the corners, because growing a rectangle by $r$ gives square
 * corners where the true region has rounded ones. So it reports a hit while the circle is still short of
 * the corner - a shot that stops in mid-air near a crate, which is exactly the kind of bug that gets
 * blamed on the renderer.
 *
 * The size of the mistake is not a matter of opinion. The false region is four corner squares minus
 * four quarter-discs, so its area is
 *
 * $$4r^2 - \pi r^2 = (4 - \pi)\,r^2 \approx 0.8584\,r^2$$
 *
 * independent of the box. The build measures it by sampling and compares against that expression.
 */
export function circleAabbOverlapNaive(circle: Circle, box: Aabb): boolean {
  return aabbContains(expanded(box, circle.radius), circle.centre);
}

/** How far the circle's edge is from the box. Negative when they overlap. */
export function circleAabbSeparation(circle: Circle, box: Aabb): number {
  const nearest = closestPointInAabb(box, circle.centre);
  return length(displacement(circle.centre, nearest)) - circle.radius;
}

/**
 * The exact area the naive test gets wrong, for comparing a measurement against.
 *
 * Stated as a function rather than as a comment so the check can call it, and so the claim in the
 * Section is arithmetic rather than a remembered figure.
 */
export function cornerErrorArea(radius: number): number {
  return (4 - Math.PI) * radius * radius;
}
