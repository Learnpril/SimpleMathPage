/** Three ways out of an overlap, and why the shortest one is the only acceptable answer. */
import { axisOverlaps, boxContact, pushOut } from "../response.ts";
import type { Demo } from "./runner.ts";

// A character has sunk 30 cm into a wide floor.
const FLOOR = { min: { x: -5, y: -1, z: -5 }, max: { x: 5, y: 0, z: 5 } };
const FEET = {
  min: { x: -0.4, y: -0.3, z: -0.4 },
  max: { x: 0.4, y: 1.5, z: 0.4 },
};

const demo: Demo = (log) => {
  for (const { axis, overlap } of axisOverlaps(FLOOR, FEET)) {
    log(
      `push out along ${axis}`,
      `${overlap.toFixed(2)} m`,
      axis === "y" ? "the shallowest, so this is the way out" : undefined,
    );
  }

  const contact = boxContact(FLOOR, FEET)!;
  log(
    "boxContact(floor, feet).normal",
    `(${contact.normal.x}, ${contact.normal.y}, ${contact.normal.z})`,
    "straight up, as a floor should",
  );
  log(
    "pushOut(position, contact) from y = 0.60",
    pushOut({ x: 0, y: 0.6, z: 0 }, contact).y.toFixed(3),
    "the depth plus a 1 mm skin, so the next test is not a coin flip",
  );
};

export default demo;
