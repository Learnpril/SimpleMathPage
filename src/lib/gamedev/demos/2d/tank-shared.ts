/**
 * A tank with a turret on it: two levels of hierarchy, and the three ways one goes wrong.
 *
 * The turret is placed **once**, at a fixed spot on the hull facing forward, and never touched again.
 * Everything it does on screen comes from its parent's transform, which is the whole point of a
 * hierarchy and the thing the scene is there to make obvious.
 *
 * Framing is derived rather than chosen, as in Sections 2.3 and 3.1: a rotating hull with a turret
 * sticking out of it reaches further than either shape alone.
 */
import { multiply, type Mat3 } from "../../../gamedev2d/matrix2d.ts";
import {
  matrixOf,
  placed,
  shearOf,
  type Placement,
} from "../../../gamedev2d/spaces2d.ts";
import { applyAll } from "../../../gamedev2d/matrix2d.ts";
import { length } from "../../../gamedev2d/length2d.ts";
import type { Point } from "../../../gamedev2d/vectors2d.ts";

/** The hull, in the tank's own coordinates: longer than it is wide, nose to the right. */
export const HULL: readonly Point[] = [
  { x: -1.5, y: -0.7 },
  { x: 1.1, y: -0.7 },
  { x: 1.5, y: -0.35 },
  { x: 1.5, y: 0.35 },
  { x: 1.1, y: 0.7 },
  { x: -1.5, y: 0.7 },
];

/** The turret, in the **turret's** coordinates: a stubby body with a barrel along its own +x. */
export const TURRET: readonly Point[] = [
  { x: -0.35, y: -0.32 },
  { x: 0.3, y: -0.32 },
  { x: 0.3, y: -0.08 },
  { x: 1.15, y: -0.08 },
  { x: 1.15, y: 0.08 },
  { x: 0.3, y: 0.08 },
  { x: 0.3, y: 0.32 },
  { x: -0.35, y: 0.32 },
];

/**
 * Where the turret sits on the hull. Written once, in the hull's coordinates, and then left alone.
 *
 * Slightly forward of centre, which is enough to make the difference between rotating about the
 * turret's mount and rotating about the world origin visible.
 */
export const TURRET_MOUNT: Point = { x: 0.25, y: 0 };

export const RANGE = {
  tankX: { min: -4, max: 4 },
  tankAngle: { min: -180, max: 180 },
  hullScaleX: { min: 0.6, max: 1.6 },
  turretAngle: { min: -180, max: 180 },
};

export type Params = {
  tankX: number;
  tankAngleDegrees: number;
  hullScaleX: number;
  turretAngleDegrees: number;
};

const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** The hull's placement in the world. */
export function hullPlacement(p: Params): Placement {
  return placed({ x: p.tankX, y: 0 }, radians(p.tankAngleDegrees), {
    x: p.hullScaleX,
    y: 1,
  });
}

/** The turret's placement **relative to the hull**. Its position never changes. */
export function turretPlacement(p: Params): Placement {
  return placed(TURRET_MOUNT, radians(p.turretAngleDegrees), { x: 1, y: 1 });
}

/**
 * The two world transforms, and the wrong one for comparison.
 *
 * `childFirst` is the bug: `child * parent` instead of `parent * child`. It is not a small error - the
 * turret ends up placed in the world as though the hull's transform were written in the turret's
 * coordinates - but it is easy to type, and at the identity it makes no difference at all.
 */
export function transforms(
  p: Params,
  childFirst: boolean,
): { hull: Mat3; turret: Mat3 } {
  const hull = matrixOf(hullPlacement(p));
  const turret = matrixOf(turretPlacement(p));
  return {
    hull,
    turret: childFirst ? multiply(turret, hull) : multiply(hull, turret),
  };
}

export function hullShape(p: Params, childFirst: boolean): Point[] {
  return applyAll(transforms(p, childFirst).hull, HULL);
}

export function turretShape(p: Params, childFirst: boolean): Point[] {
  return applyAll(transforms(p, childFirst).turret, TURRET);
}

/** How far from square the turret's frame has become, once the hull's uneven scale reaches it. */
export function turretShear(p: Params): number {
  return shearOf(transforms(p, false).turret);
}

/**
 * How far from the origin anything drawn can reach, in world units.
 *
 * The hull's own corners reach `|position| + scaleMax * hullCorner`, and the turret hangs off the
 * mount by its own longest reach, scaled by the hull. Taking the worse of the two covers both shapes
 * and both multiplication orders, which a build-time sweep confirms rather than assumes.
 */
export function extentBound(): { x: number; y: number } {
  const hullCorner = Math.max(...HULL.map((q) => length(q)));
  const turretReach =
    length(TURRET_MOUNT) + Math.max(...TURRET.map((q) => length(q)));
  const reach = RANGE.hullScaleX.max * Math.max(hullCorner, turretReach);
  return {
    x: Math.max(Math.abs(RANGE.tankX.min), RANGE.tankX.max) + reach,
    y: reach,
  };
}

/** Pixels per world unit, so nothing either shape draws can leave the canvas. */
export function fittingScale(
  halfWidth: number,
  halfHeight: number,
  margin = 12,
): number {
  const bound = extentBound();
  return Math.min(
    (halfWidth - margin) / bound.x,
    (halfHeight - margin) / bound.y,
  );
}
