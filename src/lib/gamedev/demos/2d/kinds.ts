/** Which combinations of places and displacements mean something, decided by moving the origin. */
import {
  addPositions,
  combine,
  displacement,
  fromNewOrigin,
  midpoint,
  movedBy,
} from "../../../gamedev2d/vectors2d.ts";
import type { Demo } from "../runner.ts";

const A = { x: 3, y: 2 };
const B = { x: 11, y: 6 };
const at = (p: { x: number; y: number }) => `(${p.x}, ${p.y})`;

/** Re-measure from a shifted origin, do the sum, then put the answer back for comparison. */
const throughOrigin = (
  origin: { x: number; y: number },
  f: (a: typeof A, b: typeof B) => { x: number; y: number },
) => movedBy(f(fromNewOrigin(A, origin), fromNewOrigin(B, origin)), origin);

const demo: Demo = (log) => {
  log(
    `A is at ${at(A)} and B is at ${at(B)}`,
    "",
    "both measured from the origin",
  );
  log(
    "B - A, a place minus a place",
    `${at(displacement(A, B))}, a displacement`,
  );
  log(
    "A + that displacement",
    `${at(movedBy(A, displacement(A, B)))}, a place`,
    "which is B again",
  );
  log(
    "two displacements added",
    `${at(combine({ x: 4, y: 1 }, { x: -1, y: 3 }))}, a displacement`,
    "and the order they are applied in makes no difference",
  );

  // The test: move the origin, and see which answers stay put.
  for (const origin of [
    { x: 5, y: 5 },
    { x: -100, y: 40 },
  ]) {
    log(
      `measured from ${at(origin)} instead, B - A is`,
      at(throughOrigin(origin, displacement)),
      origin.x === 5
        ? "unchanged, because it never depended on the origin"
        : undefined,
    );
  }
  for (const origin of [
    { x: 5, y: 5 },
    { x: -100, y: 40 },
  ]) {
    log(
      `but A + B, measured from ${at(origin)}, becomes`,
      at(throughOrigin(origin, addPositions)),
      origin.x === 5
        ? "a different place each time, so it is not about A and B at all"
        : undefined,
    );
  }
  log(
    "the midpoint of A and B survives it though",
    `${at(throughOrigin({ x: -100, y: 40 }, midpoint))} from any origin`,
    "because it is really A plus half a displacement",
  );
};

export default demo;
