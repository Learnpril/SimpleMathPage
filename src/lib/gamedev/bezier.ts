/**
 * Bezier curves, built from nothing but repeated `lerp`.
 *
 * That is the whole idea and it is worth saying before any polynomials appear: take the control
 * points, lerp between each neighbouring pair to get one fewer point, and repeat until a single
 * point is left. That point is on the curve. The polynomial form is what falls out if you expand
 * the algebra, but the repeated lerp - de Casteljau's algorithm - is the definition worth carrying.
 */
import { lerp } from "./interpolation.ts";
import type { Vec2 } from "./matrices.ts";

/** Lerp two points. Every function below is built on this and nothing else. */
export const lerp2 = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

/** One round of de Casteljau: `n` points become the `n - 1` points between them. */
export function deCasteljauStep(points: readonly Vec2[], t: number): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i + 1 < points.length; i += 1) {
    out.push(lerp2(points[i], points[i + 1], t));
  }
  return out;
}

/**
 * Every level of the construction, from the control points down to the single point on the curve.
 *
 * The scene draws the middle levels, because those lines are the algorithm made visible.
 */
export function deCasteljauLevels(
  points: readonly Vec2[],
  t: number,
): Vec2[][] {
  const levels: Vec2[][] = [points.slice()];
  while (levels[levels.length - 1].length > 1) {
    levels.push(deCasteljauStep(levels[levels.length - 1], t));
  }
  return levels;
}

/** The point on the curve, for any number of control points. */
export function bezierAt(points: readonly Vec2[], t: number): Vec2 {
  const levels = deCasteljauLevels(points, t);
  return levels[levels.length - 1][0];
}

/**
 * The last segment of the construction is **tangent to the curve**, which the scene draws.
 *
 * So de Casteljau hands you the direction of travel for free, with no derivative taken. For a
 * curve of degree `n` the tangent is `n` times that final segment.
 */
export function tangentFromLevels(levels: Vec2[][]): Vec2 {
  const degree = levels[0].length - 1;
  const last = levels[levels.length - 2];
  return {
    x: degree * (last[1].x - last[0].x),
    y: degree * (last[1].y - last[0].y),
  };
}

// ---- The polynomial form -----------------------------------------------------------------

/**
 * The four weights a cubic puts on its control points, known as the Bernstein basis.
 *
 * They always sum to 1, which is what makes the curve stay inside the shape its control points
 * span - it is a weighted average of them at every `t`.
 */
export function cubicWeights(t: number): [number, number, number, number] {
  const u = 1 - t;
  return [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
}

/** The same point as `bezierAt` on four control points, reached by expanding the algebra. */
export function cubicAt(p: readonly Vec2[], t: number): Vec2 {
  const w = cubicWeights(t);
  return {
    x: w[0] * p[0].x + w[1] * p[1].x + w[2] * p[2].x + w[3] * p[3].x,
    y: w[0] * p[0].y + w[1] * p[1].y + w[2] * p[2].y + w[3] * p[3].y,
  };
}

/**
 * The derivative of a cubic Bezier is a **quadratic Bezier** on the gaps between control points.
 *
 * Which is a pleasant fact rather than a coincidence: differentiating drops the degree by one and
 * leaves the same construction behind, so the tangent is a Bezier curve in its own right.
 */
export function cubicTangent(p: readonly Vec2[], t: number): Vec2 {
  const gap = (a: Vec2, b: Vec2): Vec2 => ({
    x: 3 * (b.x - a.x),
    y: 3 * (b.y - a.y),
  });
  return bezierAt([gap(p[0], p[1]), gap(p[1], p[2]), gap(p[2], p[3])], t);
}

// ---- Chaining ----------------------------------------------------------------------------

export type Cubic = readonly [Vec2, Vec2, Vec2, Vec2];

const near2 = (a: Vec2, b: Vec2, tol: number) =>
  Math.abs(a.x - b.x) < tol && Math.abs(a.y - b.y) < tol;

/** C0: the two halves actually touch. Without this there is a visible gap. */
export function meets(a: Cubic, b: Cubic, tol = 1e-9): boolean {
  return near2(a[3], b[0], tol);
}

/**
 * G1: the tangents point the same way, so there is no visible corner.
 *
 * Enough for something that only has to *look* smooth, and cheaper to author by hand.
 */
export function sameDirection(a: Cubic, b: Cubic, tol = 1e-9): boolean {
  const u = { x: a[3].x - a[2].x, y: a[3].y - a[2].y };
  const v = { x: b[1].x - b[0].x, y: b[1].y - b[0].y };
  const lu = Math.hypot(u.x, u.y);
  const lv = Math.hypot(v.x, v.y);
  if (lu < tol || lv < tol) return false;
  return (
    Math.abs((u.x * v.y - u.y * v.x) / (lu * lv)) < tol &&
    u.x * v.x + u.y * v.y > 0
  );
}

/**
 * C1: the tangents are identical, length included, so **speed** matches across the joint too.
 *
 * The difference matters for anything travelling the path rather than looking at it. A camera on a
 * G1-but-not-C1 join changes pace at the seam, which reads as a stumble.
 */
export function sameTangent(a: Cubic, b: Cubic, tol = 1e-9): boolean {
  return near2(
    { x: a[3].x - a[2].x, y: a[3].y - a[2].y },
    { x: b[1].x - b[0].x, y: b[1].y - b[0].y },
    tol,
  );
}

/**
 * A jump as a quadratic Bezier: launch, one control point, landing.
 *
 * The control point sits at **twice** the apex height, because a quadratic at its midpoint is
 * `(P0 + 2*P1 + P2) / 4` - the middle point only gets half the vote, so it has to reach twice as
 * high to pull the curve to the height you asked for. Section 7.1 derives the same arc from
 * gravity instead.
 */
export function jumpArc(distance: number, height: number): [Vec2, Vec2, Vec2] {
  return [
    { x: 0, y: 0 },
    { x: distance / 2, y: 2 * height },
    { x: distance, y: 0 },
  ];
}
