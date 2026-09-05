/**
 * Bezier curves, and the thing about them that catches everybody: **`t` is not distance**.
 *
 * A Bezier is a weighted blend of a handful of control points, where the weights depend on one
 * parameter. Two control points give a straight line; three give a parabola-like arc; four give the
 * cubic that every vector drawing program and every animation tool is built on.
 *
 * The parameter runs from 0 to 1 and it is tempting to read it as "how far along". It is not. Walk `t`
 * at a constant rate and the sprite speeds up and slows down depending on where the control points
 * sit - which is fine if you wanted that and a bug if you wanted a patrol route. The fix is an
 * arc-length table, and it is the second half of this file.
 */
import { displacement, movedBy, scaled, type Point } from "./vectors2d.ts";
import { length } from "./length2d.ts";
import { angleOf } from "./angles2d.ts";

export type { Point };

/**
 * A quadratic, written out in Bernstein form so the weights are visible.
 *
 * $$B(t) = (1-t)^2 P_0 + 2(1-t)t\,P_1 + t^2 P_2$$
 *
 * The three weights always sum to 1, which is the reason the curve is trapped inside the triangle its
 * control points make and can never wander off somewhere surprising. It is also why `P_1` pulls the
 * curve without the curve ever reaching it: at $t = 0.5$ the weights are $0.25$, $0.5$, $0.25$, so the
 * middle point gets half the vote and the ends split the rest.
 */
