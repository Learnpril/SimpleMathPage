/**
 * A surface at an angle, a velocity aimed at it, and the split that decides what happens.
 *
 * The angle-to-normal mapping lives here because it is the part that can be silently wrong: a
 * sign slip would still draw a plausible surface with a plausible arrow, just decomposing
 * against the wrong side of it.
 */
import type { Vec3 } from "../matrices.ts";
import { decompose, isWalkable, slopeAngle } from "../response.ts";

/** The slope a character can stand on. Above it, the surface is treated as a wall. */
export const MAX_SLOPE = 46;
export const SPEED = 4;

/** A surface tilted by `deg` from flat, in the XY plane. Its normal points up and back. */
export function surfaceNormal(deg: number): Vec3 {
  const r = (deg * Math.PI) / 180;
  return { x: -Math.sin(r), y: Math.cos(r), z: 0 };
}

/** The direction the surface runs, for drawing it. */
export function surfaceDirection(deg: number): Vec3 {
  const r = (deg * Math.PI) / 180;
  return { x: Math.cos(r), y: Math.sin(r), z: 0 };
}

/** A velocity of fixed speed, aimed `deg` from straight right. */
export function velocityAt(deg: number): Vec3 {
  const r = (deg * Math.PI) / 180;
  return { x: Math.cos(r) * SPEED, y: Math.sin(r) * SPEED, z: 0 };
}

const size = (v: Vec3) => Math.hypot(v.x, v.y, v.z);

/** Everything the scene draws and the readout says, for one pair of angles. */
export function analyse(surfaceDeg: number, aimDeg: number) {
  const normal = surfaceNormal(surfaceDeg);
  const velocity = velocityAt(aimDeg);
  const { amount, normalPart, tangentPart } = decompose(velocity, normal);
  return {
    normal,
    velocity,
    amount,
    normalPart,
    tangentPart,
    /** How much of the speed the surface takes away. Zero when moving along or away. */
    blocked: amount < 0 ? size(normalPart) : 0,
    /** How much survives, which is what sliding keeps. */
    sliding: size(tangentPart),
    /** True when the velocity is heading into the surface at all. */
    heldUp: amount < 0,
    slope: slopeAngle(normal),
    walkable: isWalkable(normal, MAX_SLOPE),
  };
}
