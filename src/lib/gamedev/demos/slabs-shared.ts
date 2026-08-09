/**
 * A ray aimed at a box, and the three stretches of it that lie between each pair of faces.
 *
 * Kept out of the scene so the build can check the thing that matters: that the overlap of
 * the three stretches really is the part of the ray inside the box.
 */
import type { Vec3 } from "../matrices.ts";
import { rayAabb, slabInterval, type Aabb } from "../collision.ts";

export const BOX: Aabb = {
  min: { x: -1.5, y: -1, z: -1.2 },
  max: { x: 1.5, y: 1, z: 1.2 },
};
export const RAY_ORIGIN: Vec3 = { x: -6, y: 0, z: 0 };
export const AXES = ["x", "y", "z"] as const;
export type Axis = (typeof AXES)[number];

/** Aim broadly along +X, turned by a yaw and a pitch. Unit length, so `t` is in meters. */
export function directionFor(yawDeg: number, pitchDeg: number): Vec3 {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  return {
    x: Math.cos(pitch) * Math.cos(yaw),
    y: Math.sin(pitch),
    z: Math.cos(pitch) * Math.sin(yaw),
  };
}

/** The stretch of the ray inside each pair of faces. A `null` interval is a parallel miss. */
export function slabsFor(yawDeg: number, pitchDeg: number) {
  const d = directionFor(yawDeg, pitchDeg);
  return AXES.map((axis) => ({
    axis,
    interval: slabInterval(
      RAY_ORIGIN[axis],
      d[axis],
      BOX.min[axis],
      BOX.max[axis],
    ),
  }));
}

/**
 * The whole answer, plus a phrase saying which pair of stretches failed to overlap.
 *
 * Naming the culprit is the point of the scene. A miss is never "the ray was somewhere
 * else" - it is always two specific stretches that did not share any of the ray.
 */
export function resultFor(yawDeg: number, pitchDeg: number) {
  const direction = directionFor(yawDeg, pitchDeg);
  const hit = rayAabb(RAY_ORIGIN, direction, BOX);
  const slabs = slabsFor(yawDeg, pitchDeg);

  let blame: string | null = null;
  const empty = slabs.find((s) => s.interval === null);
  if (empty) {
    blame = `the ${empty.axis} stretch is empty: the ray runs parallel to those faces and passes outside them`;
  } else if (hit === null) {
    const latest = slabs.reduce((best, s) =>
      s.interval!.enter > best.interval!.enter ? s : best,
    );
    const earliest = slabs.reduce((best, s) =>
      s.interval!.exit < best.interval!.exit ? s : best,
    );
    blame = `the ${latest.axis} stretch starts after the ${earliest.axis} stretch ends`;
  }
  return { direction, hit, slabs, blame };
}
