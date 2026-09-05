/**
 * Build-time checks for the 2D module. Never shown to a reader.
 *
 * Separate from the 3D module's `checks.ts`, which is already several thousand lines: two tracks
 * sharing one check file would make every failure message ambiguous about which track broke.
 *
 * The rule is the same one that has earned its keep throughout Applied: a scene cannot be tested
 * without a GPU, but the arithmetic that positions everything in it can be, so that arithmetic
 * lives in a pure module and gets swept here.
 */
import { assert, type Demo } from "../runner.ts";
import {
  SCREEN_UP,
  WORLD_UP,
  directionFromAngle,
  fractionOf,
  pixelsInUnits,
  pixelsPerUnit,
  screenToWorld,
  unitsDown,
  worldAngleToScreen,
  worldToScreen,
  type View,
} from "../../../gamedev2d/screen.ts";
import {
  VIEW,
  WORLD_HEIGHT,
  bothReadings,
  pointFrom,
  roundTrip,
} from "./axes-shared.ts";
import {
  addPositions,
  combine,
  displacement,
  fromNewOrigin,
  midpoint,
  movedBy,
  reversed,
  scaled,
  type Point,
  type Vector,
} from "../../../gamedev2d/vectors2d.ts";
import { START_A, START_B, readings } from "./arrow-shared.ts";
import {
  distance,
  distanceSquared,
  isWithin,
  length,
  lengthSquared,
  normalize,
  velocityFrom,
  withLength,
} from "../../../gamedev2d/length2d.ts";
import {
  circleLoop,
  fixedAt,
  rawAt,
  speedRatio,
  squareLoop,
} from "./diagonal-shared.ts";
import {
  along,
  angleBetween,
  angleBetweenDegrees,
  canSee,
  coneThreshold,
  dot,
  isInFront,
  projectOnto,
  unclampedAngle,
} from "../../../gamedev2d/dot2d.ts";
import { GUARD, RANGE, bugStartsAt, report } from "./cone-shared.ts";
import { residuals, split, vectorAt } from "./project-shared.ts";
import {
  cross,
  isConvex,
  parallelogramArea,
  perpLeft,
  perpRight,
  pointInTriangle,
  polygonArea,
  sideValue,
  signedPolygonArea,
  triangleArea,
  windingOf,
} from "../../../gamedev2d/cross2d.ts";
import {
  TAU,
  angleOf,
  naiveAngleOf,
  signedAngleBetween,
  toDegrees,
  toRadians,
  wrapDegrees,
  wrapRadians,
} from "../../../gamedev2d/angles2d.ts";
import {
  angleDifference,
  lerpAngle,
  lerpAngleBroken,
  rotate,
  rotateAbout,
  rotateAll,
} from "../../../gamedev2d/rotate2d.ts";
import {
  footOnLine,
  parallelogramCorners,
  reading,
  sideByAngle,
} from "./side-shared.ts";
import { report as aimReport, screenOf, worldOf } from "./aim-shared.ts";
import {
  PIVOT_RANGE,
  SPRITE,
  SPRITE_CENTRE,
  SPRITE_TIP,
  drawnExtent,
  fittingScale,
  missBy,
  orbitCentre,
  sweptRadius,
  transformed,
} from "./pivot-shared.ts";
import { START, simulate, stepsToArrive } from "./turn-shared.ts";

const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) < tol;

/**
 * Screen space against world space: the flip, the round trip, and resolution independence.
 *
 * The assertion carrying the most weight is the round trip, because a sign error in the flip still
 * produces a dot in a believable position - it is only wrong by being upside down, which is exactly
 * the bug this Section exists to prevent and exactly the bug a picture cannot rule out.
 */
export const screenCheck2d: Demo = () => {
  // ---- The corners, which pin the convention -------------------------------------

  const corners: Array<
    [string, { x: number; y: number }, { x: number; y: number }]
  > = [
    ["the world origin", { x: 0, y: 0 }, { x: 0, y: VIEW.pixelHeight }],
    ["the top-left pixel", { x: 0, y: WORLD_HEIGHT }, { x: 0, y: 0 }],
    [
      "the far right of the world",
      { x: 16, y: 0 },
      { x: VIEW.pixelWidth, y: VIEW.pixelHeight },
    ],
  ];
  for (const [what, world, expected] of corners) {
    const got = worldToScreen(world, VIEW);
    assert(
      near(got.x, expected.x, 1e-9) && near(got.y, expected.y, 1e-9),
      `${what} should land at ${expected.x},${expected.y} but landed at ${got.x},${got.y}`,
    );
  }
  // The world origin is at the BOTTOM of the canvas. If this ever flips, the Section is wrong.
  assert(
    worldToScreen({ x: 0, y: 0 }, VIEW).y === VIEW.pixelHeight,
    "world y of zero must be the bottom of the canvas, not the top",
  );

  // ---- Raising world Y must move UP the screen -----------------------------------

  let previous = Infinity;
  for (let y = 0; y <= WORLD_HEIGHT; y += 0.25) {
    const screenY = worldToScreen({ x: 4, y }, VIEW).y;
    assert(
      screenY < previous,
      `raising world y should lower screen y, failed at ${y}`,
    );
    previous = screenY;
  }
  assert(
    SCREEN_UP.y === -WORLD_UP.y,
    "up on a canvas is the opposite sign of up in the world",
  );
  assert(
    WORLD_UP.y === 1 && SCREEN_UP.y === -1,
    "and specifically +1 against -1",
  );

  // ---- The round trip, swept ------------------------------------------------------

  let worst = 0;
  for (let i = 0; i <= 60; i += 1) {
    for (let j = 0; j <= 60; j += 1) {
      const p = { x: (i / 60) * 16, y: (j / 60) * WORLD_HEIGHT };
      const back = roundTrip(p);
      worst = Math.max(worst, Math.hypot(back.x - p.x, back.y - p.y));
    }
  }
  assert(worst < 1e-12, `the world-screen round trip drifted by ${worst}`);
  // And the other direction, from pixels back to pixels, which is what a mouse click needs.
  for (let px = 0; px <= VIEW.pixelWidth; px += 31) {
    for (let py = 0; py <= VIEW.pixelHeight; py += 17) {
      const back = worldToScreen(screenToWorld({ x: px, y: py }, VIEW), VIEW);
      assert(
        near(back.x, px, 1e-9) && near(back.y, py, 1e-9),
        `the pixel round trip drifted at ${px},${py}`,
      );
    }
  }

  // ---- The scene's toggle really does put the dot in two places -------------------

  for (const second of [0, 1, 2, 4, 8]) {
    const asMaths = pointFrom(5, second, false);
    const asCanvas = pointFrom(5, second, true);
    assert(
      asMaths.x === asCanvas.x,
      "the toggle must not move the dot sideways",
    );
    if (!near(second, WORLD_HEIGHT / 2, 1e-6)) {
      assert(
        !near(asMaths.y, asCanvas.y, 1e-9),
        `the toggle should change the height at ${second}, and did not`,
      );
    }
    // Counting down from the top and counting up from the bottom must sum to the world height.
    assert(
      near(asMaths.y + asCanvas.y, WORLD_HEIGHT, 1e-9),
      "the two readings of one slider value should be complements",
    );
  }
  // Both readings of a point agree about where it is; they only disagree about how to say it.
  const readings = bothReadings({ x: 3, y: 2 });
  assert(
    readings.world.x === 3 && readings.world.y === 2,
    "the world reading is the input",
  );
  assert(
    near(readings.screen.y, VIEW.pixelHeight - 2 * pixelsPerUnit(VIEW), 1e-9),
    "the screen reading should be the flip of it",
  );

  // ---- The angle mirror ------------------------------------------------------------

  for (let deg = -350; deg <= 350; deg += 10) {
    const r = (deg * Math.PI) / 180;
    assert(
      near(worldAngleToScreen(r), -r, 1e-15),
      "a screen angle is the negated world angle",
    );
    const d = directionFromAngle(r);
    assert(
      near(Math.hypot(d.x, d.y), 1, 1e-12),
      "a direction from an angle should be unit length",
    );
  }
  // A positive angle points up in the world, which is toward smaller screen y.
  const up45 = directionFromAngle(Math.PI / 4);
  assert(up45.y > 0, "45 degrees should point up in world coordinates");
  const drawn = worldToScreen({ x: 8 + up45.x, y: 4 + up45.y }, VIEW);
  const from = worldToScreen({ x: 8, y: 4 }, VIEW);
  assert(
    drawn.y < from.y,
    "and once drawn it should be higher on the canvas, not lower",
  );
  // Straight up is a quarter turn, and it has no sideways component at all.
  const quarter = directionFromAngle(Math.PI / 2);
  assert(
    near(quarter.x, 0, 1e-15) && near(quarter.y, 1, 1e-15),
    "a quarter turn should be straight up",
  );

  // ---- Resolution independence -----------------------------------------------------

  const sizes: View[] = [
    { pixelWidth: 320, pixelHeight: 180, unitsAcross: 16 },
    { pixelWidth: 960, pixelHeight: 540, unitsAcross: 16 },
    { pixelWidth: 1920, pixelHeight: 1080, unitsAcross: 16 },
  ];
  const player = { x: 3, y: 2 };
  const fractions = sizes.map((v) => fractionOf(player, v));
  for (const f of fractions) {
    assert(
      near(f.x, fractions[0].x, 1e-12) && near(f.y, fractions[0].y, 1e-12),
      "at one aspect ratio the fractions must not depend on the resolution",
    );
  }
  // The pixels, meanwhile, must genuinely differ, or the claim is vacuous.
  const pixels = sizes.map((v) => worldToScreen(player, v).x);
  assert(
    new Set(pixels).size === sizes.length,
    "the pixel positions should all differ, or there is nothing being demonstrated",
  );
  // Every canvas shows the same amount of world vertically, because the shape is the same.
  for (const v of sizes) {
    assert(
      near(unitsDown(v), unitsDown(sizes[0]), 1e-12),
      "same shape, same world height",
    );
    assert(near(unitsDown(v), 9, 1e-12), "and 16 across at 16:9 is 9 down");
  }
  // A fixed pixel step is a different world distance on each, by the ratio of the widths.
  assert(
    near(pixelsInUnits(5, sizes[0]) / pixelsInUnits(5, sizes[2]), 6, 1e-12),
    "five pixels should be exactly six times further on a 320 wide canvas than a 1920 one",
  );
  for (const v of sizes) {
    assert(
      near(pixelsInUnits(pixelsPerUnit(v), v), 1, 1e-12),
      "one unit's worth of pixels should convert back to one unit",
    );
  }

  // A taller aspect ratio shows more world vertically, which is the honest caveat: the
  // fractions only match when the shapes do.
  const tall: View = { pixelWidth: 960, pixelHeight: 960, unitsAcross: 16 };
  assert(
    unitsDown(tall) > unitsDown(sizes[0]),
    "a squarer canvas should show more world height",
  );
  assert(
    !near(fractionOf(player, tall).y, fractions[0].y, 1e-6),
    "and it should therefore put the player at a different fraction down",
  );
};

