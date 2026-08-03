/** Why a fixed blend factor ties feel to hardware, and why decay does not. */
import { remainingAfter } from "../interpolation.ts";
import {
  START,
  TARGET,
  framesToClose,
  simulateDamped,
} from "./framerate-shared.ts";
import type { Demo } from "./runner.ts";

const FACTOR = 0.1;
const HALF_LIFE = 0.25;
const SECONDS = 1;

/** How much of the gap a simulation left unclosed. */
const leftover = (x: number) => (TARGET - x) / (TARGET - START);

const demo: Demo = (log) => {
  const frames = framesToClose(FACTOR, 0.9);

  log("frames for lerp(..., 0.1) to close 90%", frames.toFixed(1));
  log("so at 30 fps that takes", `${(frames / 30).toFixed(2)} s`);
  log(
    "and at 144 fps",
    `${(frames / 144).toFixed(2)} s`,
    "same code, 4.8x quicker on better hardware",
  );

  log(
    "decay, half-life 0.25 s, left after 1 s at 30 fps",
    leftover(simulateDamped(30, SECONDS, HALF_LIFE)).toFixed(6),
  );
  log(
    "the same at 144 fps",
    leftover(simulateDamped(144, SECONDS, HALF_LIFE)).toFixed(6),
    "identical, as it has to be",
  );
  log(
    "and in one single enormous frame",
    leftover(simulateDamped(1, SECONDS, HALF_LIFE)).toFixed(6),
    `closed form 0.5^(1/0.25) = ${remainingAfter(HALF_LIFE, SECONDS)}`,
  );
};

export default demo;
