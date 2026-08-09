/**
 * Curves that go **through** the points you place, and the lookup table that makes travelling
 * along one happen at a steady speed.
 *
 * Section 4.3's Bezier curves are steered by handles the curve never touches, which is right for
 * drawing and wrong for a path through waypoints. Hermite curves take a point and a *tangent* at
 * each end instead, and Catmull-Rom works out the tangents for you - so placing four points gives
 * you a smooth path through all four with nothing else to tune.
 */
import { lerp } from "./interpolation.ts";
import type { Vec2 } from "./matrices.ts";

const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
const scale = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });

/**
 * The four Hermite basis functions, in the order they weight
 * `[start point, start tangent, end point, end tangent]`.
 *
 * Their shape encodes the whole contract: at `t = 0` only the first is non-zero and at `t = 1`
 * only the third is, so the curve hits both points exactly. The two tangent weights vanish at
 * both ends but have slope 1 there, which is what makes the tangents come out as asked.
 */
export function hermiteBasis(t: number): [number, number, number, number] {
  const t2 = t * t;
  const t3 = t2 * t;
  return [
    2 * t3 - 3 * t2 + 1, // start point
    t3 - 2 * t2 + t, // start tangent
    -2 * t3 + 3 * t2, // end point
    t3 - t2, // end tangent
  ];
}

/** A cubic through `p0` and `p1`, leaving with velocity `m0` and arriving with velocity `m1`. */
export function hermiteAt(
  p0: Vec2,
  m0: Vec2,
  p1: Vec2,
  m1: Vec2,
  t: number,
): Vec2 {
  const [a, b, c, d] = hermiteBasis(t);
  return {
    x: a * p0.x + b * m0.x + c * p1.x + d * m1.x,
    y: a * p0.y + b * m0.y + c * p1.y + d * m1.y,
  };
}

/** The velocity along a Hermite segment, by differentiating the basis. */
export function hermiteTangent(
  p0: Vec2,
  m0: Vec2,
  p1: Vec2,
  m1: Vec2,
  t: number,
): Vec2 {
  const t2 = t * t;
  const a = 6 * t2 - 6 * t;
  const b = 3 * t2 - 4 * t + 1;
  const c = -6 * t2 + 6 * t;
  const d = 3 * t2 - 2 * t;
  return {
    x: a * p0.x + b * m0.x + c * p1.x + d * m1.x,
    y: a * p0.y + b * m0.y + c * p1.y + d * m1.y,
  };
}

/**
 * The same segment written as a cubic Bezier, which is what Section 4.3 already knows how to draw.
 *
 * The handles sit **one third** of the way along each tangent. That factor of three is the same
 * one that appeared in `cubicTangent`, seen from the other side.
 */
export function hermiteToBezier(
  p0: Vec2,
  m0: Vec2,
  p1: Vec2,
  m1: Vec2,
): [Vec2, Vec2, Vec2, Vec2] {
  return [
    p0,
    { x: p0.x + m0.x / 3, y: p0.y + m0.y / 3 },
    { x: p1.x - m1.x / 3, y: p1.y - m1.y / 3 },
    p1,
  ];
}

// ---- Catmull-Rom: let the points choose the tangents -------------------------------------

/**
 * The tangent Catmull-Rom picks at point `i`: half the gap between its two neighbours.
 *
 * That single choice is the whole algorithm. The direction a waypoint is "heading" is taken to be
 * the direction from the one before it to the one after it, which is both the obvious guess and a
 * good one. Ends have only one neighbour, so they use the one-sided gap.
 */
export function catmullTangent(
  points: readonly Vec2[],
  i: number,
  tension = 0.5,
): Vec2 {
  const last = points.length - 1;
  if (i <= 0) return scale(sub(points[1], points[0]), tension * 2);
  if (i >= last) return scale(sub(points[last], points[last - 1]), tension * 2);
  return scale(sub(points[i + 1], points[i - 1]), tension);
}