export function quadraticAt(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

/**
 * A cubic, which is the one you will actually use.
 *
 * $$B(t) = (1-t)^3 P_0 + 3(1-t)^2t\,P_1 + 3(1-t)t^2 P_2 + t^3 P_3$$
 *
 * Four points is the sweet spot: enough freedom to make an S-shape, few enough that a human can place
 * them. Two of them are the ends the curve passes through and two are handles it only leans toward.
 */
export function cubicAt(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
): Point {
  const u = 1 - t;
  return {
    x:
      u * u * u * p0.x +
      3 * u * u * t * p1.x +
      3 * u * t * t * p2.x +
      t * t * t * p3.x,
    y:
      u * u * u * p0.y +
      3 * u * u * t * p1.y +
      3 * u * t * t * p2.y +
      t * t * t * p3.y,
  };
}

/**
 * De Casteljau's algorithm: the same answer, built by **repeated lerping**, at any degree.
 *
 * Take each neighbouring pair of control points, find the point `t` of the way between them, and you
 * have one fewer point. Repeat until one is left; that is the point on the curve. Nothing but `lerp`,
 * which is why it is worth knowing even though the polynomial above is faster - it needs no formula
 * per degree, it is numerically better behaved, and it hands you the split for free.
 *
 * Returns every level, because the intermediate points **are** the picture: the last pair before the
 * answer is the curve's tangent line, which is the fact the facing direction below rests on.
 */
export function deCasteljau(
  points: readonly Point[],
  t: number,
): { levels: Point[][]; point: Point } {
  const levels: Point[][] = [points.slice()];
  let current = points.slice();
  while (current.length > 1) {
    const next: Point[] = [];
    for (let i = 0; i < current.length - 1; i += 1) {
      next.push(
        movedBy(
          current[i],
          scaled(displacement(current[i], current[i + 1]), t),
        ),
      );
    }
    levels.push(next);
    current = next;
  }
  return { levels, point: current[0] };
}

/** The point on a curve of any degree. De Casteljau, so one function covers quadratic and cubic. */
export function pointAt(points: readonly Point[], t: number): Point {
  return deCasteljau(points, t).point;
}

/**
 * The tangent: the direction the curve is heading, and how fast.
 *
 * The derivative of a degree-$n$ Bezier is $n$ times a degree-$(n-1)$ Bezier built on the **differences
 * between neighbouring control points**. So the derivative of a cubic is a quadratic on three vectors,
 * which is a pleasant thing rather than a chore.
 *
 * Its **length is the speed** in parameter terms, and that length is not constant. That is the whole
 * problem this file's second half solves.
 */
export function tangentAt(points: readonly Point[], t: number): Point {
  const n = points.length - 1;
  const differences: Point[] = [];
  for (let i = 0; i < n; i += 1) {
    differences.push(displacement(points[i], points[i + 1]));
  }
  return scaled(pointAt(differences, t), n);
}

/** How fast the curve moves per unit of `t`. Varies along the curve, which is the point. */
export function speedAt(points: readonly Point[], t: number): number {
  return length(tangentAt(points, t));
}

/**
 * The angle to face while travelling the curve, or `null` where there is no answer.
 *
 * Facing along the tangent is what makes a car follow a road rather than slide along it sideways, and
 * it is one `atan2` away once you have the derivative.
 *
 * **The `null` is not defensive.** Put two control points in the same place - a handle dropped exactly
 * on its endpoint, which is what happens when someone wants a "straight" start - and the tangent there
 * is the zero vector. `atan2(0, 0)` returns 0 without complaining, so the sprite snaps to facing east
 * for one frame and then jumps back. No error, no NaN, just a flick that is very hard to find.
 */
export function facingAt(points: readonly Point[], t: number): number | null {
  const tangent = tangentAt(points, t);
  return length(tangent) < 1e-9 ? null : angleOf(tangent);
}

/**
 * Split a curve in two at `t`, giving two curves that together are the original.
 *
 * Free from de Casteljau: the first point of every level is the left half's control points, and the
 * last point of every level is the right half's. Useful for trimming a path, for drawing only the part
 * already travelled, and for subdividing until a curve is flat enough to draw as lines.
 */
export function splitAt(
  points: readonly Point[],
  t: number,
): { left: Point[]; right: Point[] } {
  const { levels } = deCasteljau(points, t);
  return {
    left: levels.map((level) => level[0]),
    right: levels.map((level) => level[level.length - 1]).reverse(),
  };
}

/**
 * Raise a curve's degree by one without changing its shape at all.
 *
 * $$Q_i = \frac{i}{n+1}P_{i-1} + \left(1 - \frac{i}{n+1}\right)P_i$$
 *
 * Which means **every quadratic is also a cubic**, and that is practically useful rather than trivia:
 * a tool that only speaks cubics can accept a quadratic, and a chain of mixed degrees can be made
 * uniform before anything else touches it.
 */
export function elevate(points: readonly Point[]): Point[] {
  const n = points.length - 1;
  const raised: Point[] = [points[0]];
  for (let i = 1; i <= n; i += 1) {
    const k = i / (n + 1);
    raised.push({
      x: k * points[i - 1].x + (1 - k) * points[i].x,
      y: k * points[i - 1].y + (1 - k) * points[i].y,
    });
  }
  raised.push(points[n]);
  return raised;
}

// ---- Arc length: turning `t` into distance -------------------------------------------------

/**
 * A table of cumulative distance against `t`, built by walking the curve in small straight steps.
 *
 * There is no closed form for the length of a cubic Bezier, so this is not laziness - sampling is what
 * everyone does, including the engines. More samples is more accurate and the error falls off fast;
 * `LENGTH_SAMPLES` below is the default and the build prices what it costs.
 */
export type ArcTable = {
  /** `t` at each sample. */
  ts: number[];
  /** Distance from the start to that sample. */
  distances: number[];
  /** Total length, which is the last entry. */
  total: number;
};

/** Enough samples that the length is accurate to well under a pixel on any curve this size. */
export const LENGTH_SAMPLES = 256;

export function arcTable(
  points: readonly Point[],
  samples = LENGTH_SAMPLES,
): ArcTable {
  const ts: number[] = [0];
  const distances: number[] = [0];
  let previous = pointAt(points, 0);
  let total = 0;
  for (let i = 1; i <= samples; i += 1) {
    const t = i / samples;
    const current = pointAt(points, t);
    total += length(displacement(previous, current));
    ts.push(t);
    distances.push(total);
    previous = current;
  }
  return { ts, distances, total };
}

/** The curve's length, sampled. Shorthand for the total in the table. */
export function curveLength(
  points: readonly Point[],
  samples = LENGTH_SAMPLES,
): number {
  return arcTable(points, samples).total;
}

/**
 * The `t` that sits a given **distance** along the curve. The inverse of the table, by binary search.
 *
 * This is the function that makes a sprite travel at a constant speed. Ask for distance
 * `speed * elapsed` rather than for `t = elapsed / duration` and the motion stops depending on where
 * the control points happen to be.
 */
export function tAtDistance(table: ArcTable, distance: number): number {
  const target = Math.min(Math.max(distance, 0), table.total);
  let lo = 0;
  let hi = table.distances.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (table.distances[mid] <= target) lo = mid;
    else hi = mid;
  }
  const span = table.distances[hi] - table.distances[lo];
  // A zero-length segment means the curve stood still here, so either end of it will do.
  const within = span < 1e-12 ? 0 : (target - table.distances[lo]) / span;
  return table.ts[lo] + within * (table.ts[hi] - table.ts[lo]);
}

/** The `t` a given fraction of the **length** along, which is what "halfway" ought to mean. */
export function tAtFraction(table: ArcTable, fraction: number): number {
  return tAtDistance(table, fraction * table.total);
}

/** The point a given fraction of the length along. Constant speed, in one call. */
export function pointAtFraction(
  points: readonly Point[],
  table: ArcTable,
  fraction: number,
): Point {
  return pointAt(points, tAtFraction(table, fraction));
}

