/**
 * A turret aiming at a target, either with `atan2` or with the plain `atan` that loses half the plane.
 *
 * The reason `alignment` is here rather than only in the picture: the scene draws the barrel from the
 * angle it computed, so a barrel pointing exactly backwards looks like a barrel. Dotting the barrel's
 * direction back against the direction to the target turns "it looks wrong" into a number the build
 * can check, and that number is $+1$ when the aim is right and $-1$ when it is half a turn out.
 */
import {
  angleOf,
  directionFromAngle,
  naiveAngleOf,
  toDegrees,
} from "../../../gamedev2d/angles2d.ts";
import { dot } from "../../../gamedev2d/dot2d.ts";
import { normalize } from "../../../gamedev2d/length2d.ts";
import {
  displacement,
  type Point,
  type Vector,
} from "../../../gamedev2d/vectors2d.ts";

export const TURRET: Point = { x: 0, y: 0 };

/** Pixels per world unit for this scene. The world is measured in units; only drawing knows pixels. */
export const UNIT = 34;

export type AimReport = {
  target: Point;
  /** The angle the code came up with, which is not always the angle it wanted. */
  angle: number;
  degrees: number;
  /** Where the barrel ends up pointing, as a unit vector. */
  facing: Vector;
  /** +1 when the barrel points at the target, -1 when it points exactly away from it. */
  alignment: number;
  /** What `atan2` would have said, for comparison. */
  correctDegrees: number;
};

export function report(tx: number, ty: number, useAtan2: boolean): AimReport {
  const target = { x: tx, y: ty };
  const toTarget = displacement(TURRET, target);
  const angle = useAtan2 ? angleOf(toTarget) : naiveAngleOf(toTarget);
  const facing = directionFromAngle(angle);
  const unit = normalize(toTarget);
  return {
    target,
    angle,
    degrees: toDegrees(angle),
    facing,
    alignment: unit === null ? 0 : dot(facing, unit),
    correctDegrees: toDegrees(angleOf(toTarget)),
  };
}

/** World to canvas pixels, for a world centred on the canvas. The Y flip lives here. */
export function screenOf(
  p: Point,
  ox: number,
  oy: number,
): { x: number; y: number } {
  return { x: ox + p.x * UNIT, y: oy - p.y * UNIT };
}

/** And back, which is what a drag needs. Its round trip is checked at build time. */
export function worldOf(sx: number, sy: number, ox: number, oy: number): Point {
  return { x: (sx - ox) / UNIT, y: (oy - sy) / UNIT };
}
