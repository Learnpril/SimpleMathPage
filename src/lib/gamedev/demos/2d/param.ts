/** One equation, three shapes, and the two divisions that need a guard in front of them. */
import {
  areCollinear,
  clampT,
  collinearOverlap,
  distanceToSegment,
  lineCrossing,
  projectionT,
  segmentCrossing,
  type Segment,
} from "../../../gamedev2d/segment2d.ts";
import type { Demo } from "../runner.ts";

const CROSSING: Segment = { a: { x: -3, y: -1 }, b: { x: 3, y: 2 } };
const TALL: Segment = { a: { x: 1, y: -2 }, b: { x: 1, y: 3 } };
/** The same line as `TALL`, but only its top part - so the lines still cross and the segments do not. */
const SHORT: Segment = { a: { x: 1, y: 2 }, b: { x: 1, y: 3 } };
const FLAT: Segment = { a: { x: 0, y: 0 }, b: { x: 4, y: 0 } };
const SAME_LINE: Segment = { a: { x: 2, y: 0 }, b: { x: 6, y: 0 } };
const POINT: Segment = { a: { x: 1, y: 1 }, b: { x: 1, y: 1 } };

const demo: Demo = (log) => {
  // The only difference between a line, a ray and a segment is how far t may go.
  log(
    "clampT(2.5, ...) for a line, a ray and a segment",
    `${clampT(2.5, "line")}, ${clampT(2.5, "ray")}, ${clampT(2.5, "segment")}`,
    "and at t = -0.5 they give -0.5, 0 and 0 - that is the whole distinction",
  );

  // Both parameters come out of one division, and both have to be checked.
  const hit = lineCrossing(CROSSING, TALL)!;
  log(
    "lineCrossing(diagonal, tall wall)",
    `t ${hit.t.toFixed(4)}, u ${hit.u.toFixed(4)}, at (${hit.point.x}, ${hit.point.y})`,
    "both in 0 to 1, so the segments really cross",
  );
  const miss = lineCrossing(CROSSING, SHORT)!;
  log(
    "the same diagonal against a shorter wall on that same line",
    `t ${miss.t.toFixed(4)}, u ${miss.u.toFixed(4)}`,
    `t is still in range, so testing only t would report a hit - and segmentCrossing says ${segmentCrossing(CROSSING, SHORT) === null ? "no" : "yes"}`,
  );

  // Parallel means the division is impossible, and collinear means the answer is not a point at all.
  log(
    "lineCrossing on two collinear segments",
    String(lineCrossing(FLAT, SAME_LINE)),
    "the denominator is 0, so there is no single crossing to return",
  );
  log(
    "collinearOverlap on the same pair",
    `${areCollinear(FLAT, SAME_LINE)} and ${collinearOverlap(FLAT, SAME_LINE)}`,
    "they do touch, along a shared stretch - a range check answers what the division cannot",
  );

  // And the other division: projecting onto something with no direction.
  log(
    "projectionT on a zero-length segment",
    String(projectionT(POINT, { x: 4, y: 5 })),
    "null rather than 0/0, because a point has no direction to project onto",
  );
  log(
    "distanceToSegment to that same point",
    distanceToSegment(POINT, { x: 4, y: 5 }),
    "still a real answer: the nearest part of a one-point shape is that point",
  );
};

export default demo;
