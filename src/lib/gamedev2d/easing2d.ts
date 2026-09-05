/**
 * The small functions that turn a number into another number, and the curves that give motion a feel.
 *
 * Four of these do almost all the work in any game: `lerp` to blend, `inverseLerp` to ask how far along
 * something is, `remap` to move a value from one range to another, and `clamp` to keep it in bounds.
 * Everything else here is a shape applied on top.
 *
 * **This is a different tool from Section 4.1's decay, and the difference matters.** Easing animates
 * between a known start and a known end over a known duration: it can overshoot, bounce, and land
 * exactly on time. Decay chases a target that may be moving and never arrives exactly. Reach for easing
 * when you know where and when something should finish, and for decay when you are following something.
 */
import { lerp } from "./time2d.ts";

export { lerp };

/** Keep a number inside a range. The most-used function in this file and the least discussed. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Clamp to the unit interval, which is what almost every easing wants of its input. */
export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/**
 * `lerp` with the factor clamped, which is usually what was meant.
 *
 * Plain `lerp` is **not** clamped, and that is worth knowing rather than discovering: at `t = 2` it
 * extrapolates to twice past the end. Sometimes that is exactly what you want - continuing a trajectory,
 * predicting ahead - and sometimes it is a projectile leaving the level.
 */
export function lerpClamped(a: number, b: number, t: number): number {
  return lerp(a, b, clamp01(t));
}

/**
 * The opposite question to `lerp`: given a value, how far along the range is it?
 *
 * $$t = \frac{v - a}{b - a}$$
 *
 * A health bar's fill, a progress fraction, how far through a fade you are. Returns 0 for a
 * zero-width range rather than dividing by zero - the honest answer, since every value is
 * simultaneously at the start and the end of an empty range.
 */
export function inverseLerp(a: number, b: number, value: number): number {
  return Math.abs(b - a) < 1e-12 ? 0 : (value - a) / (b - a);
}

/**
 * Move a value from one range to another: the two above, composed.
 *
 * $$\text{remap}(v) = \text{lerp}\!\left(c, d, \text{inverseLerp}(a, b, v)\right)$$
 *
 * This is the function that removes most of the arithmetic from gameplay code. Stick position of
 * $-1 \ldots 1$ to a turn rate of $-180 \ldots 180$; health of $0 \ldots 100$ to a bar width in pixels;
 * a distance of $2 \ldots 20$ to a volume of $1 \ldots 0$, which is a fade-out written as one line.
 */
export function remap(
  value: number,
  fromA: number,
  fromB: number,
  toA: number,
  toB: number,
): number {
  return lerp(toA, toB, inverseLerp(fromA, fromB, value));
}

/** The same, refusing to leave the destination range. Usually the one you want for a volume or a colour. */
export function remapClamped(
  value: number,
  fromA: number,
  fromB: number,
  toA: number,
  toB: number,
): number {
  return lerp(toA, toB, clamp01(inverseLerp(fromA, fromB, value)));
}

/**
 * Smoothstep: an S-curve that starts and stops **gently**, in one polynomial.
 *
 * $$3t^2 - 2t^3$$
 *
 * Zero slope at both ends - but so has `easeInOutQuad`, so that is not what distinguishes it. Two
 * things do, both measured at build time. It is a **single** cubic rather than two parabolas stitched
 * together, so its curvature passes smoothly through zero in the middle instead of jumping from $+4$
 * to $-4$. And its peak speed is $1.5\times$ the average against the piecewise version's $2\times$, so
 * the same distance in the same time is covered with less of a surge. Same function GLSL and HLSL
 * provide, for the same reasons.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01(inverseLerp(edge0, edge1, x));
  return t * t * (3 - 2 * t);
}

/**
 * Smootherstep: zero slope **and** zero curvature at both ends.
 *
 * $$6t^5 - 15t^4 + 10t^3$$
 *
 * This is the thing smoothstep does not have. Smoothstep's curvature at $t = 0$ is exactly $6$, so the
 * *acceleration* still arrives as a step even though the speed does not; here it is $0$, and the build
 * checks it by watching the measurement fall tenfold for every tenfold step closer to the end.
 *
 * It matters when the thing being eased is itself differentiated - a camera whose velocity feeds
 * something else. The cost is a higher peak speed, $1.875\times$ the average against $1.5\times$,
 * because the gentler ends have to be paid for in the middle. For most motion the two are
 * indistinguishable.
 */
