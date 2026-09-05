/**
 * The separating axis test: **if you can find one direction along which two shapes do not overlap, they miss.**
 *
 * That sentence is the whole algorithm, and you have already used it twice. Section 5.1's box test is
 * this with the two axes fixed to $x$ and $y$. What changes here is only *which* directions are worth
 * trying - and the answer for convex polygons is short: the directions perpendicular to their edges.
 *
 * **This is the Section where 2D genuinely earns its place.** In three dimensions the candidate axes are
 * the face normals of both shapes *plus* the cross product of every pair of edges - fifteen axes for two
 * boxes, and the reason SAT has a reputation for being fiddly. In 2D there are no cross-product axes at
 * all. Two triangles need six axes and every one of them is just an edge turned ninety degrees.
 */
import { cross, isConvex, windingOf } from "./cross2d.ts";
import { rangesOverlap } from "./collide2d.ts";
import { dot } from "./dot2d.ts";
import { length, normalize } from "./length2d.ts";
import {
  displacement,
  movedBy,
  scaled,
  type Point,
  type Vector,
} from "./vectors2d.ts";

/** A polygon is its corners, in order. Convexity is a separate question, and SAT insists on it. */
export type Polygon = readonly Point[];

/** What a polygon casts onto an axis: the lowest and highest it reaches along that direction. */
export type Interval = { min: number; max: number };

/**
 * The shadow a polygon casts on an axis.
 *
 * Dot every corner against the direction and keep the smallest and largest. That is Section 1.4's
 * projection applied to a whole shape, and the reason only the **corners** need checking is convexity:
 * every point of a convex polygon is a blend of its corners, so no interior point can reach further
 * along any direction than the furthest corner does.
 */
export function project(poly: Polygon, axis: Vector): Interval {
  let min = Infinity;
  let max = -Infinity;
  for (const corner of poly) {
    const along = dot(corner, axis);
    min = Math.min(min, along);
    max = Math.max(max, along);
  }
  return { min, max };
}

/**
 * Put a polygon into counter-clockwise order, so its edge normals reliably point **outward**.
 *
 * The hit-or-miss answer does not care - an axis and its opposite give the same shadows, so a flipped
 * normal changes nothing. The **push-out direction** cares a great deal, and that is what Section 5.4
 * needs. A polygon loaded from a file or built by dragging can be wound either way, so normalizing the
 * winding once is cheaper than reasoning about signs everywhere afterwards.
 */
export function counterClockwise(poly: Polygon): Polygon {
  return windingOf(poly) === "clockwise" ? [...poly].reverse() : poly;
}

/**
 * The candidate axes for one polygon: each edge turned ninety degrees, at unit length.
 *
 * **Normalized deliberately, and it matters for exactly one reason.** Whether the shapes overlap is
 * unaffected by an axis's length, because scaling a direction scales both shadows equally and the
 * comparison is unchanged. But the *depth* of overlap comes out in units of the axis's length, so
 * comparing depths across axes of different lengths compares different units - and the "smallest
 * overlap" then picks the wrong axis. The build prices that.
 */
export function edgeNormals(poly: Polygon): Vector[] {
  const wound = counterClockwise(poly);
  const normals: Vector[] = [];
  for (let i = 0; i < wound.length; i += 1) {
    const edge = displacement(wound[i], wound[(i + 1) % wound.length]);
    // For counter-clockwise winding the interior lies to the left, so the right perpendicular is outward.
    const outward = normalize({ x: edge.y, y: -edge.x });
    // A repeated corner gives a zero-length edge and no usable normal. Skipping it is correct: it
    // contributes no direction, and dividing by its length would produce NaN axes that separate nothing.
    if (outward !== null) normals.push(outward);
  }
  return normals;
}

/** The same, left unnormalized. Here only so the build can show what that costs. */
export function edgeNormalsRaw(poly: Polygon): Vector[] {
  const wound = counterClockwise(poly);
  const normals: Vector[] = [];
  for (let i = 0; i < wound.length; i += 1) {
    const edge = displacement(wound[i], wound[(i + 1) % wound.length]);
    if (length(edge) > 1e-12) normals.push({ x: edge.y, y: -edge.x });
  }
  return normals;
}

