/** A place and a displacement under the same matrix, and the third coordinate that separates them. */
import {
  apply,
  applyToDirection,
  compose,
  determinant,
  rotation,
  scaling,
  translation,
} from "../../../gamedev2d/matrix2d.ts";
import type { Demo } from "../runner.ts";

const T = translation(4, 1);
const R = rotation(Math.PI / 2);
const S = scaling(2, 3);

const at = (p: { x: number; y: number }) =>
  `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`;

const PLACE = { x: 3, y: 2 };
const DISPLACEMENT = { x: 3, y: 2 };

const demo: Demo = (log) => {
  log(
    "a place at (3, 2), translated by (4, 1)",
    at(apply(T, PLACE)),
    "the third coordinate is 1, so the translation reaches it",
  );
  log(
    "a displacement of (3, 2), through the same matrix",
    at(applyToDirection(T, DISPLACEMENT)),
    "the third coordinate is 0, so the translation cannot",
  );
  log(
    "the same two, rotated a quarter turn",
    `${at(apply(R, PLACE))} and ${at(applyToDirection(R, DISPLACEMENT))}`,
    "turning the world does turn your directions, so here they agree",
  );

  // The identity that gives the w = 0 rule its meaning, rather than making it a rule to remember.
  const p = { x: 5, y: -2 };
  const q = { x: p.x + DISPLACEMENT.x, y: p.y + DISPLACEMENT.y };
  const byPoints = {
    x: apply(T, q).x - apply(T, p).x,
    y: apply(T, q).y - apply(T, p).y,
  };
  log(
    "transform two places, then subtract them",
    at(byPoints),
    "which is what transforming the displacement between them has to mean",
  );

  log(
    "determinant of a scale by 2 and 3",
    determinant(S),
    "the area factor, and it is Section 2.1's cross product of the two columns",
  );
  log(
    "determinant of the rotation",
    Number(determinant(R).toFixed(12)),
    "turning something does not change its area",
  );
  log(
    "compose(T, R) applied to (3, 2), against applying R then T by hand",
    `${at(apply(compose(T, R), PLACE))} and ${at(apply(T, apply(R, PLACE)))}`,
    "the right-hand matrix goes first, which is what makes the product read right to left",
  );
};

export default demo;