/**
 * Places against displacements, decided by the only test that actually separates them.
 *
 * The Section's claim is that a displacement is unchanged by moving the origin and a place is not.
 * That is not a matter of naming, it is a property, so it is checked as one: every assertion below
 * re-measures from a shifted origin and asks what survived. Sweeping 400 origins means the claim
 * cannot hold by luck at the one origin a figure happened to use.
 */
export const vectorCheck2d: Demo = () => {
  const A = { x: 3, y: 2 };
  const B = { x: 11, y: 6 };
  const same = (
    p: { x: number; y: number },
    q: { x: number; y: number },
    tol = 1e-12,
  ) => Math.abs(p.x - q.x) < tol && Math.abs(p.y - q.y) < tol;

  // ---- The four sentences ---------------------------------------------------------

  assert(
    same(displacement(A, B), { x: 8, y: 4 }),
    "B - A should be the displacement to B",
  );
  assert(
    same(movedBy(A, displacement(A, B)), B),
    "A plus the way to B should land on B",
  );
  assert(
    same(combine({ x: 4, y: 1 }, { x: -1, y: 3 }), { x: 3, y: 4 }),
    "two displacements should add componentwise",
  );
  // Reversing is what going the other way means, and it is the classic bug when unintended.
  assert(
    same(reversed(displacement(A, B)), displacement(B, A)),
    "reversed should be the other way",
  );
  assert(
    same(combine(displacement(A, B), displacement(B, A)), { x: 0, y: 0 }),
    "there and back should be no displacement at all",
  );
  // Applying two displacements in either order lands in the same place.
  const v = { x: 4, y: 1 };
  const w = { x: -1, y: 3 };
  assert(
    same(movedBy(movedBy(A, v), w), movedBy(movedBy(A, w), v)),
    "the order two displacements are applied in should not matter",
  );
  assert(
    same(movedBy(A, combine(v, w)), movedBy(movedBy(A, v), w)),
    "and combining them first should give the same place",
  );

  // ---- Scaling -------------------------------------------------------------------

  assert(
    same(scaled(v, 0), { x: 0, y: 0 }),
    "scaling by zero should leave no displacement",
  );
  assert(same(scaled(v, 1), v), "scaling by one should change nothing");
  assert(
    same(scaled(v, -1), reversed(v)),
    "scaling by minus one should turn it around",
  );
  assert(
    same(scaled(v, 3), { x: 12, y: 3 }),
    "scaling should stretch both components",
  );
  // Scaling then combining is the same as combining then scaling.
  assert(
    same(scaled(combine(v, w), 2), combine(scaled(v, 2), scaled(w, 2))),
    "scaling should distribute over adding",
  );

  // ---- The origin test, swept ----------------------------------------------------

  const between = displacement(A, B);
  const mid = midpoint(A, B);
  assert(
    same(mid, { x: 7, y: 4 }),
    "the midpoint of these two should be (7, 4)",
  );

  let sumsSeen = 0;
  for (let i = 0; i < 20; i += 1) {
    for (let j = 0; j < 20; j += 1) {
      const origin = { x: -50 + i * 5.5, y: -30 + j * 3.5 };
      const a = fromNewOrigin(A, origin);
      const b = fromNewOrigin(B, origin);

      // A displacement is untouched by the shift. This is the whole Section.
      assert(
        same(displacement(a, b), between),
        `the displacement changed when measured from ${origin.x},${origin.y}`,
      );
      // So is anything built only out of displacements.
      assert(
        same(scaled(displacement(a, b), 2.5), scaled(between, 2.5)),
        "nor should a scaled one",
      );

      // The midpoint survives too, once put back into the original frame, because its weights
      // add to one. That is the honest exception the page names.
      assert(
        same(movedBy(midpoint(a, b), origin), mid),
        `the midpoint moved when measured from ${origin.x},${origin.y}`,
      );

      // A plain sum of two places does not survive, unless the origin happens to be at zero.
      const sumBack = movedBy(addPositions(a, b), origin);
      if (origin.x !== 0 || origin.y !== 0) {
        if (!same(sumBack, addPositions(A, B))) sumsSeen += 1;
      }

      // A place itself only reads the same from the origin it was measured from.
      if (Math.abs(origin.x) > 1e-9 || Math.abs(origin.y) > 1e-9) {
        assert(
          !same(a, A),
          "a place should read differently from a different origin",
        );
      }
    }
  }
  assert(
    sumsSeen > 390,
    `adding two places should be origin dependent nearly everywhere, saw it at ${sumsSeen} of 400`,
  );

  // ---- The scene's readings ------------------------------------------------------

  for (const shift of [-6, -2.5, 0, 3, 6]) {
    const r = readings(START_A, START_B, { x: shift, y: 0 });
    assert(
      same(r.between, displacement(START_A, START_B)),
      `the scene's arrow changed when the origin slid to ${shift}`,
    );
    // The places must move by exactly the shift, and only sideways.
    assert(
      Math.abs(r.a.x - (START_A.x - shift)) < 1e-12 && r.a.y === START_A.y,
      "sliding the origin sideways should only change the x readings",
    );
    if (shift !== 0) {
      const atZero = readings(START_A, START_B, { x: 0, y: 0 });
      assert(
        !same(r.sum, atZero.sum),
        `the sum should move when the origin slides to ${shift}`,
      );
    }
  }

  // A place and a displacement are the same shape, which is the hazard worth stating.
  const asVector: Vector = A;
  const asPoint: Point = between;
  assert(
    asVector.x === A.x && asPoint.x === between.x,
    "the two types really are interchangeable, which is why the distinction has to be kept by hand",
  );
};

/**
 * Length, distance, normalizing, and the diagonal speed bug.
 *
 * Two claims here need sweeping rather than sampling. That a normalized direction is length 1 at
 * **every** angle, not just the tidy ones - because the bug this Section is about hides along the
 * axes, where the broken version happens to be right. And that a squared range test agrees with a
 * rooted one everywhere, which is what makes skipping the square root safe rather than a shortcut.
 */
