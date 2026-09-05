/** The four functions that remove most of the arithmetic from gameplay code, and the one gotcha. */
import {
  clamp,
  inverseLerp,
  lerp,
  remap,
  remapClamped,
} from "../../../gamedev2d/easing2d.ts";
import type { Demo } from "../runner.ts";

const demo: Demo = (log) => {
  log(
    "lerp(10, 50, 0.25)",
    lerp(10, 50, 0.25),
    "a quarter of the way from 10 to 50",
  );
  log(
    "inverseLerp(10, 50, 20)",
    inverseLerp(10, 50, 20),
    "the same question backwards: 20 is a quarter of the way along",
  );
  log(
    "lerp(10, 50, inverseLerp(10, 50, 37))",
    lerp(10, 50, inverseLerp(10, 50, 37)),
    "so the two undo each other, which is what makes remap trustworthy",
  );

  // remap is those two composed, and it is the one that shows up everywhere.
  log(
    "remap(0.5, -1, 1, -180, 180)",
    remap(0.5, -1, 1, -180, 180),
    "stick position to degrees per second",
  );
  log(
    "remap(75, 0, 100, 0, 240)",
    remap(75, 0, 100, 0, 240),
    "health to the width of its bar in pixels",
  );

  // The gotcha, and its fix. Both are useful; only one of them is usually meant.
  log(
    "lerp(0, 100, 2)",
    lerp(0, 100, 2),
    "lerp is not clamped - twice past the end, sometimes on purpose",
  );
  log(
    "remapClamped(25, 2, 20, 1, 0)",
    remapClamped(25, 2, 20, 1, 0),
    `a listener past the far edge goes silent, not negative: inverseLerp said ` +
      `${inverseLerp(2, 20, 25).toFixed(2)} and clamp cut it to ${clamp(inverseLerp(2, 20, 25), 0, 1)}`,
  );
};

export default demo;
