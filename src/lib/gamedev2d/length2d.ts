/**
 * How long a displacement is, how far apart two places are, and how to keep only the direction.
 *
 * All of it is the Pythagorean theorem. The interesting parts are the two places where the obvious
 * code is wrong: taking a square root you did not need, and normalizing a displacement that has no
 * direction to keep.
 */
import type { Point, Vector } from "./vectors2d.ts";

/**
 * Length, by Pythagoras. The hypotenuse of the triangle the two components make.
 *
 * $$|v| = \sqrt{v_x^2 + v_y^2}$$
 *
 * `Math.hypot` is the same formula written for you, and it is careful about enormous and tiny
 * numbers in a way that `Math.sqrt(x*x + y*y)` is not - squaring $10^{200}$ overflows to infinity
 * while `hypot` gets it right. Games rarely hold numbers like that, so use whichever reads better.
 */
export function length(v: Vector): number {
  return Math.hypot(v.x, v.y);
}

/**
 * Length **without the square root**, which is what you almost always want for a comparison.
 *
 * Square root is the expensive part, and comparing lengths never needs it: both sides are lengths,
 * so both are non-negative, and squaring preserves the order. "Is this closer than that" and "is
 * this within range" are the same answer either way, one square root cheaper.
 *
 * The trap is that a squared length is not a length. Compare it against a **squared** threshold, or
 * the numbers are nonsense - and it is nonsense that looks plausible, because a radius of 5 becomes
 * a radius of 25 rather than an error.
 */
export function lengthSquared(v: Vector): number {
  return v.x * v.x + v.y * v.y;
}

/** How far apart two places are. The length of the displacement between them. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** The same, minus the square root, for when you are only comparing. */
export function distanceSquared(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

/**
 * Is `b` within `radius` of `a`? The range check, done without a square root.
 *
 * Squaring the radius instead of rooting the distance gives an identical answer, which is worth
 * seeing rather than trusting: both quantities are non-negative, and squaring is increasing on
 * non-negative numbers, so it cannot reorder them.
 */
export function isWithin(a: Point, b: Point, radius: number): boolean {
  return distanceSquared(a, b) < radius * radius;
}

/**
 * The same direction, at length 1. A **unit vector**.
 *
 * Returns `null` when there is no direction to report, which is the guard this function exists for.
 * A displacement of zero length has no direction - not a default one, not "right", none - and
 * dividing by its length produces `NaN`, which then spreads into every number it touches and
 * surfaces as a sprite that has vanished rather than as an error.
 *
 * Returning `null` forces the caller to decide what "no input" means, which is a decision they
 * should be making anyway.
 */
export function normalize(v: Vector, epsilon = 1e-9): Vector | null {
  const len = length(v);
  if (len < epsilon) return null;
  return { x: v.x / len, y: v.y / len };
}

/** The same direction at a chosen length. Direction and speed as separate decisions. */
export function withLength(v: Vector, target: number): Vector | null {
  const unit = normalize(v);
  return unit === null ? null : { x: unit.x * target, y: unit.y * target };
}

/**
 * A velocity from a direction and a speed, which is the shape movement code should have.
 *
 * Passing raw input straight in as a velocity is **the diagonal speed bug**: two keys held at once
 * gives a displacement of length $\sqrt{2}$, so the player moves 41% faster diagonally than along an
 * axis. Normalizing first is the whole fix, and it is one line.
 */
export function velocityFrom(input: Vector, speed: number): Vector {
  const unit = normalize(input);
  return unit === null
    ? { x: 0, y: 0 }
    : { x: unit.x * speed, y: unit.y * speed };
}

/**
 * Where full deflection in a given direction lands, for input clamped per axis to $\pm 1$.
 *
 * This traces the **square** that keyboard-style input can reach: each axis is independently held or
 * not, so the corner is $(1, 1)$ and its length is $\sqrt{2}$. That square is the bug, drawn.
 */
export function fullDeflection(radians: number): Vector {
  const x = Math.cos(radians);
  const y = Math.sin(radians);
  const biggest = Math.max(Math.abs(x), Math.abs(y));
  // The ray at this angle, stretched until it meets the edge of the square.
  return biggest < 1e-12 ? { x: 0, y: 0 } : { x: x / biggest, y: y / biggest };
}
