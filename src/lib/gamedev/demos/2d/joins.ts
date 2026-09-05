/** Sharing an endpoint is not smoothness, and the one line that turns the first into the second. */
import {
  elevate,
  joinsSmoothly,
  meetsAt,
  seamAngle,
  smoothedNext,
} from "../../../gamedev2d/bezier2d.ts";
import { JOIN_A, JOIN_NAIVE, PRESETS } from "./path-shared.ts";
import type { Demo } from "../runner.ts";

const demo: Demo = (log) => {
  log(
    "meetsAt(first, second)",
    meetsAt(JOIN_A, JOIN_NAIVE),
    "they share an endpoint, which is all most code checks",
  );
  log(
    "joinsSmoothly(first, second)",
    joinsSmoothly(JOIN_A, JOIN_NAIVE),
    "and yet",
  );
  log(
    "seamAngle(first, second)",
    `${seamAngle(JOIN_A, JOIN_NAIVE).toFixed(2)}\u00B0`,
    "the corner a sprite would swing its facing through in one frame",
  );

  // The fix: reflect the previous handle through the shared point. P1' = 2S - P(n-1).
  const fixed = smoothedNext(JOIN_A, JOIN_NAIVE);
  log(
    "smoothedNext(first, second)[1]",
    `(${fixed[1].x}, ${fixed[1].y})`,
    `was (${JOIN_NAIVE[1].x}, ${JOIN_NAIVE[1].y}) - only the one handle moved`,
  );
  log(
    "seamAngle after mirroring",
    `${seamAngle(JOIN_A, fixed).toFixed(10)}\u00B0`,
    "smooth to the last decimal, and nothing else about the curve changed",
  );

  // And the degree elevation that lets a chain of mixed degrees be made uniform.
  log(
    "elevate(quadratic)",
    elevate(PRESETS[2].points)
      .map((p) => `(${p.x.toFixed(3)}, ${p.y.toFixed(3)})`)
      .join(" "),
    "four control points now, and the identical curve",
  );
};

export default demo;