export const lengthCheck2d: Demo = () => {
  // ---- Length ---------------------------------------------------------------------

  assert(
    length({ x: 3, y: 4 }) === 5,
    "the 3-4-5 triangle should come out as 5",
  );
  assert(length({ x: 0, y: 0 }) === 0, "no displacement has no length");
  assert(
    length({ x: -3, y: -4 }) === 5,
    "length should not care about direction",
  );
  assert(
    near(length({ x: 1, y: 1 }), Math.SQRT2, 1e-15),
    "a unit diagonal is root two long",
  );
  // Squared length is the same thing without the root, so rooting it must return the length.
  for (const v of [
    { x: 3, y: 4 },
    { x: -7, y: 2 },
    { x: 0.001, y: 0.002 },
    { x: 120, y: -95 },
  ]) {
    assert(
      near(Math.sqrt(lengthSquared(v)), length(v), 1e-9),
      "the squared length should root back to the length",
    );
  }
  // Distance is the length of the displacement, which is worth pinning as one idea not two.
  const a = { x: 3, y: 2 };
  const b = { x: 6, y: 6 };
  assert(distance(a, b) === 5, "these two are 5 apart");
  assert(
    distance(a, b) === length(displacement(a, b)),
    "distance is the length of the displacement",
  );
  assert(
    distance(a, b) === distance(b, a),
    "distance should not care which way round you ask",
  );
  assert(near(distanceSquared(a, b), 25, 1e-12), "and squared it is 25");

  // ---- The diagonal speed bug ------------------------------------------------------

  // Raw per-axis input reaches a square: 1 along an axis, root two at the corners, never more.
  let shortest = Infinity;
  let longest = 0;
  for (let deg = 0; deg < 360; deg += 0.25) {
    const raw = rawAt((deg * Math.PI) / 180);
    const l = length(raw);
    shortest = Math.min(shortest, l);
    longest = Math.max(longest, l);
    // Every raw sample must sit on the square, meaning one component is pinned at full deflection.
    assert(
      near(Math.max(Math.abs(raw.x), Math.abs(raw.y)), 1, 1e-12),
      `raw input at ${deg} degrees is not on the square`,
    );
  }
  assert(
    near(shortest, 1, 1e-12),
    `the square's closest point should be exactly 1, got ${shortest}`,
  );
  assert(
    near(longest, Math.SQRT2, 1e-12),
    `its corner should be exactly root two, got ${longest}`,
  );

  // The fixed version is length 1 at every angle, which is the entire repair.
  let worstUnit = 0;
  for (let deg = 0; deg < 360; deg += 0.25) {
    worstUnit = Math.max(
      worstUnit,
      Math.abs(length(fixedAt((deg * Math.PI) / 180)) - 1),
    );
  }
  assert(
    worstUnit < 1e-12,
    `a normalized direction drifted from unit length by ${worstUnit}`,
  );

  // The two agree exactly along the axes, which is why the bug survives casual testing.
  for (const deg of [0, 90, 180, 270]) {
    const r = (deg * Math.PI) / 180;
    assert(
      near(speedRatio(r), 1, 1e-12),
      `along the ${deg} degree axis the raw version should already be correct`,
    );
  }
  // And disagree everywhere else, worst at the corners.
  for (const deg of [45, 135, 225, 315]) {
    assert(
      near(speedRatio((deg * Math.PI) / 180), Math.SQRT2, 1e-12),
      `at ${deg} degrees the raw version should be root two too fast`,
    );
  }
  for (const deg of [20, 30, 60, 200, 340]) {
    assert(
      speedRatio((deg * Math.PI) / 180) > 1.0001,
      `off axis at ${deg} degrees the raw version should be measurably too fast`,
    );
  }
  // The drawn loops close, so the scene has a shape rather than an arc with a gap.
  const square = squareLoop();
  const circle = circleLoop();
  assert(
    near(square[0].x, square[square.length - 1].x, 1e-12) &&
      near(square[0].y, square[square.length - 1].y, 1e-12),
    "the square loop should close",
  );
  assert(
    circle.every((v) => near(length(v), 1, 1e-12)),
    "every circle sample should be unit length",
  );

  // A velocity keeps direction and speed separate, so its length is the speed at any angle.
  for (const deg of [0, 45, 137, 300]) {
    const v = velocityFrom(rawAt((deg * Math.PI) / 180), 6);
    assert(
      near(length(v), 6, 1e-12),
      `speed 6 should mean speed 6 at ${deg} degrees`,
    );
  }

  // ---- Skipping the square root ---------------------------------------------------

  let disagreements = 0;
  for (let i = 0; i < 200; i += 1) {
    for (let j = 0; j < 200; j += 1) {
      const p = { x: -10 + i * 0.1, y: -10 + j * 0.1 };
      const rooted = distance(a, p) < 5;
      const squared = distanceSquared(a, p) < 25;
      if (rooted !== squared) disagreements += 1;
      assert(
        isWithin(a, p, 5) === squared,
        "isWithin should be the squared comparison",
      );
    }
  }
  assert(
    disagreements === 0,
    `the squared range test disagreed with the rooted one ${disagreements} times`,
  );
  // The ordering is preserved, which is the reason the shortcut is valid at all.
  const points = [
    { x: 4, y: 3 },
    { x: 9, y: 2 },
    { x: 3, y: 12 },
    { x: -4, y: -1 },
  ];
  for (const p of points) {
    for (const q of points) {
      assert(
        distance(a, p) < distance(a, q) ===
          distanceSquared(a, p) < distanceSquared(a, q),
        "squaring must not reorder two distances",
      );
    }
  }

  // ---- The zero-length guard -------------------------------------------------------

  assert(
    normalize({ x: 0, y: 0 }) === null,
    "a zero displacement has no direction to return",
  );
  assert(
    normalize({ x: 1e-12, y: 0 }) === null,
    "and neither does one that is zero for practical purposes",
  );
  assert(
    withLength({ x: 0, y: 0 }, 5) === null,
    "so there is no way to give it a length either",
  );
  const stopped = velocityFrom({ x: 0, y: 0 }, 5);
  assert(
    stopped.x === 0 && stopped.y === 0,
    "no input should mean standing still, not NaN",
  );
  assert(
    Number.isFinite(stopped.x) && Number.isFinite(stopped.y),
    "and definitely not a position that has quietly become NaN",
  );
  // A real direction still works, right down to tiny inputs above the epsilon.
  const tiny = normalize({ x: 1e-6, y: 0 });
  assert(
    tiny !== null && near(tiny.x, 1, 1e-12),
    "a small but real direction should normalize fine",
  );
};

/**
 * The dot product: the sign test, the cone, projection, and the clamp before `acos`.
 *
 * The load-bearing assertion is the one comparing the cheap cone test against an angle-based one at
 * every position on a grid. The cheap test never computes an angle, so "it agrees with the angle" is
 * a claim about two different pieces of arithmetic rather than a restatement - and both outcomes have
 * to appear in the sweep, or a test that always answered "no" would pass it.
 */
