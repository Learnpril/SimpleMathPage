/** Range checks without a square root, and the two ways to get them wrong. */
import {
  distance,
  distanceSquared,
  isWithin,
  normalize,
  velocityFrom,
} from "../../../gamedev2d/length2d.ts";
import type { Demo } from "../runner.ts";

const PLAYER = { x: 3, y: 2 };
const RADIUS = 5;

const demo: Demo = (log) => {
  const target = { x: 5, y: 5 };
  log(
    `from (3, 2) to (5, 5): distance and squared distance`,
    `${distance(PLAYER, target).toFixed(4)} and ${distanceSquared(PLAYER, target)}`,
    "the second one skipped a square root",
  );
  log(
    `is it within ${RADIUS}? asked both ways`,
    `by distance ${distance(PLAYER, target) < RADIUS}, by squared ${distanceSquared(PLAYER, target) < RADIUS * RADIUS}`,
    `which is what isWithin does: ${isWithin(PLAYER, target, RADIUS)}`,
  );

  // The claim that the two agree is worth sweeping rather than sampling.
  let disagreements = 0;
  for (let i = 0; i < 200; i += 1) {
    for (let j = 0; j < 200; j += 1) {
      const p = { x: -10 + i * 0.1, y: -10 + j * 0.1 };
      if (
        distance(PLAYER, p) < RADIUS !==
        distanceSquared(PLAYER, p) < RADIUS * RADIUS
      ) {
        disagreements += 1;
      }
    }
  }
  log(
    "over 40,000 positions the two tests disagree",
    `${disagreements} times`,
    "so the root is simply wasted work",
  );

  // The trap: a squared distance compared against an unsquared radius.
  log(
    `the trap: squared distance < ${RADIUS} instead of < ${RADIUS * RADIUS}`,
    `${distanceSquared(PLAYER, target) < RADIUS}`,
    `wrongly excludes a target only ${distance(PLAYER, target).toFixed(2)} away`,
  );

  // The other guard: a direction that does not exist.
  log(
    "normalize({ x: 0, y: 0 })",
    `${normalize({ x: 0, y: 0 })}`,
    "no direction to report, so it says so",
  );
  log(
    "the same divide left unguarded",
    `{ x: ${0 / 0}, y: ${0 / 0} }`,
    "and a NaN position is a sprite that has silently vanished",
  );
  log(
    "velocityFrom({ x: 0, y: 0 }, 5)",
    `{ x: ${velocityFrom({ x: 0, y: 0 }, 5).x}, y: ${velocityFrom({ x: 0, y: 0 }, 5).y} }`,
    "no input means standing still, which is the sensible answer here",
  );
};

export default demo;
