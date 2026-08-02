/** A turret facing 350 degrees, and what the raw difference tells it to do. */
import { wrapDeg } from "../angles.ts";
import { HEADING, type Demo } from "./runner.ts";

const FACING = 350;

const demo: Demo = (log) => {
  log(`facing ${FACING} degrees, target at...`, HEADING);

  for (const target of [10, 90, 180, 270]) {
    const raw = target - FACING;
    log(`${String(target).padStart(3)} degrees`, {
      raw,
      wrapped: wrapDeg(raw),
    });
  }

  log("the tie, and beyond one turn", HEADING);
  log("wrapDeg(180)", wrapDeg(180));
  log("wrapDeg(-180)", wrapDeg(-180), "same answer, so it never judders");
  log("wrapDeg(540)", wrapDeg(540), "540 is one and a half turns");
};

export default demo;