/** How many segments a point list spans. */
export const segmentCount = (points: readonly Vec2[]) => points.length - 1;

/** Which segment a global `t` falls in, and how far through it. */
export function locate(
  points: readonly Vec2[],
  t: number,
): { segment: number; local: number } {
  const segs = segmentCount(points);
  const scaled = Math.min(Math.max(t, 0), 1) * segs;
  const segment = Math.min(Math.floor(scaled), segs - 1);
  return { segment, local: scaled - segment };
}

/** A point on the whole Catmull-Rom chain, with `t` running 0 to 1 across every segment. */
export function catmullRomAt(
  points: readonly Vec2[],
  t: number,
  tension = 0.5,
): Vec2 {
  const { segment, local } = locate(points, t);
  return hermiteAt(
    points[segment],
    catmullTangent(points, segment, tension),
    points[segment + 1],
    catmullTangent(points, segment + 1, tension),
    local,
  );
}

/** The velocity along the chain. Note it is per-segment, so it scales with segment length. */
export function catmullRomTangent(
  points: readonly Vec2[],
  t: number,
  tension = 0.5,
): Vec2 {
  const { segment, local } = locate(points, t);
  return hermiteTangent(
    points[segment],
    catmullTangent(points, segment, tension),
    points[segment + 1],
    catmullTangent(points, segment + 1, tension),
    local,
  );
}

// ---- Arc length: equal steps in t are not equal distances --------------------------------

/**
 * A table of "how far along the curve am I at this `t`", built by walking it in small pieces.
 *
 * There is no shortcut here. The arc length of a cubic has no closed form worth using, so the
 * honest approach is to sample it densely, add up the straight-line hops, and interpolate. This is
 * the standard trick and it is why every engine's spline has a "build lookup table" step.
 */
export type ArcTable = {
  /** The `t` at each sample. */
  ts: number[];
  /** Distance travelled by that sample. */
  distances: number[];
  total: number;
};

export function buildArcTable(
  at: (t: number) => Vec2,
  samples = 256,
): ArcTable {
  const ts: number[] = [0];
  const distances: number[] = [0];
  let running = 0;
  let previous = at(0);
  for (let i = 1; i <= samples; i += 1) {
    const t = i / samples;
    const here = at(t);
    running += Math.hypot(here.x - previous.x, here.y - previous.y);
    ts.push(t);
    distances.push(running);
    previous = here;
  }
  return { ts, distances, total: running };
}

/**
 * The `t` that lands you a given **distance** along the curve.
 *
 * Binary search the table, then lerp between the two straddling samples. This is the inverse of
 * the table, and it is the function that turns "move at 3 meters per second" into a `t`.
 */
export function tAtDistance(table: ArcTable, distance: number): number {
  const target = Math.min(Math.max(distance, 0), table.total);
  let low = 0;
  let high = table.distances.length - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (table.distances[mid] <= target) low = mid;
    else high = mid;
  }
  const span = table.distances[high] - table.distances[low];
  const within = span < 1e-12 ? 0 : (target - table.distances[low]) / span;
  return lerp(table.ts[low], table.ts[high], within);
}

/** The `t` that lands you a given **fraction** of the way along, by distance rather than by `t`. */
export function tAtFraction(table: ArcTable, u: number): number {
  return tAtDistance(table, u * table.total);
}

/** The other direction: how far along the curve a given `t` actually is. */
export function distanceAtT(table: ArcTable, t: number): number {
  const target = Math.min(Math.max(t, 0), 1);
  let low = 0;
  let high = table.ts.length - 1;
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (table.ts[mid] <= target) low = mid;
    else high = mid;
  }
  const span = table.ts[high] - table.ts[low];
  const within = span < 1e-12 ? 0 : (target - table.ts[low]) / span;
  return lerp(table.distances[low], table.distances[high], within);
}
