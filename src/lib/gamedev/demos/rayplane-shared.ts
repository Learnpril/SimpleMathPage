/**
 * One ray aimed at the floor, with its pitch as the only control.
 *
 * The pitch-to-direction mapping lives here rather than in the scene because it is the part
 * that can be wrong without looking wrong: a sign slip would still draw a plausible ray,
 * just hitting on the wrong side. `checks.ts` pins the resulting distances against values
 * worked out by hand.
 */
import type { Vec3 } from "../matrices.ts";
import { planeThrough, pointAt, rayPlane, type Ray } from "../geometry.ts";

/** The floor: the plane through the world origin with its normal straight up. */
export const FLOOR = planeThrough({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });

/** The ray starts three meters up and five meters back, and aims forward along -Z. */
export const RAY_ORIGIN: Vec3 = { x: 0, y: 3, z: 5 };

/**
 * The ray at a given pitch. Negative pitch aims down, which is the only case that hits.
 *
 * The direction comes out unit length for free, because it is built from a sine and a
 * cosine of the same angle - so `t` reads directly as a distance in meters.
 */
export function rayAtPitch(pitchDeg: number): Ray {
  const p = (pitchDeg * Math.PI) / 180;
  return {
    origin: RAY_ORIGIN,
    direction: { x: 0, y: Math.sin(p), z: -Math.cos(p) },
  };
}

/**
 * What the intersection reports at a given pitch: the denominator, the distance, the point.
 *
 * The denominator is `n · D`, and it is the number worth watching. It shrinks as the ray
 * flattens out, so `t` grows without bound, and at exactly level it is zero and there is no
 * answer at all.
 */
export function hitAtPitch(pitchDeg: number): {
  denominator: number;
  t: number | null;
  point: Vec3 | null;
} {
  const ray = rayAtPitch(pitchDeg);
  const denominator =
    FLOOR.x * ray.direction.x +
    FLOOR.y * ray.direction.y +
    FLOOR.z * ray.direction.z;
  const t = rayPlane(ray, FLOOR);
  return { denominator, t, point: t === null ? null : pointAt(ray, t) };
}
