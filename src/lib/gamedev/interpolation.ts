/**
 * Blending values, and blending them at a rate that does not depend on the frame rate.
 *
 * The first three functions are the small ones everything else is built from. The last group is
 * the point of Section 4.1: a blend factor computed **from the timestep** rather than picked as
 * a constant, so the same code feels the same on a 30 Hz laptop and a 144 Hz monitor.
 *
 * Section 4.2 adds the easing family to this file.
 */

/** Start at `a`, go a fraction `t` of the way towards `b`. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Hold a value inside a range. */
export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** The common case: keep a blend factor inside [0, 1]. */
export function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

/**
 * Lerp run backwards: given a value, what `t` would have produced it?
 *
 * Answers "how far through this range am I", which is how a raw quantity becomes a fraction you
 * can drive something else with. Deliberately not clamped, so a value outside the range reports
 * honestly - `inverseLerp(0, 10, 15)` is `1.5`, not `1`.
 *
 * The guard matters. A zero-width range divides by zero and produces `NaN`, which then spreads
 * silently through everything downstream, so it returns 0 instead.
 */
export function inverseLerp(a: number, b: number, v: number): number {
  if (a === b) return 0;
  return (v - a) / (b - a);
}

/**
 * Carry a value from one range into another - the workhorse of any code touching a UI.
 *
 * It is just `inverseLerp` followed by `lerp`: work out how far through the input range the value
 * sits, then go that far through the output range.
 */
export function remap(
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return lerp(outMin, outMax, inverseLerp(inMin, inMax, v));
}

// ---- Frame-rate independence -------------------------------------------------------------

/**
 * The blend factor to use this frame, given a decay `rate` and however long the frame took.
 *
 * This is the whole fix. A constant factor closes a fixed **fraction per frame**, so more
 * frames means faster convergence and the feel of the game changes with the hardware. This
 * closes a fixed fraction **per second** instead, by asking how much time actually passed.
 *
 * The reason it works is that the leftover distance after a step is `exp(-rate * dt)`, and
 * multiplying those together over a series of steps adds the exponents - so the total only
 * depends on the total time, never on how it was chopped up.
 */
export function decayFactor(rate: number, dt: number): number {
  return 1 - Math.exp(-rate * dt);
}

/**
 * Convert a **half-life** into a decay rate.
 *
 * Half-life is the number to expose to whoever is tuning the feel, because it means something
 * out loud: "the camera closes half the remaining distance every 0.15 seconds". A raw rate
 * means nothing to anybody.
 */
export function rateFromHalfLife(halfLife: number): number {
  return Math.LN2 / halfLife;
}

/** Back the other way, for reading a rate someone else picked. */
export function halfLifeFromRate(rate: number): number {
  return Math.LN2 / rate;
}

/**
 * One frame of frame-rate-independent smoothing towards a target.
 *
 * The drop-in replacement for `lerp(current, target, 0.1)`, and the only difference is that it
 * is told how long the frame took.
 */
export function damp(
  current: number,
  target: number,
  rate: number,
  dt: number,
): number {
  return lerp(current, target, decayFactor(rate, dt));
}

/** How much of the gap is still left after `seconds`, given a half-life. */
export function remainingAfter(halfLife: number, seconds: number): number {
  return Math.pow(0.5, seconds / halfLife);
}
