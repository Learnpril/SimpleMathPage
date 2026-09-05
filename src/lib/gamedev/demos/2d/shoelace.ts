/** The cross product's two readings: a sign that says which way round, and a size that is an area. */
import {
  cross,
  isConvex,
  parallelogramArea,
  signedPolygonArea,
} from "../../../gamedev2d/cross2d.ts";
import { fromNewOrigin, type Point } from "../../../gamedev2d/vectors2d.ts";
import type { Demo } from "../runner.ts";

const RECTANGLE: Point[] = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 3, y: 2 },
  { x: 0, y: 2 },
];

/** An L, so there is something with a corner that turns back the other way. */
const L_SHAPE: Point[] = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 3, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: 2 },
  { x: 0, y: 2 },
];

const demo: Demo = (log) => {
  log(
    "cross({x: 1, y: 0}, {x: 0, y: 1})",
    cross({ x: 1, y: 0 }, { x: 0, y: 1 }),
    "positive: b is a quarter turn counter-clockwise from a",
  );
  log(
    "cross({x: 0, y: 1}, {x: 1, y: 0})",
    cross({ x: 0, y: 1 }, { x: 1, y: 0 }),
    "the same two vectors the other way round, and only the sign changed",
  );
  log(
    "parallelogramArea({x: 4, y: 0}, {x: 1, y: 2})",
    parallelogramArea({ x: 4, y: 0 }, { x: 1, y: 2 }),
    "so the triangle those two span has area 4, with no square root anywhere",
  );

  log(
    "signedPolygonArea(rectangle)",
    signedPolygonArea(RECTANGLE),
    "positive, so the corners are listed counter-clockwise",
  );
  log(
    "signedPolygonArea(the same corners, reversed)",
    signedPolygonArea([...RECTANGLE].reverse()),
    "clockwise now, and the rectangle has not moved",
  );

  // Every term is a triangle fanned out from the origin, and the surplus cancels - so where the
  // origin sits cannot matter. Worth showing rather than claiming.
  log(
    "signedPolygonArea(L), then the same L re-measured from (100, 40)",
    `${signedPolygonArea(L_SHAPE)}, then ${signedPolygonArea(
      L_SHAPE.map((p) => fromNewOrigin(p, { x: 100, y: 40 })),
    )}`,
    "the origin can be anywhere, inside the shape or far outside it",
  );
  log(
    "isConvex(L)",
    isConvex(L_SHAPE),
    "one of its corners turns the opposite way to the rest, which is what concave means",
  );
};

export default demo;
