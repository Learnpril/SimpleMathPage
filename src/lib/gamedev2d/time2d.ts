/**
 * Time, and why almost every first attempt at smooth movement is secretly tied to a frame rate.
 *
 * A frame is not a unit of time. It is however long the machine happened to take, which on one screen
 * is $1/30$ of a second and on another $1/144$. So any update written **per frame** does a different
 * amount of work per second depending on the hardware, and a game tuned on one monitor behaves
 * differently on another - faster, not just smoother.
 *
 * Two fixes, for two different shapes of update. Anything that accumulates gets multiplied by the
 * elapsed time. Anything that **converges** toward a target needs exponential decay, which is the part
 * people get wrong for years, because the wrong version looks completely fine on the machine it was
 * written on.
 */

/** Seconds per frame at a given rate. Named because `1 / 144` in the middle of a formula reads as noise. */
export function secondsPerFrame(fps: number): number {
  return 1 / fps;
}

/**
 * Move at a velocity, correctly: multiply by the time that actually passed.
 *
 * $$p' = p + v\,\Delta t$$
 *
 * With `velocity` in units **per second**, this is frame-rate independent for free, and the units tell
 * you so: units per second times seconds is units. That dimensional check is the quickest way to audit
 * an update loop - anything added to a position without a `dt` beside it is suspect.
 */
export function step(position: number, velocity: number, dt: number): number {
  return position + velocity * dt;
}

/** The same thing with the `dt` left out, which is the bug. Kept so the build can price it. */
export function stepWithoutDt(position: number, velocity: number): number {
  return position + velocity;
}

/** Straight-line interpolation. `t` of 0 gives `a`, 1 gives `b`, and it is not clamped. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * The seductive one-liner: move a fraction of the remaining distance, every frame.
 *
 * ```js
 * current = lerp(current, target, 0.1);
 * ```
 *
 * It looks frame-rate independent because there is no time in it, and that is exactly the problem.
 * **The fraction is per frame, so it is per unknown amount of time.** A 144 Hz screen applies it 144
 * times a second and a 30 Hz screen 30 times, so the same code converges at wildly different speeds -
 * and it converges *faster* on better hardware, which is why it survives testing on a fast machine.
 */
export function lerpPerFrame(
  current: number,
  target: number,
  factor: number,
): number {
  return current + (target - current) * factor;
}

/**
 * How much of the gap is still left after a number of frames of per-frame lerp.
 *
 * $$\text{remaining} = (1 - f)^{n}$$
 *
 * Which is the whole problem in one expression: the exponent is a **frame count**, so the answer
 * depends on the machine rather than on the clock.
 */
export function remainingAfterFrames(factor: number, frames: number): number {
  return Math.pow(1 - factor, frames);
}

/**
 * The fix: exponential decay, where the exponent is **time** rather than frames.
 *
 * $$p' = \text{target} + (p - \text{target})\,e^{-\lambda \Delta t}$$
 *
 * Now the elapsed time is in the formula, so a hundred small steps and one big step covering the same
 * span give the same answer. That property is what frame-rate independence *means*, and it holds
 * because $e^{-\lambda t_1}e^{-\lambda t_2} = e^{-\lambda(t_1 + t_2)}$ - the exponential composes with
 * itself, which is the reason this particular curve is the right one rather than a convenient one.
 */
export function decay(
  current: number,
  target: number,
  rate: number,
  dt: number,
): number {
  return target + (current - target) * Math.exp(-rate * dt);
}

/** How much of the gap survives a given number of seconds of decay. No frame count anywhere. */
export function remainingAfterSeconds(rate: number, seconds: number): number {
  return Math.exp(-rate * seconds);
}

/**
 * The same decay, specified as a **half-life**: the time for half the gap to close.
 *
 * $$p' = \text{target} + (p - \text{target})\,2^{-\Delta t / h}$$
 *
 * This is the form worth exposing to whoever is tuning the feel, because the parameter is a duration
 * with an obvious meaning. "Catch up halfway in a tenth of a second" is a sentence a designer can hold
 * in their head; "lambda equals 6.93" is not. The two are the same curve.
 */
export function smooth(
  current: number,
  target: number,
  halfLife: number,
  dt: number,
): number {
  return target + (current - target) * Math.pow(2, -dt / halfLife);
}

/** Half-life to decay rate. $\lambda = \ln 2 / h$. */
export function rateFromHalfLife(halfLife: number): number {
  return Math.LN2 / halfLife;
}

/** And back, so either parameterisation can be handed to the other. */
export function halfLifeFromRate(rate: number): number {
  return Math.LN2 / rate;
}

/**
 * The decay rate that matches an existing per-frame lerp factor at one specific frame rate.
 *
 * $$\lambda = -\,\text{fps}\,\ln(1 - f)$$
 *
 * For porting code that is already tuned. Someone spent an afternoon settling on `0.15` at 60 fps and
 * likes how it feels; this reproduces that feel while making it independent of the frame rate. The
 * conversion is exact at that rate and the behaviour is now identical at every other one.
 */
export function rateFromLerpFactor(factor: number, fps: number): number {
  return -fps * Math.log(1 - factor);
}

/**
 * Run a whole second of per-frame lerp at a given frame rate, and report what is left.
 *
 * Here so the difference between two frame rates is a number the build can assert rather than a claim
 * in a caption.
 */
export function lerpAfterOneSecond(factor: number, fps: number): number {
  let remaining = 1;
  for (let i = 0; i < fps; i += 1) remaining *= 1 - factor;
  return remaining;
}

/**
 * Run a whole second of decay in `fps` steps, and report what is left.
 *
 * The point of this function is that the frame rate argument makes **no difference** to the result,
 * which is the opposite of the one above and is the assertion the Section rests on.
 */
export function decayAfterOneSecond(rate: number, fps: number): number {
  let remaining = 1;
  const dt = secondsPerFrame(fps);
  for (let i = 0; i < fps; i += 1) remaining *= Math.exp(-rate * dt);
  return remaining;
}

/**
 * A frame time clamped to something a simulation can survive.
 *
 * A tab left in the background, a garbage collection pause or a breakpoint can produce a `dt` of
 * several seconds, and every formula here will faithfully apply all of it - teleporting a character
 * through a wall. Clamping loses real time on purpose, which is the right trade for one bad frame.
 *
 * **Never skip the frame instead.** Returning early on a large `dt` makes the simulation drift out of
 * step with the clock permanently, and it is not necessary: decay handles any span correctly, so a
 * clamped step is still a well-behaved one.
 */
export function clampDt(dt: number, maximum = 0.1): number {
  return Math.min(Math.max(dt, 0), maximum);
}
