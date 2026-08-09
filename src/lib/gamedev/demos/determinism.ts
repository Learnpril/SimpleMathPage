/** What a fixed timestep does and does not promise, measured on the run above. */
import { SPEED } from "../controller.ts";
import { ALL_ON, simulate } from "./capstone-shared.ts";
import type { Demo } from "./runner.ts";

const demo: Demo = (log) => {
  const ends = [30, 60, 144].map((fps) => ({
    fps,
    at: simulate(ALL_ON, 1 / fps).at(-1)!.position,
  }));

  for (const { fps, at } of ends) {
    log(
      `the same run stepped at ${fps} Hz ends at`,
      `x ${at.x.toFixed(3)}, z ${at.z.toFixed(3)}`,
      fps === 30
        ? "identical input, identical code, different tick rate"
        : undefined,
    );
  }

  const xs = ends.map((e) => e.at.x);
  const zs = ends.map((e) => e.at.z);
  const spread = Math.hypot(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...zs) - Math.min(...zs),
  );
  log("so they disagree by", `${spread.toFixed(3)} m`, "which is not nothing");
  log(
    "one tick of walking at 30 Hz is",
    `${(SPEED / 30).toFixed(3)} m`,
    `so the disagreement is ${(spread / (SPEED / 30)).toFixed(2)} ticks of travel`,
  );

  // The promise that does hold: the same rate, twice.
  const a = simulate(ALL_ON, 1 / 60);
  const b = simulate(ALL_ON, 1 / 60);
  const identical = a.every(
    (c, i) =>
      c.position.x === b[i].position.x &&
      c.position.y === b[i].position.y &&
      c.position.z === b[i].position.z &&
      c.yaw === b[i].yaw,
  );
  log(
    "re-running at one rate matches",
    identical ? "bit for bit, every tick" : "NOT identical",
    "which is the promise a replay actually needs",
  );
};

export default demo;