export const dotCheck2d: Demo = () => {
  const same = (
    p: { x: number; y: number },
    q: { x: number; y: number },
    tol = 1e-12,
  ) => Math.abs(p.x - q.x) < tol && Math.abs(p.y - q.y) < tol;

  // ---- The formula and its two readings -------------------------------------------

  assert(dot({ x: 3, y: 4 }, { x: 2, y: 1 }) === 10, "3*2 + 4*1 should be 10");
  assert(
    dot({ x: 1, y: 0 }, { x: 0, y: 1 }) === 0,
    "perpendicular directions should dot to zero",
  );
  assert(
    dot({ x: 2, y: 5 }, { x: 7, y: -1 }) ===
      dot({ x: 7, y: -1 }, { x: 2, y: 5 }),
    "the dot product should not care about the order",
  );
  assert(
    near(
      dot({ x: 3, y: 4 }, { x: 3, y: 4 }),
      lengthSquared({ x: 3, y: 4 }),
      1e-12,
    ),
    "a vector dotted with itself is its squared length",
  );
  // The component form and the cosine form must agree, at every angle, or the geometry is a story.
  for (let deg = -180; deg <= 180; deg += 3) {
    const a = { x: 2.5, y: 0 };
    const b = vectorAt(deg, 3.5);
    const byCosine = length(a) * length(b) * Math.cos((deg * Math.PI) / 180);
    assert(
      near(dot(a, b), byCosine, 1e-12),
      `the two readings of the dot product disagreed at ${deg} degrees`,
    );
  }

  // ---- The sign test is 180 degrees wide, not narrow -------------------------------

  const facing = { x: 1, y: 0 };
  assert(isInFront(facing, { x: 1, y: 0 }), "dead ahead is in front");
  assert(isInFront(facing, { x: 0.1, y: 9 }), "so is very nearly beside you");
  assert(
    !isInFront(facing, { x: -0.1, y: 9 }),
    "just behind the shoulder is not",
  );
  // Which is the point: the sign test is not a vision cone, it is a half-plane.
  let insideSign = 0;
  let inside45 = 0;
  for (let deg = -180; deg < 180; deg += 1) {
    const t = vectorAt(deg, 4);
    if (dot(facing, t) > 0) insideSign += 1;
    if (dot(facing, normalize(t)!) >= coneThreshold(45)) inside45 += 1;
  }
  assert(
    insideSign > 175 && insideSign < 185,
    `the sign test should accept about half of all directions, accepted ${insideSign} of 360`,
  );
  assert(
    inside45 > 85 && inside45 < 95,
    `a 45 degree half-angle cone should accept about a quarter, accepted ${inside45} of 360`,
  );

  // ---- The cone threshold runs backwards, which is worth pinning --------------------

  assert(
    near(coneThreshold(0), 1, 1e-15),
    "a cone of no width needs an exact match",
  );
  assert(
    near(coneThreshold(90), 0, 1e-15),
    "a 90 degree half-angle is the sign test",
  );
  assert(
    coneThreshold(60) < coneThreshold(30),
    "a wider cone is a smaller threshold",
  );
  for (let half = 1; half < 180; half += 1) {
    assert(
      coneThreshold(half) < coneThreshold(half - 1),
      `the threshold should fall as the cone widens, failed at ${half}`,
    );
  }

  // ---- The cone test against an honest angle, swept --------------------------------

  let disagreements = 0;
  let seen = 0;
  let unseen = 0;
  for (let i = 0; i < 240; i += 1) {
    for (let j = 0; j < 240; j += 1) {
      const t = { x: -12 + i * 0.1, y: -12 + j * 0.1 };
      const cheap = canSee(GUARD, facing, t, 50, RANGE);
      const angle = angleBetweenDegrees(facing, t);
      const honest =
        Math.hypot(t.x, t.y) <= RANGE && (angle === null || angle <= 50 + 1e-9);
      if (cheap !== honest) disagreements += 1;
      if (cheap) seen += 1;
      else unseen += 1;
    }
  }
  assert(
    disagreements === 0,
    `the cheap cone test disagreed with the angle-based one ${disagreements} times`,
  );
  // Both answers have to appear, or a test that always said no would pass the line above.
  assert(
    seen > 1000 && unseen > 1000,
    `the sweep needs both outcomes, saw ${seen} seen and ${unseen} unseen`,
  );

  // ---- Skipping the normalize: the answer starts depending on distance --------------

  // Held at 60 degrees off the facing, well outside a 45 degree cone, at three distances.
  const angles = [2, 5, 12].map((d) => report(45, 60, d, true));
  for (const r of angles) {
    assert(
      !r.inCone,
      "normalized, 60 degrees is outside a 45 degree cone at any distance",
    );
    assert(
      near(r.measured, 0.5, 1e-12),
      "and the number it measures is cos 60, always",
    );
  }
  const buggy = [2, 5, 12].map((d) => report(45, 60, d, false));
  assert(
    buggy.every((r) => r.inCone),
    "unnormalized, the same target passes the cone at every one of those distances",
  );
  // Worse than wrong: it gets wronger with distance, which is the opposite of any sane behaviour.
  assert(
    buggy[0].measured < buggy[1].measured &&
      buggy[1].measured < buggy[2].measured,
    "the unnormalized number should grow with distance",
  );
  const starts = bugStartsAt(45, 60);
  assert(
    starts !== null && near(starts, Math.SQRT2, 1e-12),
    `outside a 45 degree cone at 60 degrees the bug should begin at root two meters, got ${starts}`,
  );
  // Close in, the bug happens to be right, which is why it survives a playtest in a corridor.
  assert(
    !report(45, 60, 1.2, false).inCone,
    "under root two meters the unnormalized test still says no",
  );
  // At the cone edge the two agree, so the disagreement really is about the region outside it.
  assert(
    report(45, 0, 3, true).inCone && report(45, 0, 3, false).inCone,
    "dead ahead passes both",
  );

  // ---- Projection -------------------------------------------------------------------

  assert(
    same(projectOnto({ x: 6, y: 4 }, { x: 1, y: 0 }), { x: 6, y: 0 }),
    "projecting onto the x axis should keep only x",
  );
  assert(
    near(along({ x: 6, y: 4 }, { x: 1, y: 0 }), 6, 1e-12),
    "and the signed amount along it should be 6",
  );
  // A longer direction must not change the projection, which is what dividing by d.d buys.
  const v = { x: 6, y: 4 };
  const base = projectOnto(v, { x: 3, y: 1 });
  for (const k of [1, 10, 1000, 1e6]) {
    assert(
      same(projectOnto(v, { x: 3 * k, y: 1 * k }), base, 1e-9),
      `scaling the direction by ${k} changed the projection`,
    );
  }
  assert(
    same(base, { x: 6.6, y: 2.2 }, 1e-12),
    "projecting (6, 4) onto (3, 1) should give (6.6, 2.2)",
  );
  // The split adds back and stays perpendicular at every angle. Both, or it is not a split.
  let worstSum = 0;
  let worstPerp = 0;
  for (let vDeg = -180; vDeg <= 180; vDeg += 5) {
    for (let dDeg = -180; dDeg <= 180; dDeg += 5) {
      const s = split(vDeg, 4, dDeg);
      const r = residuals(s);
      worstSum = Math.max(worstSum, r.sum);
      worstPerp = Math.max(worstPerp, r.perpendicular);
      // Pythagoras must hold on the two parts, which is the same claim from another direction.
      assert(
        near(
          Math.hypot(length(s.alongPart), length(s.acrossPart)),
          length(s.v),
          1e-9,
        ),
        `the two parts failed Pythagoras at ${vDeg} against ${dDeg}`,
      );
    }
  }
  assert(
    worstSum < 1e-12,
    `the two parts failed to add back to the vector by ${worstSum}`,
  );
  assert(
    worstPerp < 1e-12,
    `the two parts were not perpendicular, off by ${worstPerp}`,
  );
  // Against a unit direction the scalar projection is the bare dot product, which is the shortcut.
  for (let deg = -180; deg <= 180; deg += 7) {
    const s = split(deg, 3.5, 20);
    assert(
      near(s.signed, s.raw, 1e-12),
      `the shortcut failed at ${deg} degrees`,
    );
  }
  // A right angle projects to nothing, and past a right angle it goes negative.
  assert(
    near(split(110, 4, 20).signed, 0, 1e-12),
    "a right angle projects to zero",
  );
  assert(
    split(150, 4, 20).signed < 0,
    "past a right angle the projection is negative",
  );
  // Projecting a projection changes nothing, which is what makes it a projection.
  const once = projectOnto(v, { x: 3, y: 1 });
  assert(
    same(projectOnto(once, { x: 3, y: 1 }), once, 1e-12),
    "projecting twice should be the same as projecting once",
  );

  // ---- The clamp before acos --------------------------------------------------------

  assert(
    near(angleBetweenDegrees({ x: 1, y: 0 }, { x: 0, y: 1 })!, 90, 1e-12),
    "perpendicular should be 90 degrees",
  );
  assert(
    near(angleBetweenDegrees({ x: 1, y: 0 }, { x: -1, y: 0 })!, 180, 1e-12),
    "opposite should be 180 degrees",
  );
  assert(
    angleBetween({ x: 0, y: 0 }, { x: 1, y: 0 }) === null,
    "there is no angle to a zero vector",
  );
  // The unsigned range is the honest limitation: two mirrored targets give the same answer.
  assert(
    near(
      angleBetweenDegrees({ x: 1, y: 0 }, vectorAt(40, 2))!,
      angleBetweenDegrees({ x: 1, y: 0 }, vectorAt(-40, 2))!,
      1e-12,
    ),
    "acos cannot tell left from right, which is what Section 2.1 is for",
  );
  // The clamp is required, not defensive: count how often the unclamped version fails.
  let nans = 0;
  const samples = 20000;
  for (let i = 0; i < samples; i += 1) {
    const r = (i / samples) * Math.PI * 2;
    const u = normalize({ x: Math.cos(r) * 3.7, y: Math.sin(r) * 3.7 })!;
    if (Number.isNaN(unclampedAngle(u, u))) nans += 1;
    // The clamped version must survive every one of those.
    const clamped = angleBetween(u, u);
    assert(
      clamped !== null && Number.isFinite(clamped),
      `the clamped angle was not finite at ${r}`,
    );
    assert(near(clamped!, 0, 1e-7), "a direction is at zero degrees to itself");
  }
  assert(
    nans > samples * 0.1,
    `the unclamped acos should fail often enough to matter, failed ${nans} of ${samples}`,
  );
  // And the whole angle range must stay finite, including the two ends where the clamp bites.
  for (let deg = -180; deg <= 180; deg += 1) {
    const angle = angleBetweenDegrees({ x: 1, y: 0 }, vectorAt(deg, 2.5));
    assert(
      angle !== null &&
        Number.isFinite(angle) &&
        angle >= -1e-9 &&
        angle <= 180 + 1e-9,
      `the angle went out of range at ${deg} degrees`,
    );
  }
};

/**
 * The 2D cross product: the sign as a side, the magnitude as an area, and winding.
 *
 * The assertion doing the most work compares the determinant against a **signed angle from `atan2`**
 * over a grid. Those are genuinely different pieces of arithmetic reaching the same conclusion, which
 * is worth more than either one matching what I expected. The second is the drop to the line, checked
 * against a brute-force minimum over sampled points rather than against the same formula rearranged.
 */
