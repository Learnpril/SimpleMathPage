/**
 * Turning a cursor position into a ray, and finding what it hits.
 *
 * Everything is in the picked camera's own view space: it sits at the origin looking down -Z,
 * which is exactly the space `rayThroughNdc` produces a ray in. Doing the test here avoids a
 * conversion, and it is what an engine does too - transform the ray once, then test cheaply.
 */
import type { Vec3 } from "../matrices.ts";
import { rayThroughNdc, raySphere } from "../projection.ts";

export const ASPECT = 16 / 9;
export const FOV = 55;
export const NEAR = 1.2;
export const FAR = 26;

export const TARGETS: ReadonlyArray<{ centre: Vec3; radius: number }> = [
  { centre: { x: -2.4, y: 0.9, z: -7 }, radius: 0.9 },
  { centre: { x: 1.9, y: -0.7, z: -9 }, radius: 1.1 },
  { centre: { x: 0.2, y: 1.6, z: -14 }, radius: 1.3 },
  { centre: { x: -3.6, y: -1.4, z: -17 }, radius: 1.2 },
  { centre: { x: 4.2, y: 1.2, z: -20 }, radius: 1.4 },
];

/** The nearest target under the cursor, or `null` for empty space. */
export function pick(ndc: { x: number; y: number }): {
  index: number;
  distance: number;
} | null {
  const ray = rayThroughNdc(FOV, ASPECT, ndc);
  let best: { index: number; distance: number } | null = null;
  TARGETS.forEach((target, index) => {
    const t = raySphere(
      ray.origin,
      ray.direction,
      target.centre,
      target.radius,
    );
    // Nearest hit wins, which is the whole reason picking returns a distance at all.
    if (t !== null && (best === null || t < best.distance)) {
      best = { index, distance: t };
    }
  });
  return best;
}
