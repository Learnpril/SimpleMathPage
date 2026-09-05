/** What a second of smoothing leaves behind, at two frame rates, done the wrong way and the right way. */
import {
  decayAfterOneSecond,
  halfLifeFromRate,
  lerpAfterOneSecond,
  rateFromHalfLife,
  rateFromLerpFactor,
  smooth,
} from "../../../gamedev2d/time2d.ts";
import type { Demo } from "../runner.ts";

const pct = (x: number) => `${(x * 100).toFixed(4)}%`;

/** Thousands separators, done by hand. `toLocaleString` depends on the ICU build, and this output is
 *  committed to the repository, so it has to be identical everywhere. */
const grouped = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const demo: Demo = (log) => {
  log(
    "lerp(current, target, 0.1) every frame, for one second at 30 fps",
    pct(lerpAfterOneSecond(0.1, 30)),
    "of the gap is still there",
  );
  log(
    "the same code, one second at 144 fps",
    pct(lerpAfterOneSecond(0.1, 144)),
    // Computed, not typed: a ratio written by hand here would be wrong within one edit.
    `the better screen ends up ${grouped(
      Math.round(lerpAfterOneSecond(0.1, 30) / lerpAfterOneSecond(0.1, 144)),
    )} times closer, on identical code`,
  );

  // The fix. The frame rate argument is passed and makes no difference, which is the point.
  const rate = rateFromHalfLife(0.15);
  log(
    "exponential decay with a 0.15 s half-life, one second at 30 fps",
    pct(decayAfterOneSecond(rate, 30)),
    `rate ${rate.toFixed(3)} per second`,
  );
  log(
    "the same, one second at 144 fps",
    pct(decayAfterOneSecond(rate, 144)),
    "the same answer, because the exponent is time rather than a frame count",
  );

  // Half-life is exact by construction, which is what makes it a good thing to expose to a designer.
  log(
    "after exactly one half-life, the gap left is",
    smooth(0, 1, 0.15, 0.15).toFixed(6),
    "halfway, to the last decimal, whatever the step size was",
  );
  log(
    "and 0.15 s as a decay rate, converted back and forth",
    `${rate.toFixed(4)} then ${halfLifeFromRate(rate).toFixed(4)} s`,
    "the two parameterisations are the same curve",
  );

  // Porting existing code that somebody already tuned by feel.
  log(
    "a factor of 0.15 tuned at 60 fps, as a frame-rate independent rate",
    `${rateFromLerpFactor(0.15, 60).toFixed(3)} per second, a ${halfLifeFromRate(rateFromLerpFactor(0.15, 60)).toFixed(3)} s half-life`,
    "same feel at 60 fps, and now the same feel everywhere else too",
  );
};

export default demo;
