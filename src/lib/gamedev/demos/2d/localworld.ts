/** One point carried out to the world and back, and what a parent's uneven scale does to a child. */
import {
  multiply,
  sameMatrix,
  translationOf,
} from "../../../gamedev2d/matrix2d.ts";
import {
  axisLengths,
  isSquare,
  localUnderNewParent,
  matrixOf,
  placed,
  pointToLocal,
  pointToWorld,
  shearOf,
  worldOf,
} from "../../../gamedev2d/spaces2d.ts";
import type { Demo } from "../runner.ts";

const quarter = Math.PI / 2;
const at = (p: { x: number; y: number } | null) =>
  p === null ? "null" : `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`;
const degreesApart = (m: Parameters<typeof shearOf>[0]) =>
  ((Math.acos(Math.min(1, Math.max(-1, shearOf(m)))) * 180) / Math.PI).toFixed(
    1,
  );

/** A tank at (3, 1) turned a quarter turn, with a turret mounted forward of its centre. */
const HULL = placed({ x: 3, y: 1 }, quarter);
const TURRET = placed({ x: 0.25, y: 0 }, 0);
const TURRET_WORLD = worldOf([HULL, TURRET]);

/** The tip of the barrel, in the turret's own coordinates. It never changes. */
const BARREL_TIP = { x: 1.15, y: 0 };

const demo: Demo = (log) => {
  log(
    "the barrel tip, in the turret's own coordinates",
    at(BARREL_TIP),
    "a constant: the only place the barrel's length is written down",
  );
  log(
    "the same point in the world, hull at (3, 1) turned 90 degrees",
    at(pointToWorld(TURRET_WORLD, BARREL_TIP)),
    "the hull turned, so the barrel now points along world +y",
  );
  log(
    "converted back into the turret's coordinates",
    at(pointToLocal(TURRET_WORLD, pointToWorld(TURRET_WORLD, BARREL_TIP))),
    "the round trip, which is what makes a mouse click usable",
  );

  // Order is not a preference. Both products are valid matrices; only one is the hierarchy.
  log(
    "where the mount lands, as hull x turret against turret x hull",
    `${at(translationOf(TURRET_WORLD))} against ${at(translationOf(worldOf([TURRET, HULL])))}`,
    "the wrong order is not slightly off, it is a different place entirely",
  );

  // A parent's uneven scale reaches a rotated child as shear, not as scale.
  const sheared = worldOf([
    placed({ x: 0, y: 0 }, 0, { x: 2, y: 1 }),
    placed({ x: 0, y: 0 }, Math.PI / 4),
  ]);
  log(
    "a child turned 45 degrees under a parent scaled 2 by 1",
    `its axes are ${degreesApart(sheared)} degrees apart, of lengths ${at(axisLengths(sheared))}`,
    "a square went in and a parallelogram came out: the child was sheared, not scaled",
  );
  log(
    "isSquare on that frame",
    isSquare(sheared),
    "and nothing the child owns has changed, so nothing it owns can report this",
  );

  // Reparenting: hold the world transform still and solve for the new local one.
  const newParent = matrixOf(placed({ x: -2, y: 4 }, -quarter));
  const rehomed = localUnderNewParent(newParent, TURRET_WORLD);
  log(
    "re-home the turret under a parent at (-2, 4), keeping it where it is",
    rehomed !== null && sameMatrix(multiply(newParent, rehomed), TURRET_WORLD),
    "inverse of the new parent times the world transform, and nothing moves on screen",
  );
};

export default demo;
