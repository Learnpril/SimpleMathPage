/** How many physics ticks each display frame gets, and the leftover that has to be interpolated. */
import { alphaFrom, stepsFor } from "../integrators.ts";
import type { Demo } from "./runner.ts";

const FIXED = 1 / 60;

/** The tick count for each of twelve frames at a given display rate. */
function pattern(displayHz: number): { counts: number[]; leftover: number } {
  let leftover = 0;
  const counts: number[] = [];
  for (let i = 0; i < 12; i += 1) {
    const r = stepsFor(leftover, 1 / displayHz, FIXED);
    leftover = r.leftover;
    counts.push(r.steps);
  }
  return { counts, leftover };
}

const demo: Demo = (log) => {
  for (const hz of [60, 30, 144, 50]) {
    const { counts, leftover } = pattern(hz);
    log(
      `${hz} Hz display, 60 Hz physics: ticks over twelve frames`,
      counts.join(" "),
      hz === 144
        ? "most frames get none, so without interpolation nothing moves on them"
        : hz === 50
          ? "an uneven pattern, which is what stutter actually looks like"
          : undefined,
    );
    log(
      `   leftover in the accumulator`,
      `${(leftover * 1000).toFixed(2)} ms, so alpha = ${alphaFrom(leftover, FIXED).toFixed(2)}`,
      hz === 60 ? "alpha is how far between two ticks to draw" : undefined,
    );
  }

  // A frame that takes far too long has to be clamped, or the accumulator never empties.
  const stall = stepsFor(0, 1, FIXED);
  log(
    "after a one second stall, ticks wanted was 60 but",
    `${stall.steps} ran, ${(stall.leftover * 1000).toFixed(0)} ms still owed`,
    "the clamp trades slow motion for not locking up",
  );
};

export default demo;
