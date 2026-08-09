/** What the near plane costs you in depth precision, and what the far plane does not. */
import { depthResolution, perspective } from "../projection.ts";
import type { Demo } from "./runner.ts";

const ASPECT = 16 / 9;
const BITS = 24;
const mm = (metres: number) => `${(metres * 1000).toFixed(2)} mm`;

const demo: Demo = (log) => {
  // A 24-bit depth buffer, measured at 100 metres out, for four choices of near plane.
  for (const near of [0.001, 0.01, 0.1, 1]) {
    const proj = perspective(60, ASPECT, near, 1000);
    log(
      `near ${near} m, depth precision at 100 m`,
      mm(depthResolution(proj, 100, BITS)),
      near === 0.001 ? "half a metre of uncertainty" : undefined,
    );
  }

  // Now move the far plane by the same factor of ten and watch nothing happen.
  const a = depthResolution(perspective(60, ASPECT, 0.1, 100), 50, BITS);
  const b = depthResolution(perspective(60, ASPECT, 0.1, 1000), 50, BITS);
  log(
    "far 100 m vs far 1000 m, measured at 50 m",
    `${(b / a).toFixed(4)}x worse`,
    "ten times the range costs almost nothing",
  );
};

export default demo;
