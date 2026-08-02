/**
 * Length, normalization and distance.
 *
 * Displayed in the lesson and imported by the figure above it, so the code on the page
 * is the code that ran.
 *
 * Everything here takes plain number arrays, so the same function works for 2 or 3
 * components. Three.js, Godot and Unity all wrap these in a Vector class; the
 * arithmetic underneath is exactly this.
 */
export type Vec = number[];

/** Squared length. Prefer this whenever you are only comparing. */
export function lengthSq(v: Vec): number {
  let sum = 0;
  for (const c of v) sum += c * c;
  return sum;
}

/** Length, also called magnitude or norm. The Pythagorean theorem, once per axis. */
export function length(v: Vec): number {
  return Math.sqrt(lengthSq(v));
}

/**
 * A unit vector pointing the same way, or `null` if there is no direction to report.
 *
 * Returning null rather than a zero vector is deliberate: a zero-length input has no
 * direction, and forcing the caller to handle that is better than handing back
 * something that looks like an answer. Dividing without this check produces NaN, which
 * spreads silently through every later calculation.
 */
export function normalize(v: Vec, epsilon = 1e-6): Vec | null {
  const len = length(v);
  if (len < epsilon) return null;
  return v.map((c) => c / len);
}

/** Distance between two points. The length of the vector between them. */
export function distance(a: Vec, b: Vec): number {
  return Math.sqrt(distanceSq(a, b));
}

/** Squared distance, for comparisons. No square root taken. */
export function distanceSq(a: Vec, b: Vec): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = b[i] - a[i];
    sum += d * d;
  }
  return sum;
}

/**
 * Is b within `radius` of a?
 *
 * Squares the radius instead of rooting the distance. Both sides are non-negative, so
 * squaring preserves the comparison, and the answer is identical to
 * `distance(a, b) < radius` with one fewer square root.
 */
export function isWithin(a: Vec, b: Vec, radius: number): boolean {
  return distanceSq(a, b) < radius * radius;
}

/**
 * Direction and speed as separate decisions, which is how movement should be written.
 *
 * Passing a raw input vector straight in as a velocity is the diagonal-speed bug: two
 * keys held at once gives length 1.414, so diagonal movement runs 41% fast.
 */
export function velocityFromInput(input: Vec, speed: number): Vec {
  const dir = normalize(input);
  if (dir === null) return input.map(() => 0);
  return dir.map((c) => c * speed);
}
