/** Reading a fraction out of a range, and carrying a value into another one. */
import { clamp01, inverseLerp, remap } from "../interpolation.ts";
import { smoothstep } from "../easings.ts";
import type { Demo } from "./runner.ts";

const demo: Demo = (log) => {
  log(
    "inverseLerp(10, 20, 15)",
    inverseLerp(10, 20, 15),
    "halfway through the range",
  );
  log(
    "inverseLerp(10, 20, 25)",
    inverseLerp(10, 20, 25),
    "past the end, and it says so rather than clamping",
  );
  log(
    "clamp01 of that",
    clamp01(inverseLerp(10, 20, 25)),
    "clamp only when you mean to",
  );
  log(
    "inverseLerp(5, 5, 5)",
    inverseLerp(5, 5, 5),
    "a zero-width range would divide by zero, so it is guarded",
  );
  log(
    "remap(15, 10, 20, 0, 100)",
    remap(15, 10, 20, 0, 100),
    "same fraction, new range",
  );
  log(
    "smoothstep(10, 20, 15)",
    smoothstep(10, 20, 15),
    "remap with an S curve, and clamped by design",
  );
};

export default demo;
