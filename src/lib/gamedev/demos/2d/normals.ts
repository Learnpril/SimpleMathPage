/** The candidate axes, where they come from, and why they are normalized. */
import {
  candidateAxes,
  distinctAxisCount,
  edgeNormals,
  edgeNormalsRaw,
  overlapOnAxis,
  project,
  regularPolygon,
  smallestOverlap,
  smallestOverlapRaw,
  suitableForSat,
} from "../../../gamedev2d/sat2d.ts";
import { CHEVRON } from "./separate-shared.ts";
import type { Demo } from "../runner.ts";

const SQUARE = [
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
];
const TRIANGLE = regularPolygon(3, 1.5, { x: 0.8, y: 0.4 }, 0.3);

const demo: Demo = (log) => {
  // One axis per edge, and nothing else. That is the part 3D does not get.
  log(
    "edgeNormals(square)",
    edgeNormals(SQUARE)
      .map((n) => `(${n.x}, ${n.y})`)
      .join(" "),
    "one per edge, each the edge turned ninety degrees and scaled to length 1",
  );
  log(
    "candidateAxes(square, triangle).length",
    candidateAxes(SQUARE, TRIANGLE).length,
    `4 + 3, and ${distinctAxisCount(SQUARE, TRIANGLE)} of them point in different directions`,
  );
  log(
    "distinctAxisCount(square, square shifted)",
    distinctAxisCount(
      SQUARE,
      SQUARE.map((p) => ({ x: p.x + 3, y: p.y })),
    ),
    "8 axes offered, 2 directions - a rectangle's opposite edges test identically",
  );

  // A projection is a shadow: the lowest and highest the shape reaches along a direction.
  const axis = { x: 1, y: 0 };
  log(
    "project(triangle, (1, 0))",
    `${project(TRIANGLE, axis).min.toFixed(4)} to ${project(TRIANGLE, axis).max.toFixed(4)}`,
    "only the corners need testing, because a convex shape reaches no further than they do",
  );
  log(
    "overlapOnAxis(square, triangle, (1, 0))",
    overlapOnAxis(SQUARE, TRIANGLE, axis).toFixed(4),
    "positive is an overlap on this axis; negative would be a gap, and one gap ends the test",
  );

  /* Normalizing does not change the verdict - scaling an axis scales both shadows - but it does change
     which axis wins the "shallowest" comparison, because depth comes out in units of the axis's length. */
  const good = smallestOverlap(SQUARE, TRIANGLE)!;
  const raw = smallestOverlapRaw(SQUARE, TRIANGLE)!;
  const squareEdge = edgeNormalsRaw(SQUARE)[0];
  const triangleEdge = edgeNormalsRaw(TRIANGLE)[0];
  log(
    "smallestOverlap vs smallestOverlapRaw",
    `depth ${good.depth.toFixed(4)} along (${good.axis.x.toFixed(3)}, ${good.axis.y.toFixed(3)}) vs ${raw.depth.toFixed(4)} along (${raw.axis.x.toFixed(3)}, ${raw.axis.y.toFixed(3)})`,
    `unnormalized, the square's axes are ${Math.hypot(squareEdge.x, squareEdge.y).toFixed(3)} long and the triangle's ${Math.hypot(triangleEdge.x, triangleEdge.y).toFixed(3)}, so the depths are in different units`,
  );

  // And the precondition, which is not a formality.
  log(
    "suitableForSat(square) and suitableForSat(chevron)",
    `${suitableForSat(SQUARE)} and ${suitableForSat(CHEVRON)}`,
    "a concave shape gives no error and no warning, only overlaps that are not there",
  );
};

export default demo;
