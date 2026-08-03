/**
 * The same move, once as exponential decay and once as a critically damped spring.
 *
 * Both closed forms are exact, so a single step of length `t` gives the position at time `t` with
 * no simulation loop at all. `springStepped` exists only so the build can check that stepping it
 * frame by frame agrees with taking one big step - which is the frame-rate independence claim.
 */
import { damp, rateFromHalfLife } from "../interpolation.ts";
import { springStep, type SpringState } from "../easings.ts";

export const HALF_LIFE = 0.1;
export const SMOOTH_TIME = 0.3;
const START = 0;
const TARGET = 1;

/** Exponential decay, `t` seconds after the target appeared. */
export function decayAt(t: number): number {
  return damp(START, TARGET, rateFromHalfLife(HALF_LIFE), t);
}

/** Critically damped spring, starting from rest, `t` seconds after the target appeared. */
export function springAt(t: number): number {
  return springStep({ value: START, velocity: 0 }, TARGET, SMOOTH_TIME, t)
    .value;
}

/** The same spring taken in frames of a given length, to compare against one big step. */
export function springStepped(t: number, fps: number): SpringState {
  const dt = 1 / fps;
  let state: SpringState = { value: START, velocity: 0 };
  const whole = Math.floor(t / dt + 1e-9);
  for (let i = 0; i < whole; i += 1) {
    state = springStep(state, TARGET, SMOOTH_TIME, dt);
  }
  const leftover = t - whole * dt;
  if (leftover > 1e-12) {
    state = springStep(state, TARGET, SMOOTH_TIME, leftover);
  }
  return state;
}