export const crossCheck2d: Demo = () => {
  // ---- The formula and its two readings -------------------------------------------

  assert(
    cross({ x: 1, y: 0 }, { x: 0, y: 1 }) === 1,
    "x crossed with y should be +1",
  );
  assert(
    cross({ x: 0, y: 1 }, { x: 1, y: 0 }) === -1,
    "and the other way round should be -1",
  );
  assert(
    cross({ x: 3, y: 4 }, { x: 3, y: 4 }) === 0,
    "a vector crossed with itself has no area",
  );
  // Anti-symmetry, which is the property the dot product does not have and the reason this works.
  for (let deg = -180; deg <= 180; deg += 7) {
    const a = { x: 2.5, y: 0 };
    const b = vectorAt(deg, 3.5);
    assert(
      near(cross(a, b), -cross(b, a), 1e-12),
      `swapping the arguments should flip the sign, failed at ${deg}`,
    );
    // The sine reading has to hold at every angle, or the geometry is a story rather than a fact.
    const bySine = length(a) * length(b) * Math.sin((deg * Math.PI) / 180);
    assert(
      near(cross(a, b), bySine, 1e-12),
      `the two readings of the cross product disagreed at ${deg} degrees`,
    );
    // And it must agree with the dot product about the angle, via atan2.
    const signed = signedAngleBetween(a, b);
    assert(
      signed !== null && near(toDegrees(signed), wrapDegrees(deg), 1e-9),
      `the signed angle disagreed at ${deg} degrees`,
    );
    // The signed angle's magnitude is the unsigned one from Part 1, so the two Sections agree.
    assert(
      near(Math.abs(toDegrees(signed!)), angleBetweenDegrees(a, b)!, 1e-9),
      `the signed and unsigned angles disagreed in size at ${deg} degrees`,
    );
  }
  // A quarter turn for free, and it must be the same quarter turn `rotate` performs.
  for (const v of [
    { x: 3, y: 1 },
    { x: -2, y: 5 },
    { x: 0, y: -4 },
  ]) {
    const left = perpLeft(v);
    assert(near(dot(v, left), 0, 1e-12), "perpLeft should be perpendicular");
    assert(near(length(left), length(v), 1e-12), "and the same length");
    assert(cross(v, left) > 0, "and to the left, which is the positive side");
    assert(
      near(perpRight(v).x, -left.x, 1e-12) &&
        near(perpRight(v).y, -left.y, 1e-12),
      "the other perpendicular is the negation of it",
    );
  }

  // ---- Which side, against a different piece of arithmetic --------------------------

  let disagreements = 0;
  let leftSeen = 0;
  let rightSeen = 0;
  let collinear = 0;
  for (let i = 0; i <= 120; i += 1) {
    for (let j = 0; j <= 120; j += 1) {
      const px = -7 + (i / 120) * 14;
      const py = -4 + (j / 120) * 8;
      for (const angle of [0, 20, 90, -55]) {
        const r = reading(angle, px, py, false);
        if (r.raw === 0) {
          collinear += 1;
          continue;
        }
        if (r.side !== sideByAngle(r)) disagreements += 1;
        if (r.side > 0) leftSeen += 1;
        else rightSeen += 1;

        // Reversing the line flips the side and nothing else.
        const back = reading(angle, px, py, true);
        assert(
          back.side === -r.side,
          `reading the line backwards should flip the side at ${px},${py}`,
        );
        assert(
          near(Math.abs(back.distance), Math.abs(r.distance), 1e-9),
          "and must not change how far away the point is",
        );
        assert(near(back.parallelogram, r.parallelogram, 1e-9), "nor the area");
      }
    }
  }
  assert(
    disagreements === 0,
    `the determinant disagreed with the signed angle ${disagreements} times`,
  );
  // Both outcomes have to appear, or a test that always said "left" would pass the line above.
  assert(
    leftSeen > 10000 && rightSeen > 10000,
    `the sweep needs both sides, saw ${leftSeen} left and ${rightSeen} right`,
  );
  // Exactly on the line does happen, and the two methods are allowed to differ there: atan2 of
  // (0, negative) is pi rather than 0. Worth knowing rather than worth relying on.
  assert(
    collinear > 0,
    "the sweep should include some points exactly on the line",
  );

  // ---- The perpendicular distance, against a brute-force minimum --------------------

  let worstDrop = 0;
  for (const [px, py, angle] of [
    [3, 2, 20],
    [-5, 1.5, 0],
    [0.5, -3, 75],
    [6, 3.5, -40],
  ] as const) {
    const r = reading(angle, px, py, false);
    const direction = normalize(displacement(r.from, r.to))!;
    let closest = Infinity;
    for (let t = -30; t <= 30; t += 0.001) {
      const on = movedBy(r.from, {
        x: direction.x * t,
        y: direction.y * t,
      });
      closest = Math.min(closest, distance(on, r.p));
    }
    worstDrop = Math.max(worstDrop, Math.abs(closest - Math.abs(r.distance)));
    // The drawn foot of the perpendicular must be the place that distance is measured to.
    assert(
      near(distance(footOnLine(r), r.p), Math.abs(r.distance), 1e-9),
      `the drawn perpendicular did not match the signed distance at ${px},${py}`,
    );
    // And it must actually be on the line.
    assert(
      Math.abs(sideValue(r.from, r.to, footOnLine(r))) < 1e-9,
      "the foot of the perpendicular should lie on the line",
    );
  }
  assert(
    worstDrop < 1e-3,
    `the signed distance missed the brute-force minimum by ${worstDrop}`,
  );
  // The signed distance carries the side too, so it is one number doing both jobs.
  for (const [px, py] of [
    [0, 3],
    [0, -3],
  ] as const) {
    const r = reading(0, px, py, false);
    assert(
      Math.sign(r.distance) === r.side,
      "the signed distance and the side should agree about which way is positive",
    );
  }

  // ---- Areas ------------------------------------------------------------------------

  assert(
    parallelogramArea({ x: 4, y: 0 }, { x: 1, y: 2 }) === 8,
    "that parallelogram has area 8",
  );
  assert(
    triangleArea({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 1, y: 2 }) === 4,
    "so the triangle is 4",
  );
  // Area is unchanged by turning both vectors together, which is what makes it a property of the pair.
  const baseArea = parallelogramArea({ x: 4, y: 0 }, { x: 1, y: 2 });
  for (let deg = 0; deg < 360; deg += 3) {
    const r = (deg * Math.PI) / 180;
    assert(
      near(
        parallelogramArea(rotate({ x: 4, y: 0 }, r), rotate({ x: 1, y: 2 }, r)),
        baseArea,
        1e-9,
      ),
      `rotating both vectors changed the area at ${deg} degrees`,
    );
  }
  // The scene's drawn parallelogram must have the area the cross product claims.
  for (const [px, py, angle] of [
    [2.5, 2, 20],
    [-4, -1, 55],
    [1, 3.5, -30],
  ] as const) {
    const r = reading(angle, px, py, false);
    assert(
      near(polygonArea(parallelogramCorners(r)), r.parallelogram, 1e-9),
      `the drawn parallelogram's area did not match the cross product at ${px},${py}`,
    );
    assert(
      near(r.triangle, r.parallelogram / 2, 1e-12),
      "the triangle should be exactly half of it",
    );
  }

  // ---- Winding, and the origin it does not depend on ---------------------------------

  const rectangle: Point[] = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 2 },
    { x: 0, y: 2 },
  ];
  const lShape: Point[] = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 0, y: 2 },
  ];
  assert(
    signedPolygonArea(rectangle) === 6,
    "the rectangle should have signed area 6",
  );
  assert(
    signedPolygonArea([...rectangle].reverse()) === -6,
    "and -6 listed the other way",
  );
  assert(
    windingOf(rectangle) === "counter-clockwise",
    "listed that way it is counter-clockwise",
  );
  assert(
    windingOf([...rectangle].reverse()) === "clockwise",
    "and reversed it is clockwise",
  );
  assert(polygonArea(lShape) === 4, "the L should have area 4");
  // Every shoelace term is a triangle fanned from the origin, so the origin cannot matter.
  for (const origin of [
    { x: 0, y: 0 },
    { x: 100, y: 40 },
    { x: -7.5, y: 2.25 },
    { x: 1.5, y: 1 },
  ]) {
    const moved = lShape.map((p) => fromNewOrigin(p, origin));
    assert(
      near(signedPolygonArea(moved), signedPolygonArea(lShape), 1e-9),
      `the signed area changed when measured from ${origin.x},${origin.y}`,
    );
  }
  // Convexity, and the concave corner that decides it.
  assert(isConvex(rectangle), "a rectangle is convex");
  assert(!isConvex(lShape), "an L is not");
  assert(
    isConvex([...rectangle].reverse()),
    "and convexity should not depend on the winding",
  );
  assert(
    !isConvex([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]),
    "two points are not a polygon",
  );

  // Drawing flips the winding, because the canvas flips Y. The area scales by the square of the
  // pixels-per-unit, which is the honest version of "it looks the other way round on screen".
  const scale = pixelsPerUnit(VIEW);
  const drawn = rectangle.map((p) => worldToScreen(p, VIEW));
  assert(
    windingOf(drawn) === "clockwise",
    "a counter-clockwise shape is clockwise once drawn on a canvas",
  );
  assert(
    near(polygonArea(drawn) / polygonArea(rectangle), scale * scale, 1e-9),
    "and its area should scale by the square of the pixels per unit",
  );

  // ---- Three sides make an inside ---------------------------------------------------

  const tri: [Point, Point, Point] = [
    { x: -3, y: -2 },
    { x: 4, y: -1 },
    { x: 0, y: 3 },
  ];
  let inside = 0;
  let outside = 0;
  const step = 0.05;
  for (let x = -5; x <= 5; x += step) {
    for (let y = -4; y <= 4; y += step) {
      const p = { x, y };
      const byCross = pointInTriangle(p, tri[0], tri[1], tri[2]);
      // Barycentric coordinates: different arithmetic, same question.
      const d = sideValue(tri[0], tri[1], tri[2]);
      const u = sideValue(tri[0], tri[1], p) / d;
      const v = sideValue(tri[1], tri[2], p) / d;
      const w = sideValue(tri[2], tri[0], p) / d;
      const byBarycentric = u >= 0 && v >= 0 && w >= 0;
      assert(
        byCross === byBarycentric,
        `the three-sign test disagreed with barycentric coordinates at ${x},${y}`,
      );
      if (byCross) inside += 1;
      else outside += 1;
      // The three weights always add to one, whether or not the point is inside.
      assert(near(u + v + w, 1, 1e-9), "barycentric weights should sum to one");
    }
  }
  assert(
    inside > 1000 && outside > 1000,
    `the sweep needs both outcomes, saw ${inside} inside and ${outside} outside`,
  );
  // Counting cells is an independent measure of the area, so the two should roughly agree.
  const byCount = inside * step * step;
  const byFormula = triangleArea(tri[0], tri[1], tri[2]);
  assert(
    Math.abs(byCount - byFormula) / byFormula < 0.02,
    `counting cells gave area ${byCount} where the formula gave ${byFormula}`,
  );
  // The winding of the corner list must not change the answer.
  for (let x = -5; x <= 5; x += 0.25) {
    for (let y = -4; y <= 4; y += 0.25) {
      assert(
        pointInTriangle({ x, y }, tri[0], tri[1], tri[2]) ===
          pointInTriangle({ x, y }, tri[2], tri[1], tri[0]),
        `the inside test changed with the winding at ${x},${y}`,
      );
    }
  }
};

