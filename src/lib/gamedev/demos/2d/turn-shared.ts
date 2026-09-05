/**
 * A turret turning toward a heading a fixed amount per step, with and without wrapping the difference.
 *
 * Stepped rather than animated on purpose: the reader drives the clock with a slider, so the scene is
 * deterministic, works from the keyboard, and needs nothing when reduced motion is asked for. It also
 * makes the count of steps the thing on screen, which is where the whole difference shows up.
 */
import { toRadians } from "../../../gamedev2d/angles2d.ts";
import {
  angleDifference,
  turnToward,
  turnTowardBroken,
} from "../../../gamedev2d/rotate2d.ts";

/** The turret starts here. Near the seam, because that is where the two versions part company. */
export const START = toRadians(170);

/** Enough that the long way round always finishes, so a null return means something is genuinely stuck. */
const CAP = 2000;

export type Turn = {
  /** Every heading visited, so the scene can draw the path that was swept. */
  angles: number[];
  current: number;
  /** The step it first landed on the target, or null if it has not yet. */
  arrivedAt: number | null;
  /** The difference the step used, which is the number the wrap changes. */
  difference: number;
};

export function simulate(
  targetDegrees: number,
  rateDegrees: number,
  steps: number,
  wrap: boolean,
): Turn {
  const target = toRadians(targetDegrees);
  const maxStep = toRadians(rateDegrees);
  let current = START;
  const angles = [current];
  let arrivedAt: number | null = null;
  for (let i = 1; i <= steps; i += 1) {
    current = wrap
      ? turnToward(current, target, maxStep)
      : turnTowardBroken(current, target, maxStep);
    angles.push(current);
    if (arrivedAt === null && Math.abs(angleDifference(current, target)) < 1e-9)
      arrivedAt = i;
  }
  return {
    angles,
    current,
    arrivedAt,
    difference: wrap ? angleDifference(START, target) : target - START,
  };
}

/** How many steps this version needs to arrive. The one number that separates the two. */
export function stepsToArrive(
  targetDegrees: number,
  rateDegrees: number,
  wrap: boolean,
): number | null {
  const target = toRadians(targetDegrees);
  const maxStep = toRadians(rateDegrees);
  let current = START;
  for (let i = 1; i <= CAP; i += 1) {
    current = wrap
      ? turnToward(current, target, maxStep)
      : turnTowardBroken(current, target, maxStep);
    if (Math.abs(angleDifference(current, target)) < 1e-9) return i;
  }
  return null;
}
