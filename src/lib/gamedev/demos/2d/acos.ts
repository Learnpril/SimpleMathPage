/** The clamp before acos, and how often leaving it out costs you a NaN. */
import {
  angleBetweenDegrees,
  dot,
  unclampedAngle,
} from "../../../gamedev2d/dot2d.ts";
import { normalize } from "../../../gamedev2d/length2d.ts";
import type { Demo } from "../runner.ts";

const demo: Demo = (log) => {
  // A real unit direction whose dot with itself lands just above 1. Nothing exotic produced it.
  const u = normalize({
    x: Math.cos(0.0000314) * 3.7,
    y: Math.sin(0.0000314) * 3.7,
  })!;

  log(
    "a normalized direction, dotted with itself",
    `${dot(u, u)}`,
    "which is not 1",
  );
  log(
    "Math.acos of that",
    `${unclampedAngle(u, u)}`,
    "outside [-1, 1] acos has no answer",
  );
  log(
    "the same angle, clamped first",
    `${angleBetweenDegrees(u, u)!.toFixed(1)}\u00B0`,
    "a vector is at 0 degrees to itself, as it should be",
  );

  // How often it happens, which is the part that decides whether the clamp is optional.
  let nans = 0;
  const samples = 200000;
  for (let i = 0; i < samples; i += 1) {
    const r = (i / samples) * Math.PI * 2;
    const d = normalize({ x: Math.cos(r) * 3.7, y: Math.sin(r) * 3.7 })!;
    if (Number.isNaN(unclampedAngle(d, d))) nans += 1;
  }
  log(
    `over ${samples.toLocaleString("en-US")} directions, unclamped acos returns NaN`,
    `${nans.toLocaleString("en-US")} times`,
    `${((nans / samples) * 100).toFixed(1)}% of them, so this is not a rare case`,
  );

  // And why a NaN is worse than a wrong number: it does not stay put.
  log(
    "what a NaN angle does next",
    `${NaN > 0} and ${NaN < 0}`,
    "every comparison says false",
  );
  log(
    "and it spreads",
    `${NaN + 1}`,
    "so one missing clamp corrupts the whole frame",
  );
};

export default demo;
