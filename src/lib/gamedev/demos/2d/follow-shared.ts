/**
 * Two followers chasing the same target, one updated at 30 fps and one at 144 fps.
 *
 * The signal is a step: the target sits at 0, then jumps to 1. A step response is the clearest way to
 * see a convergence rate, because the whole behaviour is one curve and two curves that should behave
 * the same either lie together or they do not.
 *
 * Both followers run the **same code with the same parameter**. The only difference is how often it is
 * called, which is the entire point: with a per-frame lerp that difference changes the whole curve, and
 * with exponential decay it changes only the single frame the step lands in.
 */
import {
  decay,
  lerpPerFrame,
  rateFromHalfLife,
  secondsPerFrame,
  smooth,
} from "../../../gamedev2d/time2d.ts";

/** The two frame rates. A slow tablet and a gaming monitor, which is a real spread of hardware. */
export const RATES = [30, 144] as const;

/**
 * 30 fps and 144 fps share a frame boundary every **sixth of a second**: frame 5 of one, frame 24 of
 * the other, at the same instant. Those are the only moments at which the two can be compared without
 * comparing two different questions.
 */
export const SHARED_PERIOD = 1 / 6;

/** Frames per shared boundary, one per rate: 5 at 30 fps, 24 at 144. Both whole numbers by design. */
export const STRIDES = RATES.map((fps) => Math.round(fps * SHARED_PERIOD));

/**
 * The target steps on a shared boundary, on purpose.
 *
 * An earlier version stepped at 0.2 s, which falls between frames at both rates - so the 30 fps
 * follower first noticed at 0.233 and the 144 fps one at 0.201, and the curves were offset by that
 * 32 ms whatever smoothing was used. That is **when each found out**, not how fast it converges, and it
 * made a frame-rate-independent update look frame-rate dependent.
 */
export const STEP_AT = SHARED_PERIOD;

/** Nine shared boundaries fit in this, ending exactly on one. */
export const DURATION = 1.5;

/**
 * The half-life floor sits above **two** frames at 30 fps, which is 0.067 s.
 *
 * Below one frame time the slow follower closes most of the gap in a single step, so its drawn curve is
 * visibly coarser than the fast one - not because decay depends on the frame rate, but because 30
 * samples a second cannot draw detail finer than a thirtieth of a second.
 */
export const RANGE = {
  factor: { min: 0.02, max: 0.4 },
  halfLife: { min: 0.07, max: 0.5 },
};

/** The target's value at a time: zero, then one. */
export function targetAt(seconds: number): number {
  return seconds < STEP_AT ? 0 : 1;
}

export type Params = {
  /** The per-frame fraction, used when `useDecay` is false. */
  factor: number;
  /** The half-life in seconds, used when `useDecay` is true. */
  halfLife: number;
  useDecay: boolean;
};

/**
 * Simulate one follower for the whole duration, returning its value at each of its own frames.
 *
 * Deliberately a plain loop over fixed frames rather than anything clever: this is the loop a game
 * actually runs, and the Section's claim is about what that loop does at two different rates.
 */
export function traceFor(
  p: Params,
  fps: number,
): Array<{ t: number; value: number }> {
  const dt = secondsPerFrame(fps);
  const rate = rateFromHalfLife(p.halfLife);
  const trace: Array<{ t: number; value: number }> = [{ t: 0, value: 0 }];
  let value = 0;
  const frames = Math.round(DURATION * fps);
  for (let i = 1; i <= frames; i += 1) {
    const t = i * dt;
    const target = targetAt(t);
    value = p.useDecay
      ? decay(value, target, rate, dt)
      : lerpPerFrame(value, target, p.factor);
    trace.push({ t, value });
  }
  return trace;
}

/** Both traces at once, in the order they should be drawn. */
export function traces(p: Params): Array<{
  fps: number;
  points: Array<{ t: number; value: number }>;
}> {
  return RATES.map((fps) => ({ fps, points: traceFor(p, fps) }));
}

/**
 * The two followers' values at every instant they share, as pairs.
 *
 * Compared by **frame index**, never by looking a trace up at a time: frame 5k of one and frame 24k of
 * the other are the same instant by construction, with nothing to round.
 */
export function sharedPairs(
  p: Params,
): Array<{ t: number; slow: number; fast: number }> {
  const traced = RATES.map((fps) => traceFor(p, fps));
  const pairs: Array<{ t: number; slow: number; fast: number }> = [];
  for (let k = 0; ; k += 1) {
    const indices = STRIDES.map((stride) => k * stride);
    if (indices.some((index, i) => index >= traced[i].length)) break;
    pairs.push({
      t: traced[0][indices[0]].t,
      slow: traced[0][indices[0]].value,
      fast: traced[1][indices[1]].value,
    });
  }
  return pairs;
}

/**
 * The gap in the single frame the step lands in, which decay cannot avoid and does not need to.
 *
 * The target changes at an instant both followers observe, but they then integrate the new target over
 * frames of different lengths - 33 ms against 7 ms - so the slow one has closed more of the gap by the
 * time that frame ends. It is bounded by exactly one frame of decay, it appears only at a
 * discontinuity, and it is gone by the next boundary. Naming it separately is what lets the page be
 * honest about it instead of claiming an equality that is not there.
 */
export function transientGap(p: Params): number {
  const pairs = sharedPairs(p);
  return pairs.length > 1 ? Math.abs(pairs[1].slow - pairs[1].fast) : 0;
}

/**
 * The worst gap **after** the frame the step landed in. The number the Section is really about.
 *
 * Once both followers are chasing a target that is no longer changing, decay puts them on the same
 * curve and this collapses toward zero. A per-frame lerp does not: it stays wide, because the two rates
 * are converging at genuinely different speeds.
 */
export function worstGapAfterStep(p: Params): number {
  return sharedPairs(p)
    .slice(2)
    .reduce(
      (worst, pair) => Math.max(worst, Math.abs(pair.slow - pair.fast)),
      0,
    );
}

/** A trace's value at an arbitrary time, held from the last frame - which is what a screen shows. */
export function valueAt(
  trace: Array<{ t: number; value: number }>,
  seconds: number,
): number {
  let value = trace[0].value;
  for (const point of trace) {
    if (point.t > seconds) break;
    value = point.value;
  }
  return value;
}

/**
 * The gap on a dense grid, including moments between the slow follower's frames.
 *
 * Only used to show what a coarse frame rate looks like: with a half-life shorter than a frame, 30
 * samples a second cannot draw the curve however correct each sample is. Sampling, not frame-rate
 * dependence - and keeping the two measurements apart is what lets the page say so.
 */
export function worstSampledGap(p: Params, samples = 400): number {
  const [slow, fast] = RATES.map((fps) => traceFor(p, fps));
  let worst = 0;
  for (let i = 0; i <= samples; i += 1) {
    const t = (i / samples) * DURATION;
    worst = Math.max(worst, Math.abs(valueAt(slow, t) - valueAt(fast, t)));
  }
  return worst;
}

/** How long a follower takes to close a fraction of the gap after the step. Null if it never does. */
export function timeToClose(
  p: Params,
  fps: number,
  fraction = 0.95,
): number | null {
  for (const point of traceFor(p, fps)) {
    if (point.t >= STEP_AT && point.value >= fraction) return point.t - STEP_AT;
  }
  return null;
}

/** One frame of decay's worth of catch-up at a given rate, which bounds the transient. */
export function oneFrameOfDecay(p: Params, fps: number): number {
  return smooth(0, 1, p.halfLife, secondsPerFrame(fps));
}
