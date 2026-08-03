/** The same three angles under all six orders, and how far apart the results end up. */
import {
  ORDERS,
  degreesBetween,
  forwardOf,
  fromEuler,
  type Euler,
} from "../euler.ts";
import type { Demo } from "./runner.ts";

/** Pitch 30, yaw 60, roll 45. One set of numbers, read six different ways. */
const ANGLES: Euler = { x: 30, y: 60, z: 45 };

const demo: Demo = (log) => {
  const reference = forwardOf(fromEuler(ANGLES, "XYZ"));
  for (const order of ORDERS) {
    const away = degreesBetween(reference, forwardOf(fromEuler(ANGLES, order)));
    log(
      `forward under "${order}"`,
      `${away.toFixed(1)}\u00B0 away`,
      order === "XYZ" ? "the one we are comparing against" : undefined,
    );
  }
};

export default demo;