/**
 * The distance from the start to a given `t`, read off the table. The forward direction.
 *
 * Note this is not the inverse of `tAtDistance` by construction - it is the same table read the other
 * way - so the two agreeing on a round trip is a real check rather than an identity, and the build
 * runs it.
 */
export function distanceAtT(table: ArcTable, t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  const position = clamped * (table.ts.length - 1);
  const lo = Math.floor(position);
  const hi = Math.min(lo + 1, table.distances.length - 1);
  return (
    table.distances[lo] +
    (position - lo) * (table.distances[hi] - table.distances[lo])
  );
}

/**
 * What fraction of the **length** has been covered at a given `t`.
 *
 * Here so the mismatch is a number the build can assert rather than a claim in a caption. At $t = 0.5$
 * on a curve with evenly spread control points this is close to a half; pull one handle out and it is
 * not, and that difference is the Section.
 */
export function fractionAtT(
  points: readonly Point[],
  t: number,
  table?: ArcTable,
): number {
  const built = table ?? arcTable(points);
  return built.total < 1e-12 ? 0 : distanceAtT(built, t) / built.total;
}

/** The ratio of the fastest point on the curve to the slowest. 1 would mean `t` already was distance. */
export function speedSpread(points: readonly Point[], samples = 2000): number {
  let fastest = 0;
  let slowest = Infinity;
  for (let i = 0; i <= samples; i += 1) {
    const speed = speedAt(points, i / samples);
    fastest = Math.max(fastest, speed);
    slowest = Math.min(slowest, speed);
  }
  return slowest < 1e-9 ? Infinity : fastest / slowest;
}

// ---- Chaining: joining curves without a visible corner -------------------------------------

/** Two curves meet at a point if one ends where the next begins. The easy half, and not enough. */
export function meetsAt(a: readonly Point[], b: readonly Point[]): boolean {
  const end = a[a.length - 1];
  return Math.abs(end.x - b[0].x) < 1e-9 && Math.abs(end.y - b[0].y) < 1e-9;
}

/**
 * Do two curves join **smoothly**, or is there a corner at the seam?
 *
 * Sharing an endpoint is $C^0$ continuity and it is what everybody checks. It is not enough: the
 * tangents on either side of the seam can point in completely different directions, and the result is
 * a visible kink and a sprite that snaps its facing in one frame.
 *
 * Smooth means the incoming and outgoing tangents point the **same way**. Equal length as well as
 * direction is $C^1$; direction alone is $G^1$, which looks smooth and is what a path usually needs.
 */
export function joinsSmoothly(
  a: readonly Point[],
  b: readonly Point[],
  tolerance = 1e-6,
): boolean {
  if (!meetsAt(a, b)) return false;
  const incoming = tangentAt(a, 1);
  const outgoing = tangentAt(b, 0);
  const la = length(incoming);
  const lb = length(outgoing);
  if (la < 1e-9 || lb < 1e-9) return false;
  const cross = (incoming.x * outgoing.y - incoming.y * outgoing.x) / (la * lb);
  const dot = (incoming.x * outgoing.x + incoming.y * outgoing.y) / (la * lb);
  return Math.abs(cross) < tolerance && dot > 0;
}

/**
 * The corner in degrees at a seam, so "there is a kink" becomes a measurement.
 *
 * Zero is smooth. Anything else is the angle a sprite's facing would jump through in a single frame.
 */
export function seamAngle(a: readonly Point[], b: readonly Point[]): number {
  const incoming = tangentAt(a, 1);
  const outgoing = tangentAt(b, 0);
  const difference = angleOf(outgoing) - angleOf(incoming);
  const wrapped = Math.atan2(Math.sin(difference), Math.cos(difference));
  return (wrapped * 180) / Math.PI;
}

/**
 * Move the next curve's first handle so the seam is smooth: **reflect the previous one through the
 * shared point**.
 *
 * $$P_1' = 2S - P_{n-1}$$
 *
 * One line, and it is the whole trick behind every smooth path editor. Dragging a handle on one side
 * of a node moves its twin on the other side, and this is the arithmetic doing it. Everything else
 * about the second curve is left alone.
 */
export function smoothedNext(
  a: readonly Point[],
  b: readonly Point[],
): Point[] {
  const shared = a[a.length - 1];
  const previousHandle = a[a.length - 2];
  const mirrored = {
    x: 2 * shared.x - previousHandle.x,
    y: 2 * shared.y - previousHandle.y,
  };
  return [shared, mirrored, ...b.slice(2)];
}

/** Every point along a chain of curves, for drawing it as one path. */
export function chainPoints(
  curves: ReadonlyArray<readonly Point[]>,
  perCurve = 48,
): Point[] {
  const out: Point[] = [];
  curves.forEach((curve, index) => {
    for (let i = index === 0 ? 0 : 1; i <= perCurve; i += 1) {
      out.push(pointAt(curve, i / perCurve));
    }
  });
  return out;
}
