/**
 * Turning things: the rotation formula, rotating about a pivot that is not the origin, and turning
 * toward a heading the short way at a limited rate.
 *
 * Three separate mistakes live in this file's subject matter, and each one is here as a working
 * function beside its broken twin. Rotating without moving the pivot to the origin first. Comparing
 * two angles without wrapping the difference. Interpolating between two headings as though they were
 * plain numbers.
 */
import { wrapRadians } from "./angles2d.ts";
import { displacement, movedBy, type Point, type Vector } from "./vectors2d.ts";

/**
 * Rotate a vector counter-clockwise about the origin.
 *
 * $$x' = x\cos\theta - y\sin\theta \qquad y' = x\sin\theta + y\cos\theta$$
 *
 * Worth reading rather than memorising. The result is the vector's own components used as weights on
 * two rotated axes: $(\cos\theta, \sin\theta)$ is where $(1, 0)$ ends up, and
 * $(-\sin\theta, \cos\theta)$ is where $(0, 1)$ ends up. Section 3.1 turns exactly that observation
 * into a matrix, and the two columns of it are those two vectors.
 *
 * The classic slip is a sign: $x\cos\theta + y\sin\theta$ rotates the other way, which looks
 * plausible on screen right up to the moment something has to line up with something else.
 */
export function rotate(v: Vector, radians: number): Vector {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

/**
 * Rotate a point about an arbitrary pivot. Three steps, and the third is the one that gets forgotten.
 *
 * The formula above only turns things about the origin, so: measure the point **from** the pivot,
 * rotate that displacement, then put it back. Subtract, rotate, add.
 *
 * Leaving off the final add does not crash and does not produce a `NaN`. The shape rotates correctly
 * and lands somewhere else, offset by exactly the pivot. Worse, **it is completely correct while the
 * pivot is at the origin**, so it survives every test you write before you move anything.
 */
export function rotateAbout(p: Point, pivot: Point, radians: number): Point {
  return movedBy(pivot, rotate(displacement(pivot, p), radians));
}

/** The same, minus the step back. Kept only so the build can show what it costs. */
export function rotateAboutBroken(
  p: Point,
  pivot: Point,
  radians: number,
): Point {
  return rotate(displacement(pivot, p), radians);
}

/**
 * Rotate a whole shape about a pivot, computing the sine and cosine **once**.
 *
 * The arithmetic is identical to calling `rotateAbout` per point; the difference is that a sprite with
 * forty corners calls `Math.cos` once instead of forty times. Not a micro-optimisation worth
 * contorting code for, but this shape is the natural one anyway.
 */
export function rotateAll(
  points: readonly Point[],
  pivot: Point,
  radians: number,
): Point[] {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return points.map((p) => {
    const dx = p.x - pivot.x;
    const dy = p.y - pivot.y;
    return { x: pivot.x + dx * c - dy * s, y: pivot.y + dx * s + dy * c };
  });
}

/**
 * The shortest signed way round from one heading to another, in $[-\pi, \pi)$.
 *
 * $$\Delta = \operatorname{wrap}(\theta_{\text{target}} - \theta_{\text{current}})$$
 *
 * One subtraction and one wrap. **The wrap is the entire function** - without it, facing $170°$ and
 * aiming at $-170°$ gives a difference of $-340°$, so a turret turns almost all the way round to
 * reach a target $20°$ away. The sign says which way: positive is counter-clockwise.
 */
export function angleDifference(current: number, target: number): number {
  return wrapRadians(target - current);
}

/**
 * Turn from `current` toward `target` by at most `maxStep`, taking the short way.
 *
 * The clamp is what makes it feel like a machine with a turn rate rather than a value being
 * assigned. Note that it snaps exactly onto the target on the final step instead of overshooting and
 * oscillating, which is the other half of what makes it look intentional.
 */
export function turnToward(
  current: number,
  target: number,
  maxStep: number,
): number {
  const difference = angleDifference(current, target);
  if (Math.abs(difference) <= maxStep) return wrapRadians(target);
  return wrapRadians(current + Math.sign(difference) * maxStep);
}

/**
 * The same turn with the wrap left out, which turns the long way round. Do not ship this.
 *
 * It still arrives, which is what makes it survive a code review: nothing is `NaN`, nothing
 * oscillates, the turret simply takes the scenic route whenever the short way crosses the $\pm 180°$
 * seam. On a tank turret it reads as a bug in the AI rather than in the arithmetic.
 */
export function turnTowardBroken(
  current: number,
  target: number,
  maxStep: number,
): number {
  const difference = target - current;
  if (Math.abs(difference) <= maxStep) return target;
  return current + Math.sign(difference) * maxStep;
}

/**
 * Interpolate between two headings the short way round.
 *
 * Blend the **difference**, not the endpoints: take the wrapped difference, scale it, and add. At
 * `t = 1` this returns the target's heading rather than the target's number, which is the same
 * direction and not always the same value.
 */
export function lerpAngle(from: number, to: number, t: number): number {
  return wrapRadians(from + angleDifference(from, to) * t);
}

/** Lerping the raw numbers, which is the bug. Halfway between two nearby headings can be opposite. */
export function lerpAngleBroken(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}
