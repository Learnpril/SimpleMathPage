/**
 * A vector split into the part along a direction and the part across it.
 *
 * Separate from the scene because the two claims worth making are numeric: the parts add back to the
 * original exactly, and they are perpendicular to each other at every angle.
 */
import { along, decompose, dot } from "../../../gamedev2d/dot2d.ts";
import { length } from "../../../gamedev2d/length2d.ts";
import type { Vector } from "../../../gamedev2d/vectors2d.ts";

export type Split = {
  v: Vector;
  direction: Vector;
  alongPart: Vector;
  acrossPart: Vector;
  /** The signed distance along the direction, which is the dot product when it is unit length. */
  signed: number;
  raw: number;
  angleDegrees: number;
};

/** A vector of a given length at a given angle. World angles: positive is counter-clockwise. */
export function vectorAt(angleDegrees: number, len: number): Vector {
  const r = (angleDegrees * Math.PI) / 180;
  return { x: Math.cos(r) * len, y: Math.sin(r) * len };
}

/**
 * Split a vector at `vAngle` of length `speed` against a **unit** direction at `dirAngle`.
 *
 * The direction is deliberately unit length here, because that is the case where the projection is
 * the bare dot product and the picture reads as one number rather than a ratio.
 */
export function split(vAngle: number, speed: number, dirAngle: number): Split {
  const v = vectorAt(vAngle, speed);
  const direction = vectorAt(dirAngle, 1);
  const parts = decompose(v, direction);
  return {
    v,
    direction,
    alongPart: parts.along,
    acrossPart: parts.across,
    signed: along(v, direction),
    raw: dot(v, direction),
    angleDegrees: Math.abs(vAngle - dirAngle),
  };
}

/** Do the two parts add back to the original, and are they perpendicular? Both, at every angle. */
export function residuals(s: Split): { sum: number; perpendicular: number } {
  return {
    sum: length({
      x: s.alongPart.x + s.acrossPart.x - s.v.x,
      y: s.alongPart.y + s.acrossPart.y - s.v.y,
    }),
    perpendicular: Math.abs(dot(s.alongPart, s.acrossPart)),
  };
}
