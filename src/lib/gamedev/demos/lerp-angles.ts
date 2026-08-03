/** Interpolating 350 degrees to 10 degrees, blending numbers versus blending angles. */
import { wrapDeg } from "../angles.ts";
import { lerp } from "../interpolation.ts";
import { HEADING, type Demo } from "./runner.ts";

const FROM = 350;
const TO = 10;

/** Plain lerp walks straight through the numbers. This one walks through the angles. */
const lerpAngle = (a: number, b: number, t: number) => a + wrapDeg(b - a) * t;

const demo: Demo = (log) => {
  for (const t of [0, 0.5, 1]) {
    log(`t = ${t.toFixed(1)}`, {
      lerp: lerp(FROM, TO, t),
      lerpAngle: lerpAngle(FROM, TO, t),
    });
  }

  log("degrees travelled", HEADING);
  log("lerp", Math.abs(TO - FROM), "the long way round");
  log("lerpAngle", Math.abs(wrapDeg(TO - FROM)));
};

export default demo;