/**
 * Angles: radians against degrees, `atan2` against `atan`, and the wrap.
 *
 * The load-bearing assertion is the **round trip**: take an angle, aim with it, and dot the resulting
 * direction back against the direction to the target. That has to be $+1$. The scene draws its barrel
 * from the angle it computed, so a barrel pointing exactly backwards still looks like a barrel - which
 * is the failure mode the 3D module's turret shipped with, and the reason this check exists in this
 * shape rather than as a comparison of two numbers I chose.
 */
export const angleCheck2d: Demo = () => {
  // ---- Units -----------------------------------------------------------------------

  assert(near(toDegrees(Math.PI), 180, 1e-12), "pi radians is half a turn");
  assert(
    near(toRadians(90), Math.PI / 2, 1e-15),
    "and 90 degrees is a quarter",
  );
  assert(TAU === Math.PI * 2, "a full turn is two pi");
  for (let deg = -720; deg <= 720; deg += 3) {
    assert(
      near(toDegrees(toRadians(deg)), deg, 1e-9),
      `the unit round trip drifted at ${deg}`,
    );
  }

  // ---- atan2 recovers the angle it was given ---------------------------------------

  for (let deg = -180; deg < 180; deg += 0.5) {
    const r = toRadians(deg);
    const back = angleOf(directionFromAngle(r));
    assert(
      near(back, wrapRadians(r), 1e-9),
      `atan2 did not recover ${deg} degrees, gave ${toDegrees(back)}`,
    );
  }
  // The quadrant cases, spelled out, because these are the ones people get wrong by hand.
  const corners: Array<[Vector, number]> = [
    [{ x: 1, y: 0 }, 0],
    [{ x: 0, y: 1 }, 90],
    [{ x: -1, y: 0 }, 180],
    [{ x: 0, y: -1 }, -90],
    [{ x: 1, y: 1 }, 45],
    [{ x: -1, y: 1 }, 135],
    [{ x: -1, y: -1 }, -135],
    [{ x: 1, y: -1 }, -45],
  ];
  for (const [v, expected] of corners) {
    assert(
      near(toDegrees(angleOf(v)), expected, 1e-12),
      `atan2 should give ${expected} for (${v.x}, ${v.y})`,
    );
  }
  // A zero vector has no angle, and atan2(0, 0) is 0 rather than NaN, which is worth knowing.
  assert(angleOf({ x: 0, y: 0 }) === 0, "atan2 of nothing is zero, not NaN");

  // ---- Aiming, checked by round trip -----------------------------------------------

  let worstAim = 0;
  let backwards = 0;
  let naiveAgreed = 0;
  for (let i = 0; i <= 80; i += 1) {
    for (let j = 0; j <= 80; j += 1) {
      const tx = -8 + (i / 80) * 16;
      const ty = -4 + (j / 80) * 8;
      if (Math.hypot(tx, ty) < 1e-6) continue;

      const good = aimReport(tx, ty, true);
      worstAim = Math.max(worstAim, Math.abs(good.alignment - 1));

      const naive = aimReport(tx, ty, false);
      if (tx < 0) {
        // Every direction pointing left comes back exactly half a turn wrong.
        assert(
          near(naive.alignment, -1, 1e-9),
          `plain atan should be exactly backwards at ${tx},${ty}, scored ${naive.alignment}`,
        );
        backwards += 1;
      } else if (tx > 0) {
        assert(
          near(naive.alignment, 1, 1e-9),
          `plain atan should be right at ${tx},${ty}, scored ${naive.alignment}`,
        );
        naiveAgreed += 1;
      }
    }
  }
  assert(
    worstAim < 1e-9,
    `aiming with atan2 missed the target by ${worstAim} at worst`,
  );
  assert(
    backwards > 2000 && naiveAgreed > 2000,
    `both halves need to appear, saw ${backwards} backwards and ${naiveAgreed} correct`,
  );
  // Straight up and down happen to survive the division, so the damage is exactly the left half.
  assert(
    near(aimReport(0, 3, false).alignment, 1, 1e-12),
    "atan gets straight up right, by accident",
  );
  assert(
    Number.isNaN(naiveAngleOf({ x: 0, y: 0 })),
    "and it produces NaN at the origin, where atan2 does not",
  );

  // ---- The mapping the scene drags through -----------------------------------------

  for (let sx = 0; sx <= 600; sx += 37) {
    for (let sy = 0; sy <= 320; sy += 23) {
      const back = screenOf(worldOf(sx, sy, 310, 160), 310, 160);
      assert(
        near(back.x, sx, 1e-9) && near(back.y, sy, 1e-9),
        `the drag round trip drifted at ${sx},${sy}`,
      );
    }
  }

  // ---- The wrap ---------------------------------------------------------------------

  assert(near(wrapDegrees(370), 10, 1e-12), "370 degrees is 10 degrees");
  assert(near(wrapDegrees(-190), 170, 1e-12), "and -190 is 170");
  assert(near(wrapDegrees(180), -180, 1e-12), "exactly 180 comes back as -180");
  assert(near(wrapDegrees(0), 0, 1e-12), "zero is zero");
  for (let deg = -179; deg <= 179; deg += 1) {
    assert(
      near(wrapDegrees(deg), deg, 1e-12),
      `an angle already in range should not move, failed at ${deg}`,
    );
    // Adding whole turns must change nothing, in either direction, however many.
    for (const turns of [-5, -1, 1, 3, 11]) {
      assert(
        near(wrapDegrees(deg + turns * 360), deg, 1e-9),
        `${turns} extra turns changed the answer at ${deg}`,
      );
    }
  }
  // Wrapping is idempotent, and it never changes the direction the angle describes.
  for (let deg = -900; deg <= 900; deg += 7) {
    const once = wrapDegrees(deg);
    assert(
      near(wrapDegrees(once), once, 1e-12),
      "wrapping twice is wrapping once",
    );
    assert(
      once >= -180 && once < 180,
      `the wrapped angle ${once} is out of range`,
    );
    const r = toRadians(deg);
    assert(
      near(Math.cos(wrapRadians(r)), Math.cos(r), 1e-9) &&
        near(Math.sin(wrapRadians(r)), Math.sin(r), 1e-9),
      `wrapping changed the direction at ${deg} degrees`,
    );
  }
};

