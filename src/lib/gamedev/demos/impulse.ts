/** The same change in velocity, delivered instantly or spread over a tenth of a second. */
import {
  jumpFromHeightAndTime,
  riseFromImpulse,
  riseFromSteadyForce,
} from "../dynamics.ts";
import type { Demo } from "./runner.ts";

const HEIGHT = 1.2;
const TIME_UP = 0.4;
const PUSH = 0.1;

const demo: Demo = (log) => {
  const { gravity, launchSpeed } = jumpFromHeightAndTime(HEIGHT, TIME_UP);
  log(
    `a ${HEIGHT} m jump in ${TIME_UP} s needs`,
    `${launchSpeed.toFixed(2)} m/s, against gravity ${gravity.toFixed(1)}`,
    "the impulse is applied all at once",
  );

  for (const t of [0.025, 0.05, PUSH]) {
    const instant = riseFromImpulse(t, launchSpeed, gravity);
    const spread = riseFromSteadyForce(t, launchSpeed, PUSH);
    log(
      `height after ${t} s`,
      `${instant.toFixed(3)} m as an impulse, ${spread.toFixed(3)} m as a force`,
      t === PUSH ? "both are now doing 6 m/s, but one is far lower" : undefined,
    );
  }

  const behind =
    riseFromImpulse(PUSH, launchSpeed, gravity) -
    riseFromSteadyForce(PUSH, launchSpeed, PUSH);
  log(
    "so a force spread over 0.1 s ends up",
    `${behind.toFixed(3)} m behind`,
    "which is why a jump is an impulse and a thruster is not",
  );
};

export default demo;
