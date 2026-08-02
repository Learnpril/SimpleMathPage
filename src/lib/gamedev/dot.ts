/**
 * The dot product, and the three questions it answers.
 *
 * Displayed in the lesson and imported by the figure above it.
 */
import { type Vec, length, normalize } from "./vectors.ts";

/** Multiply matching components, add the results. Returns a number, not a vector. */
export function dot(a: Vec, b: Vec): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

/**
 * Is `toTarget` broadly in the same direction as `forward`?
 *
 * Only the sign is read, and normalizing cannot change a sign - it only divides by a
 * positive length - so neither input needs normalizing here. Skip the square roots.
 */
export function isInFront(forward: Vec, toTarget: Vec): boolean {
  return dot(forward, toTarget) > 0;
}

/**
 * Is `toTarget` inside a cone of total width `fovDegrees` around `forward`?
 *
 * Compares against a cosine rather than computing an angle, which avoids an arccosine
 * per call. Note that a wider cone gives a *smaller* threshold, because cosine
 * decreases as the angle grows.
 */
export function isInCone(
  forward: Vec,
  toTarget: Vec,
  fovDegrees: number,
): boolean {
  const f = normalize(forward);
  const t = normalize(toTarget);
  if (f === null || t === null) return false;
  const threshold = Math.cos((fovDegrees * 0.5 * Math.PI) / 180);
  return dot(f, t) > threshold;
}

/**
 * The unsigned angle between two vectors, in radians.
 *
 * The clamp is not optional. Mathematically the quotient cannot leave [-1, 1], but in
 * floating point it can arrive as 1.0000000000000002, and `Math.acos` of that is NaN.
 * Even the angle between a vector and itself can trigger it.
 */
export function angleBetween(a: Vec, b: Vec): number {
  const denom = length(a) * length(b);
  if (denom < 1e-12) return 0;
  const c = dot(a, b) / denom;
  return Math.acos(Math.min(1, Math.max(-1, c)));
}

/**
 * The part of `v` that lies along `onto`.
 *
 * When `onto` is already a unit vector this reduces to `dot(v, onto) * onto`, which is
 * why unit vectors are worth keeping around.
 */
export function project(v: Vec, onto: Vec): Vec {
  const denom = dot(onto, onto);
  if (denom < 1e-12) return v.map(() => 0);
  const k = dot(v, onto) / denom;
  return onto.map((c) => c * k);
}

/**
 * Everything except the part going into a surface - which is how sliding works.
 *
 * Remove the component of `v` along the surface normal and whatever remains is parallel
 * to the surface. This one function is the heart of "move and slide", and it comes back
 * in the collision response lesson.
 */
export function slide(v: Vec, normal: Vec): Vec {
  const n = normalize(normal);
  if (n === null) return [...v];
  const along = dot(v, n);
  return v.map((c, i) => c - along * n[i]);
}
