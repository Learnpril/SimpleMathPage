/**
 * Angles: the unit they are measured in, the function that recovers one from a direction, and the
 * wrap that keeps the answers comparable.
 *
 * Two things in here account for most angle bugs in 2D games. Using `Math.atan` instead of
 * `Math.atan2`, which throws away half the information before you start. And comparing two angles
 * without wrapping the difference, so $170°$ and $-170°$ look $340°$ apart when they are $20°$ apart.
 */
import { cross } from "./cross2d.ts";
import { dot } from "./dot2d.ts";
import { length } from "./length2d.ts";
import { displacement, type Point, type Vector } from "./vectors2d.ts";

/** A full turn in radians. Named because `2 * Math.PI` appears in every wrap and every loop. */
export const TAU = Math.PI * 2;

/**
 * Radians to degrees.
 *
 * Radians are not an arbitrary preference: an angle in radians **is** the arc length it cuts on a
 * unit circle, which is why every trigonometric function and every derivative in the rest of
 * mathematics is written in them. Degrees are for designers, inspectors and dialogue with humans.
 * Convert at the edges and keep radians in the middle.
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Degrees to radians. */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * A direction from an angle: the unit circle, in code.
 *
 * Counter-clockwise from the $+X$ axis, in world coordinates with Y up. `screen.ts` owns this
 * definition, and it is re-exported here so a Section about angles does not have to send you to a
 * Section about pixels to find it.
 */
export { directionFromAngle } from "./screen.ts";

/**
 * The angle of a direction, from $-\pi$ to $\pi$. **The function to reach for.**
 *
 * $$\theta = \operatorname{atan2}(v_y, v_x)$$
 *
 * Note the argument order: **Y first**. Every language spells it this way and it still catches people,
 * because it reads backwards from the $(x, y)$ you have in your hand.
 *
 * `atan2` looks at the signs of both components, so it knows which of the four quadrants you are in
 * and returns an angle covering the whole circle. It also handles a zero `x` without dividing by it.
 */
export function angleOf(v: Vector): number {
  return Math.atan2(v.y, v.x);
}

/**
 * The angle by way of `Math.atan`, which is wrong for half of the plane. Do not ship this.
 *
 * $$\theta = \arctan\!\left(\frac{v_y}{v_x}\right)$$
 *
 * The division is where the information goes. $(1, 1)$ and $(-1, -1)$ are opposite directions and
 * both give a ratio of $1$, so `atan` has no way to separate them and returns $45°$ for both. Every
 * direction pointing left comes back **exactly half a turn wrong**, and the code looks fine.
 *
 * It is also undefined when `x` is zero. In JavaScript that happens to work out - the division gives
 * `Infinity` and `Math.atan(Infinity)` is $\pi/2$ - so straight up and straight down come out right,
 * which just means the failure is concentrated in the half you are least likely to test first.
 */
export function naiveAngleOf(v: Vector): number {
  return Math.atan(v.y / v.x);
}

/** The angle you must face to look from `from` at `to`. Aiming, in one line. */
export function angleFromTo(from: Point, to: Point): number {
  return angleOf(displacement(from, to));
}

/**
 * The **signed** angle from `a` to `b`, from $-\pi$ to $\pi$.
 *
 * $$\theta = \operatorname{atan2}(a \times b,\; a \cdot b)$$
 *
 * Both readings of Part 1 and 2.1 in one expression: the cross product supplies $|a||b|\sin\theta$
 * and the dot product supplies $|a||b|\cos\theta$, so `atan2` divides out the lengths and recovers
 * the angle with its sign intact. This is the thing `acos` could not give you.
 *
 * It is also better conditioned than `acos` near $0°$ and $180°$, and it needs no clamp, because
 * `atan2` accepts any pair of numbers. Returns `null` when either vector has no direction.
 */
export function signedAngleBetween(a: Vector, b: Vector): number | null {
  if (length(a) < 1e-9 || length(b) < 1e-9) return null;
  return Math.atan2(cross(a, b), dot(a, b));
}

/**
 * Bring an angle into $[-\pi, \pi)$, so two angles can be compared.
 *
 * Angles are not numbers on a line; they live on a circle, where $370°$ and $10°$ are the same
 * heading. Wrapping is how you make arithmetic respect that. **Exactly $\pi$ comes back as $-\pi$**,
 * which is the same direction written the other way and is worth knowing before you write a test
 * expecting $\pi$.
 *
 * The double modulo is not superstition: `%` in JavaScript keeps the sign of its left operand, so a
 * single `%` leaves negative inputs negative and outside the range you asked for.
 */
export function wrapRadians(radians: number): number {
  return ((((radians + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
}

/** The same, in degrees, for the numbers a designer will hand you. */
export function wrapDegrees(degrees: number): number {
  return ((((degrees + 180) % 360) + 360) % 360) - 180;
}
