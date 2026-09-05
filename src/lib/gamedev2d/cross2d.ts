/**
 * The 2D cross product: one number, whose sign says which side and whose size is an area.
 *
 * In three dimensions the cross product returns a vector, which is where most of its difficulty
 * comes from - a direction you have to reason about, a handedness convention, a right-hand rule to
 * remember. In two dimensions it returns a **single number**, and that number does most of the same
 * work with none of the bookkeeping.
 *
 * Read it two ways, exactly as with the dot product. The sign answers "which side of this line",
 * which is the question the dot product cannot answer. The magnitude is an area, which is where
 * polygon winding and every "is this shape wound the right way" test comes from.
 */
import { displacement, type Point, type Vector } from "./vectors2d.ts";
import { length } from "./length2d.ts";

/**
 * The cross product of two 2D vectors. A number, not a vector.
 *
 * $$a \times b = a_x b_y - a_y b_x$$
 *
 * The meaning, which is the form worth carrying in your head:
 *
 * $$a \times b = |a|\,|b|\sin\theta$$
 *
 * where $\theta$ is the angle **from** `a` **to** `b`, measured counter-clockwise. Sine is positive
 * for a counter-clockwise turn and negative for a clockwise one, so the sign tells you which way you
 * would turn to get from `a` to `b`. That is the whole thing.
 *
 * Compare the dot product's $|a||b|\cos\theta$: cosine is symmetric, so the dot product cannot tell
 * left from right. Sine is not, so this can. **Swapping the arguments flips the sign**, which is the
 * property that makes it useful and the property that makes it easy to get backwards.
 */
export function cross(a: Vector, b: Vector): number {
  return a.x * b.y - a.y * b.x;
}

/**
 * The same vector turned a quarter turn counter-clockwise, which is free.
 *
 * No trigonometry, no multiplication: swap the components and negate one of them. This is the
 * cheapest rotation there is, and it comes up constantly - a wall's normal, the perpendicular to a
 * movement direction, the axis a separating-axis test wants in Section 5.3.
 */
export function perpLeft(v: Vector): Vector {
  return { x: -v.y, y: v.x };
}

/** The other quarter turn. Negate the other component. */
export function perpRight(v: Vector): Vector {
  return { x: v.y, y: -v.x };
}

/**
 * The raw cross product of the line's direction with the direction to the point.
 *
 * Keep this rather than only its sign when you need the magnitude too, because it is twice the area
 * of the triangle the three points make - so it is a measure of how far off the line the point is,
 * scaled by the line's length.
 */
export function sideValue(from: Point, to: Point, p: Point): number {
  return cross(displacement(from, to), displacement(from, p));
}

/**
 * Which side of the line through `from` and `to` does `p` lie on?
 *
 * `1` is left of the direction of travel, `-1` is right, `0` is exactly on the line. **"Left" is
 * relative to the line's direction**, not to anything absolute, so reading the same line backwards
 * swaps every answer. That is not a flaw; it is what makes the test useful for a directed edge, and
 * it is the first thing to check when a which-side test comes out inverted.
 *
 * As with a dot product of exactly zero, landing exactly on the line is decided by rounding rather
 * than by geometry, so do not build anything that depends on the `0` case appearing.
 */
export function sideOf(from: Point, to: Point, p: Point): -1 | 0 | 1 {
  const s = sideValue(from, to, p);
  return s > 0 ? 1 : s < 0 ? -1 : 0;
}

/**
 * How far `p` sits from the **infinite** line through `from` and `to`, with a sign for the side.
 *
 * $$d = \frac{(b - a) \times (p - a)}{|b - a|}$$
 *
 * Dividing the cross product by the line's length is all it takes: the cross product is twice the
 * triangle's area, and area over base is height. Returns `0` for a degenerate line, which has no
 * side to be on.
 */
export function signedDistanceToLine(from: Point, to: Point, p: Point): number {
  const direction = displacement(from, to);
  const len = length(direction);
  return len < 1e-9 ? 0 : sideValue(from, to, p) / len;
}

