/**
 * The two shapes a movement direction can reach: the square you get by accident, the circle you want.
 *
 * Kept out of the scene because the claim being made is numeric - that the corner is exactly
 * $\sqrt{2}$ and the circle is exactly 1 everywhere - and a picture cannot show "exactly".
 */
import {
  fullDeflection,
  length,
  normalize,
} from "../../../gamedev2d/length2d.ts";
import type { Vector } from "../../../gamedev2d/vectors2d.ts";

/** What raw per-axis input reaches at a given direction: somewhere on the square. */
export function rawAt(radians: number): Vector {
  return fullDeflection(radians);
}

/** What the same direction reaches once normalized: always on the circle. */
export function fixedAt(radians: number): Vector {
  return normalize(fullDeflection(radians)) ?? { x: 0, y: 0 };
}

/** How much faster the raw version is, as a multiplier. 1 on an axis, root two on a diagonal. */
export function speedRatio(radians: number): number {
  return length(rawAt(radians));
}

/** The whole square, for drawing, sampled finely enough that its corners stay sharp. */
export function squareLoop(samples = 360): Vector[] {
  return Array.from({ length: samples + 1 }, (_, i) =>
    rawAt((i / samples) * Math.PI * 2),
  );
}

/** The whole circle, for drawing. */
export function circleLoop(samples = 180): Vector[] {
  return Array.from({ length: samples + 1 }, (_, i) =>
    fixedAt((i / samples) * Math.PI * 2),
  );
}
