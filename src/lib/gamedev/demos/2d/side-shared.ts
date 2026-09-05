/**
 * A directed line, a point, and the one number that says which side the point is on.
 *
 * The line is stored as an angle rather than two corners so the scene can sweep it, and reversing it
 * is a separate flag rather than a different line - because "read the same line backwards" is the
 * thing that flips every answer, and it should be one checkbox away.
 */
import {
  cross,
  parallelogramArea,
  sideOf,
  sideValue,
  signedDistanceToLine,
  triangleArea,
} from "../../../gamedev2d/cross2d.ts";
import {
  displacement,
  movedBy,
  type Point,
} from "../../../gamedev2d/vectors2d.ts";

/** Half the drawn length of the line's segment, in world units. The maths treats it as infinite. */
export const HALF_LENGTH = 2.5;

export type SideReport = {
  from: Point;
  to: Point;
  p: Point;
  /** The cross product itself, which is twice the triangle's area. */
  raw: number;
  side: -1 | 0 | 1;
  /** Positive to the left of the direction of travel, negative to the right. */
  distance: number;
  parallelogram: number;
  triangle: number;
};

/** The two drawn ends of the line, through the origin at the given angle. */
export function lineEnds(
  angleDegrees: number,
  reversed: boolean,
): { from: Point; to: Point } {
  const r = (angleDegrees * Math.PI) / 180;
  const tip = { x: Math.cos(r) * HALF_LENGTH, y: Math.sin(r) * HALF_LENGTH };
  const tail = { x: -tip.x, y: -tip.y };
  return reversed ? { from: tip, to: tail } : { from: tail, to: tip };
}

export function reading(
  angleDegrees: number,
  px: number,
  py: number,
  reversed: boolean,
): SideReport {
  const { from, to } = lineEnds(angleDegrees, reversed);
  const p = { x: px, y: py };
  return {
    from,
    to,
    p,
    raw: sideValue(from, to, p),
    side: sideOf(from, to, p),
    distance: signedDistanceToLine(from, to, p),
    parallelogram: parallelogramArea(
      displacement(from, to),
      displacement(from, p),
    ),
    triangle: triangleArea(from, to, p),
  };
}

/**
 * The four corners of the parallelogram the cross product measures.
 *
 * Drawn so the magnitude reading has something to point at. Its area must come out as the cross
 * product's absolute value, which is checked rather than asserted in a caption.
 */
export function parallelogramCorners(r: SideReport): Point[] {
  const alongLine = displacement(r.from, r.to);
  const toPoint = displacement(r.from, r.p);
  return [
    r.from,
    movedBy(r.from, alongLine),
    movedBy(movedBy(r.from, alongLine), toPoint),
    movedBy(r.from, toPoint),
  ];
}

/**
 * The same question answered by `atan2` instead, for the build to compare against.
 *
 * Genuinely different arithmetic: a signed angle rather than a determinant. If the two ever disagree
 * about a side, one of them is wrong, and a picture would not tell us which.
 */
export function sideByAngle(r: SideReport): -1 | 0 | 1 {
  const alongLine = displacement(r.from, r.to);
  const toPoint = displacement(r.from, r.p);
  const signed = Math.atan2(
    cross(alongLine, toPoint),
    alongLine.x * toPoint.x + alongLine.y * toPoint.y,
  );
  return signed > 0 ? 1 : signed < 0 ? -1 : 0;
}

/**
 * The nearest place on the infinite line, so the scene can draw the perpendicular it is measuring.
 *
 * Here rather than in the scene because it is arithmetic, not drawing: its distance to the point must
 * come out as the magnitude of the signed distance, and that is worth checking rather than eyeballing.
 */
export function footOnLine(r: SideReport): Point {
  const alongLine = displacement(r.from, r.to);
  const toPoint = displacement(r.from, r.p);
  const denominator = alongLine.x * alongLine.x + alongLine.y * alongLine.y;
  if (denominator < 1e-18) return r.from;
  const k = (toPoint.x * alongLine.x + toPoint.y * alongLine.y) / denominator;
  return movedBy(r.from, { x: alongLine.x * k, y: alongLine.y * k });
}
