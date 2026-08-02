/**
 * Signed angles, wrapping, and turning the short way.
 *
 * Displayed in the lesson and imported by the figure above it.
 */
import { type Vec } from "./vectors.ts";
import { dot } from "./dot.ts";
import { cross, cross2 } from "./cross.ts";

export const TAU = Math.PI * 2;

/**
 * The angle of a 2D vector, measured from the +x axis, in radians from -PI to PI.
 *
 * Note the argument order: y first. `Math.atan2` takes the components separately rather
 * than their ratio, which is what lets it keep the quadrant and survive a zero x. Plain
 * `Math.atan(y / x)` throws both of those away.
 */
export function angleOf(v: Vec): number {
  return Math.atan2(v[1], v[0]);
}

/**
 * Fold any angle into [-PI, PI).
 *
 * An angle difference has infinitely many representations, all describing the same final
 * heading, and plain subtraction hands you an arbitrary one. This picks the shortest.
 *
 * At exactly half a turn the two directions are equally short, so there is no correct
 * answer. This implementation consistently returns -PI, i.e. clockwise. Consistency is
 * the property that matters; without it a turret facing exactly away from its target can
 * flip direction every frame and judder.
 */
export function wrapRad(radians: number): number {
  const m = (radians + Math.PI) % TAU;
  return (m < 0 ? m + TAU : m) - Math.PI;
}

/** The same fold, in degrees, to [-180, 180). */
export function wrapDeg(degrees: number): number {
  const m = (degrees + 180) % 360;
  return (m < 0 ? m + 360 : m) - 180;
}

/**
 * The signed angle from `a` to `b` in 2D, in radians.
 *
 * The dot product supplies the cosine and the 2D cross the sine, so atan2 of the pair
 * recovers both magnitude and direction. `Math.acos` alone cannot do this: it only ever
 * returns 0 to PI, so it can say how far apart two directions are but never which side.
 */
export function signedAngle2(a: Vec, b: Vec): number {
  return Math.atan2(cross2(a, b), dot(a, b));
}

/**
 * The signed angle from `a` to `b` measured about `axis`, in radians.
 *
 * In 3D "which side" is meaningless until you name the plane you are measuring in, which
 * is what the axis argument is for.
 */
export function signedAngle3(a: Vec, b: Vec, axis: Vec = [0, 1, 0]): number {
  const c = cross(a, b);
  const sine = c[0] * axis[0] + c[1] * axis[1] + c[2] * axis[2];
  return Math.atan2(sine, dot(a, b));
}

/**
 * Step `current` toward `target` by at most `maxStep`, taking the short way.
 *
 * The wrap is what stops a turret rotating 340 degrees to reach something 20 degrees
 * away. The clamp is what makes the movement look mechanical rather than instant.
 */
export function rotateToward(
  current: number,
  target: number,
  maxStep: number,
): number {
  const delta = wrapRad(target - current);
  const step = Math.min(maxStep, Math.max(-maxStep, delta));
  return current + step;
}