/**
 * Rotation, an arbitrary pivot, and turning the short way at a limited rate.
 *
 * Two things here are the kind of bug a picture cannot rule out. Forgetting the final translate is
 * **exactly correct while the pivot is at the origin**, so the check has to sweep pivots away from it
 * and assert the offset is precisely the pivot. And turning the long way round still arrives, so the
 * assertion is about the **number of steps**, not about whether it converges.
 */
export const rotateCheck2d: Demo = () => {
  const same = (a: Point, b: Point, tol = 1e-9) =>
    Math.abs(a.x - b.x) < tol && Math.abs(a.y - b.y) < tol;

  // ---- The formula -----------------------------------------------------------------

  assert(
    same(rotate({ x: 1, y: 0 }, Math.PI / 2), { x: 0, y: 1 }, 1e-15),
    "a quarter turn should take +x to +y",
  );
  assert(
    same(rotate({ x: 1, y: 0 }, -Math.PI / 2), { x: 0, y: -1 }, 1e-15),
    "and the other way to -y",
  );
  // The quarter turn from cross2d is the same operation done without any trigonometry.
  for (const v of [
    { x: 3, y: 1 },
    { x: -2, y: 5 },
    { x: 0.5, y: -0.25 },
  ]) {
    assert(
      same(rotate(v, Math.PI / 2), perpLeft(v), 1e-12),
      "rotating by 90 degrees should be perpLeft exactly",
    );
  }
  let worstLength = 0;
  for (let deg = -360; deg <= 360; deg += 1) {
    const r = toRadians(deg);
    const v = { x: 3, y: -1.5 };
    const spun = rotate(v, r);
    worstLength = Math.max(worstLength, Math.abs(length(spun) - length(v)));
    // Rotating and then unrotating must return the original, or the sign convention is wrong.
    assert(
      same(rotate(spun, -r), v, 1e-9),
      `rotating back did not return the original at ${deg}`,
    );
    // The angle should advance by exactly the amount asked for.
    assert(
      near(wrapRadians(angleOf(spun)), wrapRadians(angleOf(v) + r), 1e-9),
      `the angle did not advance by ${deg} degrees`,
    );
  }
  assert(
    worstLength < 1e-12,
    `rotation changed a vector's length by ${worstLength}`,
  );
  // Two rotations compose into their sum, which is the property matrices will inherit in Part 3.
  for (const [a, b] of [
    [30, 40],
    [170, 25],
    [-90, -140],
  ] as const) {
    assert(
      same(
        rotate(rotate({ x: 2, y: 1 }, toRadians(a)), toRadians(b)),
        rotate({ x: 2, y: 1 }, toRadians(a + b)),
        1e-9,
      ),
      `rotating by ${a} then ${b} should be rotating by ${a + b}`,
    );
  }

  // ---- An arbitrary pivot, and the step that gets forgotten -------------------------

  for (let i = 0; i <= 30; i += 1) {
    for (let j = 0; j <= 30; j += 1) {
      const pivot = { x: -2 + (i / 30) * 8, y: -2 + (j / 30) * 7 };
      for (const deg of [-150, -40, 0, 35, 90, 179]) {
        const radians = toRadians(deg);
        // The pivot is a fixed point. If this fails, nothing else about the picture matters.
        assert(
          same(rotateAbout(pivot, pivot, radians), pivot, 1e-9),
          `the pivot moved at ${deg} degrees`,
        );
        const moved = transformed(deg, pivot, true);
        // Every point keeps its distance from the pivot, which is what rotating about it means.
        SPRITE.forEach((p, k) => {
          assert(
            near(distance(pivot, moved[k]), distance(pivot, p), 1e-9),
            `a corner changed its distance from the pivot at ${deg} degrees`,
          );
        });
        // rotateAll and rotateAbout are the same arithmetic, one just hoists the sine and cosine.
        const bulk = rotateAll(SPRITE, pivot, radians);
        SPRITE.forEach((p, k) => {
          assert(
            same(bulk[k], rotateAbout(p, pivot, radians), 1e-12),
            "rotateAll should match rotateAbout point by point",
          );
        });

        // The bug: the shape is offset by exactly the pivot, whatever the angle.
        const miss = missBy(deg, pivot);
        assert(
          same(miss, pivot, 1e-9),
          `the broken version should be off by the pivot, was off by ${miss.x},${miss.y}`,
        );
        // Which grows with the pivot, so the further off the origin it sits the worse it looks.
        assert(
          near(length(miss), length(pivot), 1e-9),
          "the size of the mistake should be the pivot's own distance from the origin",
        );
        // And the broken shape is still correctly rotated, which is why it looks plausible.
        const wrong = transformed(deg, pivot, false);
        assert(
          near(
            distance(wrong[0], wrong[3]),
            distance(SPRITE[0], SPRITE[3]),
            1e-9,
          ),
          "the broken version should still be a rigid copy of the sprite",
        );
      }
    }
  }
  // A rotation by nothing should be the identity, both correctly and in the broken version's own terms.
  assert(
    transformed(0, SPRITE_CENTRE, true).every((p, k) =>
      same(p, SPRITE[k], 1e-12),
    ),
    "rotating by zero should change nothing",
  );
  // And the case the whole Section turns on: at the origin the broken version is exactly right, so
  // there is nothing to notice while the pivot sits there. Asserted separately because the sweep
  // above steps over the origin rather than landing on it.
  for (const deg of [-150, -40, 0, 35, 90, 179]) {
    const atOrigin = { x: 0, y: 0 };
    assert(
      same(missBy(deg, atOrigin), atOrigin, 1e-12),
      `at the origin the broken version should be exactly right, and was not at ${deg} degrees`,
    );
    assert(
      transformed(deg, atOrigin, false).every((p, k) =>
        same(p, transformed(deg, atOrigin, true)[k], 1e-12),
      ),
      `both versions should agree exactly at the origin, and did not at ${deg} degrees`,
    );
  }

  // ---- What the broken version actually orbits ---------------------------------------

  // The scene draws a dashed circle. An earlier version always centred it on the pivot, which is a
  // false statement once the translate is missing: the shape is orbiting the origin, not the pivot.
  // These rows are what make the drawn circle a claim the build can check.
  let circlesDiffered = 0;
  let circlesAgreed = 0;
  for (let i = 0; i <= 20; i += 1) {
    for (let j = 0; j <= 20; j += 1) {
      const pivot = {
        x: PIVOT_RANGE.minX + (i / 20) * (PIVOT_RANGE.maxX - PIVOT_RANGE.minX),
        y: PIVOT_RANGE.minY + (j / 20) * (PIVOT_RANGE.maxY - PIVOT_RANGE.minY),
      };
      const wanted = distance(pivot, SPRITE_TIP);
      for (const deg of [-175, -60, 0, 25, 90, 180]) {
        const right = transformed(deg, pivot, true);
        const wrong = transformed(deg, pivot, false);
        // Correct: the tip orbits the pivot at its original distance.
        assert(
          near(distance(orbitCentre(pivot, true), right[3]), wanted, 1e-9),
          `the tip left its circle round the pivot at ${deg} degrees`,
        );
        // Broken: the tip orbits the origin, at exactly the same radius.
        assert(
          near(distance(orbitCentre(pivot, false), wrong[3]), wanted, 1e-9),
          `the broken tip is not on a circle round the origin at ${deg} degrees`,
        );
        // So the two circles differ only in where they are centred, which is the whole picture.
        assert(
          same(orbitCentre(pivot, true), pivot, 1e-12) &&
            same(orbitCentre(pivot, false), { x: 0, y: 0 }, 1e-12),
          "the orbit centres should be the pivot and the origin",
        );
        // Without the next two counters the rows above could pass vacuously: if the pivot were
        // always the origin, both circles would be the same circle and nothing would be shown.
        // Note it is not true angle by angle - the two radii coincide at whichever angle puts the
        // tip on the perpendicular bisector of the origin and the pivot - so this is counted.
        if (length(pivot) > 0.25) {
          if (near(distance(pivot, wrong[3]), wanted, 1e-3)) circlesAgreed += 1;
          else circlesDiffered += 1;
        }
      }
    }
  }

  // Away from the origin the wrong circle really is the wrong circle, nearly everywhere.
  assert(
    circlesDiffered > circlesAgreed * 20,
    `the two circles should mostly differ, differed at ${circlesDiffered} and agreed at ${circlesAgreed}`,
  );

  // ---- Everything the scene draws has to fit on the canvas ---------------------------

  // The bound the scale is derived from: four pivot-rectangle corners, because |p| + r is convex.
  // A fine scan must never beat it, or the derivation is wrong rather than merely untidy.
  const bound = drawnExtent();
  let worstX = 0;
  let worstY = 0;
  for (let i = 0; i <= 40; i += 1) {
    for (let j = 0; j <= 40; j += 1) {
      const pivot = {
        x: PIVOT_RANGE.minX + (i / 40) * (PIVOT_RANGE.maxX - PIVOT_RANGE.minX),
        y: PIVOT_RANGE.minY + (j / 40) * (PIVOT_RANGE.maxY - PIVOT_RANGE.minY),
      };
      assert(
        sweptRadius(pivot) <= bound.x + 1e-9,
        "the swept radius should never exceed the bound",
      );
      for (let deg = -180; deg <= 180; deg += 5) {
        for (const back of [true, false]) {
          for (const p of transformed(deg, pivot, back)) {
            worstX = Math.max(worstX, Math.abs(p.x));
            worstY = Math.max(worstY, Math.abs(p.y));
            assert(
              Math.abs(p.x) <= bound.x + 1e-9 &&
                Math.abs(p.y) <= bound.y + 1e-9,
              `a corner reached ${p.x},${p.y}, outside the bound ${bound.x},${bound.y}`,
            );
          }
        }
      }
    }
  }
  // The bound must also be tight enough to be worth having: a wildly loose one would shrink the
  // picture for nothing. Within 25% of what the scan actually reaches is close enough.
  assert(
    worstX > bound.x * 0.75 && worstY > bound.y * 0.75,
    `the bound ${bound.x},${bound.y} is loose against the scan's ${worstX},${worstY}`,
  );

  // And now the thing that actually failed before: at the derived scale, does it all land inside
  // the canvas? Checked at the full width and at a narrow one, since the scale follows the canvas.
  for (const [w, h] of [
    [620, 340],
    [380, 340],
    [280, 340],
  ] as const) {
    const unit = fittingScale(w / 2, h / 2);
    assert(unit > 4, `the derived scale collapsed to ${unit} at ${w} by ${h}`);
    for (let i = 0; i <= 20; i += 1) {
      for (let j = 0; j <= 20; j += 1) {
        const pivot = {
          x:
            PIVOT_RANGE.minX + (i / 20) * (PIVOT_RANGE.maxX - PIVOT_RANGE.minX),
          y:
            PIVOT_RANGE.minY + (j / 20) * (PIVOT_RANGE.maxY - PIVOT_RANGE.minY),
        };
        for (let deg = -180; deg <= 180; deg += 10) {
          for (const back of [true, false]) {
            for (const p of transformed(deg, pivot, back)) {
              const sx = w / 2 + p.x * unit;
              const sy = h / 2 - p.y * unit;
              assert(
                sx >= 0 && sx <= w && sy >= 0 && sy <= h,
                `a corner landed at ${sx.toFixed(0)},${sy.toFixed(0)} outside a ${w} by ${h} canvas`,
              );
            }
          }
          // The dashed circle too, which was the worst offender at 37.8% of settings.
          for (const back of [true, false]) {
            const c = orbitCentre(pivot, back);
            const r = distance(c, transformed(deg, pivot, back)[3]) * unit;
            const cx = w / 2 + c.x * unit;
            const cy = h / 2 - c.y * unit;
            assert(
              cx - r >= 0 && cx + r <= w && cy - r >= 0 && cy + r <= h,
              `the dashed circle left a ${w} by ${h} canvas at pivot ${pivot.x},${pivot.y}`,
            );
          }
        }
      }
    }
  }

  // ---- The shortest way round -------------------------------------------------------

  assert(
    near(toDegrees(angleDifference(toRadians(170), toRadians(-170))), 20, 1e-9),
    "170 to -170 is 20 degrees, going counter-clockwise",
  );
  assert(
    near(
      toDegrees(angleDifference(toRadians(-170), toRadians(170))),
      -20,
      1e-9,
    ),
    "and the other way it is -20",
  );
  for (let from = -180; from < 180; from += 5) {
    for (let to = -180; to < 180; to += 5) {
      const d = angleDifference(toRadians(from), toRadians(to));
      assert(
        Math.abs(toDegrees(d)) <= 180 + 1e-9,
        `the difference from ${from} to ${to} exceeded half a turn`,
      );
      // Following the difference must land on the target heading, not merely near it.
      assert(
        near(Math.cos(toRadians(from) + d), Math.cos(toRadians(to)), 1e-9) &&
          near(Math.sin(toRadians(from) + d), Math.sin(toRadians(to)), 1e-9),
        `walking the difference from ${from} did not arrive at ${to}`,
      );
    }
  }

  // ---- Turning at a limited rate ----------------------------------------------------

  let longerCases = 0;
  for (const target of [-170, -95, -20, 45, 130, 179]) {
    for (const rate of [1, 3, 4, 12, 30]) {
      const shortWay = stepsToArrive(target, rate, true);
      const longWay = stepsToArrive(target, rate, false);
      assert(shortWay !== null, `wrapped turning never arrived at ${target}`);
      assert(longWay !== null, `unwrapped turning never arrived at ${target}`);
      // The short way takes exactly the wrapped difference divided by the rate, rounded up.
      const expected = Math.ceil(
        Math.abs(toDegrees(angleDifference(START, toRadians(target)))) / rate -
          1e-9,
      );
      assert(
        shortWay === Math.max(expected, 0),
        `turning to ${target} at ${rate} should take ${expected} steps, took ${shortWay}`,
      );
      assert(
        longWay! >= shortWay!,
        `the unwrapped version should never be faster, ${longWay} against ${shortWay}`,
      );
      if (longWay! > shortWay!) longerCases += 1;

      // It never overshoots: the remaining difference only ever shrinks.
      let previous = Infinity;
      for (let steps = 0; steps <= shortWay!; steps += 1) {
        const t = simulate(target, rate, steps, true);
        const remaining = Math.abs(
          toDegrees(angleDifference(t.current, toRadians(target))),
        );
        assert(
          remaining <= previous + 1e-9,
          `the turn overshot at step ${steps} toward ${target}`,
        );
        previous = remaining;
      }
      // And having arrived, it stays put rather than oscillating.
      const after = simulate(target, rate, shortWay! + 25, true);
      assert(
        near(
          Math.abs(
            toDegrees(angleDifference(after.current, toRadians(target))),
          ),
          0,
          1e-9,
        ),
        `the turret drifted off the target after arriving at ${target}`,
      );
      // The first step has to go the way the wrapped difference says.
      const first = simulate(target, rate, 1, true);
      const wanted = angleDifference(START, toRadians(target));
      if (Math.abs(toDegrees(wanted)) > rate) {
        assert(
          Math.sign(angleDifference(START, first.current)) ===
            Math.sign(wanted),
          `the first step went the wrong way toward ${target}`,
        );
      }
    }
  }
  assert(
    longerCases > 8,
    `the unwrapped version should be slower in plenty of cases, was in ${longerCases}`,
  );
  // The headline: 170 to -170 is 20 degrees away, and the long way round is 17 times the work.
  assert(
    stepsToArrive(-170, 4, true) === 5,
    "the short way to -170 at 4 degrees a step is 5 steps",
  );
  assert(stepsToArrive(-170, 4, false) === 85, "and the long way round is 85");

  // ---- Interpolating a heading ------------------------------------------------------

  assert(
    near(
      toDegrees(lerpAngle(toRadians(170), toRadians(-170), 0.5)),
      -180,
      1e-9,
    ),
    "halfway from 170 to -170 should be 180, which wraps to -180",
  );
  assert(
    near(
      toDegrees(lerpAngleBroken(toRadians(170), toRadians(-170), 0.5)),
      0,
      1e-9,
    ),
    "lerping the raw numbers puts it at 0 instead, pointing the opposite way",
  );
  for (const [from, to] of [
    [170, -170],
    [-90, 90],
    [10, 350],
    [0, 179],
  ] as const) {
    // At both ends it must be the endpoints, as directions rather than as numbers.
    for (const [t, expected] of [
      [0, from],
      [1, to],
    ] as const) {
      const got = lerpAngle(toRadians(from), toRadians(to), t);
      assert(
        near(Math.cos(got), Math.cos(toRadians(expected)), 1e-9) &&
          near(Math.sin(got), Math.sin(toRadians(expected)), 1e-9),
        `lerpAngle at t=${t} from ${from} to ${to} did not reach ${expected}`,
      );
    }
    // And it never travels further than the short way round.
    for (let t = 0; t <= 1; t += 0.05) {
      const travelled = Math.abs(
        toDegrees(
          angleDifference(
            toRadians(from),
            lerpAngle(toRadians(from), toRadians(to), t),
          ),
        ),
      );
      assert(
        travelled <= 180 + 1e-9,
        `lerpAngle went the long way at t=${t} from ${from} to ${to}`,
      );
    }
  }
};