/**
 * Every axis worth testing for a pair: the edge normals of both.
 *
 * And in 2D that is genuinely all of them. The reason is worth stating because it is what makes this
 * Section tractable: if two convex shapes are apart, there is a line between them, and that line can
 * always be slid until it lies flush against an edge of one of them. So some edge's normal separates
 * them, and testing the edges is testing everything.
 */
export function candidateAxes(a: Polygon, b: Polygon): Vector[] {
  return [...edgeNormals(a), ...edgeNormals(b)];
}

/**
 * How much the two shadows overlap on an axis. **Negative means a gap**, and a gap means a miss.
 *
 * The range comparison is Section 5.1's, doing its fourth job in three Sections: two boxes, two
 * collinear segments, and now two polygon shadows.
 */
export function overlapOnAxis(a: Polygon, b: Polygon, axis: Vector): number {
  const shadowA = project(a, axis);
  const shadowB = project(b, axis);
  return (
    Math.min(shadowA.max, shadowB.max) - Math.max(shadowA.min, shadowB.min)
  );
}

/** The same question as a boolean, so the range check is visibly the same one. */
export function shadowsOverlap(a: Polygon, b: Polygon, axis: Vector): boolean {
  const shadowA = project(a, axis);
  const shadowB = project(b, axis);
  return rangesOverlap(shadowA.min, shadowA.max, shadowB.min, shadowB.max);
}

/**
 * An axis that proves the two shapes miss, or `null` if there is none.
 *
 * **One is enough.** That is what makes SAT cheap in the common case: shapes that are far apart are
 * usually separated by the first axis tried, and the loop stops. Shapes that overlap are the expensive
 * case, because every axis has to be checked before you can say so.
 */
export function separatingAxis(a: Polygon, b: Polygon): Vector | null {
  for (const axis of candidateAxes(a, b)) {
    if (!shadowsOverlap(a, b, axis)) return axis;
  }
  return null;
}

/** Do two **convex** polygons overlap? No separating axis means yes. */
export function polygonsOverlap(a: Polygon, b: Polygon): boolean {
  return separatingAxis(a, b) === null;
}

/** The axis with the least overlap, and by how much. What Section 5.4 pushes along. */
export type Push = { axis: Vector; depth: number };

/**
 * The shallowest overlap across all candidate axes: the **minimum translation vector**.
 *
 * The shortest way to separate two overlapping shapes, because every axis measures a distance you could
 * move one of them to end the overlap on that axis, and the smallest of those is the least disruptive.
 * Section 5.4 is about what to do with it; here it is only the measurement.
 *
 * Returns `null` when they are not overlapping at all, which is a different thing from a zero-depth
 * push and worth keeping distinct.
 */
export function smallestOverlap(a: Polygon, b: Polygon): Push | null {
  let best: Push | null = null;
  for (const axis of candidateAxes(a, b)) {
    const depth = overlapOnAxis(a, b, axis);
    if (depth <= 0) return null;
    if (best === null || depth < best.depth) best = { axis, depth };
  }
  return best;
}

/**
 * The same, with unnormalized axes. Correct about hit or miss, wrong about which way to push.
 *
 * Kept so the build can measure the difference rather than the page claiming there is one.
 */
export function smallestOverlapRaw(a: Polygon, b: Polygon): Push | null {
  let best: Push | null = null;
  for (const axis of [...edgeNormalsRaw(a), ...edgeNormalsRaw(b)]) {
    const depth = overlapOnAxis(a, b, axis);
    if (depth <= 0) return null;
    if (best === null || depth < best.depth) best = { axis, depth };
  }
  return best;
}

/**
 * How many of the candidate axes point in genuinely different directions.
 *
 * Worth knowing because a rectangle's opposite edges have opposite normals, which test identically - so
 * two rectangles offer eight axes and only two distinct directions between them. Testing the duplicates
 * is harmless and wasteful, and skipping them is the first optimisation anyone makes.
 */
export function distinctAxisCount(a: Polygon, b: Polygon): number {
  const seen: Vector[] = [];
  for (const axis of candidateAxes(a, b)) {
    // Parallel counts as the same, in either direction, since a shadow does not care which way up it is.
    if (seen.some((other) => Math.abs(cross(axis, other)) < 1e-9)) continue;
    seen.push(axis);
  }
  return seen.length;
}

