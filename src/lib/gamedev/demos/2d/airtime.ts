/** Turning a jump you can describe into the two numbers a loop needs, and back again. */
import {
  apexOf,
  clampFallSpeed,
  cutJump,
  dragExactAt,
  jumpFromHeightAndAirtime,
  jumpFromHeightAndTime,
  remainingHeight,
  terminalVelocity,
} from "../../../gamedev2d/physics2d.ts";
import { ASYMMETRIC, asymmetricFor } from "./leap-shared.ts";
import type { Demo } from "../runner.ts";

/* Rounded for display. The arithmetic is exact to within a part in a trillion - the checks assert that - but
   $0.4^2$ is not a binary fraction, so a gravity of exactly -25 prints as -24.999999999999996 in output that
   gets committed to the repository. The dust carries no information. */
const tidy = (n: number, places = 4) => Number(n.toFixed(places));

const demo: Demo = (log) => {
  // The whole point: a description a person can hold, turned into the two constants a loop wants.
  const jump = jumpFromHeightAndTime(2, 0.4);
  log(
    "jumpFromHeightAndTime(2, 0.4)",
    `launch ${tidy(jump.launch)}, gravity ${tidy(jump.gravity)}`,
    "two units high, four tenths of a second to the top - nobody has to pick a gravity",
  );
  const back = apexOf(jump.launch, jump.gravity);
  log(
    "apexOf on those two numbers",
    `height ${tidy(back.height, 9)}, time ${tidy(back.timeToApex, 9)}`,
    "the round trip is exact, so the two descriptions really are the same jump",
  );
  log(
    "the same from total airtime instead",
    `${jumpFromHeightAndAirtime(2, 0.8).launch} equals ${jump.launch}`,
    "half the airtime is the rise, for a symmetric jump",
  );

  // Most platformers are not symmetric, and falling faster is why they feel controllable.
  const a = asymmetricFor();
  log(
    `asymmetricJump(${ASYMMETRIC.height}, up ${ASYMMETRIC.up}, down ${ASYMMETRIC.down})`,
    `rise ${a.riseGravity.toFixed(2)}, fall ${a.fallGravity.toFixed(2)}`,
    `the fall is ${(a.fallGravity / a.riseGravity).toFixed(4)} times stronger, which is (${ASYMMETRIC.up}/${ASYMMETRIC.down})\u00B2`,
  );

  /* Cutting the jump short, and the thing worth noticing: height goes as the square of the velocity, so
     keeping half the speed keeps a quarter of the height. */
  const full = jumpFromHeightAndTime(2.5, 0.5);
  log(
    "cutJump at half the launch speed, then the height left",
    `${tidy(cutJump(full.launch, 0.5))} gives ${tidy(remainingHeight(cutJump(full.launch, 0.5), full.gravity))}`,
    `a quarter of the full ${tidy(remainingHeight(full.launch, full.gravity))}, because height goes as velocity squared`,
  );

  // Terminal velocity, which is Section 4.1's decay wearing different labels.
  log(
    "terminalVelocity(-25, 4)",
    terminalVelocity(-25, 4),
    "gravity over drag: the speed at which they cancel and nothing changes",
  );
  log(
    "how much of it a fall has reached after 0.5 s and after 1 s",
    `${((dragExactAt(0, -25, 4, 0.5) / terminalVelocity(-25, 4)) * 100).toFixed(2)}% then ${((dragExactAt(0, -25, 4, 1) / terminalVelocity(-25, 4)) * 100).toFixed(2)}%`,
    `exponential approach, never arrival - and clampFallSpeed(-40, 12) = ${clampFallSpeed(-40, 12)} is the blunt alternative that never slows a rise`,
  );
};

export default demo;
