/**
 * Four primitives spread out in a row, and the nearest point on each to a query point.
 *
 * Spread out on purpose: the point of the scene is that four different shapes answer the same
 * question, so they must not overlap and confuse whose answer is whose.
 */
import type { Vec3 } from "../matrices.ts";
import {
  closestOnBox,
  closestOnPlane,
  closestOnSegment,
  closestOnSphere,
  magnitude,
  planeThrough,
} from "../geometry.ts";

export const GROUND = planeThrough(
  { x: 0, y: -2.5, z: 0 },
  { x: 0, y: 1, z: 0 },
);
export const SEG_A: Vec3 = { x: -6, y: -1, z: -1.5 };
export const SEG_B: Vec3 = { x: -3.5, y: 1.5, z: 1 };
/* Deliberately not a cube. With equal extents an axis mix-up inside `closestOnBox` is
   invisible - every wrong answer is also a right answer - so the box the checks sweep has
   three different half-widths. */
export const BOX_MIN: Vec3 = { x: -1.7, y: -1.1, z: -0.8 };
export const BOX_MAX: Vec3 = { x: 1.7, y: 1.1, z: 0.8 };
export const SPHERE_C: Vec3 = { x: 5, y: 0.2, z: 0 };
export const SPHERE_R = 1.7;

export type Nearest = {
  name: string;
  point: Vec3;
  distance: number;
};

/** The nearest point on each primitive, with its distance, in a fixed order. */
export function nearestPoints(p: Vec3): Nearest[] {
  const entries: Array<[string, Vec3]> = [
    ["segment", closestOnSegment(SEG_A, SEG_B, p)],
    ["box", closestOnBox(BOX_MIN, BOX_MAX, p)],
    ["sphere", closestOnSphere(SPHERE_C, SPHERE_R, p)],
    ["ground", closestOnPlane(GROUND, p)],
  ];
  return entries.map(([name, point]) => ({
    name,
    point,
    distance: magnitude({
      x: p.x - point.x,
      y: p.y - point.y,
      z: p.z - point.z,
    }),
  }));
}

/** Which primitive is closest. The index a collision system would care about. */
export function nearestIndex(p: Vec3): number {
  const all = nearestPoints(p);
  let best = 0;
  all.forEach((n, i) => {
    if (n.distance < all[best].distance) best = i;
  });
  return best;
}