// ---- The convexity requirement ----------------------------------------------------------------

/**
 * Is this polygon something SAT can be trusted on? Convex, and with enough corners to be a shape.
 *
 * `isConvex` comes from Section 2.1, where it was a fact about cross products changing sign. Here it is
 * a **precondition**, and one worth checking rather than assuming: SAT on a concave polygon does not
 * crash, does not warn, and reports overlaps that are not there. The build measures how much area that
 * costs.
 */
export function suitableForSat(poly: Polygon): boolean {
  return poly.length >= 3 && isConvex(poly);
}

/**
 * Is a point inside a polygon? Ray casting, which works for concave shapes too.
 *
 * Needed as the honest reference the concave case is measured against. It counts how many times a ray
 * from the point crosses the boundary: an odd count means inside. Nothing about it assumes convexity,
 * which is exactly why it can be used to catch SAT out.
 */
export function containsPoint(poly: Polygon, p: Point): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const a = poly[i];
    const b = poly[j];
    // Does the edge straddle the point's height, and if so is the crossing to the right?
    if (a.y > p.y !== b.y > p.y) {
      const crossesAt = a.x + ((p.y - a.y) / (b.y - a.y)) * (b.x - a.x);
      if (crossesAt > p.x) inside = !inside;
    }
  }
  return inside;
}

// ---- Building and moving polygons -------------------------------------------------------------

/** A regular polygon, which is the easiest convex shape to reason about and to draw. */
export function regularPolygon(
  sides: number,
  radius: number,
  centre: Point = { x: 0, y: 0 },
  rotation = 0,
): Point[] {
  return Array.from({ length: sides }, (_, i) => {
    const angle = rotation + (i / sides) * Math.PI * 2;
    return {
      x: centre.x + Math.cos(angle) * radius,
      y: centre.y + Math.sin(angle) * radius,
    };
  });
}

/** Every corner moved by the same displacement. */
export function translatePolygon(poly: Polygon, by: Vector): Point[] {
  return poly.map((p) => movedBy(p, by));
}

/** Every corner turned about a pivot, which is Section 2.3's rotation applied to a list. */
export function rotatePolygon(
  poly: Polygon,
  radians: number,
  about: Point = { x: 0, y: 0 },
): Point[] {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return poly.map((p) => {
    const local = displacement(about, p);
    return movedBy(about, {
      x: local.x * cos - local.y * sin,
      y: local.x * sin + local.y * cos,
    });
  });
}

/**
 * The convex hull: the smallest convex polygon containing every corner. Andrew's monotone chain.
 *
 * Here because it names what a concave shape's problem **is**. SAT can only ever describe a convex
 * region, so handed a concave polygon it answers about something closer to this - and the difference
 * between the two is where it invents collisions.
 *
 * Not exactly the hull, though, and the page is careful about that: a concave polygon offers normals from
 * its reflex edges too, which are not hull edges, and those extra axes occasionally do separate. So the
 * hull bounds the lie rather than being it, which is why the false region is measured as well as drawn.
 */
export function convexHull(poly: Polygon): Point[] {
  if (poly.length < 3) return [...poly];
  const sorted = [...poly].sort((p, q) => p.x - q.x || p.y - q.y);
  const half = (points: Point[]): Point[] => {
    const chain: Point[] = [];
    for (const p of points) {
      while (
        chain.length >= 2 &&
        cross(
          displacement(chain[chain.length - 2], chain[chain.length - 1]),
          displacement(chain[chain.length - 2], p),
        ) <= 0
      ) {
        chain.pop();
      }
      chain.push(p);
    }
    return chain;
  };
  const lower = half(sorted);
  const upper = half([...sorted].reverse());
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** The average of the corners. Not the centre of area, and adequate for placing a label. */
export function cornerCentre(poly: Polygon): Point {
  const total = poly.reduce((sum, p) => ({ x: sum.x + p.x, y: sum.y + p.y }), {
    x: 0,
    y: 0,
  });
  return scaled(total, 1 / poly.length);
}
