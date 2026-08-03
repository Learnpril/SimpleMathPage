/**
 * Chasing a target at two different frame rates, once the wrong way and once the right way.
 *
 * Both simulations run whole frames and then one short final frame for the leftover, because
 * that is what a real loop does - a frame's `dt` is however long it happened to take. Doing it
 * this way means both frame rates cover exactly the same total time, so any difference in the
 * answer is the method's fault rather than an artefact of where the frames landed.
 */
import { damp, lerp, rateFromHalfLife } from "../interpolation.ts";

export const START = -3;
export const TARGET = 3;

/** Split a duration into whole frames plus whatever is left over. */
function steps(fps: number, seconds: number): number[] {
  const dt = 1 / fps;
  const whole = Math.floor(seconds / dt + 1e-9);
  const out: number[] = new Array(whole).fill(dt);
  const leftover = seconds - whole * dt;
  if (leftover > 1e-12) out.push(leftover);
  return out;
}

/** The bug: a fixed blend factor every frame, whatever the frame took. */
export function simulateNaive(
  fps: number,
  seconds: number,
  factor: number,
): number {
  let x = START;
  for (let i = 0; i < steps(fps, seconds).length; i += 1) {
    x = lerp(x, TARGET, factor);
  }
  return x;
}

/** The fix: a blend factor derived from each frame's actual timestep. */
export function simulateDamped(
  fps: number,
  seconds: number,
  halfLife: number,
): number {
  const rate = rateFromHalfLife(halfLife);
  let x = START;
  for (const dt of steps(fps, seconds)) {
    x = damp(x, TARGET, rate, dt);
  }
  return x;
}

/** How many frames a fixed factor needs to close a given share of the gap. */
export function framesToClose(factor: number, share: number): number {
  return Math.log(1 - share) / Math.log(1 - factor);
}