export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01(inverseLerp(edge0, edge1, x));
  return t * t * t * (t * (6 * t - 15) + 10);
}

/** An easing takes a fraction of the way through and returns a fraction of the way there. */
export type Easing = (t: number) => number;

/** No easing at all. Constant speed, sudden start, sudden stop. */
export const linear: Easing = (t) => t;

/** Starts slow. Reads as something heavy getting going, or a menu sliding away. */
export const easeInQuad: Easing = (t) => t * t;

/** Ends slow. The workhorse: things arriving feel like they have mass and settle. */
export const easeOutQuad: Easing = (t) => 1 - (1 - t) * (1 - t);

/** Slow at both ends. The default for anything that both starts and stops on screen. */
export const easeInOutQuad: Easing = (t) =>
  t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);

/** A stronger version of the same three, for when quadratic is too subtle. */
export const easeInCubic: Easing = (t) => t * t * t;
export const easeOutCubic: Easing = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic: Easing = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - 4 * Math.pow(1 - t, 3);

/**
 * The famous magic number, and it is not arbitrary: it is the value that makes the overshoot **10%**.
 *
 * Measured, since a constant with no derivation attached invites being rounded. At $1.70158$ the peak
 * is $1.100004$; at a tidy $1.7$ it is $1.099843$, and at $2$ it is $1.131687$. So the digits are
 * buying the round number in the *output*, which is the number a designer was actually choosing.
 */
const BACK = 1.70158;

/**
 * Overshoots the target and comes back. Reads as eagerness, or as something snapping into place.
 *
 * **This leaves the 0 to 1 range on purpose**, which is the whole point of it and also the thing to
 * check before using it on a value that must not exceed its bounds - a colour channel, an opacity, a
 * health fraction. Its peak is asserted at build time rather than guessed at.
 */
export const easeOutBack: Easing = (t) =>
  1 + (BACK + 1) * Math.pow(t - 1, 3) + BACK * Math.pow(t - 1, 2);

const ELASTIC = (2 * Math.PI) / 3;

/**
 * Overshoots and oscillates before settling. Reads as springy, and wears out its welcome quickly.
 *
 * The two endpoint cases are **not** cosmetic tidying, which is worth knowing before deleting them.
 * The formula alone gives $1.000488$ at $t = 1$ - it lands half a tenth of a percent past the target
 * and stays there, because there is nothing after $t = 1$ to bring it back. The case returns the
 * target exactly, which is the promise easing makes and decay cannot.
 */
export const easeOutElastic: Easing = (t) =>
  t === 0
    ? 0
    : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ELASTIC) + 1;

/**
 * Never leaves the range, but lands **four times**. Reads as a physical object dropping.
 *
 * Piecewise rather than a formula, which is why it is written out: each segment is one parabola. It
 * reaches the target at $t = 0.3636$, $0.7273$, $0.9091$ and $1$, and between those it falls back by
 * $0.25$, then $0.0625$, then $0.015625$ - each dip **exactly a quarter** of the one before, which is
 * where the drop-and-settle reading comes from. Its maximum over the interval is $1$ and not a
 * fraction more, so unlike the two above it is safe on a value with a hard ceiling.
 */
export const easeOutBounce: Easing = (t) => {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};

/**
 * Turn any easing into its mirror image, so one definition covers both directions.
 *
 * $$\text{out}(t) = 1 - \text{in}(1 - t)$$
 *
 * Worth having as a function rather than as a second hand-written formula: the pair can then never
 * drift apart, and the identity is checkable.
 */
export function reverse(easing: Easing): Easing {
  return (t) => 1 - easing(1 - t);
}

/**
 * Animate between two values over a **fixed duration**, which is what easing is for.
 *
 * Frame-rate independent by construction, and for a different reason than Section 4.1's decay: the
 * fraction is `elapsed / duration`, both measured in seconds, so the frame rate never enters. It also
 * lands exactly on `to` at exactly `duration`, which decay can never promise.
 */
export function tween(
  from: number,
  to: number,
  elapsed: number,
  duration: number,
  easing: Easing = linear,
): number {
  if (duration <= 0) return to;
  return lerp(from, to, easing(clamp01(elapsed / duration)));
}
