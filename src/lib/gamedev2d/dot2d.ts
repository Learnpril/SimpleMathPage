/**
 * The dot product: one number that answers "how much do these two agree about direction".
 *
 * It does three jobs that look unrelated until you see they are the same formula: a facing test, a
 * projection, and the angle between two directions. The traps are all in the third one.
 */
import { length, normalize } from "./length2d.ts";
import type { Point, Vector } from "./vectors2d.ts";

/**
 * Multiply matching components, add the results. That is all it is.
 *
 * $$a \cdot b = a_x b_x + a_y b_y$$
 *
 * The reason it means anything is the other way of writing the same number:
 *
 * $$a \cdot b = |a|\,|b|\cos\theta$$
 *
 * Two multiplications and an add on the left; an angle on the right. Nothing in the code computes
 * an angle, which is exactly why this is the cheap way to ask about one.
 */
export function dot(a: Vector, b: Vector): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * Is `b` in the same general direction as `a`? The sign test.
 *
 * Positive means the angle between them is under 90°, zero means exactly perpendicular, negative
 * means over 90°. **Lengths cannot change the sign**, only the size, so this one question needs no
 * normalizing at all - which makes it the cheapest useful thing here.
 *
 * The trap is thinking "positive means in front of me". It means within 90° of your facing, which is
 * a **180° wedge** - half the plane. Something at your shoulder passes this test.
 */
export function isInFront(facing: Vector, toTarget: Vector): boolean {
  return dot(facing, toTarget) > 0;
}

/**
 * The cosine threshold for a cone of a given half-angle, so a cone test needs no `acos`.
 *
 * Compare a normalized dot product against this. Note the direction of the comparison is the
 * opposite of what a beginner expects: **a wider cone is a smaller number**, because cosine falls
 * as the angle grows. A 180° cone (half-angle 90°) has a threshold of 0, which is the sign test.
 */
export function coneThreshold(halfAngleDegrees: number): number {
  return Math.cos((halfAngleDegrees * Math.PI) / 180);
}

/**
 * Can a guard at `eye` facing `facing` see `target`, given a cone and a range?
 *
 * Two things this gets right that the obvious version does not. The displacement to the target is
 * **normalized** first, so the answer depends only on the angle - skip that and the dot grows with
 * distance, so a far-away target passes a cone it is nowhere near. And the range check is squared,
 * so the whole test contains no square root except the one inside the normalize.
 */
export function canSee(
  eye: Point,
  facing: Vector,
  target: Point,
  halfAngleDegrees: number,
  range: number,
): boolean {
  const toTarget = { x: target.x - eye.x, y: target.y - eye.y };
  if (dot(toTarget, toTarget) > range * range) return false;
  const unit = normalize(toTarget);
  const forward = normalize(facing);
  // Standing exactly on the guard has no direction, so there is no angle to judge. Seen.
  if (unit === null) return true;
  if (forward === null) return false;
  return dot(forward, unit) >= coneThreshold(halfAngleDegrees);
}

/**
 * How far along `onto` the vector `v` reaches, as a signed number. The **scalar projection**.
 *
 * $$\text{along} = \frac{v \cdot d}{|d|}$$
 *
 * When `onto` is already a unit vector the division disappears and the projection is just the dot
 * product - which is the main reason unit vectors are worth keeping around.
 */
export function along(v: Vector, onto: Vector): number {
  const len = length(onto);
  return len < 1e-9 ? 0 : dot(v, onto) / len;
}

/**
 * The part of `v` that lies along `onto`, as a vector. The **vector projection**.
 *
 * $$\text{proj}_d\,v = \frac{v \cdot d}{d \cdot d}\,d$$
 *
 * Dividing by `d · d` rather than `|d|` is not a trick; it is the scalar projection divided by the
 * length a second time, which turns `d` into a unit vector without a separate normalize.
 */
export function projectOnto(v: Vector, onto: Vector): Vector {
  const denominator = dot(onto, onto);
  if (denominator < 1e-18) return { x: 0, y: 0 };
  const k = dot(v, onto) / denominator;
  return { x: onto.x * k, y: onto.y * k };
}

/**
 * Split `v` into the part along `onto` and the part across it.
 *
 * The two always add back to `v`, and they are always perpendicular to each other. This one split is
 * how sliding along a wall works, how a jump's horizontal and vertical parts stay independent, and
 * how you separate the speed you keep from the speed you lose in a collision.
 */
export function decompose(
  v: Vector,
  onto: Vector,
): { along: Vector; across: Vector } {
  const parallel = projectOnto(v, onto);
  return {
    along: parallel,
    across: { x: v.x - parallel.x, y: v.y - parallel.y },
  };
}

/**
 * The angle between two vectors in radians, from 0 to $\pi$. Never signed - see Section 2.1.
 *
 * $$\theta = \arccos\!\left(\frac{a \cdot b}{|a|\,|b|}\right)$$
 *
 * `Math.acos` is only defined on $[-1, 1]$ and returns `NaN` outside it. Rounding puts you outside
 * it: normalizing two vectors and dotting them can land on `1.0000000000000002`, which is a real
 * floating-point result and an impossible cosine. **The clamp is not defensive coding, it is
 * required**, and the value it saves you from is a `NaN` angle that then poisons everything downstream.
 */
export function angleBetween(a: Vector, b: Vector): number | null {
  const la = length(a);
  const lb = length(b);
  if (la < 1e-9 || lb < 1e-9) return null;
  const cosine = dot(a, b) / (la * lb);
  return Math.acos(Math.min(1, Math.max(-1, cosine)));
}

/** The same in degrees, because that is what a designer will ask you for. */
export function angleBetweenDegrees(a: Vector, b: Vector): number | null {
  const radians = angleBetween(a, b);
  return radians === null ? null : (radians * 180) / Math.PI;
}

/**
 * `acos` with no clamp, kept only so the build can show what it costs. Do not ship this.
 */
export function unclampedAngle(a: Vector, b: Vector): number {
  return Math.acos(dot(a, b) / (length(a) * length(b)));
}
