/** A jump as a quadratic Bezier, and where its one control point has to sit. */
import { bezierAt, jumpArc } from "../bezier.ts";
import type { Demo } from "./runner.ts";

const DISTANCE = 6;
const HEIGHT = 2;

const demo: Demo = (log) => {
  const arc = jumpArc(DISTANCE, HEIGHT);

  log(
    `jumpArc(${DISTANCE}, ${HEIGHT}) control point`,
    `(${arc[1].x}, ${arc[1].y})`,
    "twice the height you asked for",
  );
  log(
    "height at the midpoint",
    bezierAt(arc, 0.5).y,
    "which is the height you asked for",
  );
  log("launch point", `(${bezierAt(arc, 0).x}, ${bezierAt(arc, 0).y})`);
  log("landing point", `(${bezierAt(arc, 1).x}, ${bezierAt(arc, 1).y})`);

  // Where the peak actually is, found by sampling rather than assumed.
  let peak = -Infinity;
  let peakAt = 0;
  for (let i = 0; i <= 2000; i += 1) {
    const p = bezierAt(arc, i / 2000);
    if (p.y > peak) {
      peak = p.y;
      peakAt = i / 2000;
    }
  }
  log("highest point found by sampling", peak, `at t = ${peakAt}`);
};

export default demo;
