/** Restitution scales speed, so it scales height twice over. */
import { apexAfterBounces, respond } from "../response.ts";
import type { Demo } from "./runner.ts";

const DROP = 2;
const FLOOR = { x: 0, y: 1, z: 0 };
const RUNNING = { x: 5, y: -1, z: 0 };

const demo: Demo = (log) => {
  for (const e of [0.5, 0.8, 0.95, 1]) {
    log(
      `dropped from ${DROP} m with restitution ${e}, apex after 1, 2 and 3 bounces`,
      [1, 2, 3]
        .map((n) => `${apexAfterBounces(DROP, e, n).toFixed(3)} m`)
        .join(", "),
      e === 0.95
        ? "sounds nearly lossless, still down a quarter after three"
        : e === 1
          ? "never settles, which is why nothing uses it"
          : undefined,
    );
  }

  // Friction acts on the other half of the split: the part travelling along the surface.
  for (const friction of [0, 0.3]) {
    const after = respond(RUNNING, FLOOR, 0, friction);
    log(
      `landing at 5 m/s along the floor with friction ${friction}`,
      `${Math.hypot(after.x, after.y, after.z).toFixed(2)} m/s left`,
      friction === 0 ? "restitution never touches this part" : undefined,
    );
  }
};

export default demo;
