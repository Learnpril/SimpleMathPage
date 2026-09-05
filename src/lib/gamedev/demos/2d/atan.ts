/** The same four targets read by atan2 and by plain atan, one quadrant at a time. */
import {
  angleOf,
  directionFromAngle,
  naiveAngleOf,
  toDegrees,
} from "../../../gamedev2d/angles2d.ts";
import { dot } from "../../../gamedev2d/dot2d.ts";
import { normalize } from "../../../gamedev2d/length2d.ts";
import type { Vector } from "../../../gamedev2d/vectors2d.ts";
import type { Demo } from "../runner.ts";

const QUADRANTS: Array<{ v: Vector; where: string }> = [
  { v: { x: 3, y: 2 }, where: "up and to the right" },
  { v: { x: -3, y: 2 }, where: "up and to the left" },
  { v: { x: -3, y: -2 }, where: "down and to the left" },
  { v: { x: 3, y: -2 }, where: "down and to the right" },
];

const deg = (radians: number) => `${toDegrees(radians).toFixed(1)}\u00B0`;

/** Point a barrel at the angle, then ask how well it lines up with the target. 1 is right, -1 is backwards. */
const alignment = (v: Vector, angle: number) =>
  dot(directionFromAngle(angle), normalize(v)!).toFixed(0);

const demo: Demo = (log) => {
  for (const { v, where } of QUADRANTS) {
    const agree =
      toDegrees(angleOf(v)).toFixed(1) ===
      toDegrees(naiveAngleOf(v)).toFixed(1);
    log(
      `a target at (${v.x}, ${v.y}), ${where}`,
      `atan2 says ${deg(angleOf(v))}, atan says ${deg(naiveAngleOf(v))}`,
      agree
        ? "agreeing, because x is positive"
        : "half a turn apart, and nothing in the code says which is which",
    );
  }
  log(
    "aim a barrel with each answer and dot it back against the target",
    `atan2: ${QUADRANTS.map((q) => alignment(q.v, angleOf(q.v))).join(", ")} \u00B7 ` +
      `atan: ${QUADRANTS.map((q) => alignment(q.v, naiveAngleOf(q.v))).join(", ")}`,
    "minus one is a barrel pointing exactly away from what it was aiming at",
  );
  log(
    "straight left, at (-1, 0)",
    `atan2 says ${deg(angleOf({ x: -1, y: 0 }))}, atan says ${deg(naiveAngleOf({ x: -1, y: 0 }))}`,
    "the plainest case there is, and the division threw away the minus sign",
  );
};

export default demo;
