/** Fixing the position, the guard that stops a character sticking, and what corners cost. */
import {
  SKIN,
  convergenceRate,
  pushOut,
  pushOutExactly,
  resolveVelocity,
  settleVelocity,
  slide,
  substepsNeeded,
  tunnellingChance,
  tunnellingSpeed,
} from "../../../gamedev2d/response2d.ts";
import { FRAME, WALL_THICKNESS } from "./deflect-shared.ts";
import type { Demo } from "../runner.ts";

const UP = { x: 0, y: 1 };
const RIGHT = { x: 1, y: 0 };

/* Rounded, because the skin is 0.001 and that is not a binary fraction - so 0.25 + 0.001 - 0.25 prints as
   0.0010000000000000009 in output that gets committed to the repository. Four places is plenty here and the
   dust carries no information. */
const V = (v: { x: number; y: number }) =>
  `(${Number(v.x.toFixed(4))}, ${Number(v.y.toFixed(4))})`;

const demo: Demo = (log) => {
  // The position fix, and why exact is not good enough.
  log(
    "pushOutExactly, then pushOut, from 0.25 deep",
    `${V(pushOutExactly({ x: 0, y: -0.25 }, { normal: UP, depth: 0.25 }))} then ${V(pushOut({ x: 0, y: -0.25 }, { normal: UP, depth: 0.25 }))}`,
    `exact leaves them touching, where the next frame's answer rests on the last bit of a float; the skin of ${SKIN} does not`,
  );

  // The guard. Without it, an outward velocity loses its outward part.
  log(
    "slide vs resolveVelocity on a velocity already leaving the wall",
    `${V(slide({ x: 1, y: 1 }, UP))} vs ${V(resolveVelocity({ x: 1, y: 1 }, UP))}`,
    "unguarded it is glued to the surface; the guard is one dot product and a comparison",
  );

  // A right-angled corner settles at once, and to exactly zero.
  const corner = settleVelocity({ x: -1, y: -1 }, [RIGHT, UP], 0);
  log(
    "settleVelocity((-1, -1)) into a right-angled corner",
    `${V(corner.velocity)} in ${corner.passes} pass, residual ${corner.residual}`,
    "perpendicular normals never fight, so one pass is exact - which is the corner games actually hit",
  );

  /* A wider wedge does fight, and only approaches the answer. The rate is cos squared of the angle between
     the normals, which is why 120 degrees sheds exactly a quarter of the residual per pass. */
  const wedge = {
    x: Math.cos((120 * Math.PI) / 180),
    y: Math.sin((120 * Math.PI) / 180),
  };
  const slow = settleVelocity({ x: -0.5, y: -0.866 }, [RIGHT, wedge], 0, 4, 0);
  log(
    "the same into normals 120\u00B0 apart, capped at 4 passes",
    `residual ${slow.residual.toFixed(6)}, settled ${slow.settled}`,
    `it falls by cos\u00B2 120\u00B0 = ${convergenceRate(RIGHT, wedge).toFixed(3)} each pass, so it approaches zero without reaching it`,
  );

  // Tunnelling: the speed, and how often it actually bites above that speed.
  log(
    `escape speed for a wall ${WALL_THICKNESS} thick at 60 fps`,
    tunnellingSpeed(WALL_THICKNESS, FRAME).toFixed(1),
    "thickness over the frame time, and a wall 0.1 thick gives only 6.0",
  );
  log(
    "at twice that speed, the fraction of start offsets that tunnel",
    `${(tunnellingChance(2 * tunnellingSpeed(WALL_THICKNESS, FRAME), FRAME, WALL_THICKNESS) * 100).toFixed(1)}%`,
    "so above the threshold it is intermittent rather than certain, which is what makes it hard to find",
  );
  log(
    "substeps needed at four times the escape speed",
    substepsNeeded(
      4 * tunnellingSpeed(WALL_THICKNESS, FRAME),
      FRAME,
      WALL_THICKNESS,
    ),
    "and the thinnest wall in the level sets that budget for everything in it",
  );
};

export default demo;
