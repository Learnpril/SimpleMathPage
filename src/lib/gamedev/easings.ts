/**
 * The **shape** of a movement, as opposed to its rate.
 *
 * `interpolation.ts` answers "how much of the gap should close this frame". This file answers a
 * different question: given that a move takes a fixed amount of time, how should the progress be
 * distributed across it? Fast then slow, slow then fast, overshoot and settle - each reads as a
 * different physical claim about the thing moving.
 *
 * Every curve here takes `t` in [0, 1] and returns a shaped value that is 0 at 0 and 1 at 1. The
 * last section is the exception: a spring has no fixed duration, so it takes a timestep instead.
 */
import { clamp01, inverseLerp } from "./interpolation.ts";

/**
 * The classic S curve, flat at both ends.
 *
 * The reason it is everywhere: its slope is **zero** at 0 and at 1, so motion driven by it eases
 * out of rest and settles rather than starting and stopping abruptly. Takes edges rather than a
 * bare `t` so it can map a range directly, matching the shader function of the same name.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01(inverseLerp(edge0, edge1, x));
  return t * t * (3 - 2 * t);
}

/**
 * Ken Perlin's refinement. Zero slope **and** zero curvature at both ends.
 *
 * Worth the two extra multiplies when the value feeds something that itself gets differentiated -
 * a camera path, a normal map - because a jump in curvature is visible as a crease even when the
 * value and its slope are continuous.
 */
export function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01(inverseLerp(edge0, edge1, x));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// ---- The curve family ---------------------------------------------------------------------

/** No shaping at all. Constant speed, which reads as mechanical. */
export const linear = (t: number) => t;

/** Accelerating from rest. Reads as something heavy getting going. */
export const easeInQuad = (t: number) => t * t;

/** Decelerating into the target. Reads as arriving deliberately. */
export const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

/** Accelerate then decelerate, harder than smoothstep at both ends. */
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - 4 * (1 - t) * (1 - t) * (1 - t);

/** Smoothstep as a plain easing curve, with the edges fixed at 0 and 1. */
export const smoothstep01 = (t: number) => smoothstep(0, 1, t);

/** Smootherstep the same way. */
export const smootherstep01 = (t: number) => smootherstep(0, 1, t);

/**
 * Overshoots the target and comes back. Reads as snappy and deliberate.
 *
 * Note this leaves [0, 1] on purpose - it peaks above 1 - so anything consuming it must tolerate
 * that. Clamping it removes the entire effect.
 */
export const easeOutBack = (t: number) => {
  const c = 1.70158;
  const u = t - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
};

/** Overshoots several times with shrinking amplitude. Reads as cartoonish, and wears out fast. */
export const easeOutElastic = (t: number) => {
  if (t === 0 || t === 1) return t;
  return (
    Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
  );
};

/**
 * The gallery, with what each one says to a player.
 *
 * The third field is the part that actually matters when choosing. Easing is not decoration - a
 * curve is a claim about mass and intent, and picking the wrong one makes a light object feel
 * heavy or a deliberate action feel accidental.
 */
export const EASINGS: ReadonlyArray<{
  name: string;
  fn: (t: number) => number;
  says: string;
}> = [
  { name: "linear", fn: linear, says: "mechanical, no mass" },
  { name: "easeInQuad", fn: easeInQuad, says: "heavy, getting going" },
  { name: "easeOutQuad", fn: easeOutQuad, says: "arriving deliberately" },
  { name: "easeInOutCubic", fn: easeInOutCubic, says: "purposeful, both ends" },
  { name: "smoothstep", fn: smoothstep01, says: "the default S curve" },
  { name: "smootherstep", fn: smootherstep01, says: "S curve, no crease" },
  { name: "easeOutBack", fn: easeOutBack, says: "snappy, slight overshoot" },
  { name: "easeOutElastic", fn: easeOutElastic, says: "cartoonish, springy" },
];

// ---- Springs ------------------------------------------------------------------------------

/** A spring carries velocity between frames, so it needs somewhere to keep it. */
export type SpringState = { value: number; velocity: number };

/**
 * One frame of **critically damped** spring smoothing.
 *
 * Critically damped means the fastest approach that does not overshoot: any less damping and it
 * oscillates around the target, any more and it crawls. That boundary is the one worth having as
 * a default, because it is the fastest motion that never looks like a mistake.
 *
 * This is the exact solution of the spring equation rather than a step-by-step approximation,
 * which is what makes it frame-rate independent for the same reason `decayFactor` is: composing
 * exact solutions over consecutive intervals gives the exact solution over the whole.
 *
 * What it buys over `damp` is **continuous velocity**. Exponential decay's speed depends only on
 * distance, so a target that jumps makes it lurch instantly. A spring has to accelerate first, so
 * it eases out of rest as well as into the target.
 */
export function springStep(
  state: SpringState,
  target: number,
  smoothTime: number,
  dt: number,
): SpringState {
  const omega = 2 / smoothTime;
  const change = state.value - target;
  // The velocity the solution needs in order to match both position and speed at t = 0.
  const b = state.velocity + omega * change;
  const decay = Math.exp(-omega * dt);
  return {
    value: target + (change + b * dt) * decay,
    velocity: (state.velocity - omega * b * dt) * decay,
  };
}
