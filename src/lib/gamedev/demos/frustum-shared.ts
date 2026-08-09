/**
 * A fixed spread of objects in front of a camera, for showing which ones survive culling.
 *
 * Positions are generated from a deterministic irrational-stride sequence rather than
 * `Math.random`, because a demo's output is committed and randomness would churn the diff on every
 * build. It spreads well enough to put objects both inside and outside any reasonable frustum.
 */
import type { Vec3 } from "../matrices.ts";
import { frustumPlanes, insideFrustum, perspective } from "../projection.ts";

export const ASPECT = 16 / 9;
export const RADIUS = 0.35;

export const OBJECTS: readonly Vec3[] = Array.from({ length: 28 }, (_, i) => {
  const a = ((i + 1) * 0.6180339887) % 1;
  const b = ((i + 1) * 0.4142135624) % 1;
  const c = ((i + 1) * 0.2360679775) % 1;
  return {
    x: (a - 0.5) * 16,
    y: (b - 0.5) * 8,
    z: -(c * 20 + 0.6),
  };
});

/** Which objects a camera with these settings would actually have to draw. */
export function visibleCount(fovY: number, near: number, far: number): number {
  const planes = frustumPlanes(perspective(fovY, ASPECT, near, far));
  return OBJECTS.filter((p) => insideFrustum(planes, p, RADIUS)).length;
}

/** Per-object verdict, so the scene can colour them. */
export function visibility(fovY: number, near: number, far: number): boolean[] {
  const planes = frustumPlanes(perspective(fovY, ASPECT, near, far));
  return OBJECTS.map((p) => insideFrustum(planes, p, RADIUS));
}
