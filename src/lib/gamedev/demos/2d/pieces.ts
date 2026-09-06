/** The six constants this character is made of, each traced back to the Section it came from. */
import {
  CONTACT_SKIN,
  FIXED_DT,
  TUNING,
  coyoteRemaining,
  derived,
  stepsFor,
} from "../../../gamedev2d/platformer2d.ts";
import {
  COYOTE_WINDOW,
  JUMP_WINDOW,
  chargeSummary,
} from "./platformer-shared.ts";
import type { Demo } from "../runner.ts";

/* Rounded for display only; the checks assert the unrounded values. A gravity solved from 0.34 seconds is
   not a binary fraction, and the trailing dust carries no information. */
const tidy = (n: number, places = 4) => Number(n.toFixed(places));

const demo: Demo = (log) => {
  // Section 4.1: the fixed step, and the cap that stops one slow frame becoming a hang.
  const hitch = stepsFor(0, 0.5);
  log(
    "stepsFor(0, 0.5) on a 120 Hz fixed step",
    `${hitch.steps} steps, ${tidy(hitch.dropped)} s dropped, ${tidy(hitch.leftover, 9)} carried`,
    `Section 4.1 - a half-second hitch asks for ${Math.floor(0.5 / FIXED_DT)} steps; the cap runs 8 and throws the rest away rather than spiralling`,
  );

  // Section 6.1: the jump, solved backwards from what a designer can picture.
  const jump = derived(TUNING);
  log(
    `derived(${TUNING.jumpHeight} units high, ${TUNING.timeToApex} s to the top)`,
    `launch ${tidy(jump.launch)}, gravity ${tidy(jump.gravity)}`,
    "Section 6.1 - nobody tunes a gravity constant; they tune a height and a rise time",
  );

  // Section 4.2: two forgiveness windows that are both inverseLerp with a clamp.
  log(
    "the two windows, in frames at 60 fps",
    `coyote ${tidy(COYOTE_WINDOW * 60, 1)}, buffer ${tidy(JUMP_WINDOW * 60, 1)}`,
    "Section 4.2 - both are inverseLerp against a window, clamped; six frames of grace is the whole trick",
  );

  /* And the trap in switching one off, which is worth a row because the failure is silent and inverted:
     inverseLerp guards an empty range by returning 0, which reads here as "the window is completely full". */
  log(
    "coyoteRemaining(0.5 s after leaving, window 0)",
    `${coyoteRemaining(0.5, 0)}, where the unguarded form gives 1`,
    "Section 4.2 - a zero window would report itself permanently open, so switching the feature off switches it on forever",
  );

  // Sections 5.1 and 5.4: why the move is split, priced over the speeds a slider offers.
  const charge = chargeSummary();
  log(
    "running at a one-tile step, resolved both ways",
    `both axes at once fails at ${charge.combinedFailures} of ${charge.total} speeds, one axis at a time at ${charge.perAxisFailures}`,
    `Sections 5.1 and 5.4 - the naive version is correct up to ${(charge.firstCombinedFailure ?? 0) - 1} units per second, then loses the character out of the level`,
  );

  // The float that forced a contact skin, which is the least glamorous line in the whole Module.
  log(
    "a foot at 0.9 resting on a floor at 1.0",
    `1.0 + 0.9 - 0.9 = ${1.0 + 0.9 - 0.9}`,
    `Section 5.4's skin - the foot sits one bit *below* the floor, so a sideways move collides with the ground it stands on; ${CONTACT_SKIN} of tolerance fixes it`,
  );

  /* Six rows, and two things deliberately absent. What the forgiveness windows are worth on the scripted run
     belongs to the run scene, which switches them off and lets the reader watch the jump not happen; and the
     camera's pixel wobble belongs to its own figure, because four numbers asking a reader to imagine a
     sub-pixel shimmer is exactly the case the visuals-first rule exists for. */
};

export default demo;
