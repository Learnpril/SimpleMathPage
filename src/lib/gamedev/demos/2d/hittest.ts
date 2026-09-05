/** The clamp that turns circle-versus-box into circle-versus-circle, and the two ways to get it wrong. */
import {
  circlesOverlap,
  circlesOverlapWrongSquare,
  closestPointInAabb,
  cornerErrorArea,
  toBox,
} from "../../../gamedev2d/collide2d.ts";
import { MOVING_RADIUS, STATIC_BOX, STATIC_CIRCLE } from "./shapes-shared.ts";
import type { Demo } from "../runner.ts";

const at = (x: number, y: number) => ({ x, y });
const show = (p: { x: number; y: number }) => `(${p.x}, ${p.y})`;

const demo: Demo = (log) => {
  // One clamp per axis, and it covers a face, a corner and the inside with no branch between them.
  log(
    "closestPointInAabb(box, (4, 0))",
    show(closestPointInAabb(STATIC_BOX, at(4, 0))),
    "clamped on x only, so the nearest point is on a face",
  );
  log(
    "closestPointInAabb(box, (4, 3))",
    show(closestPointInAabb(STATIC_BOX, at(4, 3))),
    "clamped on both, so it is a corner - the same two lines of code",
  );
  log(
    "closestPointInAabb(box, (-1.5, 0))",
    show(closestPointInAabb(STATIC_BOX, at(-1.5, 0))),
    "already inside, so it is the point itself",
  );

  // The mistake that makes collision feel late: squaring the radii instead of their sum.
  const reach = STATIC_CIRCLE.radius + MOVING_RADIUS;
  const wrongReach = Math.sqrt(STATIC_CIRCLE.radius ** 2 + MOVING_RADIUS ** 2);
  log(
    `(${STATIC_CIRCLE.radius} + ${MOVING_RADIUS})\u00B2 against ${STATIC_CIRCLE.radius}\u00B2 + ${MOVING_RADIUS}\u00B2`,
    `${reach ** 2} against ${STATIC_CIRCLE.radius ** 2 + MOVING_RADIUS ** 2}`,
    `the missing 2\u00B7r\u2090\u00B7r\u1D47 is ${2 * STATIC_CIRCLE.radius * MOVING_RADIUS}, which is most of it`,
  );
  /* Placed between the two reaches, so the right test says yes and the wrong one says no. A round 2.25
     rather than the midpoint of the two, because the wrong reach is a square root and the midpoint
     printed as 0.8512812094883317 in a panel that gets committed. The build asserts 2.25 really does
     fall between them, which is the part that has to be true. */
  const between = at(STATIC_CIRCLE.centre.x + 2.25, 0);
  log(
    `both tests on a circle at ${show(between)}`,
    `correct ${circlesOverlap(STATIC_CIRCLE, { centre: between, radius: MOVING_RADIUS })}, wrong ${circlesOverlapWrongSquare(STATIC_CIRCLE, { centre: between, radius: MOVING_RADIUS })}`,
    `the wrong one only reports contact at ${((wrongReach / reach) * 100).toFixed(2)}% of the right distance`,
  );

  // And the corner bug, priced in closed form rather than described.
  log(
    "cornerErrorArea(1.25), the area the naive box test gets wrong",
    cornerErrorArea(1.25).toFixed(4),
    "(4 \u2212 \u03C0)r\u00B2, and it does not depend on the box at all",
  );

  // Two representations of one box, because passing one where the other belongs still looks like a box.
  const asBox = toBox(STATIC_BOX);
  log(
    "toBox(box), from two corners to a centre and half-extents",
    `centre ${show(asBox.centre)}, half ${show(asBox.half)}`,
    `the box is ${STATIC_BOX.max.x - STATIC_BOX.min.x} by ${STATIC_BOX.max.y - STATIC_BOX.min.y}, so the extents are halved - mix the two forms up and you get a box of the wrong size that still looks like a box`,
  );
};

export default demo;
