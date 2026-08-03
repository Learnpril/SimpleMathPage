/**
 * Two cubics joined three ways: with a corner, looking smooth, and actually smooth.
 *
 * Only the second curve's *first* control point changes between the three cases. Everything else
 * is held fixed, so any difference at the seam is down to that one point.
 */
import { bezierAt, cubicTangent, type Cubic } from "../bezier.ts";
import type { Vec2 } from "../matrices.ts";

export type Join = "broken" | "g1" | "c1";

export const JOINS: readonly Join[] = ["broken", "g1", "c1"];

export const FIRST: Cubic = [
  { x: -2.2, y: -0.9 },
  { x: -1.4, y: 0.9 },
  { x: -0.5, y: 1.2 },
  { x: 0.2, y: 0.4 },
];

const JOINT = FIRST[3];
/** The direction the first curve is travelling as it arrives. */
const ARRIVING: Vec2 = {
  x: FIRST[3].x - FIRST[2].x,
  y: FIRST[3].y - FIRST[2].y,
};
const TAIL_A: Vec2 = { x: 1.6, y: -1.1 };
const TAIL_B: Vec2 = { x: 2.3, y: 0.4 };

/** The handle that decides the join, expressed as a multiple of the arriving direction. */
function handleFor(join: Join): Vec2 {
  if (join === "broken") return { x: JOINT.x + 0.95, y: JOINT.y + 1.0 };
  const scale = join === "g1" ? 0.3 : 1;
  return {
    x: JOINT.x + ARRIVING.x * scale,
    y: JOINT.y + ARRIVING.y * scale,
  };
}

export function secondFor(join: Join): Cubic {
  return [JOINT, handleFor(join), TAIL_A, TAIL_B];
}

/** Where a dot sweeping the whole chain sits. The first half is curve one, the second is two. */
export function chainAt(join: Join, t: number): Vec2 {
  return t < 0.5
    ? bezierAt(FIRST, t * 2)
    : bezierAt(secondFor(join), (t - 0.5) * 2);
}

/** How fast the chain is moving on each side of the seam. */
export function seamSpeeds(join: Join): { leaving: number; entering: number } {
  const out = cubicTangent(FIRST, 1);
  const into = cubicTangent(secondFor(join), 0);
  return {
    leaving: Math.hypot(out.x, out.y),
    entering: Math.hypot(into.x, into.y),
  };
}