/**
 * The area of the parallelogram the two vectors span. The magnitude reading of the cross product.
 *
 * $$\text{area} = |a \times b|$$
 *
 * Zero means the two are parallel, which is a more useful test than it sounds: it is how you detect
 * two segments that will never cross, and Section 5.2 uses exactly this.
 */
export function parallelogramArea(a: Vector, b: Vector): number {
  return Math.abs(cross(a, b));
}

/** Half the parallelogram, which is the triangle. No square roots and no trigonometry. */
export function triangleArea(a: Point, b: Point, c: Point): number {
  return Math.abs(sideValue(a, b, c)) / 2;
}

/**
 * The **signed** area of a polygon, by the shoelace formula.
 *
 * $$2A = \sum_i \left(x_i y_{i+1} - y_i x_{i+1}\right)$$
 *
 * which is a sum of cross products of consecutive corners, taken as vectors from the origin. Every
 * term is a triangle fanned out from the origin, and the ones outside the shape cancel against the
 * ones inside - so the origin can be anywhere, including outside the polygon, and the answer is the
 * same.
 *
 * The **sign is the winding**: positive for counter-clockwise, negative for clockwise. Keeping the
 * sign rather than taking the absolute value immediately is what turns an area function into a
 * winding test.
 */
export function signedPolygonArea(points: readonly Point[]): number {
  if (points.length < 3) return 0;
  let total = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += cross(a, b);
  }
  return total / 2;
}

/** The area, which is what you asked for when you did not care about the winding. */
export function polygonArea(points: readonly Point[]): number {
  return Math.abs(signedPolygonArea(points));
}

export type Winding = "counter-clockwise" | "clockwise" | "degenerate";

/**
 * Which way round the corners are listed.
 *
 * Worth naming because so much depends on it: which way a polygon's edge normals point, whether a
 * separating-axis test finds the outside, whether a renderer culls the face. A shape wound the wrong
 * way usually does not error - it just turns inside out, which is Section 2.1's version of the
 * mirrored-basis problem the 3D module has.
 *
 * **Counter-clockwise is measured in world coordinates, with Y up.** A canvas has Y down, so the same
 * list of corners appears to wind the other way once drawn. Nothing changed but the picture.
 */
export function windingOf(points: readonly Point[], epsilon = 1e-12): Winding {
  const area = signedPolygonArea(points);
  if (Math.abs(area) <= epsilon) return "degenerate";
  return area > 0 ? "counter-clockwise" : "clockwise";
}

/**
 * Is this polygon convex? Every turn goes the same way.
 *
 * Walk the corners, cross each edge with the next, and check the signs agree. A concave corner turns
 * back the other way, so its cross product has the opposite sign. Zeros are skipped, because three
 * corners in a straight line are neither turn.
 */
export function isConvex(points: readonly Point[]): boolean {
  if (points.length < 3) return false;
  let sign = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const c = points[(i + 2) % points.length];
    const turn = cross(displacement(a, b), displacement(b, c));
    if (Math.abs(turn) < 1e-12) continue;
    const here = turn > 0 ? 1 : -1;
    if (sign === 0) sign = here;
    else if (here !== sign) return false;
  }
  return sign !== 0;
}

/**
 * Is `p` inside the triangle? The which-side test, three times.
 *
 * A point is inside when it is on the same side of all three edges, which is three cross products
 * and no division. Works for either winding, because it only asks whether the three signs agree
 * rather than what they are.
 */
export function pointInTriangle(
  p: Point,
  a: Point,
  b: Point,
  c: Point,
): boolean {
  const ab = sideValue(a, b, p);
  const bc = sideValue(b, c, p);
  const ca = sideValue(c, a, p);
  const noneNegative = ab >= 0 && bc >= 0 && ca >= 0;
  const nonePositive = ab <= 0 && bc <= 0 && ca <= 0;
  return noneNegative || nonePositive;
}
