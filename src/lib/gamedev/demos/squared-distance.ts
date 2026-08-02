/** Comparing squared distances gives the same answer with no square root. */
import { distance, distanceSq } from "../vectors.ts";
import { HEADING, type Demo } from "./runner.ts";

const RADIUS = 10;

const demo: Demo = (log) => {
  for (const p of [
    [3, 4],
    [6, 8],
    [7, 8],
  ]) {
    log(
      `point (${p.join(", ")})`,
      {
        distance: distance([0, 0], p),
        squared: distanceSq([0, 0], p),
        within: distanceSq([0, 0], p) < RADIUS * RADIUS,
      },
      `radius ${RADIUS}`,
    );
  }

  log("checked on a grid of 90,601 points", HEADING);

  let disagree = 0;
  for (let i = -150; i <= 150; i++) {
    for (let j = -150; j <= 150; j++) {
      const p = [i / 10, j / 10];
      const plain = distance([0, 0], p) < RADIUS;
      const squared = distanceSq([0, 0], p) < RADIUS * RADIUS;
      if (plain !== squared) disagree += 1;
    }
  }
  log("times the two tests disagreed", disagree, "so use the cheap one");
};

export default demo;
