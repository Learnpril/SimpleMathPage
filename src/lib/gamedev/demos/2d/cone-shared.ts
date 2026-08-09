/**
 * A guard, a vision cone, and the two ways the cone test goes wrong.
 *
 * The target is placed in polar form - an angle off the guard's facing and a distance - because that
 * is what separates the two mistakes. Holding the angle and sweeping the distance shows the
 * unnormalized test flipping its answer with no change in angle at all.
 */
import { coneThreshold, dot, isInFront } from "../../../gamedev2d/dot2d.ts";
import { normalize } from "../../../gamedev2d/length2d.ts";
import type { Point, Vector } from "../../../gamedev2d/vectors2d.ts";

export const GUARD: Point = { x: 0, y: 0 };
export const RANGE = 8;
/** The guard faces along positive x, so the picture's angles are the target's angles. */
export const FACING: Vector = { x: 1, y: 0 };

export type Report = {
  target: Point;
  /** The number the test actually compares, which depends on whether it was normalized. */
  measured: number;
  threshold: number;
  inCone: boolean;
  inRange: boolean;
  seen: boolean;
  /** The 180 degree answer, for contrast: positive dot alone. */
  inFront: boolean;
};

/** Where the target sits, given an angle off the guard's facing and a distance. */
export function targetAt(angleDegrees: number, distance: number): Point {
  const r = (angleDegrees * Math.PI) / 180;
  return { x: Math.cos(r) * distance, y: Math.sin(r) * distance };
}

/**
 * Run the cone test, either correctly or with the normalize left out.
 *
 * With `normalized` false this is the bug: the dot product grows with distance, so the threshold
 * stops meaning an angle. The measured number is the only thing that changes between the two.
 */
export function report(
  halfAngleDegrees: number,
  angleDegrees: number,
  distance: number,
  normalized: boolean,
): Report {
  const target = targetAt(angleDegrees, distance);
  const toTarget = { x: target.x - GUARD.x, y: target.y - GUARD.y };
  const unit = normalize(toTarget);
  const measured = normalized
    ? unit === null
      ? 1
      : dot(FACING, unit)
    : dot(FACING, toTarget);
  const threshold = coneThreshold(halfAngleDegrees);
  const inCone = measured >= threshold;
  const inRange = distance <= RANGE;
  return {
    target,
    measured,
    threshold,
    inCone,
    inRange,
    seen: inCone && inRange,
    inFront: isInFront(FACING, toTarget),
  };
}

/**
 * The closest distance at which the unnormalized test wrongly passes, at a given angle.
 *
 * Solving $d\cos\theta \ge \cos\phi$ for $d$: outside the cone, the buggy test is satisfied by
 * simply standing further away. Returns null when the angle is at or inside the cone anyway.
 */
export function bugStartsAt(
  halfAngleDegrees: number,
  angleDegrees: number,
): number | null {
  const cosAngle = Math.cos((angleDegrees * Math.PI) / 180);
  if (cosAngle <= 0) return null;
  const needed = coneThreshold(halfAngleDegrees) / cosAngle;
  return needed <= 1 ? null : needed;
}
