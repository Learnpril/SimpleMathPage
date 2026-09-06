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
import {
  apply,
  applyAll,
  applyToDirection,
  compose,
  determinant,
  identity,
  multiply,
  rotation,
  sameMatrix,
  scaling,
  translation,
} from "../../../gamedev2d/matrix2d.ts";
import { inverse, translationOf } from "../../../gamedev2d/matrix2d.ts";
import {
  camera as camera2d,
  cameraPlacement,
  parallax as parallax2d,
  screenToWorld as screenToWorld2d,
  unitsPerPixel,
  viewMatrix,
  visibleWorld as visibleWorld2d,
  withZoom,
  worldToScreen as worldToScreen2d,
  zoomAbout as zoomAbout2d,
} from "../../../gamedev2d/camera2d.ts";
import {
  RANGE as CAMERA_RANGE,
  flagOnScreen,
  ridge,
  visible,
  worldUnderPixel,
} from "./camera-shared.ts";
import {
  clampDt,
  decay,
  decayAfterOneSecond,
  halfLifeFromRate,
  lerpAfterOneSecond,
  lerpPerFrame,
  rateFromHalfLife,
  rateFromLerpFactor,
  remainingAfterFrames,
  remainingAfterSeconds,
  secondsPerFrame,
  smooth,
  step,
  stepWithoutDt,
} from "../../../gamedev2d/time2d.ts";
import {
  RANGE as FOLLOW_RANGE,
  SHARED_PERIOD,
  STEP_AT,
  oneFrameOfDecay,
  sharedPairs,
  targetAt,
  timeToClose,
  traceFor,
  transientGap,
  worstSampledGap,
} from "./follow-shared.ts";
import {
  axisLengths,
  directionToLocal,
  directionToWorld,
  isMirrored,
  isSquare,
  localUnderNewParent,
  matrixOf,
  placed,
  pointToLocal,
  pointToWorld,
  shearOf,
  worldOf as worldOfChain,
} from "../../../gamedev2d/spaces2d.ts";
import {
  RANGE as TANK_RANGE,
  extentBound as tankExtent,
  fittingScale as tankScale,
  hullShape,
  turretShape,
} from "./tank-shared.ts";
import {
  ORDERS,
  RANGE as AFFINE_RANGE,
  SHAPE as AFFINE_SHAPE,
  distinctOutcomes,
  extentBound,
  fittingScale as fittingScale2d,
  ordersAgree,
  partsOf,
  transformedShape,
} from "./affine-shared.ts";
import {
  clamp,
  clamp01,
  easeInCubic,
  easeInOutCubic,
  easeInOutQuad,
  easeInQuad,
  easeOutBack,
  easeOutBounce,
  easeOutCubic,
  easeOutElastic,
  easeOutQuad,
  inverseLerp,
  lerp,
  lerpClamped,
  linear,
  remap,
  remapClamped,
  reverse,
  smootherstep,
  smoothstep,
  tween,
  type Easing,
} from "../../../gamedev2d/easing2d.ts";
import {
  ALL,
  CAPTION_LIMIT,
  GALLERY,
  GHOSTS,
  LAYOUT,
  curvatureAt,
  drawnRight,
  extremes,
  ghostTimes,
  isMonotone,
  peakSlope,
  rowCentre,
  slopeAt,
  trackX,
} from "./gallery-shared.ts";
import {
  LENGTH_SAMPLES,
  arcTable,
  chainPoints,
  cubicAt,
  curveLength,
  deCasteljau,
  distanceAtT,
  elevate,
  facingAt,
  fractionAtT,
  joinsSmoothly,
  meetsAt,
  pointAt,
  quadraticAt,
  seamAngle,
  smoothedNext,
  speedSpread,
  splitAt,
  tAtDistance,
  tAtFraction,
  tangentAt,
} from "../../../gamedev2d/bezier2d.ts";
/* Aliased on the way in: `screenOf`, `worldOf` and `VIEW` are already bound here by the aiming and
   axes Sections, and two different mappings under one name is exactly the sort of thing that produces
   a check which passes while testing the wrong geometry. */
import {
  BOUNDS as PATH_BOUNDS,
  JOIN_A,
  JOIN_NAIVE,
  MARKS,
  PRESETS,
  UNIT as PATH_UNIT,
  VIEW as PATH_VIEW,
  clampToBounds,
  markPoints,
  outline,
  screenOf as pathScreenOf,
  travelReport,
  worldOf as pathWorldOf,
} from "./path-shared.ts";
import {
  aabbContains,
  aabbOverlapDepth,
  aabbsOverlap,
  boxHeight,
  boxWidth,
  circleAabbOverlap,
  circleAabbOverlapNaive,
  circleAabbSeparation,
  circleSeparation,
  circlesOverlap,
  circlesOverlapWrongSquare,
  closestPointInAabb,
  cornerErrorArea,
  isValidAabb,
  normalized,
  rangesOverlap,
  toAabb,
  toBox,
  type Aabb,
  type Circle,
} from "../../../gamedev2d/collide2d.ts";
/* `START` belongs to the turning Section already, and `screenOf`, `worldOf`, `VIEW`, `BOUNDS` and
   `clampToBounds` are each bound by two earlier Sections. Aliasing rather than shadowing, because a
   check that silently tests the wrong Section's geometry still passes. */
import {
  BOUNDS as SHAPES_BOUNDS,
  CORNER_BOX,
  KINDS,
  MOVING_RADIUS,
  RADIUS_RANGE,
  START as SHAPES_START,
  STATIC_BOX,
  STATIC_CIRCLE,
  VIEW as SHAPES_VIEW,
  clampToBounds as shapesClampToBounds,
  measuredErrorArea,
  movingBoxAt,
  naiveRegion,
  reportAt,
  screenOf as shapesScreenOf,
  worldOf as shapesWorldOf,
} from "./shapes-shared.ts";
import {
  areCollinear,
  areParallel,
  clampT,
  closestPoint,
  collinearOverlap,
  containsT,
  direction,
  distanceToLine,
  distanceToSegment,
  firstBlocker,
  firstBlockerWrong,
  hasLineOfSight,
  lineCrossing,
  pointOn,
  projectionT,
  rayHitsSegment,
  segmentCrossing,
  segmentLength,
  type Segment,
} from "../../../gamedev2d/segment2d.ts";
/* Aliased for the same reason as the last two Sections: `START`, `VIEW`, `BOUNDS`, `screenOf`,
   `worldOf` and `clampToBounds` are each bound several times over by now, and a check quietly testing
   an earlier Section's geometry would pass while proving nothing about this one. */
import {
  BOUNDS as SIGHT_BOUNDS,
  GUARD_AT as SIGHT_GUARD,
  NEAREST_WALL,
  RADIUS_RANGE as SIGHT_RADIUS_RANGE,
  SIGHT_RADIUS,
  START as SIGHT_START,
  VIEW as SIGHT_VIEW,
  WALLS as SIGHT_WALLS,
  clampToBounds as sightClampToBounds,
  clearInDirection,
  nearestReport,
  screenOf as sightScreenOf,
  sightReport,
  sweepDisagreements,
  worldOf as sightWorldOf,
} from "./sight-shared.ts";
/* Everything from the separating-axis Section is aliased. By this point in the file `fixedAt`, `project`,
   `screenOf`, `worldOf`, `VIEW`, `BOUNDS` and `START` are each bound by an earlier Section, and a check
   that silently exercises the wrong Section's geometry passes while proving nothing. */
import {
  candidateAxes as satCandidateAxes,
  containsPoint as satContains,
  counterClockwise as satCounterClockwise,
  distinctAxisCount as satDistinctAxes,
  edgeNormals as satEdgeNormals,
  overlapOnAxis as satOverlapOnAxis,
  polygonsOverlap as satOverlap,
  project as satProject,
  regularPolygon as satRegular,
  separatingAxis as satSeparatingAxis,
  smallestOverlap as satSmallestOverlap,
  smallestOverlapRaw as satSmallestOverlapRaw,
  suitableForSat as satSuitable,
  type Polygon,
} from "../../../gamedev2d/sat2d.ts";
import {
  BOUNDS as SAT_BOUNDS,
  CHEVRON as SAT_CHEVRON,
  CHEVRON_HULL as SAT_HULL,
  FIXED as SAT_FIXED,
  MOVING as SAT_MOVING,
  PROBE_START as SAT_PROBE_START,
  SPIN_RANGE as SAT_SPIN,
  START as SAT_START,
  VIEW as SAT_VIEW,
  clampToBounds as satClamp,
  concaveFalseArea as satFalseArea,
  falseRegionCells as satFalseCells,
  fixedAt as satFixedAt,
  movingAt as satMovingAt,
  probeAt as satProbeAt,
  satIsWrongAt as satIsWrong,
  satReport as satReportOf,
  screenOf as satScreenOf,
  worldOf as satWorldOf,
} from "./separate-shared.ts";
import {
  SKIN,
  cappedSpeed,
  convergenceRate,
  movingInto,
  pushOut,
  pushOutAll,
  pushOutExactly,
  reflect,
  respond,
  resolveVelocity,
  settleVelocity,
  slide,
  slideSpeedFraction,
  stepDistance,
  substepsNeeded,
  tunnellingChance,
  tunnellingSpeed,
} from "../../../gamedev2d/response2d.ts";
/* Aliased where an earlier Section already owns the name: `screenOf`, `worldOf` and `VIEW` for the sixth
   time now, and `THIN_WALL` is only unique because nothing else needed a wall of its own. */
import {
  CONTACT,
  FRAME,
  MOVER_SPEED,
  THIN_WALL,
  VELOCITY_RANGE,
  VIEW as DEFLECT_VIEW,
  WALL_DRAW_LENGTH,
  WALL_RANGE,
  WALL_THICKNESS,
  deflectReport,
  insideWall,
  measuredTunnelChance,
  screenOf as deflectScreenOf,
  substepReport,
  tipOf,
  wallFrom,
  worldOf as deflectWorldOf,
} from "./deflect-shared.ts";
import {
  INTEGRATORS,
  apexOf,
  asymmetricJump,
  clampFallSpeed,
  clampSpeed,
  cutJump,
  dragExactAt,
  driftAfter,
  exactAt,
  jumpFromHeightAndAirtime,
  jumpFromHeightAndTime,
  remainingHeight,
  step as physicsStep,
  stepExplicit,
  stepMidpoint,
  stepSemiImplicit,
  stepWithDrag,
  terminalVelocity,
  type Body as PhysicsBody,
} from "../../../gamedev2d/physics2d.ts";
/* Aliased throughout, for the seventh Section running. `step`, `GROUND`, `VIEW`, `screenOf` and `worldOf` are
   all taken by now, and quietly testing an earlier Section's arithmetic is a failure mode that passes. */
import {
  APEX_TIME_RANGE as LEAP_APEX,
  FPS_RANGE as LEAP_FPS,
  GROUND as LEAP_GROUND,
  HEIGHT_RANGE as LEAP_HEIGHT,
  LAUNCH_X as LEAP_LAUNCH_X,
  THROW_TIME as LEAP_THROW_TIME,
  VIEW as LEAP_VIEW,
  allTraces as leapAllTraces,
  apexOnFrame as leapApexOnFrame,
  arcFor as leapArcFor,
  bracketAt as leapBracketAt,
  exactArc as leapExactArc,
  predictedDrift as leapPredictedDrift,
  samplingDeficit as leapSamplingDeficit,
  screenOf as leapScreenOf,
  worldOf as leapWorldOf,
} from "./leap-shared.ts";
/* The capstone, aliased without exception. By this point in the file `step`, `START`, `VIEW`, `BOUNDS`,
   `screenOf`, `worldOf`, `clampToBounds`, `GROUND`, `project`, `fixedAt` and `RADIUS_RANGE` are each bound by
   several earlier Sections, and a capstone check that silently exercised Section 4.3's geometry would pass
   while proving nothing about the thing it is named after. Prefixing every one of them is cheaper than
   discovering that later. */
import {
  ART_PIXELS_PER_UNIT as CAP_ART_PIXELS,
  CONTACT_SKIN as CAP_CONTACT_SKIN,
  COYOTE_TIME as CAP_COYOTE,
  FIXED_DT as CAP_FIXED_DT,
  TUNING as CAP_TUNING,
  boxOf as capBoxOf,
  bufferRemaining as capBufferRemaining,
  canJump as capCanJump,
  coyoteRemaining as capCoyoteRemaining,
  derived as capDerived,
  followCamera as capFollowCamera,
  renderAlpha as capRenderAlpha,
  stepsFor as capStepsFor,
} from "../../../gamedev2d/platformer2d.ts";
import {
  CHARGE_FACE as capChargeFace,
  CHARGE_FROM as CAP_CHARGE_FROM,
  CHARGE_SECONDS as CAP_CHARGE_SECONDS,
  CHARGE_VIEW as CAP_CHARGE_VIEW,
  JITTER_FPS as CAP_JITTER_FPS,
  JITTER_FRAMES as CAP_JITTER_FRAMES,
  LANDMARKS as CAP_LANDMARKS,
  RUN_STEPS as capRunSteps,
  SNAPS as CAP_SNAPS,
  SOLID_CELLS as CAP_SOLID_CELLS,
  TIME_RANGE as CAP_TIME_RANGE,
  VIEW as CAP_VIEW,
  advancesWholePixels as capAdvancesWholePixels,
  frameSignature as capFrameSignature,
  jitterSignature as capJitterSignature,
  jitterSpeeds as capJitterSpeeds,
  jitterTrace as capJitterTrace,
  chargeAtStep as capChargeAtStep,
  chargeRectOf as capChargeRectOf,
  chargeScreenOf as capChargeScreenOf,
  chargeSignature as capChargeSignature,
  chargeSpeeds as capChargeSpeeds,
  chargeSummary as capChargeSummary,
  chargeWorldOf as capChargeWorldOf,
  clampCamera as capClampCamera,
  divergence as capDivergence,
  endedAt as capEndedAt,
  jitterFor as capJitterFor,
  jumpSteps as capJumpSteps,
  rectOf as capRectOf,
  runScript as capRunScript,
  screenOf as capScreenOf,
  worldOf as capWorldOf,
} from "./platformer-shared.ts";

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

/**
 * Matrices: the three transforms, the order they compose in, and what the third coordinate is for.
 *
 * Three rows carry most of the weight. The rotation matrix is compared against Section 2.3's `rotate`
 * at every angle, so the claim that a matrix is only the same arithmetic in a box is checked rather
 * than asserted. The `w = 0` rule is checked by an **identity** rather than by a rule - transforming a
 * displacement must equal transforming two places and subtracting - so it cannot be satisfied by
 * happening to ignore the right column. And the determinant is checked against Section 2.1's signed
 * polygon area, including its sign, which is what makes "negative means mirrored" a fact.
 */
export const matrixCheck2d: Demo = () => {
  const same = (a: Point, b: Point, tol = 1e-9) =>
    Math.abs(a.x - b.x) < tol && Math.abs(a.y - b.y) < tol;

  // ---- The three ingredients -------------------------------------------------------

  assert(
    sameMatrix(identity(), [1, 0, 0, 0, 1, 0, 0, 0, 1], 0),
    "the identity should be the identity",
  );
  assert(
    same(apply(identity(), { x: 3, y: -7 }), { x: 3, y: -7 }, 1e-15),
    "and it should leave a point alone",
  );
  assert(
    same(apply(translation(4, 1), { x: 3, y: 2 }), { x: 7, y: 3 }, 1e-15),
    "translating (3, 2) by (4, 1) should give (7, 3)",
  );
  assert(
    same(apply(scaling(2, 3), { x: 3, y: 2 }), { x: 6, y: 6 }, 1e-15),
    "scaling should multiply each axis independently",
  );
  // The bottom row is what makes these affine, and nothing here should disturb it.
  for (const m of [
    identity(),
    translation(3, -2),
    rotation(0.7),
    scaling(1.5, 0.5),
    compose(translation(1, 2), rotation(0.3), scaling(2, 0.4)),
  ]) {
    assert(
      m[6] === 0 && m[7] === 0 && m[8] === 1,
      "the bottom row of an affine matrix should stay 0 0 1",
    );
  }

  // ---- The rotation matrix is Section 2.3's formula ---------------------------------

  for (let deg = -360; deg <= 360; deg += 1) {
    const r = toRadians(deg);
    const m = rotation(r);
    for (const v of [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 2.5, y: -1.25 },
      { x: -3, y: 4 },
    ]) {
      assert(
        same(apply(m, v), rotate(v, r), 1e-12),
        `the rotation matrix disagreed with rotate() at ${deg} degrees`,
      );
    }
    // Which means the columns are where the two axes land - the reason it is readable at all.
    assert(
      same({ x: m[0], y: m[3] }, applyToDirection(m, { x: 1, y: 0 }), 1e-15) &&
        same({ x: m[1], y: m[4] }, applyToDirection(m, { x: 0, y: 1 }), 1e-15),
      `the columns should be the transformed axes, failed at ${deg} degrees`,
    );
  }

  // ---- Composition, and which side goes first --------------------------------------

  const T = translation(3, -1);
  const R = rotation(toRadians(35));
  const S = scaling(1.8, 0.6);
  for (const p of [
    { x: 0, y: 0 },
    { x: 1.2, y: 1.4 },
    { x: -2, y: 0.5 },
    { x: 4, y: -3 },
  ]) {
    // The right-hand matrix is applied first. This is the whole of transform order.
    assert(
      same(apply(multiply(T, R), p), apply(T, apply(R, p)), 1e-12),
      "multiply(T, R) should apply R first",
    );
    assert(
      same(apply(compose(T, R, S), p), apply(T, apply(R, apply(S, p))), 1e-12),
      "compose(T, R, S) should apply S first and T last",
    );
  }
  // Associative but not commutative, and the second half is the one that matters here.
  assert(
    sameMatrix(multiply(multiply(T, R), S), multiply(T, multiply(R, S)), 1e-12),
    "matrix multiplication should be associative",
  );
  assert(
    !sameMatrix(multiply(T, R), multiply(R, T), 1e-6),
    "translation and rotation should not commute",
  );
  assert(
    !sameMatrix(multiply(S, R), multiply(R, S), 1e-6),
    "a non-uniform scale and a rotation should not commute",
  );
  // Uniform scale is the exception, which is exactly why order bugs hide.
  const uniform = scaling(1.7, 1.7);
  assert(
    sameMatrix(multiply(uniform, R), multiply(R, uniform), 1e-12),
    "a uniform scale and a rotation do commute",
  );

  // ---- The third coordinate, checked as an identity ---------------------------------

  let worstDirection = 0;
  for (const m of [
    T,
    R,
    S,
    compose(T, R, S),
    compose(S, R, T),
    translation(-40, 17),
  ]) {
    for (const base of [
      { x: 0, y: 0 },
      { x: 3, y: 2 },
      { x: -9, y: 4.5 },
    ]) {
      for (const v of [
        { x: 1, y: 0 },
        { x: 0, y: -1 },
        { x: 2.5, y: 3.5 },
      ]) {
        // Transforming a displacement must be transforming two places and subtracting.
        const byPoints = displacement(
          apply(m, base),
          apply(m, movedBy(base, v)),
        );
        const direct = applyToDirection(m, v);
        worstDirection = Math.max(
          worstDirection,
          Math.hypot(byPoints.x - direct.x, byPoints.y - direct.y),
        );
      }
    }
  }
  assert(
    worstDirection < 1e-9,
    `transforming a displacement disagreed with subtracting two transformed places by ${worstDirection}`,
  );
  // And a pure translation must leave every displacement completely alone, however large.
  for (const t of [
    { x: 1, y: 1 },
    { x: -250, y: 900 },
  ]) {
    assert(
      same(
        applyToDirection(translation(t.x, t.y), { x: 3, y: 2 }),
        { x: 3, y: 2 },
        1e-15,
      ),
      `a translation by ${t.x},${t.y} moved a displacement`,
    );
    // Whereas it certainly does move a place, or there would be nothing being distinguished.
    assert(
      !same(apply(translation(t.x, t.y), { x: 3, y: 2 }), { x: 3, y: 2 }, 1e-6),
      "a translation should move a place",
    );
  }

  // ---- The determinant, against Section 2.1's signed area --------------------------

  assert(
    near(determinant(scaling(2, 3)), 6, 1e-15),
    "a scale by 2 and 3 should have determinant 6",
  );
  assert(
    near(determinant(rotation(1.234)), 1, 1e-12),
    "a rotation should have determinant 1",
  );
  assert(
    near(determinant(translation(9, -4)), 1, 1e-15),
    "so should a pure translation",
  );
  assert(
    determinant(scaling(-1, 1)) < 0,
    "a reflection should have a negative determinant",
  );
  const square: Point[] = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 0, y: 1 },
  ];
  for (const m of [
    identity(),
    T,
    R,
    S,
    compose(T, R, S),
    scaling(-1, 1),
    compose(R, scaling(1, -2.5)),
    scaling(0.5, 0.5),
  ]) {
    const det = determinant(m);
    const before = signedPolygonArea(square);
    const after = signedPolygonArea(applyAll(m, square));
    // The signed area scales by the determinant exactly, sign included.
    assert(
      near(after / before, det, 1e-9),
      `the signed area changed by ${after / before} where the determinant said ${det}`,
    );
    // So a negative determinant is precisely a reversed winding, which is what "mirrored" means.
    assert(
      det < 0 === (windingOf(applyAll(m, square)) !== windingOf(square)),
      "a negative determinant should be exactly a flipped winding",
    );
    // The determinant is the cross product of the two columns, which is where the area comes from.
    assert(
      near(cross({ x: m[0], y: m[3] }, { x: m[1], y: m[4] }), det, 1e-12),
      "the determinant should be the cross product of the two columns",
    );
  }

  // ---- The six orders --------------------------------------------------------------

  const nonUniform = {
    angleDegrees: 30,
    scaleX: 1.4,
    scaleY: 0.6,
    translateX: 1.2,
  };
  const uniformParams = {
    angleDegrees: 30,
    scaleX: 1.4,
    scaleY: 1.4,
    translateX: 1.2,
  };
  assert(
    !ordersAgree("TRS", "SRT", nonUniform),
    "T·R·S and S·R·T should differ under a non-uniform scale",
  );
  // With all three operations doing something, every one of the six lands somewhere different.
  assert(
    distinctOutcomes(nonUniform) === 6,
    `all six orders should differ here, got ${distinctOutcomes(nonUniform)} distinct`,
  );
  for (const order of ORDERS) {
    if (order === "TRS") continue;
    assert(
      !ordersAgree("TRS", order, nonUniform),
      `${order} should differ from T·R·S at these settings`,
    );
  }

  // Uniform scale lets rotation and scale commute, collapsing six results into four. That collapse
  // is the reason transform-order bugs survive: they are invisible until a scale becomes uneven.
  assert(
    distinctOutcomes(uniformParams) === 4,
    `under a uniform scale it should collapse to 4, got ${distinctOutcomes(uniformParams)}`,
  );
  assert(
    ordersAgree("TRS", "TSR", uniformParams) &&
      ordersAgree("RST", "SRT", uniformParams),
    "uniform scale should make T·R·S = T·S·R and R·S·T = S·R·T",
  );
  // But it does not collapse everything: the two that scale a translation still differ.
  assert(
    !ordersAgree("RTS", "STR", uniformParams),
    "uniform scale should not make R·T·S the same as S·T·R",
  );

  // Drop the translation and only one question is left - did the scale or the rotation go first.
  assert(
    distinctOutcomes({ ...nonUniform, translateX: 0 }) === 2,
    `with no translation there should be 2 results, got ${distinctOutcomes({ ...nonUniform, translateX: 0 })}`,
  );
  // Drop the rotation instead and the question becomes whether the translation was scaled.
  const noRotation = {
    angleDegrees: 0,
    scaleX: 1.4,
    scaleY: 0.6,
    translateX: 1.2,
  };
  assert(
    distinctOutcomes(noRotation) === 2,
    `with no rotation there should be 2 results, got ${distinctOutcomes(noRotation)}`,
  );
  assert(
    ordersAgree("TRS", "RTS", noRotation) &&
      !ordersAgree("TRS", "SRT", noRotation),
    "with no rotation the split should be about which side of the scale the translation sits",
  );
  // And with only a translation there is nothing left to order at all.
  assert(
    distinctOutcomes({
      angleDegrees: 0,
      scaleX: 1,
      scaleY: 1,
      translateX: 1.2,
    }) === 1,
    "a translation on its own has no ordering to get wrong",
  );
  // Every order is its own composition, so the shape must match applying the parts by hand.
  for (const order of ORDERS) {
    const parts = partsOf(nonUniform);
    const byHand = order
      .split("")
      .reduceRight<
        Point[]
      >((points, letter) => points.map((p) => apply(parts[letter as "T"], p)), [...AFFINE_SHAPE]);
    assert(
      transformedShape(order, nonUniform).every((p, i) =>
        same(p, byHand[i], 1e-12),
      ),
      `${order} did not match applying its parts one at a time`,
    );
  }

  // ---- Everything both scenes draw has to fit on the canvas ------------------------

  const bound = extentBound();
  let worstReach = 0;
  for (const order of ORDERS) {
    for (let a = -180; a <= 180; a += 15) {
      for (
        let sx = AFFINE_RANGE.scale.min;
        sx <= AFFINE_RANGE.scale.max + 1e-9;
        sx += 0.1
      ) {
        for (
          let sy = AFFINE_RANGE.scale.min;
          sy <= AFFINE_RANGE.scale.max + 1e-9;
          sy += 0.1
        ) {
          for (
            let tx = AFFINE_RANGE.translate.min;
            tx <= AFFINE_RANGE.translate.max + 1e-9;
            tx += 0.25
          ) {
            for (const p of transformedShape(order, {
              angleDegrees: a,
              scaleX: sx,
              scaleY: sy,
              translateX: tx,
            })) {
              const reach = length(p);
              worstReach = Math.max(worstReach, reach);
              assert(
                reach <= bound + 1e-9,
                `${order} reached ${reach} beyond the bound ${bound}`,
              );
            }
          }
        }
      }
    }
  }
  // Loose enough to be safe, tight enough to be worth having.
  assert(
    worstReach > bound * 0.6,
    `the bound ${bound} is loose against the sweep's ${worstReach}`,
  );

  // The single-panel layout, and the two-panel one, at several widths.
  for (const [w, h, panels] of [
    [620, 320, 1],
    [620, 330, 2],
    [380, 330, 2],
    [280, 320, 1],
  ] as const) {
    const panelWidth = w / panels;
    const unit = fittingScale2d(panelWidth / 2, h / 2);
    assert(unit > 4, `the derived scale collapsed to ${unit} at ${w} by ${h}`);
    for (const order of ORDERS) {
      for (let a = -180; a <= 180; a += 30) {
        for (const p of transformedShape(order, {
          angleDegrees: a,
          scaleX: AFFINE_RANGE.scale.max,
          scaleY: AFFINE_RANGE.scale.max,
          translateX: AFFINE_RANGE.translate.max,
        })) {
          const sx = panelWidth / 2 + p.x * unit;
          const sy = h / 2 - p.y * unit;
          assert(
            sx >= 0 && sx <= panelWidth && sy >= 0 && sy <= h,
            `a corner landed at ${sx.toFixed(0)},${sy.toFixed(0)} outside a ${panelWidth} by ${h} panel`,
          );
        }
      }
    }
  }
};

/**
 * Hierarchies: the order of the product, the inverse that undoes it, and shear.
 *
 * Three things here need checking rather than describing. The **round trip** through local and world
 * space, swept over a grid of placements, because an inverse that is slightly wrong still returns a
 * plausible point. The claim that a child's own numbers **never change** while its world position
 * does, which is the entire promise of a hierarchy and is easy to break by writing the product the
 * other way round. And **shear**, which is the one thing a parent can do to a child that neither of
 * their own placements can express - a square child comes out a parallelogram with no number in the
 * child reporting it, so the frame's own axes have to be measured.
 */
export const spaceCheck2d: Demo = () => {
  const same = (a: Point, b: Point, tol = 1e-9) =>
    Math.abs(a.x - b.x) < tol && Math.abs(a.y - b.y) < tol;

  // ---- The inverse ------------------------------------------------------------------

  assert(inverse(identity()) !== null, "the identity is invertible");
  assert(
    sameMatrix(inverse(identity())!, identity(), 1e-12),
    "and it is its own inverse",
  );
  // A zero scale collapses the plane, and no matrix can undo that. Returning null says so.
  assert(inverse(scaling(0, 1)) === null, "a zero x scale is not invertible");
  assert(inverse(scaling(1, 0)) === null, "nor a zero y scale");
  assert(
    inverse(scaling(1e-20, 1e-20)) === null,
    "nor one that is zero for practical purposes",
  );

  let worstInverse = 0;
  for (let deg = -180; deg <= 180; deg += 5) {
    for (const sx of [0.4, 1, 2.5]) {
      for (const sy of [0.4, 1, 2.5]) {
        const m = compose(
          translation(3.5, -2),
          rotation(toRadians(deg)),
          scaling(sx, sy),
        );
        const back = inverse(m);
        assert(back !== null, `should be invertible at ${deg} degrees`);
        // The defining property, both ways round, since matrices do not commute in general.
        assert(
          sameMatrix(multiply(m, back!), identity(), 1e-9) &&
            sameMatrix(multiply(back!, m), identity(), 1e-9),
          `the inverse did not cancel at ${deg} degrees, scale ${sx} by ${sy}`,
        );
        for (const p of [
          { x: 0, y: 0 },
          { x: 1.15, y: 0 },
          { x: -3, y: 2.5 },
        ]) {
          const there = apply(m, p);
          worstInverse = Math.max(
            worstInverse,
            Math.hypot(
              apply(back!, there).x - p.x,
              apply(back!, there).y - p.y,
            ),
          );
        }
        // The translation is inverted through the linear part, not merely negated. Negating it is
        // the common mistake and is only correct when there is no rotation or scale.
        if (deg % 180 !== 0 || sx !== 1 || sy !== 1) {
          assert(
            !same(
              translationOf(back!),
              {
                x: -translationOf(m).x,
                y: -translationOf(m).y,
              },
              1e-6,
            ),
            `negating the translation should not be the inverse at ${deg} degrees`,
          );
        }
      }
    }
  }
  assert(
    worstInverse < 1e-9,
    `the local-world round trip drifted by ${worstInverse}`,
  );

  // ---- The order of the product ------------------------------------------------------

  const hull = placed({ x: 3, y: 1 }, toRadians(90));
  const turret = placed({ x: 0.25, y: 0 }, 0);
  const right = worldOfChain([hull, turret]);
  const wrong = worldOfChain([turret, hull]);
  // Parent times child puts the mount a quarter turn round from the hull's origin.
  assert(
    same(translationOf(right), { x: 3, y: 1.25 }, 1e-9),
    `the mount should be at (3, 1.25), was at ${translationOf(right).x},${translationOf(right).y}`,
  );
  assert(
    !same(translationOf(right), translationOf(wrong), 1e-6),
    "the two orders should put the mount in different places",
  );
  // And the wrong order is not a small error. Worth pinning, because "close enough" would hide it.
  assert(
    Math.hypot(
      translationOf(right).x - translationOf(wrong).x,
      translationOf(right).y - translationOf(wrong).y,
    ) > 0.2,
    "the wrong order should be badly wrong, not marginally wrong",
  );
  // Both orders agree when there is nothing to disagree about, which is why the bug ships.
  const still = placed({ x: 0, y: 0 }, 0);
  assert(
    sameMatrix(worldOfChain([still, still]), worldOfChain([still, still]), 0) &&
      sameMatrix(
        worldOfChain([still, turret]),
        worldOfChain([turret, still]),
        1e-12,
      ),
    "against an identity parent the two orders are identical",
  );
  // A chain of three composes the same way, and grouping must not matter.
  const grand = placed({ x: 0.9, y: 0 }, toRadians(20));
  assert(
    sameMatrix(
      worldOfChain([hull, turret, grand]),
      multiply(worldOfChain([hull, turret]), matrixOf(grand)),
      1e-12,
    ),
    "a three-level chain should compose associatively",
  );

  // ---- A child's own numbers do not change -------------------------------------------

  // The turret is mounted once and never touched. Move the hull however you like: the turret's
  // local placement is identical every time, and only its world transform moves.
  const barrelTip = { x: 1.15, y: 0 };
  const worldSeen: Point[] = [];
  for (let i = 0; i <= 20; i += 1) {
    for (let deg = -180; deg <= 180; deg += 30) {
      const moved = placed({ x: -4 + (i / 20) * 8, y: 0 }, toRadians(deg));
      const world = worldOfChain([moved, turret]);
      // The local coordinates are the same object every time - that is the point of a hierarchy.
      assert(
        turret.position.x === 0.25 && turret.position.y === 0,
        "the child's local position must never be rewritten",
      );
      // Out to the world and back has to return exactly the point we started from.
      const there = pointToWorld(world, barrelTip);
      const back = pointToLocal(world, there);
      assert(
        back !== null && same(back, barrelTip, 1e-9),
        `the barrel tip did not survive the round trip at ${deg} degrees`,
      );
      // A rigid parent cannot change how long the barrel is.
      assert(
        near(
          distance(translationOf(world), there),
          distance({ x: 0, y: 0 }, barrelTip),
          1e-9,
        ),
        "a rigid hierarchy should not change the barrel's length",
      );
      worldSeen.push(there);
    }
  }
  // And the world positions must genuinely differ, or the sweep proves nothing.
  assert(
    new Set(worldSeen.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`)).size >
      200,
    `the barrel tip should land somewhere different for each hull pose, saw ${
      new Set(worldSeen.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`)).size
    }`,
  );

  // Directions ride along rotated and scaled but never translated, which is Section 3.1's w = 0.
  for (let deg = -180; deg <= 180; deg += 15) {
    const world = worldOfChain([
      placed({ x: 40, y: -25 }, toRadians(deg)),
      turret,
    ]);
    const forward = directionToWorld(world, { x: 1, y: 0 });
    assert(
      near(length(forward), 1, 1e-9),
      "a rigid chain should keep a direction unit length",
    );
    // Enormous translations must leave it completely alone.
    assert(
      same(
        forward,
        directionToWorld(
          worldOfChain([placed({ x: 0, y: 0 }, toRadians(deg)), turret]),
          { x: 1, y: 0 },
        ),
        1e-12,
      ),
      `translating the hull changed the turret's facing at ${deg} degrees`,
    );
    const back = directionToLocal(world, forward);
    assert(
      back !== null && same(back, { x: 1, y: 0 }, 1e-9),
      "and the direction round trip should return the original",
    );
  }

  // ---- Shear, the thing only a hierarchy can do ---------------------------------------

  // A rigid or uniformly scaled chain keeps every frame square, at every angle.
  for (let deg = -180; deg <= 180; deg += 5) {
    for (const s of [0.5, 1, 2.2]) {
      const uniform = worldOfChain([
        placed({ x: 1, y: 2 }, toRadians(deg), { x: s, y: s }),
        placed({ x: 0.25, y: 0 }, toRadians(deg / 2)),
      ]);
      assert(
        isSquare(uniform),
        `a uniform scale should not shear a child, failed at ${deg} degrees`,
      );
      const lengths = axisLengths(uniform);
      assert(
        near(lengths.x, s, 1e-9) && near(lengths.y, s, 1e-9),
        "and both axes should carry exactly the parent's scale",
      );
    }
  }
  // An uneven parent scale shears a rotated child, and leaves an axis-aligned one alone.
  const parent = placed({ x: 0, y: 0 }, 0, { x: 2, y: 1 });
  assert(
    isSquare(worldOfChain([parent, placed({ x: 0, y: 0 }, 0)])),
    "an unrotated child is scaled, not sheared",
  );
  assert(
    isSquare(worldOfChain([parent, placed({ x: 0, y: 0 }, toRadians(90))])),
    "and a quarter turn is still square, because the axes only swap",
  );
  let shearedCases = 0;
  for (let deg = 5; deg < 90; deg += 5) {
    const child = worldOfChain([
      parent,
      placed({ x: 0, y: 0 }, toRadians(deg)),
    ]);
    assert(!isSquare(child), `a child turned ${deg} degrees should be sheared`);
    shearedCases += 1;
    // The child's own placement says nothing is wrong, which is why this needs measuring.
    assert(
      isSquare(matrixOf(placed({ x: 0, y: 0 }, toRadians(deg)))),
      "the child's own transform is perfectly square on its own",
    );
  }
  assert(shearedCases > 15, "the sweep should find plenty of sheared cases");
  // 45 degrees under a 2 by 1 parent is the worst case, and it is a specific number.
  const worst = worldOfChain([parent, placed({ x: 0, y: 0 }, toRadians(45))]);
  assert(
    near(Math.abs(shearOf(worst)), 0.6, 1e-9),
    `the 45 degree case should shear to 0.6, gave ${shearOf(worst)}`,
  );
  // A negative scale mirrors rather than shears, which is the determinant test from Section 3.1.
  assert(
    isMirrored(
      worldOfChain([placed({ x: 0, y: 0 }, 0, { x: -1, y: 1 }), turret]),
    ),
    "a negative parent scale should mirror the child",
  );
  assert(
    !isMirrored(worldOfChain([hull, turret])),
    "and a rigid chain should not",
  );

  // ---- Reparenting keeps the child exactly where it is --------------------------------

  for (let deg = -180; deg <= 180; deg += 20) {
    for (const s of [0.7, 1, 1.9]) {
      const newParent = matrixOf(
        placed({ x: -2, y: 4 }, toRadians(deg), { x: s, y: s }),
      );
      const local = localUnderNewParent(newParent, right);
      assert(local !== null, `reparenting should succeed at ${deg} degrees`);
      // The whole promise: recompose under the new parent and nothing has moved.
      assert(
        sameMatrix(multiply(newParent, local!), right, 1e-9),
        `the child moved when re-homed at ${deg} degrees`,
      );
      // Which is worth stating as a point, not only as a matrix.
      assert(
        same(
          pointToWorld(multiply(newParent, local!), barrelTip),
          pointToWorld(right, barrelTip),
          1e-9,
        ),
        "the barrel tip should not budge when the turret changes parent",
      );
    }
  }
  // A collapsed parent cannot be un-done, so reparenting under it has to refuse rather than guess.
  assert(
    localUnderNewParent(scaling(0, 1), right) === null,
    "reparenting under a flattened parent should return null",
  );
  assert(
    pointToLocal(scaling(0, 0), { x: 1, y: 1 }) === null,
    "and so should converting a point into a collapsed space",
  );

  // ---- Everything the scene draws has to fit on the canvas ----------------------------

  const bound = tankExtent();
  let worstX = 0;
  let worstY = 0;
  for (let i = 0; i <= 12; i += 1) {
    for (let deg = -180; deg <= 180; deg += 20) {
      for (let td = -180; td <= 180; td += 45) {
        for (const sx of [
          TANK_RANGE.hullScaleX.min,
          1,
          TANK_RANGE.hullScaleX.max,
        ]) {
          const params = {
            tankX:
              TANK_RANGE.tankX.min +
              (i / 12) * (TANK_RANGE.tankX.max - TANK_RANGE.tankX.min),
            tankAngleDegrees: deg,
            hullScaleX: sx,
            turretAngleDegrees: td,
          };
          for (const wrongOrder of [false, true]) {
            for (const p of [
              ...hullShape(params, wrongOrder),
              ...turretShape(params, wrongOrder),
            ]) {
              worstX = Math.max(worstX, Math.abs(p.x));
              worstY = Math.max(worstY, Math.abs(p.y));
              /* The wrong order is allowed to fly off: it is a bug being displayed, and framing the
                 canvas for it would shrink the correct picture for nothing. Only the real hierarchy
                 has to be guaranteed to fit. */
              if (!wrongOrder) {
                assert(
                  Math.abs(p.x) <= bound.x + 1e-9 &&
                    Math.abs(p.y) <= bound.y + 1e-9,
                  `a corner reached ${p.x},${p.y} beyond the bound ${bound.x},${bound.y}`,
                );
              }
            }
          }
        }
      }
    }
  }
  assert(
    worstX > bound.x * 0.5 && worstY > bound.y * 0.5,
    `the bound ${bound.x},${bound.y} is loose against the sweep's ${worstX},${worstY}`,
  );
  for (const [w, h] of [
    [620, 330],
    [380, 330],
    [280, 330],
  ] as const) {
    const unit = tankScale(w / 2, h / 2);
    assert(unit > 4, `the derived scale collapsed to ${unit} at ${w} by ${h}`);
    for (let deg = -180; deg <= 180; deg += 30) {
      const params = {
        tankX: TANK_RANGE.tankX.max,
        tankAngleDegrees: deg,
        hullScaleX: TANK_RANGE.hullScaleX.max,
        turretAngleDegrees: deg,
      };
      for (const p of [
        ...hullShape(params, false),
        ...turretShape(params, false),
      ]) {
        const sx = w / 2 + p.x * unit;
        const sy = h / 2 - p.y * unit;
        assert(
          sx >= 0 && sx <= w && sy >= 0 && sy <= h,
          `a corner landed at ${sx.toFixed(0)},${sy.toFixed(0)} outside a ${w} by ${h} canvas`,
        );
      }
    }
  }
};

/**
 * Cameras: the view as an inverse, the screen-to-world round trip, zooming about a point, and parallax.
 *
 * The round trip is the assertion this Section is built around, and it is swept over the whole canvas
 * at a range of camera positions, zooms and rotations. The reason is the one that keeps recurring: a
 * screen-to-world conversion that is slightly wrong still returns a perfectly plausible world point, so
 * a click lands somewhere believable and nothing looks broken until someone notices their taps are
 * consistently a little off. The second load-bearing row is that `viewMatrix` really is the inverse of
 * the camera's own placement rather than something that resembles it - each of its three terms could
 * have its sign flipped independently and still produce a picture.
 */
export const cameraCheck2d: Demo = () => {
  const same = (a: Point, b: Point, tol = 1e-9) =>
    Math.abs(a.x - b.x) < tol && Math.abs(a.y - b.y) < tol;
  const W = 620;
  const H = 330;

  // ---- The view matrix is the camera's placement, inverted ----------------------------

  let worstView = 0;
  for (let deg = -180; deg <= 180; deg += 10) {
    for (const z of [0.4, 1, 2.5]) {
      for (const pos of [
        { x: 0, y: 0 },
        { x: 8, y: 3 },
        { x: -12, y: -6 },
      ]) {
        const cam = camera2d(pos, z, toRadians(deg));
        const placement = cameraPlacement(cam);
        const view = viewMatrix(cam);
        const inverted = inverse(placement);
        assert(inverted !== null, "a camera's placement should be invertible");
        // Written out by hand against computed by inversion. Two routes, one answer.
        for (let i = 0; i < 9; i += 1) {
          worstView = Math.max(worstView, Math.abs(view[i] - inverted![i]));
        }
        // And the defining property directly, so the row above cannot pass by coincidence.
        assert(
          sameMatrix(multiply(view, placement), identity(), 1e-9),
          `the view did not cancel the placement at ${deg} degrees, zoom ${z}`,
        );
      }
    }
  }
  assert(
    worstView < 1e-9,
    `the hand-written view matrix differs from the inverted placement by ${worstView}`,
  );

  // The camera's own position is always the middle of the screen. If this moves, nothing else matters.
  for (const pos of [
    { x: 0, y: 0 },
    { x: 8, y: 3 },
    { x: -11.5, y: 5.5 },
  ]) {
    for (const z of [0.4, 1, 3]) {
      assert(
        same(
          worldToScreen2d(camera2d(pos, z), W, H, pos),
          { x: W / 2, y: H / 2 },
          1e-9,
        ),
        `the camera's own position should land at the centre, failed at zoom ${z}`,
      );
    }
  }
  // Raising world y must move something up the screen, whatever the camera is doing. Section 1.1.
  for (const z of [0.5, 1, 2]) {
    const cam = camera2d({ x: 2, y: 1 }, z);
    assert(
      worldToScreen2d(cam, W, H, { x: 2, y: 5 }).y <
        worldToScreen2d(cam, W, H, { x: 2, y: 0 }).y,
      `higher world y should be lower screen y at zoom ${z}`,
    );
  }

  // ---- The round trip, swept over the whole canvas -------------------------------------

  let worstTrip = 0;
  let samples = 0;
  for (const pos of [
    { x: 0, y: 0 },
    { x: 8, y: 3 },
    { x: -12, y: -6 },
  ]) {
    for (const z of [0.4, 1, 1.7, 3]) {
      for (const deg of [0, 35, -90, 175]) {
        const cam = camera2d(pos, z, toRadians(deg));
        for (let px = 0; px <= W; px += 31) {
          for (let py = 0; py <= H; py += 17) {
            const world = screenToWorld2d(cam, W, H, { x: px, y: py });
            assert(
              world !== null,
              `a pixel should map to a world point at ${px},${py}`,
            );
            const back = worldToScreen2d(cam, W, H, world!);
            worstTrip = Math.max(
              worstTrip,
              Math.hypot(back.x - px, back.y - py),
            );
            samples += 1;
          }
        }
      }
    }
  }
  assert(
    worstTrip < 1e-9,
    `the screen-world round trip drifted by ${worstTrip} pixels`,
  );
  assert(samples > 5000, `the sweep should be substantial, was ${samples}`);

  // And the other direction: world to pixel and back, over a grid of world points.
  for (const z of [0.4, 1, 2.5]) {
    const cam = camera2d({ x: 8, y: 3 }, z, toRadians(20));
    for (let x = -20; x <= 20; x += 2.5) {
      for (let y = -10; y <= 10; y += 2.5) {
        const there = worldToScreen2d(cam, W, H, { x, y });
        const back = screenToWorld2d(cam, W, H, there);
        assert(
          back !== null && same(back, { x, y }, 1e-9),
          `the world round trip failed at ${x},${y}, zoom ${z}`,
        );
      }
    }
  }

  // ---- Zoom is a divisor on how much world you see -------------------------------------

  for (const z of [0.5, 1, 2, 3]) {
    const seen = visibleWorld2d(camera2d({ x: 0, y: 0 }, z), W, H);
    assert(seen !== null, "something should be visible");
    assert(
      near(seen!.max.x - seen!.min.x, W / z, 1e-9) &&
        near(seen!.max.y - seen!.min.y, H / z, 1e-9),
      `the visible region at zoom ${z} should be the canvas divided by the zoom`,
    );
    assert(
      near(unitsPerPixel(camera2d({ x: 0, y: 0 }, z)), 1 / z, 1e-12),
      "one pixel should cover one over the zoom in world units",
    );
  }
  // Doubling the zoom must halve what is on screen, which is the sanity check on the direction.
  const wide = visibleWorld2d(camera2d({ x: 0, y: 0 }, 1), W, H)!;
  const tight = visibleWorld2d(camera2d({ x: 0, y: 0 }, 2), W, H)!;
  assert(
    near((wide.max.x - wide.min.x) / (tight.max.x - tight.min.x), 2, 1e-9),
    "zooming in twice should show half as much world, not twice as much",
  );
  // A rotated camera's bounding box is larger than the unrotated one, which is expected, not a bug.
  const turned = visibleWorld2d(
    camera2d({ x: 0, y: 0 }, 1, toRadians(45)),
    W,
    H,
  )!;
  assert(
    turned.max.x - turned.min.x > wide.max.x - wide.min.x,
    "a rotated camera should need a larger bounding box",
  );

  // ---- Zooming about a point holds that point still -------------------------------------

  let anchoredCases = 0;
  let naiveMoved = 0;
  for (const anchor of [
    { x: 11, y: 4 },
    { x: -6, y: -3 },
    { x: 0, y: 0 },
  ]) {
    for (const from of [0.5, 1, 2]) {
      for (const to of [0.5, 1, 2, 3]) {
        const cam = camera2d({ x: 8, y: 3 }, from);
        const before = worldToScreen2d(cam, W, H, anchor);
        const zoomed = zoomAbout2d(cam, anchor, to);
        // The whole promise: the anchor keeps its pixel, to the last decimal place.
        assert(
          same(worldToScreen2d(zoomed, W, H, anchor), before, 1e-9),
          `the anchor moved when zooming from ${from} to ${to}`,
        );
        assert(
          near(zoomed.zoom, to, 1e-12),
          "and the zoom should actually change",
        );
        anchoredCases += 1;

        // Meanwhile, assigning the zoom does move it - unless the anchor is where the camera is,
        // or the zoom did not change. Without this the row above could pass vacuously.
        const naive = { ...cam, zoom: to };
        const movedBy = Math.hypot(
          worldToScreen2d(naive, W, H, anchor).x - before.x,
          worldToScreen2d(naive, W, H, anchor).y - before.y,
        );
        const atCamera = same(anchor, cam.position, 1e-12);
        if (!atCamera && Math.abs(from - to) > 1e-9) {
          assert(
            movedBy > 1,
            `assigning the zoom should move the anchor from ${from} to ${to}, moved ${movedBy}`,
          );
          naiveMoved += 1;
        } else {
          assert(movedBy < 1e-9, "with nothing to change, both versions agree");
        }
      }
    }
  }
  assert(anchoredCases > 30, "the anchor sweep should be substantial");
  assert(
    naiveMoved > 15,
    `the naive version should visibly slide in plenty of cases, did in ${naiveMoved}`,
  );
  // Zooming about a point and back again returns the camera exactly where it started.
  const there = zoomAbout2d(camera2d({ x: 8, y: 3 }, 1), { x: 11, y: 4 }, 2.5);
  const andBack = zoomAbout2d(there, { x: 11, y: 4 }, 1);
  assert(
    same(andBack.position, { x: 8, y: 3 }, 1e-9) &&
      near(andBack.zoom, 1, 1e-12),
    "zooming about a point and back should restore the camera",
  );
  // Zoom cannot be driven to zero or negative, which would flatten or mirror the world.
  assert(
    zoomAbout2d(camera2d({ x: 0, y: 0 }, 1), { x: 1, y: 1 }, 0).zoom > 0,
    "zoom should be clamped above zero",
  );
  assert(
    withZoom(camera2d({ x: 0, y: 0 }, 1), -5).zoom > 0,
    "and a negative zoom should be refused rather than mirroring everything",
  );

  // ---- Parallax ------------------------------------------------------------------------

  for (const pos of [
    { x: 0, y: 0 },
    { x: 10, y: -4 },
  ]) {
    const cam = camera2d(pos, 1.5, toRadians(15));
    // A factor of 1 is the layer the action is on: unchanged.
    assert(
      same(parallax2d(cam, 1).position, cam.position, 1e-12),
      "a parallax factor of 1 should change nothing",
    );
    // A factor of 0 is a sky: it never moves, whatever the camera does.
    assert(
      same(parallax2d(cam, 0).position, { x: 0, y: 0 }, 1e-12),
      "a parallax factor of 0 should never move",
    );
    // In between, it lags proportionally.
    for (const f of [0.25, 0.6]) {
      assert(
        same(
          parallax2d(cam, f).position,
          { x: pos.x * f, y: pos.y * f },
          1e-12,
        ),
        `a factor of ${f} should move that fraction of the way`,
      );
      /* Zoom and rotation must be untouched, or distant layers would change size as you pan.
         Strict equality rather than a tolerance: these are copied, not recomputed, so anything
         other than identical means the function is doing something it should not. */
      assert(
        parallax2d(cam, f).zoom === cam.zoom &&
          parallax2d(cam, f).rotation === cam.rotation,
        "parallax should only scale the translation",
      );
    }
  }
  // A far layer must move less on screen than a near one, which is the whole visual effect.
  const still = camera2d({ x: 0, y: 0 }, 1);
  const panned = camera2d({ x: 10, y: 0 }, 1);
  const mark = { x: 4, y: 2 };
  const nearShift = Math.abs(
    worldToScreen2d(parallax2d(panned, 1), W, H, mark).x -
      worldToScreen2d(parallax2d(still, 1), W, H, mark).x,
  );
  const farShift = Math.abs(
    worldToScreen2d(parallax2d(panned, 0.25), W, H, mark).x -
      worldToScreen2d(parallax2d(still, 0.25), W, H, mark).x,
  );
  assert(
    farShift < nearShift && farShift > 0,
    `a far layer should shift less than a near one, saw ${farShift} against ${nearShift}`,
  );
  assert(
    near(nearShift / farShift, 4, 1e-9),
    "and a factor of 0.25 should shift exactly a quarter as far",
  );

  // ---- The scene's own claims ----------------------------------------------------------

  // With the anchor option on, the flag keeps its pixel across the whole zoom range.
  for (let i = 0; i <= 20; i += 1) {
    const z =
      CAMERA_RANGE.zoom.min +
      (i / 20) * (CAMERA_RANGE.zoom.max - CAMERA_RANGE.zoom.min);
    const held = flagOnScreen(
      { cameraX: 0, cameraY: 1, zoom: z, anchorZoom: true },
      W,
      H,
    );
    const first = flagOnScreen(
      { cameraX: 0, cameraY: 1, zoom: CAMERA_RANGE.zoom.min, anchorZoom: true },
      W,
      H,
    );
    assert(
      same(held, first, 1e-9),
      `the flag should keep its pixel at zoom ${z.toFixed(2)}`,
    );
  }
  // And with it off, it does not - or the checkbox would be showing nothing.
  const slid = flagOnScreen(
    { cameraX: 0, cameraY: 1, zoom: CAMERA_RANGE.zoom.max, anchorZoom: false },
    W,
    H,
  );
  const slidStart = flagOnScreen(
    { cameraX: 0, cameraY: 1, zoom: CAMERA_RANGE.zoom.min, anchorZoom: false },
    W,
    H,
  );
  assert(
    Math.hypot(slid.x - slidStart.x, slid.y - slidStart.y) > 50,
    "without the anchor the flag should visibly slide across the zoom range",
  );
  // The ridge lines are deterministic, since their output is committed with the page.
  assert(
    ridge(0.25, 1.6).every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
    "the ridge should be finite everywhere",
  );
  assert(
    ridge(0.25, 1.6)[10].y === ridge(0.25, 1.6)[10].y,
    "and identical between calls",
  );
  // Every pixel of the scene's canvas has to resolve to a world point at every slider setting.
  for (const z of [CAMERA_RANGE.zoom.min, 1, CAMERA_RANGE.zoom.max]) {
    for (const [cx, cy] of [
      [CAMERA_RANGE.cameraX.min, CAMERA_RANGE.cameraY.min],
      [0, 0],
      [CAMERA_RANGE.cameraX.max, CAMERA_RANGE.cameraY.max],
    ] as const) {
      for (const anchored of [true, false]) {
        const p = { cameraX: cx, cameraY: cy, zoom: z, anchorZoom: anchored };
        for (const pixel of [
          { x: 0, y: 0 },
          { x: W, y: 0 },
          { x: W, y: H },
          { x: 0, y: H },
          { x: W / 2, y: H / 2 },
        ]) {
          assert(
            worldUnderPixel(p, W, H, pixel) !== null,
            `pixel ${pixel.x},${pixel.y} should resolve at zoom ${z}`,
          );
        }
        assert(visible(p, W, H) !== null, "the visible rectangle should exist");
      }
    }
  }
};

/**
 * Delta time: the update that depends on the frame rate, and the one that does not.
 *
 * One assertion carries this Section, and it is the definition of the property rather than a symptom of
 * it: **decaying over one second gives the same answer however many steps it is cut into.** Swept from
 * 1 step to 1000, which spans every frame rate anyone will ever run and then some. Its companion is the
 * one that must *fail* the same test - a per-frame lerp has to be shown genuinely frame-rate dependent,
 * or the Section is arguing against nothing.
 *
 * The reason this needs a build-time check rather than a picture is that the wrong version looks
 * perfect. On the machine it was written on it is smooth, responsive and correct; the bug is only
 * visible on hardware the author does not have.
 */
export const timeCheck2d: Demo = () => {
  // ---- Movement: the easy case ---------------------------------------------------------

  // Velocity in units per second, times seconds, is units. Any frame rate, same distance covered.
  for (const velocity of [1, 7.5, -3]) {
    for (const fps of [24, 30, 60, 144, 240]) {
      let p = 0;
      const dt = secondsPerFrame(fps);
      for (let i = 0; i < fps; i += 1) p = step(p, velocity, dt);
      assert(
        near(p, velocity, 1e-9),
        `a second at ${velocity} per second should cover ${velocity}, covered ${p} at ${fps} fps`,
      );
    }
  }
  // Without the dt, the distance is the frame count - which is the bug, and it scales with hardware.
  const noDt30 = (() => {
    let p = 0;
    for (let i = 0; i < 30; i += 1) p = stepWithoutDt(p, 1);
    return p;
  })();
  const noDt144 = (() => {
    let p = 0;
    for (let i = 0; i < 144; i += 1) p = stepWithoutDt(p, 1);
    return p;
  })();
  assert(
    noDt30 === 30 && noDt144 === 144,
    "without dt, distance is the frame count",
  );
  assert(
    near(noDt144 / noDt30, 4.8, 1e-12),
    "so a 144 Hz screen moves 4.8 times as far per second as a 30 Hz one",
  );

  // ---- The per-frame lerp is frame-rate dependent, and by a lot -------------------------

  for (const factor of [0.05, 0.1, 0.2, 0.35]) {
    const slow = lerpAfterOneSecond(factor, 30);
    const fast = lerpAfterOneSecond(factor, 144);
    // The closed form and the loop must agree, or one of them is lying about what the loop does.
    assert(
      near(slow, remainingAfterFrames(factor, 30), 1e-12),
      "the closed form should match the loop at 30 fps",
    );
    assert(
      near(fast, remainingAfterFrames(factor, 144), 1e-12),
      "and at 144 fps",
    );
    // The faster screen converges much closer in the same wall-clock second.
    assert(
      fast < slow,
      `a higher frame rate should converge further, ${fast} against ${slow}`,
    );
    assert(
      slow / fast > 100,
      `and by a wide margin at factor ${factor}, ratio was ${slow / fast}`,
    );
  }
  // The headline pair, pinned exactly: 0.9^30 against 0.9^144.
  assert(
    near(lerpAfterOneSecond(0.1, 30), Math.pow(0.9, 30), 1e-15),
    "one second of 0.1 at 30 fps is 0.9 to the thirtieth",
  );
  assert(
    lerpAfterOneSecond(0.1, 30) / lerpAfterOneSecond(0.1, 144) > 100000,
    "the 144 Hz screen should end up more than a hundred thousand times closer",
  );

  // ---- Decay is frame-rate independent, which is the whole Section ----------------------

  let worstSpread = 0;
  for (const halfLife of [0.05, 0.12, 0.3, 1]) {
    const rate = rateFromHalfLife(halfLife);
    const reference = remainingAfterSeconds(rate, 1);
    for (const steps of [1, 2, 5, 24, 30, 60, 90, 144, 240, 500, 1000]) {
      // Cut one second into `steps` pieces. The answer must not care how many.
      let remaining = 1;
      for (let i = 0; i < steps; i += 1) {
        remaining = decay(remaining, 0, rate, 1 / steps);
      }
      worstSpread = Math.max(worstSpread, Math.abs(remaining - reference));
      assert(
        near(decayAfterOneSecond(rate, steps), reference, 1e-9),
        `a second of decay in ${steps} steps disagreed with the closed form`,
      );
    }
  }
  assert(
    worstSpread < 1e-12,
    `decay varied with the step count by ${worstSpread}, which it must not`,
  );

  // Uneven steps too, since real frames are never uniform. Ten random-looking but fixed spans.
  const spans = [
    0.004, 0.021, 0.007, 0.033, 0.011, 0.002, 0.018, 0.05, 0.009, 0.045,
  ];
  const total = spans.reduce((a, b) => a + b, 0);
  for (const halfLife of [0.08, 0.25]) {
    const rate = rateFromHalfLife(halfLife);
    let stepped = 1;
    for (const dt of spans) stepped = decay(stepped, 0, rate, dt);
    assert(
      near(stepped, remainingAfterSeconds(rate, total), 1e-12),
      "ten uneven steps should equal one step of their total",
    );
  }
  // The property that makes it work, stated directly: the exponential composes with itself.
  for (const rate of [1, 4.6, 20]) {
    for (const [a, b] of [
      [0.01, 0.02],
      [0.1, 0.4],
      [0.3, 0.7],
    ] as const) {
      assert(
        near(
          decay(decay(1, 0, rate, a), 0, rate, b),
          decay(1, 0, rate, a + b),
          1e-12,
        ),
        `decaying ${a} then ${b} should equal decaying ${a + b}`,
      );
    }
  }

  // ---- Half-life is exact, which is why it is the parameter to expose -------------------

  for (const halfLife of [0.03, 0.15, 0.5, 2]) {
    assert(
      near(smooth(0, 1, halfLife, halfLife), 0.5, 1e-12),
      `one half-life should close exactly half the gap, failed at ${halfLife}`,
    );
    assert(
      near(smooth(0, 1, halfLife, halfLife * 2), 0.75, 1e-12),
      "two half-lives should leave a quarter",
    );
    // And the two parameterisations must be the same curve, not merely similar.
    const rate = rateFromHalfLife(halfLife);
    assert(
      near(halfLifeFromRate(rate), halfLife, 1e-12),
      "the half-life round trip should be exact",
    );
    for (const dt of [0.001, 0.016, 0.033, 0.25]) {
      assert(
        near(smooth(0, 1, halfLife, dt), decay(0, 1, rate, dt), 1e-12),
        `the half-life and rate forms disagreed at dt ${dt}`,
      );
    }
  }
  // Decay approaches the target and never overshoots it, at any step size.
  for (const dt of [0.001, 0.016, 0.1, 1, 10]) {
    const next = decay(0, 1, rateFromHalfLife(0.1), dt);
    assert(
      next >= 0 && next <= 1,
      `decay overshot with a step of ${dt}, giving ${next}`,
    );
  }
  // Which a per-frame lerp also manages, so long as the factor stays under 1. Worth knowing the limit.
  assert(
    lerpPerFrame(0, 1, 1.5) > 1,
    "a lerp factor above 1 overshoots, which is why the range is capped",
  );

  // ---- Porting a tuned factor ------------------------------------------------------------

  for (const fps of [30, 60, 144]) {
    for (const factor of [0.05, 0.15, 0.3]) {
      const rate = rateFromLerpFactor(factor, fps);
      // Exact at the rate it was tuned at: one frame of each must land in the same place.
      assert(
        near(
          decay(0, 1, rate, secondsPerFrame(fps)),
          lerpPerFrame(0, 1, factor),
          1e-12,
        ),
        `the converted rate should match the lerp exactly at ${fps} fps, factor ${factor}`,
      );
      // And a whole second must match too, which follows but is worth pinning.
      assert(
        near(
          decayAfterOneSecond(rate, fps),
          lerpAfterOneSecond(factor, fps),
          1e-9,
        ),
        "and over a full second at that rate",
      );
      // But now it behaves the same at other rates, which the lerp did not.
      assert(
        near(
          decayAfterOneSecond(rate, 17),
          decayAfterOneSecond(rate, 313),
          1e-12,
        ),
        "and it is frame-rate independent afterwards",
      );
    }
  }

  // ---- The clamp -------------------------------------------------------------------------

  assert(clampDt(0.016) === 0.016, "an ordinary frame passes through");
  assert(clampDt(3) === 0.1, "a three second hitch is clamped");
  assert(
    clampDt(-1) === 0,
    "and a negative frame time cannot happen, so it is floored",
  );
  assert(clampDt(3, 0.25) === 0.25, "the maximum is adjustable");

  // ---- The scene's own claims -------------------------------------------------------------

  /* The right measure for a follower is **how long it takes to arrive**, not whether two traces agree
     instant by instant. With a step target they cannot agree instant by instant, and it took measuring
     to see why: both followers observe the step at the same moment, but then integrate the new target
     over frames of different lengths - 33 ms against 7 ms - so the slow one has closed more of the gap
     by the time its frame ends. That transient is bounded by one frame of catch-up, shrinks at every
     boundary afterwards, and is asserted as such below rather than wished away.

     Convergence time separates the two update rules exactly. */

  /* The per-frame lerp takes the same number of FRAMES whatever the rate, so its wall-clock time scales
     with the frame rate: 144/30 = 4.8 times faster on the faster screen, across the whole range. */
  let ratiosSeen = 0;
  let slowNeverArrived = 0;
  for (let i = 0; i <= 10; i += 1) {
    const factor =
      FOLLOW_RANGE.factor.min +
      (i / 10) * (FOLLOW_RANGE.factor.max - FOLLOW_RANGE.factor.min);
    const p = { factor, halfLife: 0.12, useDecay: false };
    const slow = timeToClose(p, 30, 0.8);
    const fast = timeToClose(p, 144, 0.8);
    assert(
      fast !== null,
      `the fast follower should arrive at factor ${factor.toFixed(3)}`,
    );
    if (slow === null) {
      // Slower than the run is long: the same problem, in its most extreme form.
      slowNeverArrived += 1;
      continue;
    }
    assert(
      near(slow / fast!, 144 / 30, 0.02),
      `the lerp should be 4.8x slower at 30 fps, was ${(slow / fast!).toFixed(3)} at factor ${factor.toFixed(3)}`,
    );
    ratiosSeen += 1;
  }
  assert(
    ratiosSeen > 7,
    `the ratio should hold across most of the range, held at ${ratiosSeen} settings`,
  );
  assert(
    slowNeverArrived > 0,
    "and at the heaviest smoothing the slow screen should not arrive at all within the run",
  );

  /* Decay takes the same wall-clock time at either rate. What is left is frame quantisation: 30 fps can
     only report an arrival in thirtieths of a second, which accounts for the whole of the spread. */
  for (let i = 0; i <= 10; i += 1) {
    const halfLife =
      FOLLOW_RANGE.halfLife.min +
      (i / 10) * (FOLLOW_RANGE.halfLife.max - FOLLOW_RANGE.halfLife.min);
    const p = { factor: 0.1, halfLife, useDecay: true };
    const slow = timeToClose(p, 30, 0.8);
    const fast = timeToClose(p, 144, 0.8);
    assert(
      slow !== null && fast !== null,
      `both followers should arrive at half-life ${halfLife.toFixed(3)}`,
    );
    assert(
      Math.abs(slow! - fast!) <= 1 / 30 + 1e-9,
      `they should arrive within one slow frame of each other, differed by ${Math.abs(slow! - fast!)}`,
    );

    // The transient is bounded by one frame of catch-up at the slower rate.
    assert(
      transientGap(p) <= oneFrameOfDecay(p, 30) + 1e-9,
      `the transient ${transientGap(p)} exceeded one frame of decay ${oneFrameOfDecay(p, 30)}`,
    );
    /* And it decays away at the follower's **own** half-life. Once both are chasing a target that has
       stopped changing, the difference between them is itself just a gap being closed by the same
       exponential - so each successive shared boundary shrinks it by exactly one shared period's worth
       of decay. An identity rather than a threshold, which is what took five attempts to see: every
       version of this assertion written as "the gap is small" needed a constant that depended on the
       half-life, because how far the transient gets inside a fixed run obviously does. */
    const perBoundary = Math.pow(2, -SHARED_PERIOD / halfLife);
    const gaps = sharedPairs(p)
      .slice(1)
      .map((q) => Math.abs(q.slow - q.fast));
    gaps.forEach((gap, k) => {
      if (k === 0) return;
      assert(
        near(gap, gaps[k - 1] * perBoundary, 1e-9),
        `the gap should shrink by exactly ${perBoundary.toFixed(4)} per boundary, went ${gaps[k - 1]} to ${gap} at half-life ${halfLife.toFixed(3)}`,
      );
    });
  }

  /* Below one frame time the drawn curve goes coarse, and it is worth pinning why: the 30 fps follower
     closes most of the gap in a single step, so it cannot draw a curve finer than its own frame time.
     That is sampling, not frame-rate dependence - its arrival time is still right - and it is why the
     scene's half-life floor sits above two frames at 30 fps. */
  const subFrame = worstSampledGap({
    factor: 0.1,
    halfLife: 0.02,
    useDecay: true,
  });
  assert(
    subFrame > 0.3,
    `a half-life under one frame should look coarse at 30 fps, gap was ${subFrame}`,
  );
  assert(
    Math.abs(
      timeToClose({ factor: 0.1, halfLife: 0.02, useDecay: true }, 30, 0.8)! -
        timeToClose({ factor: 0.1, halfLife: 0.02, useDecay: true }, 144, 0.8)!,
    ) <=
      1 / 30 + 1e-9,
    "while its arrival time is still within one slow frame of the fast one",
  );
  // The target really is a step, and the traces really do start at zero and end near one.
  assert(
    targetAt(0) === 0 && targetAt(STEP_AT) === 1,
    "the target should step at STEP_AT",
  );
  for (const useDecay of [true, false]) {
    for (const fps of [30, 144]) {
      const trace = traceFor({ factor: 0.2, halfLife: 0.12, useDecay }, fps);
      assert(trace[0].value === 0, "a follower starts at rest");
      assert(
        trace[trace.length - 1].value > 0.9,
        `and should have caught up by the end at ${fps} fps`,
      );
      assert(
        trace.every((q) => Number.isFinite(q.value)),
        "with no NaN anywhere along the way",
      );
    }
  }
};

/**
 * Easing: the endpoints every curve must hit, the ones that leave the range, and by exactly how much.
 *
 * Every number this Section quotes is pinned here, because they are all properties of a **shape** and a
 * shape is the one thing a build with no GPU cannot look at. Three of them contradicted what I first
 * wrote down. The overshoot constant $1.70158$ turns out to be chosen to make the peak $1.100004$
 * rather than being folklore; `easeOutElastic`'s endpoint case is load-bearing, because the formula
 * alone lands $1.000488$ past the target and stays there; and "zero slope at the ends" does **not**
 * separate `smoothstep` from `easeInOutQuad`, since both have it. Curvature separates them, so
 * curvature is what is measured.
 */
export const easeCheck2d: Demo = () => {
  // ---- lerp, inverseLerp, remap, clamp -------------------------------------------------

  assert(lerp(10, 50, 0.25) === 20, "a quarter of the way from 10 to 50 is 20");
  assert(
    lerp(10, 50, 0) === 10 && lerp(10, 50, 1) === 50,
    "and the ends are the ends",
  );
  assert(
    inverseLerp(10, 50, 20) === 0.25,
    "and asked backwards, 20 is a quarter along",
  );

  // The round trip, over a grid rather than at one convenient point.
  for (const [a, b] of [
    [0, 1],
    [10, 50],
    [-8, 3],
    [100, -100],
    [0.25, 0.75],
  ] as const) {
    for (let i = 0; i <= 40; i += 1) {
      const value = lerp(a, b, i / 40 - 0.25);
      assert(
        near(lerp(a, b, inverseLerp(a, b, value)), value, 1e-9),
        `lerp and inverseLerp should undo each other on [${a}, ${b}], failed at ${value}`,
      );
    }
    // And `remap` really is the two composed, not a second implementation of the same idea.
    for (const [c, d] of [
      [0, 1],
      [-180, 180],
      [7, 7.5],
    ] as const) {
      for (let i = 0; i <= 20; i += 1) {
        const value = lerp(a, b, i / 20);
        assert(
          near(
            remap(value, a, b, c, d),
            lerp(c, d, inverseLerp(a, b, value)),
            1e-9,
          ),
          "remap should be lerp of inverseLerp",
        );
      }
    }
  }
  /* Exact equality here, and it is worth saying why the arguments are what they are: a stick at 0.4
     gives 72.00000000000003, because 0.7 is not a binary fraction. The maths is right and the last bit
     is dust, but a values panel is committed to the repository, so the row would publish the dust.
     Halves and quarters are exact, so the demo asks about a half. */
  assert(
    remap(0.5, -1, 1, -180, 180) === 90,
    "a stick at 0.5 maps to 90 degrees per second",
  );
  assert(
    remap(0.4, -1, 1, -180, 180) !== 72 &&
      near(remap(0.4, -1, 1, -180, 180), 72, 1e-12),
    "while 0.4 is correct to within floating-point dust rather than exactly",
  );
  assert(
    remap(75, 0, 100, 0, 240) === 180,
    "75 health fills 180 of 240 pixels",
  );

  /* A zero-width range has no honest answer, so `inverseLerp` returns 0 rather than dividing. Worth an
     assertion because the alternative is an Infinity that propagates into a position and shows up as a
     sprite that has vanished. */
  assert(
    inverseLerp(5, 5, 5) === 0,
    "a zero-width range answers 0 rather than dividing by zero",
  );
  assert(
    Number.isFinite(remap(5, 5, 5, 0, 100)),
    "and remap through one stays finite",
  );

  // Unclamped on purpose, clamped on request. Both matter, and confusing them is the bug.
  assert(lerp(0, 100, 2) === 200, "lerp extrapolates past the end");
  assert(lerp(0, 100, -0.5) === -50, "and before the start");
  assert(lerpClamped(0, 100, 2) === 100, "the clamped one refuses");
  assert(lerpClamped(0, 100, -0.5) === 0, "at both ends");
  assert(
    remapClamped(25, 2, 20, 1, 0) === 0,
    "and a listener past the far edge is silent, not negative",
  );
  assert(
    clamp(1.4, 0, 1) === 1 && clamp(-3, 0, 1) === 0,
    "clamp does what it says",
  );
  assert(clamp01(0.5) === 0.5, "and leaves an in-range value alone");

  // ---- Every easing starts at 0 and ends at 1, exactly ----------------------------------

  for (const entry of ALL) {
    /* `easeOutBack(0)` is 2.22e-16 rather than 0 - three terms of a cubic that cancel, and floating
       point does not cancel them perfectly. A tolerance rather than strict equality, therefore, and
       stating the size of the dust is better than pretending it is not there. */
    assert(
      near(entry.easing(0), 0, 1e-12),
      `${entry.name} should start at 0, started at ${entry.easing(0)}`,
    );
    assert(
      entry.easing(1) === 1,
      `${entry.name} must land exactly on the target, landed on ${entry.easing(1)}`,
    );
    // No NaN anywhere, including at the piecewise boundaries.
    for (let i = 0; i <= 1000; i += 1) {
      assert(
        Number.isFinite(entry.easing(i / 1000)),
        `${entry.name} produced a non-finite value at t = ${i / 1000}`,
      );
    }
    // The caption has to fit the column it is drawn in, which is a fact about the picture.
    assert(
      entry.reads.length <= CAPTION_LIMIT,
      `${entry.name}'s caption is ${entry.reads.length} characters, over the ${CAPTION_LIMIT} the column holds`,
    );
  }

  /* The exact landing is what easing promises and decay cannot, so it is checked as an equality above
     rather than a tolerance - and `easeOutElastic` only manages it because of its endpoint case. Left
     to the formula it lands past the target and stays there, which is the thing that case is for. */
  const elasticFormula = (t: number) =>
    Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  assert(
    near(elasticFormula(1), 1.000488, 1e-6),
    `the bare elastic formula should land 1.000488 past the target, landed ${elasticFormula(1)}`,
  );
  assert(
    easeOutElastic(1) === 1 && elasticFormula(1) !== 1,
    "so the endpoint case is load-bearing rather than tidying",
  );

  // ---- Which curves leave the range, and by how much -------------------------------------

  for (const entry of ALL) {
    const { min, max } = extremes(entry.easing, 200000);
    const leavesRange = max > 1 + 1e-9;
    // The declared flag has to match the measurement, or the page is documenting a wish.
    assert(
      entry.overshoots === leavesRange,
      `${entry.name} declares overshoots=${entry.overshoots} but its maximum is ${max}`,
    );
    assert(min >= -1e-12, `${entry.name} dipped below 0, to ${min}`);
    // Monotone exactly when it does not overshoot, for these eight - bounce being the exception.
    assert(
      isMonotone(entry.easing, 20000) ===
        (max <= 1 + 1e-9 && entry.name !== "easeOutBounce"),
      `${entry.name}'s monotonicity is not what its range implies`,
    );
  }

  // The three figures the Section quotes, to six digits.
  assert(
    near(extremes(easeOutBack, 200000).max, 1.100004, 1e-6),
    "easeOutBack should peak at 1.100004",
  );
  assert(
    near(extremes(easeOutElastic, 200000).max, 1.373098, 1e-6),
    "easeOutElastic should peak at 1.373098",
  );
  assert(
    extremes(easeOutBounce, 400000).max <= 1,
    "and easeOutBounce should never exceed 1 at all",
  );

  /* The 1.70158 is not folklore: it is the value that makes the overshoot 10%. Shown by pricing the
     tidier alternatives, which is the only way to demonstrate that the digits are buying something. */
  const backPeak = (c: number) => {
    let peak = -Infinity;
    for (let i = 0; i <= 200000; i += 1) {
      const t = i / 200000;
      peak = Math.max(
        peak,
        1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2),
      );
    }
    return peak;
  };
  assert(near(backPeak(1.70158), 1.1, 1e-5), "1.70158 buys a 10% overshoot");
  assert(
    Math.abs(backPeak(1.7) - 1.1) > Math.abs(backPeak(1.70158) - 1.1),
    "and rounding it to 1.7 is measurably further off",
  );
  assert(near(backPeak(2), 1.131687, 1e-6), "while 2 overshoots by 13.2%");

  /* Bounce lands four times and each dip is exactly a quarter of the one before, which is where the
     dropped-object reading comes from. Found by looking for local minima rather than by reading the
     piecewise constants back out of the function, so the two can disagree. */
  const dips: number[] = [];
  const landings: number[] = [];
  const N = 400000;
  for (let i = 1; i < N; i += 1) {
    const a = easeOutBounce((i - 1) / N);
    const b = easeOutBounce(i / N);
    const c = easeOutBounce((i + 1) / N);
    if (b < a && b <= c) dips.push(b);
    if (b > a && b >= c) landings.push(i / N);
  }
  assert(
    landings.length === 3,
    `bounce should touch the target three times before the end, touched ${landings.length}`,
  );
  assert(dips.length === 3, `and dip back three times, dipped ${dips.length}`);
  dips.forEach((dip, k) => {
    assert(
      near(1 - dip, Math.pow(0.25, k + 1), 1e-6),
      `dip ${k + 1} should be ${Math.pow(0.25, k + 1)} below the target, was ${1 - dip}`,
    );
  });

  // ---- What "smooth" actually means, which is curvature and not slope --------------------

  const asCurve =
    (f: (a: number, b: number, x: number) => number): Easing =>
    (t) =>
      f(0, 1, t);
  const SMOOTH = asCurve(smoothstep);
  const SMOOTHER = asCurve(smootherstep);

  // Zero end slope is shared, so it separates nothing. Asserted as the negative result it is.
  for (const easing of [easeInOutQuad, easeInOutCubic, SMOOTH, SMOOTHER]) {
    assert(
      Math.abs(slopeAt(easing, 0)) < 1e-3 &&
        Math.abs(slopeAt(easing, 1)) < 1e-3,
      "all four S-curves have zero slope at both ends, which is why slope cannot tell them apart",
    );
  }
  assert(
    near(slopeAt(linear, 0.5, 1e-6), 1, 1e-6),
    "while linear's slope is 1 throughout",
  );

  /* Curvature does separate them. Matched against the closed forms across the interval rather than
     sampled at one point near an end, which was the first attempt and was wrong: smoothstep's second
     derivative is $6 - 12t$, so a reading at $t = 10^{-3}$ is 5.988 and not 6, and asserting 6 with a
     tight tolerance failed on arithmetic that was perfectly correct. Comparing to the closed form
     everywhere is both stronger and honest about the finite difference. */
  const grid = Array.from({ length: 99 }, (_, i) => (i + 1) / 100);
  for (const t of grid) {
    assert(
      near(curvatureAt(SMOOTH, t), 6 - 12 * t, 1e-6),
      `smoothstep's curvature should be 6 - 12t, was ${curvatureAt(SMOOTH, t)} at t = ${t}`,
    );
    assert(
      near(
        curvatureAt(SMOOTHER, t),
        120 * t * t * t - 180 * t * t + 60 * t,
        1e-5,
      ),
      `smootherstep's curvature should be 120t³ - 180t² + 60t, was ${curvatureAt(SMOOTHER, t)} at t = ${t}`,
    );
    // The piecewise quadratic's is a constant on each half, which is the whole difference.
    assert(
      near(curvatureAt(easeInOutQuad, t), t < 0.5 ? 4 : -4, 1e-6) ||
        Math.abs(t - 0.5) < 1e-9,
      `easeInOutQuad's curvature should be ±4, was ${curvatureAt(easeInOutQuad, t)} at t = ${t}`,
    );
  }
  /* So the values at the ends follow from the closed forms rather than from a measurement that cannot
     quite reach them: 6 for smoothstep, 0 for smootherstep. Corroborated by watching the measurement
     collapse tenfold for every tenfold step closer to the end, which a small constant would not do. */
  const smootherCurvature = [1e-2, 1e-3, 1e-4].map((t) =>
    curvatureAt(SMOOTHER, t, t / 10),
  );
  /* Near enough a tenth, not exactly: the leading term is $60t$, but at $t = 10^{-2}$ the $-180t^2$
     term is still worth 3% of the reading, so the first ratio is 0.1028 rather than 0.1. A tolerance
     that pretended otherwise would be asserting the wrong closed form. */
  smootherCurvature.slice(1).forEach((value, k) => {
    assert(
      near(value / smootherCurvature[k], 0.1, 5e-3),
      `smootherstep's end curvature should fall about tenfold each step closer, went ${smootherCurvature[k]} to ${value}`,
    );
  });
  assert(
    smootherCurvature[2] < 1e-2,
    `and be negligible by t = 1e-4, was ${smootherCurvature[2]}`,
  );
  // While smoothstep's does not budge from 6, which is the contrast.
  assert(
    [1e-2, 1e-3, 1e-4].every((t) => curvatureAt(SMOOTH, t, t / 10) > 5.8),
    "smoothstep's end curvature should stay near 6 however close to the end it is measured",
  );

  /* In the middle it is the other way round: the stitched pair flip sign discontinuously and the single
     polynomials pass through zero. This is the kink smoothstep exists to avoid. */
  for (const [name, easing, jump] of [
    ["easeInOutQuad", easeInOutQuad, 4],
    ["easeInOutCubic", easeInOutCubic, 11.76],
  ] as const) {
    assert(
      near(curvatureAt(easing, 0.49), jump, 1e-2) &&
        near(curvatureAt(easing, 0.51), -jump, 1e-2),
      `${name} should flip its curvature from ${jump} to ${-jump} across the middle`,
    );
  }
  for (const [name, easing] of [
    ["smoothstep", SMOOTH],
    ["smootherstep", SMOOTHER],
  ] as const) {
    assert(
      Math.abs(curvatureAt(easing, 0.5)) < 1e-3,
      `${name} should pass through zero curvature in the middle, had ${curvatureAt(easing, 0.5)}`,
    );
  }

  // A gentler start is paid for in the middle. The exchange rate, to six digits.
  for (const [name, easing, peak] of [
    ["linear", linear, 1],
    ["smoothstep", SMOOTH, 1.5],
    ["smootherstep", SMOOTHER, 1.875],
    ["easeInOutQuad", easeInOutQuad, 2],
    ["easeInOutCubic", easeInOutCubic, 3],
  ] as const) {
    assert(
      near(peakSlope(easing), peak, 1e-4),
      `${name}'s peak speed should be ${peak} times the average, measured ${peakSlope(easing)}`,
    );
  }

  // ---- The rest of the figures the Section quotes ---------------------------------------

  // Linear and easeInOutCubic complete the curvature table, so they are pinned like the others.
  for (const t of grid) {
    assert(
      Math.abs(curvatureAt(linear, t)) < 1e-6,
      "a straight line has no curvature anywhere",
    );
  }
  for (const t of [1e-2, 1e-3, 1e-4]) {
    assert(
      near(curvatureAt(easeInOutCubic, t, t / 10), 24 * t, 1e-3),
      `easeInOutCubic's end curvature should be 24t and so go to zero, was ${curvatureAt(easeInOutCubic, t, t / 10)} at t = ${t}`,
    );
  }

  // Where easeOutBack's peak sits, not just how high it is.
  let backPeakAt = 0;
  let backPeakValue = -Infinity;
  for (let i = 0; i <= 200000; i += 1) {
    const t = i / 200000;
    if (easeOutBack(t) > backPeakValue) {
      backPeakValue = easeOutBack(t);
      backPeakAt = t;
    }
  }
  assert(
    near(backPeakAt, 0.58, 5e-4),
    `easeOutBack should peak at t = 0.580, peaked at ${backPeakAt}`,
  );

  /* Elastic crosses the target seven times before landing. Counted with `>= 0` on the second side,
     because the samples can land exactly on a zero of the sine - a first attempt using strict
     inequalities reported zero crossings for a curve that plainly reaches 1.37, which is the sort of
     result worth chasing rather than accepting. */
  let crossings = 0;
  let previous = easeOutElastic(0) - 1;
  const steps = 400000;
  for (let i = 1; i < steps; i += 1) {
    const value = easeOutElastic(i / steps) - 1;
    if ((previous < 0 && value >= 0) || (previous > 0 && value <= 0))
      crossings += 1;
    previous = value;
  }
  assert(
    crossings === 7,
    `easeOutElastic should cross the target seven times before the end, crossed ${crossings}`,
  );

  // The quarters the gallery's prose reads off. Percentages of the distance, per quarter of the time.
  for (const [name, easing, first, last] of [
    ["linear", linear, 0.25, 0.25],
    ["easeInQuad", easeInQuad, 0.0625, 0.4375],
    ["easeOutQuad", easeOutQuad, 0.4375, 0.0625],
  ] as const) {
    assert(
      near(easing(0.25), first, 1e-12),
      `${name} should cover ${first} of the distance in the first quarter of the time, covered ${easing(0.25)}`,
    );
    assert(
      near(1 - easing(0.75), last, 1e-12),
      `${name} should cover ${last} in the last quarter, covered ${1 - easing(0.75)}`,
    );
  }

  // And the two damping figures the comparison table leans on.
  assert(
    near(1 - Math.pow(2, -1.5 / 0.15), 0.99902344, 1e-8),
    "decay should have covered 99.902344% of the gap after ten half-lives",
  );

  // ---- reverse() is an identity, so an in and an out cannot drift apart -----------------

  for (const [inward, outward] of [
    [easeInQuad, easeOutQuad],
    [easeInCubic, easeOutCubic],
  ] as const) {
    for (let i = 0; i <= 2000; i += 1) {
      const t = i / 2000;
      assert(
        near(reverse(inward)(t), outward(t), 1e-15),
        `reverse of the in should equal the out, differed at t = ${t}`,
      );
    }
  }
  // And reversing twice gets back to where it started, for every curve here.
  for (const entry of ALL) {
    for (let i = 0; i <= 500; i += 1) {
      const t = i / 500;
      assert(
        near(reverse(reverse(entry.easing))(t), entry.easing(t), 1e-12),
        `reversing ${entry.name} twice should be the identity`,
      );
    }
  }

  // ---- tween: frame-rate independent, and it lands exactly on time ----------------------

  /* A different reason from Section 4.1's decay, and worth keeping the two apart. Decay is independent
     because the exponential composes with itself; a tween is independent because the fraction is
     `elapsed / duration` with both in seconds, so the frame rate never enters the arithmetic at all. */
  for (const entry of ALL) {
    const reference: number[] = [];
    for (const fps of [24, 30, 60, 144, 1000]) {
      const frames = Math.round(0.75 * fps);
      let last = 0;
      for (let i = 1; i <= frames; i += 1) {
        last = tween(0, 100, i / fps, 0.75, entry.easing);
      }
      assert(
        last === 100,
        `${entry.name} should land exactly on 100 at 0.75 s, landed ${last} at ${fps} fps`,
      );
      reference.push(tween(0, 100, 0.3, 0.75, entry.easing));
    }
    assert(
      reference.every((value) => value === reference[0]),
      `${entry.name} at a fixed elapsed time should not depend on the frame rate`,
    );
  }
  // Clamped past the end, so a late frame cannot carry it further.
  assert(
    tween(0, 100, 2, 0.75, easeOutQuad) === 100,
    "a tween stops at its duration",
  );
  assert(
    tween(0, 100, -1, 0.75, easeOutQuad) === 0,
    "and does not start early",
  );
  assert(
    tween(7, 9, 0.5, 0, linear) === 9,
    "a zero duration arrives immediately",
  );

  /* And the contrast the Section is built on, priced: with a 0.15 s half-life, decay has covered
     96.875% after 0.75 s and never reaches the target at all. Easing is the tool when the arrival has
     to happen at a stated time. */
  assert(
    near(1 - Math.pow(2, -0.75 / 0.15), 0.96875, 1e-12),
    "decay should have covered 96.875% of the gap after five half-lives",
  );
  for (const seconds of [0.75, 1.5, 3, 5]) {
    assert(
      1 - Math.pow(2, -seconds / 0.15) < 1,
      `decay should still not have arrived after ${seconds} s`,
    );
  }
  /* "Decay never arrives" is true of the mathematics and **false of a double**, which is worth being
     exact about rather than repeating as a slogan. The remaining gap stops being representable after
     54 half-lives - 8.1 s at 0.15 s - and from then on the value is the target. Long after anything a
     game would wait for, which is why the practical statement is "not at a time you can name". */
  let halfLivesToVanish = 0;
  while (1 - Math.pow(2, -halfLivesToVanish) !== 1) halfLivesToVanish += 1;
  assert(
    halfLivesToVanish === 54,
    `the gap should become unrepresentable at 54 half-lives, it was ${halfLivesToVanish}`,
  );
  assert(
    near(halfLivesToVanish * 0.15, 8.1, 1e-9),
    "which is 8.1 seconds at the half-life used above",
  );

  // ---- The gallery's own layout, which is arithmetic and so can be checked --------------

  assert(
    drawnRight() <= LAYOUT.width,
    `the gallery draws out to ${drawnRight()} on a canvas ${LAYOUT.width} wide`,
  );
  assert(
    trackX(0) > LAYOUT.curve.left + LAYOUT.curve.width,
    "and the track has to start clear of the curve plots",
  );
  assert(
    rowCentre(GALLERY.length - 1) + LAYOUT.rowHeight / 2 < LAYOUT.height,
    "the last row has to fit above the bottom edge",
  );
  assert(
    trackX(1) < LAYOUT.width && trackX(1) > trackX(0),
    "the target mark has to be on the canvas and to the right of the start",
  );
  // The ghosts mark equal steps in **time**, which is the claim their spacing rests on.
  const times = ghostTimes();
  assert(
    times.length === GHOSTS,
    `there should be ${GHOSTS} ghosts, there were ${times.length}`,
  );
  assert(
    times[0] === 0 && times[times.length - 1] === 1,
    "spanning the whole interval",
  );
  times.slice(1).forEach((t, k) => {
    assert(
      near(t - times[k], 1 / (GHOSTS - 1), 1e-12),
      "and equally spaced in time, since their spacing on the track is meant to be the speed",
    );
  });
  /* Which is only informative if the spacing actually differs between curves. Linear's ghosts are
     evenly spaced and easeOutQuad's are not, and if that ever stopped being true the picture would be
     six identical rows. */
  const spacings = (easing: Easing) =>
    times.slice(1).map((t, k) => trackX(easing(t)) - trackX(easing(times[k])));
  const spread = (values: number[]) =>
    Math.max(...values) - Math.min(...values);
  assert(
    spread(spacings(linear)) < 1e-9,
    "linear's ghosts should be evenly spaced",
  );
  assert(
    spread(spacings(easeOutQuad)) > 20,
    `easeOutQuad's should be visibly uneven, spread was ${spread(spacings(easeOutQuad))} px`,
  );
};

/**
 * Bezier curves: the two ways of evaluating one must agree, and `t` must be shown not to be distance.
 *
 * The load-bearing assertion is that de Casteljau's repeated lerping and the Bernstein polynomials
 * produce the same point everywhere. They are genuinely different arithmetic - one is a loop of lerps,
 * the other a weighted sum of four terms - so agreement to $10^{-15}$ across ten thousand samples means
 * both are right rather than that one was copied from the other.
 *
 * The second job is honesty about the presets. The first draft used three symmetric curves, and every
 * one of them put $t = 0.5$ at exactly $50\%$ of the arc length, which would have made the Section's
 * central claim look like a rounding error. So the check now asserts both halves: that a symmetric
 * curve **does** land on 50%, and that the asymmetric one is nowhere near it.
 */
export const curveCheck2d: Demo = () => {
  const samePoint = (a: Point, b: Point, tol = 1e-9) =>
    Math.hypot(a.x - b.x, a.y - b.y) < tol;

  const QUADRATIC = PRESETS[2].points;
  const SYMMETRIC = PRESETS[0].points;
  const LOPSIDED = PRESETS[1].points;
  const DEGENERATE = PRESETS[3].points;

  /* Two extra curves with **no zero and no repeated coordinate anywhere**, used for the agreement
     sweep below. The presets are chosen to be readable, which makes them symmetric or centred, and a
     sabotage that deleted the 2 from the quadratic's middle weight passed every assertion here -
     because the readable quadratic's handle sits at $x = 0$, so its weight could be anything at all.
     Awkward numbers are what make a weight error visible. */
  const AWKWARD_QUADRATIC: Point[] = [
    { x: -4.3, y: -1.7 },
    { x: 1.9, y: 2.3 },
    { x: 5.1, y: -2.9 },
  ];
  const AWKWARD_CUBIC: Point[] = [
    { x: -4.7, y: 2.1 },
    { x: -1.3, y: -2.7 },
    { x: 2.9, y: 3.1 },
    { x: 5.3, y: -1.1 },
  ];

  // ---- The two evaluations must agree -----------------------------------------------------

  let worstQuadratic = 0;
  let worstCubic = 0;
  for (let i = 0; i <= 10000; i += 1) {
    const t = i / 10000;
    worstQuadratic = Math.max(
      worstQuadratic,
      Math.hypot(
        quadraticAt(QUADRATIC[0], QUADRATIC[1], QUADRATIC[2], t).x -
          pointAt(QUADRATIC, t).x,
        quadraticAt(QUADRATIC[0], QUADRATIC[1], QUADRATIC[2], t).y -
          pointAt(QUADRATIC, t).y,
      ),
    );
    const bernstein = cubicAt(
      SYMMETRIC[0],
      SYMMETRIC[1],
      SYMMETRIC[2],
      SYMMETRIC[3],
      t,
    );
    worstCubic = Math.max(
      worstCubic,
      Math.hypot(
        bernstein.x - pointAt(SYMMETRIC, t).x,
        bernstein.y - pointAt(SYMMETRIC, t).y,
      ),
    );
  }
  assert(
    worstQuadratic < 1e-13,
    `de Casteljau and the quadratic polynomial disagreed by ${worstQuadratic}`,
  );
  assert(
    worstCubic < 1e-13,
    `de Casteljau and the cubic polynomial disagreed by ${worstCubic}`,
  );

  // The same sweep on the awkward pair, where every weight has a nonzero coordinate to get wrong.
  let worstAwkward = 0;
  for (let i = 0; i <= 10000; i += 1) {
    const t = i / 10000;
    const q = quadraticAt(
      AWKWARD_QUADRATIC[0],
      AWKWARD_QUADRATIC[1],
      AWKWARD_QUADRATIC[2],
      t,
    );
    const qd = pointAt(AWKWARD_QUADRATIC, t);
    const c = cubicAt(
      AWKWARD_CUBIC[0],
      AWKWARD_CUBIC[1],
      AWKWARD_CUBIC[2],
      AWKWARD_CUBIC[3],
      t,
    );
    const cd = pointAt(AWKWARD_CUBIC, t);
    worstAwkward = Math.max(
      worstAwkward,
      Math.hypot(q.x - qd.x, q.y - qd.y),
      Math.hypot(c.x - cd.x, c.y - cd.y),
    );
  }
  assert(
    worstAwkward < 1e-13,
    `the polynomials and de Casteljau disagreed by ${worstAwkward} on awkward control points`,
  );
  /* And the weights themselves, spelled out at one point rather than left implicit in the loop. At
     t = 0.5 a quadratic is 0.25, 0.5, 0.25 and a cubic is 0.125, 0.375, 0.375, 0.125. */
  assert(
    samePoint(
      pointAt(AWKWARD_QUADRATIC, 0.5),
      {
        x:
          0.25 * AWKWARD_QUADRATIC[0].x +
          0.5 * AWKWARD_QUADRATIC[1].x +
          0.25 * AWKWARD_QUADRATIC[2].x,
        y:
          0.25 * AWKWARD_QUADRATIC[0].y +
          0.5 * AWKWARD_QUADRATIC[1].y +
          0.25 * AWKWARD_QUADRATIC[2].y,
      },
      1e-14,
    ),
    "a quadratic at t = 0.5 is the 1:2:1 blend of its control points",
  );
  assert(
    samePoint(
      pointAt(AWKWARD_CUBIC, 0.5),
      {
        x:
          0.125 * AWKWARD_CUBIC[0].x +
          0.375 * AWKWARD_CUBIC[1].x +
          0.375 * AWKWARD_CUBIC[2].x +
          0.125 * AWKWARD_CUBIC[3].x,
        y:
          0.125 * AWKWARD_CUBIC[0].y +
          0.375 * AWKWARD_CUBIC[1].y +
          0.375 * AWKWARD_CUBIC[2].y +
          0.125 * AWKWARD_CUBIC[3].y,
      },
      1e-14,
    ),
    "and a cubic is the 1:3:3:1 blend",
  );
  // The weights sum to one at every t, which is what keeps the curve inside its control points.
  for (let i = 0; i <= 1000; i += 1) {
    const t = i / 1000;
    const u = 1 - t;
    assert(
      near(u * u + 2 * u * t + t * t, 1, 1e-12),
      `the quadratic weights should sum to 1, summed to ${u * u + 2 * u * t + t * t} at t = ${t}`,
    );
    assert(
      near(u * u * u + 3 * u * u * t + 3 * u * t * t + t * t * t, 1, 1e-12),
      "and the cubic weights too",
    );
  }

  // The endpoints are hit exactly, and only the endpoints are on the curve.
  for (const curve of [QUADRATIC, SYMMETRIC, LOPSIDED]) {
    assert(
      samePoint(pointAt(curve, 0), curve[0], 1e-15),
      "a Bezier starts at its first control point",
    );
    assert(
      samePoint(pointAt(curve, 1), curve[curve.length - 1], 1e-15),
      "and ends at its last",
    );
    // Every point lies inside the bounding box of the control points: the weights sum to one.
    const xs = curve.map((p) => p.x);
    const ys = curve.map((p) => p.y);
    for (let i = 0; i <= 500; i += 1) {
      const p = pointAt(curve, i / 500);
      assert(
        p.x >= Math.min(...xs) - 1e-9 &&
          p.x <= Math.max(...xs) + 1e-9 &&
          p.y >= Math.min(...ys) - 1e-9 &&
          p.y <= Math.max(...ys) + 1e-9,
        `the curve left its control points' bounding box at t = ${i / 500}`,
      );
    }
  }

  /* The middle control point is a handle, not a waypoint. Measured as a closest approach rather than
     asserted, because "the curve does not reach it" is the single most common misreading of a Bezier. */
  let closest = Infinity;
  let closestAt = 0;
  for (let i = 0; i <= 100000; i += 1) {
    const t = i / 100000;
    const gap = Math.hypot(
      pointAt(QUADRATIC, t).x - QUADRATIC[1].x,
      pointAt(QUADRATIC, t).y - QUADRATIC[1].y,
    );
    if (gap < closest) {
      closest = gap;
      closestAt = t;
    }
  }
  assert(
    near(closest, 2.6, 1e-4),
    `the quadratic's closest approach to its handle should be 2.6 units, was ${closest}`,
  );
  assert(
    near(closestAt, 0.5, 1e-4),
    `and should happen at t = 0.5, happened at ${closestAt}`,
  );
  /* And it is closest by exactly the amount the weights predict: at t = 0.5 the blend is 0.25, 0.5,
     0.25, so the point sits halfway between the handle and the midpoint of the chord. */
  const chordMiddle = {
    x: (QUADRATIC[0].x + QUADRATIC[2].x) / 2,
    y: (QUADRATIC[0].y + QUADRATIC[2].y) / 2,
  };
  assert(
    samePoint(
      pointAt(QUADRATIC, 0.5),
      {
        x: (QUADRATIC[1].x + chordMiddle.x) / 2,
        y: (QUADRATIC[1].y + chordMiddle.y) / 2,
      },
      1e-12,
    ),
    "at t = 0.5 a quadratic sits exactly halfway between its handle and the middle of its chord",
  );

  // ---- The tangent, and where it has no answer --------------------------------------------

  /* The derivative, checked against a finite difference of the curve itself rather than against a
     rearrangement of the same formula. n times a Bezier of the differences is a claim worth testing. */
  for (const curve of [
    QUADRATIC,
    SYMMETRIC,
    LOPSIDED,
    AWKWARD_QUADRATIC,
    AWKWARD_CUBIC,
  ]) {
    for (let i = 1; i < 200; i += 1) {
      const t = i / 200;
      const h = 1e-6;
      const numerical = {
        x: (pointAt(curve, t + h).x - pointAt(curve, t - h).x) / (2 * h),
        y: (pointAt(curve, t + h).y - pointAt(curve, t - h).y) / (2 * h),
      };
      assert(
        samePoint(tangentAt(curve, t), numerical, 1e-5),
        `the tangent disagreed with a finite difference at t = ${t}`,
      );
    }
  }
  // The tangent at an end points along the handle, which is what makes handles steerable.
  for (const curve of [QUADRATIC, SYMMETRIC, LOPSIDED]) {
    const startDirection = normalize(tangentAt(curve, 0));
    const towardHandle = normalize({
      x: curve[1].x - curve[0].x,
      y: curve[1].y - curve[0].y,
    });
    assert(
      startDirection !== null &&
        towardHandle !== null &&
        near(dot(startDirection, towardHandle), 1, 1e-9),
      "the tangent at t = 0 should point straight at the first handle",
    );
  }

  /* The degenerate case, which is the reason `facingAt` can return null. A handle dropped on its own
     endpoint gives a zero tangent, and `atan2(0, 0)` answers 0 without complaint - so a sprite would
     snap to facing east for exactly one sample and then jump back. */
  assert(
    samePoint(DEGENERATE[0], DEGENERATE[1], 1e-15),
    "the degenerate preset should have a handle sitting on its endpoint",
  );
  assert(
    length(tangentAt(DEGENERATE, 0)) === 0,
    `its tangent at t = 0 should be exactly zero, was ${length(tangentAt(DEGENERATE, 0))}`,
  );
  assert(facingAt(DEGENERATE, 0) === null, "so there is no facing angle there");
  assert(
    Math.atan2(0, 0) === 0,
    "while atan2 of the zero vector answers 0, with no error and no NaN",
  );
  // Only at t = 0, though: the curve recovers immediately, which is why this is so hard to spot.
  assert(
    facingAt(DEGENERATE, 1e-5) !== null,
    "the facing should be defined again by t = 1e-5",
  );
  assert(
    near(
      toDegrees(facingAt(DEGENERATE, 0.001)!),
      toDegrees(facingAt(DEGENERATE, 0.05)!),
      1.5,
    ),
    "and it is a perfectly ordinary angle either side of the hole",
  );
  // Every other preset has a facing everywhere, so the null is a real case and not the normal one.
  for (const curve of [QUADRATIC, SYMMETRIC, LOPSIDED]) {
    for (let i = 0; i <= 500; i += 1) {
      assert(
        facingAt(curve, i / 500) !== null,
        `a well-formed curve should have a facing everywhere, missing at t = ${i / 500}`,
      );
    }
  }

  // ---- `t` is not distance, which is the Section -------------------------------------------

  /* Both halves asserted, because only the pair is honest. A symmetric curve puts t = 0.5 at exactly
     half the length and so proves nothing; the lopsided one is the demonstration. */
  assert(
    near(fractionAtT(SYMMETRIC, 0.5), 0.5, 1e-6),
    `a symmetric curve should put t = 0.5 at half its length, put it at ${fractionAtT(SYMMETRIC, 0.5)}`,
  );
  assert(
    near(fractionAtT(LOPSIDED, 0.5), 0.3294, 1e-3),
    `the lopsided curve should put t = 0.5 at 32.94% of its length, put it at ${fractionAtT(LOPSIDED, 0.5)}`,
  );
  const lopsidedTable = arcTable(LOPSIDED);
  assert(
    near(tAtFraction(lopsidedTable, 0.5), 0.6829, 1e-3),
    `and half its length should be at t = 0.6829, was ${tAtFraction(lopsidedTable, 0.5)}`,
  );
  assert(
    near(speedSpread(LOPSIDED), 3.409, 1e-2),
    `its fastest point should be 3.409 times its slowest, was ${speedSpread(LOPSIDED)}`,
  );
  // The symmetric curve still varies in speed, so "symmetric" is not "uniform".
  assert(
    near(speedSpread(SYMMETRIC), 1.485, 1e-2),
    `even the symmetric curve's speed varies by 1.485, measured ${speedSpread(SYMMETRIC)}`,
  );
  // The other two rows of the Section's table.
  assert(
    near(fractionAtT(LOPSIDED, 0.25), 0.1649, 1e-3),
    `t = 0.25 should have covered 16.49% of the lopsided curve, covered ${fractionAtT(LOPSIDED, 0.25)}`,
  );
  assert(
    near(fractionAtT(LOPSIDED, 0.75), 0.5812, 1e-3),
    `t = 0.75 should have covered 58.12%, covered ${fractionAtT(LOPSIDED, 0.75)}`,
  );
  // And the two mark ratios quoted beside them.
  assert(
    near(travelReport(LOPSIDED, false).evenness, 3.118, 1e-2),
    `marks stepped by t should span a factor of 3.118, spanned ${travelReport(LOPSIDED, false).evenness}`,
  );
  assert(
    near(travelReport(LOPSIDED, true).evenness, 1.009, 2e-3),
    `and stepped by distance a factor of 1.009, spanned ${travelReport(LOPSIDED, true).evenness}`,
  );

  // Stepping by distance evens the marks out; stepping by t does not. Both measured on both curves.
  for (const [name, curve] of [
    ["symmetric", SYMMETRIC],
    ["lopsided", LOPSIDED],
    ["quadratic", QUADRATIC],
  ] as const) {
    const byT = travelReport(curve, false).evenness;
    const byDistance = travelReport(curve, true).evenness;
    assert(
      byT > 1.25,
      `${name}: marks stepped by t should be visibly uneven, ratio was ${byT}`,
    );
    assert(
      byDistance < 1.02,
      `${name}: marks stepped by distance should be even, ratio was ${byDistance}`,
    );
    assert(
      byDistance < byT,
      `${name}: stepping by distance should be the more even of the two`,
    );
  }

  /* The table's two directions must agree on a round trip. They are not inverses by construction - one
     is a binary search and the other a forward read - so this has teeth. */
  for (const curve of [QUADRATIC, SYMMETRIC, LOPSIDED, DEGENERATE]) {
    const table = arcTable(curve);
    let worst = 0;
    for (let i = 0; i <= 1000; i += 1) {
      const t = i / 1000;
      worst = Math.max(
        worst,
        Math.abs(tAtDistance(table, distanceAtT(table, t)) - t),
      );
    }
    assert(
      worst < 1e-12,
      `the distance round trip should be exact, worst error ${worst}`,
    );
    // Monotone, or a binary search over it would be meaningless.
    for (let i = 1; i < table.distances.length; i += 1) {
      assert(
        table.distances[i] >= table.distances[i - 1],
        "cumulative distance must never decrease",
      );
    }
    assert(
      near(table.total, table.distances[table.distances.length - 1], 1e-15),
      "and the total is the last entry",
    );
    assert(
      tAtDistance(table, -5) === 0,
      "asking for a negative distance clamps to the start",
    );
    assert(
      near(tAtDistance(table, table.total * 2), 1, 1e-12),
      "and past the end clamps to the finish",
    );
  }

  /* Sampled length converges, and 256 samples is enough. Priced rather than assumed: the error against
     a 8192-sample reference is under two thousandths of a pixel at this scale, so the default is not a
     compromise anybody will see. */
  for (const curve of [SYMMETRIC, LOPSIDED]) {
    const reference = curveLength(curve, 8192);
    let previousError = Infinity;
    for (const samples of [16, 32, 64, 128, 256]) {
      const error = Math.abs(curveLength(curve, samples) - reference);
      assert(
        error < previousError,
        `more samples should mean less error, ${samples} was worse than the step before`,
      );
      previousError = error;
    }
    assert(
      Math.abs(curveLength(curve, LENGTH_SAMPLES) - reference) * PATH_UNIT <
        0.01,
      `the default sample count should be accurate to well under a pixel, was off by ${
        Math.abs(curveLength(curve, LENGTH_SAMPLES) - reference) * PATH_UNIT
      }`,
    );
    // A polyline through the curve is always shorter than the curve, never longer.
    assert(
      curveLength(curve, 16) < reference,
      "a coarse polyline underestimates a curve's length, it cannot overestimate it",
    );
  }
  /* The pixel figures the Section tabulates, and the second-order behaviour they show: the error
     quarters with every doubling of the sample count. That is the claim worth pinning, because it is
     the reason 256 is enough rather than a number somebody liked. */
  {
    const reference = curveLength(LOPSIDED, 8192);
    const errorAt = (samples: number) =>
      Math.abs(curveLength(LOPSIDED, samples) - reference) * PATH_UNIT;
    for (const [samples, pixels] of [
      [8, 1.1554],
      [16, 0.2887],
      [64, 0.018],
      [256, 0.0011],
    ] as const) {
      assert(
        near(errorAt(samples), pixels, 5e-4),
        `${samples} samples should be off by ${pixels} px, was off by ${errorAt(samples)}`,
      );
    }
    for (const samples of [16, 32, 64, 128]) {
      assert(
        near(errorAt(samples) / errorAt(samples * 2), 4, 0.1),
        `doubling the samples should quarter the error, went ${errorAt(samples)} to ${errorAt(samples * 2)}`,
      );
    }
  }

  // ---- Splitting and elevating, which must not change the shape ---------------------------

  for (const curve of [
    QUADRATIC,
    SYMMETRIC,
    LOPSIDED,
    AWKWARD_QUADRATIC,
    AWKWARD_CUBIC,
  ]) {
    for (const at of [0.15, 0.5, 0.9]) {
      const { left, right } = splitAt(curve, at);
      assert(
        left.length === curve.length && right.length === curve.length,
        "a split gives two curves of the same degree",
      );
      assert(
        samePoint(left[left.length - 1], right[0], 1e-15),
        "and they meet exactly at the split point",
      );
      for (let i = 0; i <= 2000; i += 1) {
        const t = i / 2000;
        assert(
          samePoint(pointAt(curve, t * at), pointAt(left, t), 1e-12),
          `the left half should retrace the original up to ${at}`,
        );
        assert(
          samePoint(
            pointAt(curve, at + t * (1 - at)),
            pointAt(right, t),
            1e-12,
          ),
          `and the right half should retrace the rest`,
        );
      }
    }
    // Degree elevation adds a control point and changes nothing else.
    const raised = elevate(curve);
    assert(
      raised.length === curve.length + 1,
      "elevating adds exactly one control point",
    );
    assert(
      samePoint(raised[0], curve[0], 1e-15) &&
        samePoint(raised[raised.length - 1], curve[curve.length - 1], 1e-15),
      "and leaves the endpoints where they were",
    );
    for (let i = 0; i <= 5000; i += 1) {
      const t = i / 5000;
      assert(
        samePoint(pointAt(curve, t), pointAt(raised, t), 1e-12),
        `elevating must not move the curve, it moved at t = ${t}`,
      );
    }
  }
  // So every quadratic really is a cubic, and these are the four points it becomes.
  const asCubic = elevate(QUADRATIC);
  assert(asCubic.length === 4, "a quadratic elevates to four control points");
  assert(
    near(asCubic[1].x, -5 / 3, 1e-12) && near(asCubic[2].x, 5 / 3, 1e-12),
    `the raised handles should sit a third of the way along, got ${asCubic[1].x} and ${asCubic[2].x}`,
  );

  // ---- The seam ----------------------------------------------------------------------------

  assert(meetsAt(JOIN_A, JOIN_NAIVE), "the two curves share an endpoint");
  assert(
    !joinsSmoothly(JOIN_A, JOIN_NAIVE),
    "and yet they do not join smoothly, which is the whole point of the example",
  );
  /* Exactly a right angle, by construction: the first curve arrives at -45 degrees and the second
     leaves at +45. Chosen so the figure the page quotes is a number a reader can check by eye against
     the picture rather than one they have to take on trust. */
  assert(
    near(seamAngle(JOIN_A, JOIN_NAIVE), 90, 1e-9),
    `the naive seam should turn 90 degrees, turned ${seamAngle(JOIN_A, JOIN_NAIVE)}`,
  );
  const mended = smoothedNext(JOIN_A, JOIN_NAIVE);
  assert(
    joinsSmoothly(JOIN_A, mended),
    "mirroring the handle should make the seam smooth",
  );
  assert(
    Math.abs(seamAngle(JOIN_A, mended)) < 1e-12,
    `and the seam angle should be zero, was ${seamAngle(JOIN_A, mended)}`,
  );
  // It moves exactly one point, which is what makes it usable in an editor.
  assert(
    samePoint(mended[0], JOIN_NAIVE[0], 1e-15),
    "the shared point does not move",
  );
  assert(
    samePoint(mended[2], JOIN_NAIVE[2], 1e-15) &&
      samePoint(mended[3], JOIN_NAIVE[3], 1e-15),
    "and neither does the rest of the second curve",
  );
  assert(
    !samePoint(mended[1], JOIN_NAIVE[1], 1e-9),
    "only the first handle moved, and it did move",
  );
  // The mirror is the arithmetic it claims to be: P1' = 2S - P(n-1).
  assert(
    samePoint(
      mended[1],
      {
        x: 2 * JOIN_A[3].x - JOIN_A[2].x,
        y: 2 * JOIN_A[3].y - JOIN_A[2].y,
      },
      1e-15,
    ),
    "the mended handle should be the previous one reflected through the shared point",
  );
  /* And mirroring is idempotent: mending an already-smooth seam changes nothing. Worth a row because an
     editor will run this on every drag. */
  assert(
    samePoint(smoothedNext(JOIN_A, mended)[1], mended[1], 1e-15),
    "mending a smooth seam should leave it alone",
  );
  // A curve does not join smoothly to one that starts somewhere else, however aligned the tangents.
  assert(
    !joinsSmoothly(JOIN_A, [
      { x: 1, y: 1 },
      { x: 2.5, y: -1.4 },
      ...JOIN_NAIVE.slice(2),
    ]),
    "a shared endpoint is necessary as well as insufficient",
  );

  // A chain is drawn as one path with no duplicated seam point.
  const chain = chainPoints([JOIN_A, mended], 48);
  assert(
    chain.length === 97,
    `two curves at 48 steps should give 97 points, gave ${chain.length}`,
  );
  assert(
    samePoint(chain[48], JOIN_A[3], 1e-12),
    "with the seam appearing exactly once",
  );

  // ---- The scenes' own arithmetic ----------------------------------------------------------

  // The world-to-screen round trip, since a drag depends on it and a sign error still draws a curve.
  for (const curve of PRESETS) {
    for (const p of curve.points) {
      const screen = pathScreenOf(p);
      assert(
        samePoint(pathWorldOf(screen.x, screen.y), p, 1e-12),
        `the screen round trip failed for (${p.x}, ${p.y})`,
      );
    }
  }
  // Y is flipped exactly once: a point above another in the world is drawn higher on the canvas.
  assert(
    pathScreenOf({ x: 0, y: 1 }).y < pathScreenOf({ x: 0, y: 0 }).y,
    "a higher world point should be drawn nearer the top",
  );
  // Every preset, and everything reachable by dragging, stays on the canvas.
  for (const preset of PRESETS) {
    for (const p of preset.points) {
      assert(
        Math.abs(p.x) <= PATH_BOUNDS.x && Math.abs(p.y) <= PATH_BOUNDS.y,
        `${preset.name} has a control point outside the draggable bounds`,
      );
    }
    for (const p of outline(preset.points)) {
      const q = pathScreenOf(p);
      assert(
        q.x >= 0 &&
          q.x <= PATH_VIEW.width &&
          q.y >= 0 &&
          q.y <= PATH_VIEW.height,
        `${preset.name} draws outside the canvas at (${q.x}, ${q.y})`,
      );
    }
    // Including the corners of the bounds, which is where a drag can put a handle.
    for (const sx of [-PATH_BOUNDS.x, PATH_BOUNDS.x]) {
      for (const sy of [-PATH_BOUNDS.y, PATH_BOUNDS.y]) {
        const q = pathScreenOf(clampToBounds({ x: sx, y: sy }));
        assert(
          q.x >= 0 &&
            q.x <= PATH_VIEW.width &&
            q.y >= 0 &&
            q.y <= PATH_VIEW.height,
          `a handle dragged to (${sx}, ${sy}) would land off the canvas`,
        );
      }
    }
  }
  // And the clamp really clamps rather than merely existing.
  assert(
    clampToBounds({ x: 99, y: -99 }).x === PATH_BOUNDS.x &&
      clampToBounds({ x: 99, y: -99 }).y === -PATH_BOUNDS.y,
    "a handle dragged off the canvas is pulled back to the bounds",
  );

  // The construction the path scene draws: level counts, and the last pair being the tangent.
  for (const curve of [QUADRATIC, SYMMETRIC]) {
    for (const t of [0.2, 0.5, 0.77]) {
      const { levels, point } = deCasteljau(curve, t);
      assert(
        levels.length === curve.length,
        `there should be ${curve.length} levels for ${curve.length} control points`,
      );
      assert(
        levels[levels.length - 1].length === 1,
        "the last level is the single point on the curve",
      );
      assert(
        samePoint(levels[levels.length - 1][0], point, 1e-15),
        "which is what it returns",
      );
      /* The final pair of intermediate points lies **along the tangent**, which is why the facing
         direction is not a separate construction. Checked as a direction, not a length. */
      const pair = levels[levels.length - 2];
      const alongPair = normalize({
        x: pair[1].x - pair[0].x,
        y: pair[1].y - pair[0].y,
      });
      const alongTangent = normalize(tangentAt(curve, t));
      assert(
        alongPair !== null &&
          alongTangent !== null &&
          near(dot(alongPair, alongTangent), 1, 1e-9),
        `the last construction segment should lie along the tangent at t = ${t}`,
      );
    }
  }
  // The marks the travelling scene drops, at both ends and in the right number.
  for (const byDistance of [false, true]) {
    const marks = markPoints(LOPSIDED, byDistance);
    assert(
      marks.length === MARKS,
      `there should be ${MARKS} marks, there were ${marks.length}`,
    );
    assert(
      samePoint(marks[0], LOPSIDED[0], 1e-9) &&
        samePoint(marks[MARKS - 1], LOPSIDED[3], 1e-9),
      "and the first and last should sit on the curve's ends either way",
    );
  }
};

/**
 * Circles and boxes: three tests, and the two wrong versions of them priced rather than described.
 *
 * The assertion carrying the most weight is the corner one, and it is worth saying why it is possible at
 * all. The naive circle-versus-box test is wrong by an area, and that area has a closed form:
 * $(4 - \pi)r^2$, four corner squares minus four quarter-discs. So the check can **count** disagreements
 * over a grid and compare the count against a formula derived a completely different way. A bug in
 * either one would break the agreement.
 *
 * Everything else here is the discipline that has earned its keep all through this Module: the three
 * tests are swept against brute-force alternatives rather than against themselves rearranged, and the
 * two shapes are checked at the corners of their draggable range, because that is where a picture goes
 * wrong without anything throwing.
 */
export const collideCheck2d: Demo = () => {
  const samePoint = (a: Point, b: Point, tol = 1e-9) =>
    Math.hypot(a.x - b.x, a.y - b.y) < tol;

  // ---- Two circles ------------------------------------------------------------------------

  /* Two references, because one was not enough and the first attempt was itself wrong.
     
     I began by sampling points around each rim and asking whether any lay inside the other circle. That
     tests whether the **outlines** cross, which is a different question: a small disc entirely inside a
     big one overlaps it while their rims never meet. The check duly failed at exact internal tangency,
     and the code was right. Worth keeping the note, because "write an independent reference" is only
     good advice if the reference answers the same question.
     
     So: the criterion computed with an actual square root, which catches a mistake in the squaring, and
     a grid search for a genuinely shared point, which catches a mistake in the criterion. */
  const overlapUnsquared = (a: Circle, b: Circle) =>
    Math.hypot(b.centre.x - a.centre.x, b.centre.y - a.centre.y) <
    a.radius + b.radius;

  /* Asserted in one direction only, and deliberately. Finding a shared point proves an overlap, but
     failing to find one proves nothing - two discs can overlap in a lens far thinner than the grid. */
  const sharesAPoint = (a: Circle, b: Circle, samples = 120) => {
    for (let i = 0; i <= samples; i += 1) {
      for (let j = 0; j <= samples; j += 1) {
        const p = {
          x: b.centre.x - b.radius + (i / samples) * 2 * b.radius,
          y: b.centre.y - b.radius + (j / samples) * 2 * b.radius,
        };
        if (
          distanceSquared(p, a.centre) < a.radius * a.radius &&
          distanceSquared(p, b.centre) < b.radius * b.radius
        ) {
          return true;
        }
      }
    }
    return false;
  };

  for (const radius of [0.4, 1, 2.5]) {
    for (let i = 0; i <= 40; i += 1) {
      for (let j = 0; j <= 24; j += 1) {
        const centre = { x: -6 + (i / 40) * 12, y: -3 + (j / 24) * 6 };
        const moving = { centre, radius };
        const byFormula = circlesOverlap(STATIC_CIRCLE, moving);
        // Skip a whisker either side of exact contact, where floating point decides the answer.
        if (Math.abs(circleSeparation(STATIC_CIRCLE, moving)) < 1e-9) continue;
        assert(
          byFormula === overlapUnsquared(STATIC_CIRCLE, moving),
          `the squared test disagreed with the rooted one at (${centre.x.toFixed(2)}, ${centre.y.toFixed(2)}) r ${radius}`,
        );
        if (sharesAPoint(STATIC_CIRCLE, moving)) {
          assert(
            byFormula,
            `a point lies in both discs at (${centre.x.toFixed(2)}, ${centre.y.toFixed(2)}) r ${radius}, so they overlap`,
          );
        }
      }
    }
  }
  /* And the containment case explicitly, since it is what the bad reference could not see: a small disc
     wholly inside a large one overlaps it, at every offset up to internal tangency and beyond. */
  for (const offset of [0, 0.25, 0.5, 0.49999]) {
    const inside = {
      centre: { x: STATIC_CIRCLE.centre.x + offset, y: 0 },
      radius: 1,
    };
    assert(
      circlesOverlap(STATIC_CIRCLE, inside),
      `a disc inside another overlaps it, failed at offset ${offset}`,
    );
    assert(
      sharesAPoint(STATIC_CIRCLE, inside),
      "and they demonstrably share points",
    );
  }
  // Touching exactly is not overlapping, which is a decision rather than a fact, so it is pinned.
  const justTouching = {
    centre: { x: STATIC_CIRCLE.centre.x + STATIC_CIRCLE.radius + 1, y: 0 },
    radius: 1,
  };
  assert(
    !circlesOverlap(STATIC_CIRCLE, justTouching),
    "circles that touch at exactly one point are not overlapping",
  );
  assert(
    near(circleSeparation(STATIC_CIRCLE, justTouching), 0, 1e-12),
    "and their separation is exactly zero",
  );
  assert(
    circlesOverlap(STATIC_CIRCLE, {
      centre: {
        x: STATIC_CIRCLE.centre.x + STATIC_CIRCLE.radius + 0.999,
        y: 0,
      },
      radius: 1,
    }),
    "a thousandth closer and they are",
  );
  // A circle overlaps itself, and a zero-radius circle at another's centre is inside it.
  assert(
    circlesOverlap(STATIC_CIRCLE, STATIC_CIRCLE),
    "a circle overlaps itself",
  );
  assert(
    circlesOverlap(STATIC_CIRCLE, { centre: STATIC_CIRCLE.centre, radius: 0 }),
    "and contains a point at its own centre",
  );

  /* The wrong version, priced. Squaring the radii separately drops the 2*ra*rb cross term, and for equal
     radii that shrinks the reach from 2r to r*sqrt(2) - a shortfall of 29.29%, which is why it reads as
     "collision feels late" rather than as an obvious break. */
  for (const r of [0.5, 1, 3]) {
    const a = { centre: { x: 0, y: 0 }, radius: r };
    const correctReach = 2 * r;
    const wrongReach = Math.sqrt(2 * r * r);
    assert(
      near(wrongReach / correctReach, Math.SQRT1_2, 1e-12),
      "the wrong reach for equal radii should be 1/sqrt(2) of the right one",
    );
    // A position strictly between the two reaches: overlapping, and the wrong test says nothing.
    const between = {
      centre: { x: (correctReach + wrongReach) / 2, y: 0 },
      radius: r,
    };
    assert(
      circlesOverlap(a, between) && !circlesOverlapWrongSquare(a, between),
      `the wrong square test should miss a real overlap at radius ${r}`,
    );
  }
  assert(
    near((1 - Math.SQRT1_2) * 100, 29.2893, 1e-3),
    "the shortfall for equal radii should be 29.29%",
  );
  // The demo's own pair, whose figure the Section quotes.
  {
    const correctReach = STATIC_CIRCLE.radius + MOVING_RADIUS;
    const wrongReach = Math.sqrt(
      STATIC_CIRCLE.radius ** 2 + MOVING_RADIUS ** 2,
    );
    assert(
      near((wrongReach / correctReach) * 100, 71.0022, 1e-3),
      `the demo's pair should report contact at 71.00% of the right distance, got ${(wrongReach / correctReach) * 100}`,
    );
    /* The values panel puts its example circle a round 2.25 away rather than at the midpoint of the two
       reaches, because that midpoint is irrational and printed as 0.8512812094883317 in output that gets
       committed. So the roundness has to be paid for with an assertion that it still lands between them. */
    assert(
      wrongReach < 2.25 && 2.25 < correctReach,
      `2.25 has to sit between the wrong reach ${wrongReach} and the right one ${correctReach}`,
    );
    const example = {
      centre: { x: STATIC_CIRCLE.centre.x + 2.25, y: 0 },
      radius: MOVING_RADIUS,
    };
    assert(
      circlesOverlap(STATIC_CIRCLE, example) &&
        !circlesOverlapWrongSquare(STATIC_CIRCLE, example),
      "so the right test sees the overlap there and the wrong one does not",
    );
  }

  // ---- Two boxes --------------------------------------------------------------------------

  /* Against a brute-force version: sample a grid inside one box and ask whether any sample is in the
     other. Independent of the range logic, so the two agreeing means both are right. */
  const boxesOverlapByProbe = (a: Aabb, b: Aabb, samples = 140) => {
    for (let i = 0; i <= samples; i += 1) {
      for (let j = 0; j <= samples; j += 1) {
        const p = {
          x: a.min.x + (i / samples) * (a.max.x - a.min.x),
          y: a.min.y + (j / samples) * (a.max.y - a.min.y),
        };
        if (aabbContains(b, p)) return true;
      }
    }
    return false;
  };
  for (let i = 0; i <= 30; i += 1) {
    for (let j = 0; j <= 18; j += 1) {
      const centre = { x: -6 + (i / 30) * 12, y: -3 + (j / 18) * 6 };
      const moving = movingBoxAt(centre);
      const depth = aabbOverlapDepth(STATIC_BOX, moving);
      // Skip near-exact contact, where a finite probe grid cannot resolve the answer.
      if (Math.abs(depth.x) < 0.05 || Math.abs(depth.y) < 0.05) continue;
      assert(
        aabbsOverlap(STATIC_BOX, moving) ===
          boxesOverlapByProbe(STATIC_BOX, moving),
        `the box test disagreed with a probe at (${centre.x.toFixed(2)}, ${centre.y.toFixed(2)})`,
      );
      // Overlap on both axes is exactly the condition, restated so the two forms cannot drift.
      assert(
        aabbsOverlap(STATIC_BOX, moving) === (depth.x > 0 && depth.y > 0),
        "overlapping should be the same as positive depth on both axes",
      );
    }
  }
  // The whole test is two range checks, and the range check is the piece Section 5.3 generalises.
  assert(rangesOverlap(0, 2, 1, 3), "ranges that straddle overlap");
  assert(rangesOverlap(0, 5, 1, 2), "and one inside the other overlaps");
  assert(!rangesOverlap(0, 1, 1, 2), "ranges that meet at a point do not");
  assert(!rangesOverlap(0, 1, 2, 3), "and ranges with a gap do not");
  assert(
    rangesOverlap(0, 2, 1, 3) === rangesOverlap(1, 3, 0, 2),
    "and the check does not care which range is named first",
  );
  // Boxes that share an edge do not overlap, matching the circles' decision about touching.
  const touchingBox = {
    min: { x: STATIC_BOX.max.x, y: STATIC_BOX.min.y },
    max: { x: STATIC_BOX.max.x + 2, y: STATIC_BOX.max.y },
  };
  assert(
    !aabbsOverlap(STATIC_BOX, touchingBox),
    "boxes sharing an edge are not overlapping, which keeps a resting character out of contact",
  );
  assert(
    near(aabbOverlapDepth(STATIC_BOX, touchingBox).x, 0, 1e-12),
    "and their depth on that axis is exactly zero",
  );

  /* An inverted box is the failure that produces no error at all: every test says "no collision", so a
     wall becomes a doorway. Checked, along with the repair. */
  const inverted: Aabb = { min: { x: 2, y: 1 }, max: { x: -2, y: -1 } };
  assert(!isValidAabb(inverted), "a box with its corners swapped is not valid");
  assert(isValidAabb(normalized(inverted)), "and normalizing fixes it");
  assert(
    !aabbsOverlap(inverted, movingBoxAt({ x: 0, y: 0 })),
    "an inverted box collides with nothing, silently",
  );
  assert(
    aabbsOverlap(normalized(inverted), movingBoxAt({ x: 0, y: 0 })),
    "while the normalized one behaves",
  );
  assert(
    isValidAabb(STATIC_BOX) && isValidAabb(CORNER_BOX),
    "and the Section's own boxes are the right way round",
  );

  // The two representations, and the halving that is the reason to convert deliberately.
  for (const box of [
    STATIC_BOX,
    CORNER_BOX,
    movingBoxAt({ x: 1.5, y: -0.5 }),
  ]) {
    const asBox = toBox(box);
    assert(
      near(asBox.half.x * 2, boxWidth(box), 1e-12) &&
        near(asBox.half.y * 2, boxHeight(box), 1e-12),
      "half-extents are half the width and height, which is the trap",
    );
    assert(
      samePoint(toAabb(asBox).min, box.min, 1e-12) &&
        samePoint(toAabb(asBox).max, box.max, 1e-12),
      "and the round trip between the two forms is exact",
    );
  }
  // No float dust in the Section's coordinates, since they are printed in a committed values panel.
  for (const value of [
    STATIC_BOX.min.x,
    STATIC_BOX.min.y,
    STATIC_BOX.max.x,
    STATIC_BOX.max.y,
    CORNER_BOX.min.x,
    CORNER_BOX.max.y,
    toBox(STATIC_BOX).half.x,
  ]) {
    assert(
      Number.isInteger(value * 16),
      `${value} is not a sixteenth, so it will print with floating-point dust`,
    );
  }

  // ---- A circle and a box -----------------------------------------------------------------

  /* The clamp handles a face, a corner and the inside with no branch. Verified against a brute-force
     nearest point found by scanning the box's boundary, which is a different computation entirely. */
  const nearestByScan = (box: Aabb, p: Point, samples = 4000) => {
    let best = { x: box.min.x, y: box.min.y };
    let bestDistance = Infinity;
    const perimeter: Array<[Point, Point]> = [
      [box.min, { x: box.max.x, y: box.min.y }],
      [{ x: box.max.x, y: box.min.y }, box.max],
      [box.max, { x: box.min.x, y: box.max.y }],
      [{ x: box.min.x, y: box.max.y }, box.min],
    ];
    for (const [a, b] of perimeter) {
      for (let i = 0; i <= samples; i += 1) {
        const q = {
          x: a.x + (i / samples) * (b.x - a.x),
          y: a.y + (i / samples) * (b.y - a.y),
        };
        const d = distanceSquared(p, q);
        if (d < bestDistance) {
          bestDistance = d;
          best = q;
        }
      }
    }
    return best;
  };
  for (let i = 0; i <= 24; i += 1) {
    for (let j = 0; j <= 14; j += 1) {
      const p = { x: -6 + (i / 24) * 12, y: -3 + (j / 14) * 6 };
      const clamped = closestPointInAabb(CORNER_BOX, p);
      if (aabbContains(CORNER_BOX, p)) {
        // Inside, the clamp returns the point itself. Correct for a containment test, and not a
        // boundary point - which is exactly the distinction Section 5.4 has to make.
        assert(
          samePoint(clamped, p, 1e-15),
          "inside the box, the clamp is the identity",
        );
        continue;
      }
      assert(
        samePoint(clamped, nearestByScan(CORNER_BOX, p), 2e-3),
        `the clamp disagreed with a boundary scan at (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`,
      );
      // The clamped point is always on the boundary, and never outside the box.
      assert(
        aabbContains(CORNER_BOX, clamped),
        "the clamped point is in the box",
      );
    }
  }

  /* The corner bug, measured against its closed form. Two completely different computations: one counts
     grid cells where the tests disagree, the other is (4 - pi)r^2 from four squares minus four
     quarter-discs. Agreement to a fraction of a percent means both are right. */
  for (const radius of [0.3, 0.5, 0.8, 1.1, 1.4, 1.8]) {
    const measured = measuredErrorArea(radius, 700);
    const exact = cornerErrorArea(radius);
    assert(
      Math.abs(measured - exact) / exact < 0.005,
      `the sampled corner error ${measured} should match (4-pi)r^2 = ${exact} at radius ${radius}`,
    );
  }
  assert(
    near(cornerErrorArea(1) / (4 - Math.PI), 1, 1e-12),
    "the closed form should be exactly (4 - pi) at radius 1",
  );
  assert(
    near(cornerErrorArea(2), 4 * cornerErrorArea(1), 1e-12),
    "and it should scale with the square of the radius",
  );
  /* The naive test's over-reach at a corner is r*(sqrt(2) - 1), because its corner sits at r*sqrt(2)
     from the box's while the true region reaches only r. 41.42% of the radius, whatever the radius. */
  for (const radius of [0.3, 1.1, 1.8]) {
    const worst = {
      x: CORNER_BOX.max.x + radius,
      y: CORNER_BOX.max.y + radius,
    };
    const circle = { centre: worst, radius };
    assert(
      circleAabbOverlapNaive(circle, CORNER_BOX),
      "the naive test accepts a circle at the corner of the grown box",
    );
    assert(
      !circleAabbOverlap(circle, CORNER_BOX),
      "while the circle there is touching nothing",
    );
    assert(
      near(
        circleAabbSeparation(circle, CORNER_BOX),
        radius * (Math.SQRT2 - 1),
        1e-12,
      ),
      `and it clears the corner by r(sqrt(2)-1), not ${circleAabbSeparation(circle, CORNER_BOX)}`,
    );
  }
  assert(
    near((Math.SQRT2 - 1) * 100, 41.4214, 1e-3),
    "which is 41.42% of the radius",
  );
  // Along a face the naive test is right, which is why the bug is hard to notice.
  for (let i = 0; i <= 40; i += 1) {
    const y = CORNER_BOX.min.y + (i / 40) * boxHeight(CORNER_BOX);
    for (const radius of [0.4, 1.2]) {
      for (const gap of [-0.1, 0.05, 0.5]) {
        const circle = {
          centre: { x: CORNER_BOX.max.x + radius + gap, y },
          radius,
        };
        assert(
          circleAabbOverlapNaive(circle, CORNER_BOX) ===
            circleAabbOverlap(circle, CORNER_BOX),
          "directly out from a face, the naive test agrees with the right one",
        );
      }
    }
  }
  // And it is never the other way round: the naive test over-reports and never under-reports.
  for (let i = 0; i <= 60; i += 1) {
    for (let j = 0; j <= 36; j += 1) {
      const centre = { x: -6 + (i / 60) * 12, y: -3.4 + (j / 36) * 6.8 };
      const circle = { centre, radius: 1.1 };
      if (circleAabbOverlap(circle, CORNER_BOX)) {
        assert(
          circleAabbOverlapNaive(circle, CORNER_BOX),
          "the naive test must never miss a real overlap, only invent one",
        );
      }
    }
  }
  // The circle test and the box test agree when the box has no size, since then it is a point.
  for (const p of [
    { x: 0, y: 0 },
    { x: 2, y: 1 },
    { x: -4, y: 2 },
  ]) {
    const pointBox: Aabb = { min: p, max: p };
    const circle = { centre: { x: 0.5, y: 0.25 }, radius: 1.5 };
    assert(
      circleAabbOverlap(circle, pointBox) ===
        circlesOverlap(circle, { centre: p, radius: 0 }),
      "a box of no size behaves as a point for the circle test",
    );
  }

  // ---- The scenes' own arithmetic ----------------------------------------------------------

  for (const p of [
    SHAPES_START,
    { x: 0, y: 0 },
    { x: -3.4, y: 1.1 },
    { x: SHAPES_BOUNDS.x, y: SHAPES_BOUNDS.y },
  ]) {
    const screen = shapesScreenOf(p);
    assert(
      samePoint(shapesWorldOf(screen.x, screen.y), p, 1e-12),
      `the screen round trip failed for (${p.x}, ${p.y})`,
    );
  }
  assert(
    shapesScreenOf({ x: 0, y: 1 }).y < shapesScreenOf({ x: 0, y: 0 }).y,
    "a higher world point should be drawn nearer the top",
  );
  /* Everything reachable by dragging has to stay on the canvas, including the circle's rim and the
     box's corners. The first version of BOUNDS put the circle's top edge a pixel off the canvas, which
     is precisely the class of mistake a build with no GPU can still catch. */
  for (const sx of [-SHAPES_BOUNDS.x, 0, SHAPES_BOUNDS.x]) {
    for (const sy of [-SHAPES_BOUNDS.y, 0, SHAPES_BOUNDS.y]) {
      const probes: Point[] = [
        { x: sx - MOVING_RADIUS, y: sy },
        { x: sx + MOVING_RADIUS, y: sy },
        { x: sx, y: sy - MOVING_RADIUS },
        { x: sx, y: sy + MOVING_RADIUS },
        movingBoxAt({ x: sx, y: sy }).min,
        movingBoxAt({ x: sx, y: sy }).max,
      ];
      for (const probe of probes) {
        const q = shapesScreenOf(probe);
        assert(
          q.x >= 0 &&
            q.x <= SHAPES_VIEW.width &&
            q.y >= 0 &&
            q.y <= SHAPES_VIEW.height,
          `dragging to (${sx}, ${sy}) puts part of the shape at (${q.x.toFixed(1)}, ${q.y.toFixed(1)}), off a ${SHAPES_VIEW.width} by ${SHAPES_VIEW.height} canvas`,
        );
      }
    }
  }
  assert(
    shapesClampToBounds({ x: 40, y: -40 }).x === SHAPES_BOUNDS.x &&
      shapesClampToBounds({ x: 40, y: -40 }).y === -SHAPES_BOUNDS.y,
    "and the clamp pulls a far drag back to the bounds",
  );
  // The corner scene's widest region has to fit too, since the radius slider drives its size.
  for (const radius of [RADIUS_RANGE.min, 1.1, RADIUS_RANGE.max]) {
    const region = naiveRegion(radius);
    for (const corner of [region.min, region.max]) {
      const q = shapesScreenOf(corner);
      assert(
        q.x >= 0 &&
          q.x <= SHAPES_VIEW.width &&
          q.y >= 0 &&
          q.y <= SHAPES_VIEW.height,
        `the grown region at radius ${radius} reaches (${q.x.toFixed(1)}, ${q.y.toFixed(1)})`,
      );
    }
  }
  // The starting position is a miss in all three pairings, so the first thing a reader sees is a gap.
  for (const kind of KINDS) {
    const report = reportAt(kind, SHAPES_START);
    assert(
      !report.hit,
      `${kind} should start apart, and it starts ${report.separation}`,
    );
    assert(
      report.separation > 0,
      "with a positive separation, since they are apart",
    );
    assert(
      !report.naiveDisagrees,
      "and with the wrong version agreeing, so the bug is something the reader has to go and find",
    );
  }
  /* Each pairing's report has to actually flip as the shape moves, or a mode would be a still picture.
     Swept over the draggable range rather than checked at two chosen points. */
  for (const kind of KINDS) {
    let hits = 0;
    let misses = 0;
    for (let i = 0; i <= 40; i += 1) {
      for (let j = 0; j <= 24; j += 1) {
        const p = {
          x: -SHAPES_BOUNDS.x + (i / 40) * 2 * SHAPES_BOUNDS.x,
          y: -SHAPES_BOUNDS.y + (j / 24) * 2 * SHAPES_BOUNDS.y,
        };
        const report = reportAt(kind, p);
        if (report.hit) hits += 1;
        else misses += 1;
        // The separation's sign must always match the verdict, in every pairing.
        assert(
          report.hit === report.separation < 0,
          `${kind} reported hit=${report.hit} with separation ${report.separation}`,
        );
      }
    }
    assert(
      hits > 40 && misses > 40,
      `${kind} should have plenty of both outcomes in range, had ${hits} hits and ${misses} misses`,
    );
  }
  // And the circle-and-box pairing has to find positions where the naive test is visibly wrong.
  let disagreements = 0;
  for (let i = 0; i <= 60; i += 1) {
    for (let j = 0; j <= 36; j += 1) {
      const p = {
        x: -SHAPES_BOUNDS.x + (i / 60) * 2 * SHAPES_BOUNDS.x,
        y: -SHAPES_BOUNDS.y + (j / 36) * 2 * SHAPES_BOUNDS.y,
      };
      if (reportAt("circle and box", p).naiveDisagrees) disagreements += 1;
    }
  }
  assert(
    disagreements > 20,
    `the reader should be able to find the corner bug by dragging, found it at ${disagreements} positions`,
  );
};

/**
 * Rays, segments and lines: three domains for one parameter, and the four divisions that need guarding.
 *
 * The load-bearing assertion is the closest point, swept against a brute-force scan **along the segment
 * itself** rather than against the projection formula rearranged. A clamp that is missing, inverted or
 * applied to the wrong quantity all still return a plausible point somewhere near the wall, so this is
 * exactly the class of bug a picture will not settle.
 *
 * The second job is pricing the two mistakes the Section is about. Dropping the clamp gives the closest
 * point on the infinite line, and dropping `u` gives a wall that reaches for ever - and the second one
 * costs a measured $129.4°$ of a guard's view, which is a number rather than an opinion.
 */
export const segmentCheck2d: Demo = () => {
  const samePoint = (a: Point, b: Point, tol = 1e-9) =>
    Math.hypot(a.x - b.x, a.y - b.y) < tol;

  const DIAGONAL: Segment = { a: { x: -3, y: -1 }, b: { x: 3, y: 2 } };
  const TALL: Segment = { a: { x: 1, y: -2 }, b: { x: 1, y: 3 } };
  const FLAT: Segment = { a: { x: 0, y: 0 }, b: { x: 4, y: 0 } };
  const POINT_SEG: Segment = { a: { x: 1, y: 1 }, b: { x: 1, y: 1 } };

  // ---- One equation, three domains --------------------------------------------------------

  for (const t of [-2, -0.5, 0, 0.25, 1, 1.5, 40]) {
    assert(clampT(t, "line") === t, "a line clamps nothing");
    assert(clampT(t, "ray") === Math.max(t, 0), "a ray clamps below zero only");
    assert(
      clampT(t, "segment") === Math.min(Math.max(t, 0), 1),
      "and a segment clamps at both ends",
    );
    // `containsT` is the same three cases asked as a question, so the two must never disagree.
    assert(
      containsT(t, "line") === (clampT(t, "line") === t),
      "line membership should match its clamp",
    );
    assert(
      containsT(t, "ray") === (clampT(t, "ray") === t),
      "ray membership should match its clamp",
    );
    assert(
      containsT(t, "segment") === (clampT(t, "segment") === t),
      "segment membership should match its clamp",
    );
  }
  // The endpoints are hit exactly, which is what makes `t` worth reasoning about.
  for (const seg of [DIAGONAL, TALL, FLAT, NEAREST_WALL]) {
    assert(samePoint(pointOn(seg, 0), seg.a, 1e-15), "t = 0 is the first end");
    assert(samePoint(pointOn(seg, 1), seg.b, 1e-15), "and t = 1 is the second");
    assert(
      samePoint(pointOn(seg, 0.5), midpoint(seg.a, seg.b), 1e-12),
      "and t = 0.5 is the midpoint, which is Section 1.2's average",
    );
    // A segment is a lerp between its ends, so travelling `t` is linear in distance along it.
    for (let i = 0; i <= 20; i += 1) {
      const t = i / 20;
      assert(
        near(distance(seg.a, pointOn(seg, t)), t * segmentLength(seg), 1e-12),
        "distance along a segment is linear in t, unlike a Bezier's parameter",
      );
    }
  }

  // ---- The closest point, against a brute-force scan ---------------------------------------

  const nearestByScan = (seg: Segment, p: Point, samples = 20000) => {
    let best = seg.a;
    let bestDistance = Infinity;
    for (let i = 0; i <= samples; i += 1) {
      const q = pointOn(seg, i / samples);
      const d = distanceSquared(p, q);
      if (d < bestDistance) {
        bestDistance = d;
        best = q;
      }
    }
    return best;
  };
  for (const seg of [DIAGONAL, TALL, FLAT, NEAREST_WALL]) {
    for (let i = 0; i <= 22; i += 1) {
      for (let j = 0; j <= 14; j += 1) {
        const p = { x: -7 + (i / 22) * 14, y: -4 + (j / 14) * 8 };
        assert(
          samePoint(
            closestPoint(seg, p, "segment"),
            nearestByScan(seg, p),
            2e-3,
          ),
          `the clamped projection disagreed with a scan at (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`,
        );
        // The answer is always on the segment, which a missing clamp would break immediately.
        const t = projectionT(seg, closestPoint(seg, p, "segment"));
        assert(
          t !== null && t >= -1e-9 && t <= 1 + 1e-9,
          `the nearest point should have t in [0, 1], had ${t}`,
        );
        /* And the segment is never nearer than its own line - the line has more points to choose
           from, so it can only ever tie or win. Which means the unclamped version **understates**,
           always, and can never invent a distance that is too large. */
        assert(
          distanceToLine(seg, p) <= distanceToSegment(seg, p) + 1e-12,
          "the infinite line can never be further away than the segment",
        );
      }
    }
  }
  // Between the ends the clamp changes nothing, so the two answers must agree exactly there.
  for (let i = 0; i <= 50; i += 1) {
    const t = i / 50;
    const on = pointOn(NEAREST_WALL, t);
    // Step off the wall perpendicularly, staying inside the slab where t is in range.
    const along = normalize(displacement(NEAREST_WALL.a, NEAREST_WALL.b))!;
    const across = { x: -along.y, y: along.x };
    for (const offset of [-1.5, -0.25, 0.25, 1.5]) {
      const p = { x: on.x + across.x * offset, y: on.y + across.y * offset };
      assert(
        near(
          distanceToSegment(NEAREST_WALL, p),
          distanceToLine(NEAREST_WALL, p),
          1e-9,
        ),
        `inside the slab the two distances must agree, differed at t = ${t}`,
      );
      assert(
        near(Math.abs(offset), distanceToSegment(NEAREST_WALL, p), 1e-9),
        "and the distance should be exactly how far we stepped off",
      );
    }
  }

  /* The clamp's price, measured over the scene's own view rather than at a chosen point. The worst case
     is what makes it concrete: a position where the unclamped test reports all but touching the wall
     while the nearest part of it is metres away. */
  {
    let mattered = 0;
    let total = 0;
    let worstError = 0;
    const samples = 240;
    for (let i = 0; i <= samples; i += 1) {
      for (let j = 0; j <= samples; j += 1) {
        const p = {
          x: -SIGHT_BOUNDS.x + (i / samples) * 2 * SIGHT_BOUNDS.x,
          y: -SIGHT_BOUNDS.y + (j / samples) * 2 * SIGHT_BOUNDS.y,
        };
        total += 1;
        const t = projectionT(NEAREST_WALL, p);
        assert(t !== null, "the scene's wall has length, so t always exists");
        if (t! < 0 || t! > 1) {
          mattered += 1;
          worstError = Math.max(
            worstError,
            distanceToSegment(NEAREST_WALL, p) -
              distanceToLine(NEAREST_WALL, p),
          );
        }
      }
    }
    assert(
      mattered / total > 0.4,
      `the clamp should matter over much of the view, mattered at ${((mattered / total) * 100).toFixed(2)}%`,
    );
    assert(
      worstError > 4,
      `the worst understatement should be several units, was ${worstError}`,
    );
  }

  /* The case that actually bites has to be **constructed** rather than sampled, which took a failed
     assertion to notice: a grid over the view never lands exactly on the wall's extended line, so the
     grid's worst point is merely far away rather than misleadingly close. Step just off that line, well
     past the end, and the unclamped test reports all but touching a wall that is metres behind you -
     which is the shape of a bullet travelling along a wall's continuation and stopping in mid-air. */
  {
    const along = normalize(displacement(NEAREST_WALL.a, NEAREST_WALL.b))!;
    const across = { x: -along.y, y: along.x };
    const beyond = pointOn(NEAREST_WALL, 1.6);
    const probe = {
      x: beyond.x + across.x * 0.01,
      y: beyond.y + across.y * 0.01,
    };
    assert(
      Math.abs(probe.x) <= SIGHT_BOUNDS.x &&
        Math.abs(probe.y) <= SIGHT_BOUNDS.y,
      "the constructed probe has to be somewhere the reader can actually drag to",
    );
    assert(
      near(distanceToLine(NEAREST_WALL, probe), 0.01, 1e-12),
      `the unclamped distance should be the 0.01 we stepped off, was ${distanceToLine(NEAREST_WALL, probe)}`,
    );
    assert(
      near(
        distanceToSegment(NEAREST_WALL, probe),
        0.6 * segmentLength(NEAREST_WALL),
        1e-3,
      ),
      `while the real distance is 0.6 of the wall's length, ${distanceToSegment(NEAREST_WALL, probe)}`,
    );
    assert(
      distanceToSegment(NEAREST_WALL, probe) /
        distanceToLine(NEAREST_WALL, probe) >
        300,
      "so the unclamped answer is out by a factor of over three hundred",
    );
  }

  // ---- Two parameters from one division ----------------------------------------------------

  {
    const crossing = lineCrossing(DIAGONAL, TALL);
    assert(crossing !== null, "two non-parallel lines cross");
    assert(
      near(crossing!.t, 2 / 3, 1e-12) && near(crossing!.u, 0.6, 1e-12),
      `the parameters should be 2/3 and 0.6, were ${crossing!.t} and ${crossing!.u}`,
    );
    /* The same point from either parameter, which is the check that catches a swapped numerator. Both
       t and u are computed from one denominator, and getting one of them wrong still yields a plausible
       crossing point from the other. */
    assert(
      samePoint(
        pointOn(DIAGONAL, crossing!.t),
        pointOn(TALL, crossing!.u),
        1e-12,
      ),
      "t on the first and u on the second must name the same place",
    );
    assert(
      samePoint(crossing!.point, { x: 1, y: 1 }, 1e-12),
      "and it should be exactly (1, 1)",
    );
  }
  // Swept: wherever the lines cross, both parameters must agree on the point.
  for (let i = 0; i <= 30; i += 1) {
    for (let j = 0; j <= 20; j += 1) {
      const other: Segment = {
        a: { x: -6 + (i / 30) * 12, y: -4 + (j / 20) * 8 },
        b: { x: -6 + (i / 30) * 12 + 2.5, y: -4 + (j / 20) * 8 + 1.75 },
      };
      const crossing = lineCrossing(DIAGONAL, other);
      if (crossing === null) continue;
      assert(
        samePoint(
          pointOn(DIAGONAL, crossing.t),
          pointOn(other, crossing.u),
          1e-9,
        ),
        "the two parameters must always describe the same point",
      );
      // And a segment crossing is exactly a line crossing with both parameters in range.
      assert(
        (segmentCrossing(DIAGONAL, other) !== null) ===
          (containsT(crossing.t, "segment") &&
            containsT(crossing.u, "segment")),
        "a segment crossing is a line crossing with both parameters in range",
      );
    }
  }
  /* Testing only `t` is the bug that makes a short wall block a whole level. Priced with a wall on the
     same line as a longer one: the lines cross identically, the segments do not cross at all. */
  {
    const short: Segment = { a: { x: 1, y: 2 }, b: { x: 1, y: 3 } };
    const asLines = lineCrossing(DIAGONAL, short);
    assert(asLines !== null, "the lines still cross");
    assert(
      containsT(asLines!.t, "segment"),
      "and t is still in range, so a t-only test would report a hit",
    );
    assert(
      !containsT(asLines!.u, "segment"),
      `while u is out of range at ${asLines!.u}`,
    );
    assert(
      segmentCrossing(DIAGONAL, short) === null,
      "so the segments do not cross",
    );
    assert(
      near(asLines!.u, -1, 1e-12),
      `u should be exactly -1 here, was ${asLines!.u}`,
    );
  }
  // A ray reaches forward for ever and not at all backwards, which is the third domain doing work.
  {
    const wall: Segment = { a: { x: 2, y: -2 }, b: { x: 2, y: 2 } };
    const ahead = rayHitsSegment({ x: 0, y: 0 }, { x: 1, y: 0 }, wall);
    assert(
      ahead !== null && near(ahead.t, 2, 1e-12),
      "a ray hits a wall in front of it at t = 2",
    );
    assert(
      rayHitsSegment({ x: 0, y: 0 }, { x: -1, y: 0 }, wall) === null,
      "and misses the same wall when aimed away from it",
    );
    // The line through that ray does cross, at a negative parameter, which is what the ray rejects.
    const asLine = lineCrossing(
      { a: { x: 0, y: 0 }, b: { x: -1, y: 0 } },
      wall,
    );
    assert(
      asLine !== null && near(asLine.t, -2, 1e-12),
      "the line crosses behind the origin, at t = -2",
    );
  }

  // ---- Parallel and collinear, where the division cannot help ------------------------------

  {
    const parallelApart: Segment = { a: { x: 0, y: 1 }, b: { x: 4, y: 1 } };
    const sameLineOver: Segment = { a: { x: 2, y: 0 }, b: { x: 6, y: 0 } };
    const sameLineApart: Segment = { a: { x: 5, y: 0 }, b: { x: 9, y: 0 } };

    assert(areParallel(FLAT, parallelApart), "these two are parallel");
    assert(!areCollinear(FLAT, parallelApart), "but not on the same line");
    assert(areCollinear(FLAT, sameLineOver), "while these are on one line");
    assert(
      lineCrossing(FLAT, parallelApart) === null &&
        lineCrossing(FLAT, sameLineOver) === null &&
        lineCrossing(FLAT, sameLineApart) === null,
      "and none of the three can name a crossing point",
    );
    /* Which is the whole reason the guard is there. Without it the division is 0/0 and the result is
       NaN - and NaN compares false against everything, so a wall lying exactly along a sight line is
       silently reported as not blocking it. */
    const denominator = cross(direction(FLAT), direction(sameLineOver));
    assert(denominator === 0, "the denominator really is zero here");
    assert(
      Number.isNaN(
        cross(displacement(FLAT.a, sameLineOver.a), direction(sameLineOver)) /
          denominator,
      ),
      "so the unguarded parameter would be NaN",
    );
    assert(
      !(Number.NaN >= 0) && !(Number.NaN <= 1),
      "and NaN fails every range test, so the hit is dropped rather than reported",
    );

    // The overlap question, which is Section 5.1's range check doing its third job.
    assert(collinearOverlap(FLAT, sameLineOver), "collinear and overlapping");
    assert(!collinearOverlap(FLAT, sameLineApart), "collinear and disjoint");
    assert(
      !collinearOverlap(FLAT, parallelApart),
      "and parallel but not collinear cannot overlap",
    );
    assert(collinearOverlap(FLAT, FLAT), "a segment overlaps itself");
    // Meeting at exactly one shared endpoint counts, since that point is on both.
    assert(
      collinearOverlap(FLAT, { a: { x: 4, y: 0 }, b: { x: 8, y: 0 } }),
      "and two collinear segments meeting at a single point do touch",
    );
    // A sight line lying along a wall is blocked, which is what folding that case in buys.
    assert(
      !hasLineOfSight({ x: 0, y: 0 }, { x: 3, y: 0 }, [FLAT]),
      "a sight line running along a wall is blocked by it",
    );
  }

  // ---- The zero-length segment -------------------------------------------------------------

  assert(
    projectionT(POINT_SEG, { x: 4, y: 5 }) === null,
    "a segment with no length has no direction to project onto",
  );
  assert(
    samePoint(closestPoint(POINT_SEG, { x: 4, y: 5 }), POINT_SEG.a, 1e-15),
    "and its nearest point is the one point it has",
  );
  for (const p of [
    { x: 4, y: 5 },
    { x: 1, y: 1 },
    { x: -100, y: 0.5 },
  ]) {
    assert(
      Number.isFinite(distanceToSegment(POINT_SEG, p)) &&
        Number.isFinite(distanceToLine(POINT_SEG, p)),
      `both distances to a degenerate segment must be finite, at (${p.x}, ${p.y})`,
    );
    assert(
      near(distanceToSegment(POINT_SEG, p), distance(POINT_SEG.a, p), 1e-12),
      "and equal to the distance to that point",
    );
  }
  assert(
    lineCrossing(POINT_SEG, FLAT) === null,
    "a degenerate segment has no direction, so it cannot cross anything",
  );

  // ---- Line of sight, and what dropping `u` costs ------------------------------------------

  /* The headline, measured. Treating each wall as its infinite line blocks views that pass nowhere near
     it, and the cost is a measured arc of the guard's turn. Both totals are asserted, because the
     interesting number is the difference between them. */
  {
    /* Derived in closed form, then compared against the sweep. This is much stronger than pinning the
       sampled figure, and it is what caught the scene displaying 129.5 where the page said 129.4: both
       were sampling artefacts, and the true value is 129.4179.
       
       At six units only the first wall is in reach as a segment - the build asserts that below - so the
       genuinely blocked arc is simply the angle it subtends at the guard. */
    const wall = SIGHT_WALLS[0];
    const toFirst = Math.atan2(
      wall.a.y - SIGHT_GUARD.y,
      wall.a.x - SIGHT_GUARD.x,
    );
    const toSecond = Math.atan2(
      wall.b.y - SIGHT_GUARD.y,
      wall.b.x - SIGHT_GUARD.x,
    );
    const subtended = Math.abs(toSecond - toFirst) * (180 / Math.PI);
    const exactClear = 360 - subtended;
    assert(
      near(subtended, 58.24052, 1e-4),
      `the reachable wall should subtend 58.24052 degrees, subtends ${subtended}`,
    );

    /* As lines it is the union of two arcs. The first wall's line is vertical and three units across, so
       it blocks every direction whose reach carries it that far: |angle| <= acos(3/6) = 60 exactly. The
       second is horizontal and 4.75 up, blocking asin(4.75/6) to its supplement. The third wall's line
       is 6.4846 away, so at six units it blocks nothing at all. */
    const acrossFirst = SIGHT_WALLS[0].a.x - SIGHT_GUARD.x;
    const arcFirst =
      2 * Math.acos(acrossFirst / SIGHT_RADIUS) * (180 / Math.PI);
    const upSecond = SIGHT_WALLS[1].a.y - SIGHT_GUARD.y;
    const lowSecond = Math.asin(upSecond / SIGHT_RADIUS) * (180 / Math.PI);
    const arcSecond = 180 - 2 * lowSecond;
    const shared = Math.max(0, arcFirst / 2 - lowSecond);
    const exactWrongClear = 360 - (arcFirst + arcSecond - shared);
    assert(
      near(arcFirst, 120, 1e-9),
      `the first wall's line should block exactly 120 degrees, blocked ${arcFirst}`,
    );
    assert(
      near(arcSecond, 75.316924, 1e-4),
      `the second's should block 75.316924, blocked ${arcSecond}`,
    );
    assert(
      near(exactWrongClear, 172.341538, 1e-4),
      `so 172.341538 should be clear as lines, not ${exactWrongClear}`,
    );
    assert(
      near(exactClear - exactWrongClear, 129.417942, 1e-4),
      `and 129.417942 wrongly blocked, not ${exactClear - exactWrongClear}`,
    );

    // Now the sampled sweep, which has to converge on all three.
    const sweep = sweepDisagreements(SIGHT_RADIUS, 36000);
    assert(
      near(sweep.clearDegrees, exactClear, 0.01),
      `the sweep should find ${exactClear} clear, found ${sweep.clearDegrees}`,
    );
    assert(
      near(sweep.wrongClearDegrees, exactWrongClear, 0.01),
      `and ${exactWrongClear} clear as lines, found ${sweep.wrongClearDegrees}`,
    );
    assert(
      near(sweep.degrees, exactClear - exactWrongClear, 0.01),
      `and ${exactClear - exactWrongClear} wrongly blocked, found ${sweep.degrees}`,
    );
    assert(
      near(sweep.clearDegrees - sweep.wrongClearDegrees, sweep.degrees, 1e-9),
      "and the difference has to be exactly the disagreement, since the error is one-sided",
    );
    /* The **default** resolution, called the way the scene calls it. This is the assertion that matters
       for what a reader sees: at 1440 samples the scene printed 129.5 against the page's 129.4, and both
       were wrong. Pinning the explicit 36000 above did not catch that, because the scene passes no sample
       count at all. */
    const asDisplayed = sweepDisagreements(SIGHT_RADIUS);
    assert(
      near(asDisplayed.clearDegrees, exactClear, 0.01) &&
        near(asDisplayed.wrongClearDegrees, exactWrongClear, 0.01) &&
        near(asDisplayed.degrees, exactClear - exactWrongClear, 0.01),
      `the default sweep resolution is too coarse for the two decimals the scene shows: ` +
        `${asDisplayed.clearDegrees}, ${asDisplayed.wrongClearDegrees}, ${asDisplayed.degrees}`,
    );
    /* The closed form above assumed only the first wall is reachable as a segment, and only the first two
       as lines. Both assumptions are asserted rather than trusted, because the derivation is worthless
       if a wall moves into range and it silently keeps the old arithmetic. */
    assert(
      distanceToSegment(SIGHT_WALLS[0], SIGHT_GUARD) < SIGHT_RADIUS,
      "the first wall has to be within reach as a segment",
    );
    for (const other of [SIGHT_WALLS[1], SIGHT_WALLS[2]]) {
      assert(
        distanceToSegment(other, SIGHT_GUARD) > SIGHT_RADIUS,
        "and the other two must be out of reach as segments at this radius",
      );
    }
    assert(
      distanceToLine(SIGHT_WALLS[2], SIGHT_GUARD) > SIGHT_RADIUS,
      "while the third's line is out of reach too, so it contributes to neither figure",
    );
    assert(
      distanceToLine(SIGHT_WALLS[1], SIGHT_GUARD) < SIGHT_RADIUS,
      "and the second's line is in reach, which is what makes the union a union",
    );
  }
  /* One-sided, and that is worth pinning separately: reading a wall as a line can only ever block a
     view, never open one. So the wrong version is safe as a cheap first pass and fatal as an answer -
     the same shape of conclusion as Section 5.1's grown box. */
  for (let i = 0; i < 720; i += 1) {
    const angle = (i / 720) * Math.PI * 2;
    for (const radius of [2, 4, SIGHT_RADIUS, 9]) {
      if (clearInDirection(angle, radius, true)) {
        assert(
          clearInDirection(angle, radius, false),
          `the line version claimed a clear view that is really blocked, at ${((angle * 180) / Math.PI).toFixed(1)} degrees`,
        );
      }
    }
  }
  /* And the answer depends on how far away the target is, which is a property of the question rather
     than a wobble in the measurement. Worth asserting so nobody quotes the figure without the radius. */
  {
    const at3 = sweepDisagreements(3, 36000).degrees;
    const at6 = sweepDisagreements(6, 36000).degrees;
    const at10 = sweepDisagreements(10, 36000).degrees;
    assert(
      near(at3, 0, 1e-9),
      `at three units out nothing disagrees, but ${at3} degrees did`,
    );
    assert(
      at6 > 100 && at10 > at6,
      `and it should grow with the reach, went ${at3}, ${at6}, ${at10}`,
    );
    /* The slider's range itself has to make sense before sweeping it is worth anything. A negative reach
       still produces finite numbers - the ring simply mirrors - so "the sweep did not blow up" is not
       enough, and a sabotage setting the minimum to -3 passed until this was added. */
    assert(
      SIGHT_RADIUS_RANGE.min > 0,
      `a reach of ${SIGHT_RADIUS_RANGE.min} units is not a distance`,
    );
    assert(
      SIGHT_RADIUS_RANGE.min < SIGHT_RADIUS &&
        SIGHT_RADIUS < SIGHT_RADIUS_RANGE.max,
      "and the slider has to be able to reach the default the page quotes",
    );
    assert(
      SIGHT_RADIUS_RANGE.step > 0 &&
        Number.isInteger(
          (SIGHT_RADIUS - SIGHT_RADIUS_RANGE.min) / SIGHT_RADIUS_RANGE.step,
        ),
      "and land on it exactly, or the reader cannot get back to the quoted figure",
    );

    /* The scene's radius slider spans this whole range, so every value it can reach has to produce a
       finite, sane figure - otherwise a reader could drag it somewhere the readout is nonsense. */
    for (
      let radius = SIGHT_RADIUS_RANGE.min;
      radius <= SIGHT_RADIUS_RANGE.max + 1e-9;
      radius += SIGHT_RADIUS_RANGE.step
    ) {
      const sweep = sweepDisagreements(radius, 3600);
      assert(
        Number.isFinite(sweep.degrees) &&
          sweep.degrees >= -1e-9 &&
          sweep.degrees <= 360,
        `the sweep at radius ${radius} gave ${sweep.degrees}`,
      );
      assert(
        sweep.clearDegrees >= sweep.wrongClearDegrees - 1e-9,
        `the wrong version can never see more than the right one, at radius ${radius}`,
      );
    }
  }
  /* The first blocker is the **nearest** one, which is what makes the result usable for anything beyond
     a boolean - a laser that stops at the right surface, a bullet hole on the right wall.
     
     This needs sight lines that cross two walls, and the first version of it had none: at six units out
     the guard cannot reach past the first wall to any of the others, so a sabotage returning the *last*
     blocker instead of the nearest passed. Sweeping further out fixes it, and the counter below makes
     the test refuse to be vacuous again. */
  let twoWallLines = 0;
  for (const radius of [SIGHT_RADIUS, 10, 14]) {
    for (let i = 0; i < 360; i += 1) {
      const angle = (i / 360) * Math.PI * 2;
      const target = {
        x: SIGHT_GUARD.x + Math.cos(angle) * radius,
        y: SIGHT_GUARD.y + Math.sin(angle) * radius,
      };
      const blocked = firstBlocker(SIGHT_GUARD, target, SIGHT_WALLS);
      if (blocked === null) continue;
      const sight: Segment = { a: SIGHT_GUARD, b: target };
      let crossed = 0;
      for (const wall of SIGHT_WALLS) {
        const other = segmentCrossing(sight, wall);
        if (other === null) continue;
        crossed += 1;
        assert(
          blocked.crossing.t <= other.t + 1e-12,
          `the reported blocker at t ${blocked.crossing.t} is not the nearest, ${other.t} is closer`,
        );
      }
      if (crossed > 1) twoWallLines += 1;
      // The reported hit really is on both the sight line and the wall it names.
      if (blocked.crossing.t > 1e-9) {
        assert(
          distanceToSegment(sight, blocked.crossing.point) < 1e-9 &&
            distanceToSegment(blocked.wall, blocked.crossing.point) < 1e-9,
          "the crossing point has to lie on both segments",
        );
      }

      /* And the same of the **wrong** version, which the scene now draws a marker at. Without this the
         phantom blocker could be the furthest one rather than the nearest and the picture would point at
         the wrong extension - a sabotage that passed until this was added. */
      const phantom = firstBlockerWrong(SIGHT_GUARD, target, SIGHT_WALLS);
      if (phantom !== null) {
        for (const wall of SIGHT_WALLS) {
          const other = lineCrossing(sight, wall);
          if (other === null || !containsT(other.t, "segment")) continue;
          assert(
            phantom.crossing.t <= other.t + 1e-12,
            `the phantom blocker at t ${phantom.crossing.t} is not the nearest, ${other.t} is closer`,
          );
        }
        // Its point is on the sight line, and on the wall's **line** but not necessarily the wall.
        assert(
          distanceToSegment(sight, phantom.crossing.point) < 1e-9,
          "the phantom crossing has to lie on the sight line",
        );
        assert(
          distanceToLine(phantom.wall, phantom.crossing.point) < 1e-9,
          "and on the line of the wall it blames",
        );
      }
    }
  }
  assert(
    twoWallLines > 20,
    `the nearest-blocker test is only meaningful on lines crossing two walls, and found ${twoWallLines}`,
  );
  // And hasLineOfSight is exactly firstBlocker being null, so the two can never drift apart.
  for (let i = 0; i < 720; i += 1) {
    const angle = (i / 720) * Math.PI * 2;
    const target = {
      x: SIGHT_GUARD.x + Math.cos(angle) * 5,
      y: SIGHT_GUARD.y + Math.sin(angle) * 5,
    };
    assert(
      hasLineOfSight(SIGHT_GUARD, target, SIGHT_WALLS) ===
        (firstBlocker(SIGHT_GUARD, target, SIGHT_WALLS) === null),
      "the boolean and the detailed answer must agree",
    );
  }

  // ---- The scenes' own arithmetic ----------------------------------------------------------

  for (const p of [
    SIGHT_START,
    { x: 0, y: 0 },
    SIGHT_GUARD,
    { x: SIGHT_BOUNDS.x, y: -SIGHT_BOUNDS.y },
  ]) {
    const screen = sightScreenOf(p);
    assert(
      samePoint(sightWorldOf(screen.x, screen.y), p, 1e-12),
      `the screen round trip failed for (${p.x}, ${p.y})`,
    );
  }
  assert(
    sightScreenOf({ x: 0, y: 1 }).y < sightScreenOf({ x: 0, y: 0 }).y,
    "a higher world point should be drawn nearer the top",
  );
  // Everything drawn has to be on the canvas: the walls, the guard, its compass, and any dragged point.
  for (const wall of SIGHT_WALLS) {
    for (const end of [wall.a, wall.b]) {
      const q = sightScreenOf(end);
      assert(
        q.x >= 0 &&
          q.x <= SIGHT_VIEW.width &&
          q.y >= 0 &&
          q.y <= SIGHT_VIEW.height,
        `a wall end is drawn off the canvas at (${q.x.toFixed(1)}, ${q.y.toFixed(1)})`,
      );
    }
  }
  for (const sx of [-SIGHT_BOUNDS.x, 0, SIGHT_BOUNDS.x]) {
    for (const sy of [-SIGHT_BOUNDS.y, 0, SIGHT_BOUNDS.y]) {
      const q = sightScreenOf({ x: sx, y: sy });
      assert(
        q.x >= 0 &&
          q.x <= SIGHT_VIEW.width &&
          q.y >= 0 &&
          q.y <= SIGHT_VIEW.height,
        `a dragged point at (${sx}, ${sy}) lands off the canvas`,
      );
    }
  }
  // The compass spokes run out to 1.35 units, and they have to fit too.
  for (let i = 0; i < 360; i += 1) {
    const angle = (i / 360) * Math.PI * 2;
    const q = sightScreenOf({
      x: SIGHT_GUARD.x + Math.cos(angle) * 1.35,
      y: SIGHT_GUARD.y + Math.sin(angle) * 1.35,
    });
    assert(
      q.x >= 0 &&
        q.x <= SIGHT_VIEW.width &&
        q.y >= 0 &&
        q.y <= SIGHT_VIEW.height,
      `a compass spoke reaches (${q.x.toFixed(1)}, ${q.y.toFixed(1)})`,
    );
  }
  assert(
    sightClampToBounds({ x: 30, y: -30 }).x === SIGHT_BOUNDS.x &&
      sightClampToBounds({ x: 30, y: -30 }).y === -SIGHT_BOUNDS.y,
    "and the clamp pulls a far drag back to the bounds",
  );
  // No float dust in coordinates that reach a readout or a committed values panel.
  for (const value of [
    SIGHT_GUARD.x,
    SIGHT_GUARD.y,
    SIGHT_START.x,
    SIGHT_START.y,
    NEAREST_WALL.a.x,
    NEAREST_WALL.a.y,
    NEAREST_WALL.b.x,
    NEAREST_WALL.b.y,
    ...SIGHT_WALLS.flatMap((w) => [w.a.x, w.a.y, w.b.x, w.b.y]),
  ]) {
    assert(
      Number.isInteger(value * 4),
      `${value} is not a quarter, so it risks printing with floating-point dust`,
    );
  }
  // The two scenes' opening state, so the first thing a reader sees is worth looking at.
  {
    const opening = nearestReport(SIGHT_START);
    assert(
      opening.clampMattered,
      "the nearest scene should open past an end, with the clamp visibly working",
    );
    assert(
      opening.toSegment > opening.toLine + 0.5,
      `and the two answers should differ visibly, ${opening.toSegment} against ${opening.toLine}`,
    );
    const sight = sightReport(SIGHT_START);
    assert(!sight.clear, "the sight scene should open on a blocked view");
    assert(
      !sight.disagrees,
      "with the wrong version agreeing, so the bug is something the reader goes and finds",
    );
    assert(
      sight.hitAt !== null,
      "and it should name where the view was blocked",
    );
    assert(
      distanceToSegment(sight.blocker!, sight.hitAt!) < 1e-9,
      "with that point lying on the wall it blames",
    );
  }
  /* Both scenes have to show a range of outcomes as the point is dragged, or a control would be doing
     nothing. Swept over the draggable area rather than sampled at two chosen spots. */
  {
    let clamped = 0;
    let unclamped = 0;
    let clear = 0;
    let blocked = 0;
    let disagreeing = 0;
    for (let i = 0; i <= 40; i += 1) {
      for (let j = 0; j <= 26; j += 1) {
        const p = {
          x: -SIGHT_BOUNDS.x + (i / 40) * 2 * SIGHT_BOUNDS.x,
          y: -SIGHT_BOUNDS.y + (j / 26) * 2 * SIGHT_BOUNDS.y,
        };
        if (nearestReport(p).clampMattered) clamped += 1;
        else unclamped += 1;
        const sight = sightReport(p);
        if (sight.clear) clear += 1;
        else blocked += 1;
        if (sight.disagrees) disagreeing += 1;
      }
    }
    assert(
      clamped > 50 && unclamped > 50,
      `the nearest scene needs plenty of both cases, had ${clamped} and ${unclamped}`,
    );
    assert(
      clear > 50 && blocked > 50,
      `the sight scene needs plenty of both outcomes, had ${clear} and ${blocked}`,
    );
    assert(
      disagreeing > 20,
      `and the reader should be able to find the line bug by dragging, found it at ${disagreeing} spots`,
    );
  }
};

/**
 * The separating axis test: swept against a brute-force overlap, and its two preconditions priced.
 *
 * The load-bearing assertion is SAT against an independent reference - corner containment by ray casting,
 * plus edge sampling for the cross-shaped overlaps where no corner is inside anything. Nothing in that
 * reference knows about axes or projections, so agreement across a few thousand configurations means both
 * are right.
 *
 * Then the two things the algorithm quietly requires. **Convex**, or it reports overlaps that are not
 * there and says nothing about it. And **normalized axes**, which do not affect the verdict at all but
 * decide which axis wins the shallowest-overlap comparison - so getting it wrong gives a correct hit test
 * and a push in the wrong direction, by up to 67 degrees here.
 */
export const satCheck2d: Demo = () => {
  const sameVector = (a: Vector, b: Vector, tol = 1e-9) =>
    Math.hypot(a.x - b.x, a.y - b.y) < tol;

  const SQUARE: Polygon = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
  ];

  // ---- Projection: only the corners matter, and that is convexity doing the work ----------

  for (const poly of [SQUARE, SAT_FIXED, SAT_MOVING, satRegular(7, 2.1)]) {
    for (let deg = 0; deg < 180; deg += 11) {
      const axis = {
        x: Math.cos((deg * Math.PI) / 180),
        y: Math.sin((deg * Math.PI) / 180),
      };
      const shadow = satProject(poly, axis);
      /* No interior point may reach past the corners' shadow. Checked over a grid inside the polygon,
         because "a convex shape is the blend of its corners" is the reason the projection is cheap, and
         it deserves testing rather than quoting. */
      for (let i = 0; i <= 12; i += 1) {
        for (let j = 0; j <= 12; j += 1) {
          const p = { x: -3 + (i / 12) * 6, y: -3 + (j / 12) * 6 };
          if (!satContains(poly, p)) continue;
          const along = dot(p, axis);
          assert(
            along >= shadow.min - 1e-9 && along <= shadow.max + 1e-9,
            `an interior point projected outside the corners' shadow at ${deg} degrees`,
          );
        }
      }
      // A shadow is never empty, and its ends are the right way round.
      assert(shadow.min <= shadow.max, "a shadow's min cannot exceed its max");
    }
  }

  // ---- The axes: one per edge, unit length, pointing outward -------------------------------

  /* Each shape **and its reverse**, which is what actually tests the winding normalization. Every polygon
     here happens to be counter-clockwise already, so `counterClockwise` was a no-op on all of them and a
     sabotage removing it passed. Reversing them is the only way to exercise it - and the assertion that
     was supposed to catch it compared a square's normal set against itself, which is closed under
     negation, so inward normals matched outward ones exactly. A triangle's is not. */
  for (const base of [SQUARE, SAT_FIXED, SAT_MOVING, SAT_CHEVRON]) {
    for (const poly of [base, [...base].reverse()]) {
      const normals = satEdgeNormals(poly);
      assert(
        normals.length === poly.length,
        `${poly.length} edges should give ${poly.length} normals, gave ${normals.length}`,
      );
      for (const n of normals) {
        assert(
          near(Math.hypot(n.x, n.y), 1, 1e-12),
          `a candidate axis should be unit length, was ${Math.hypot(n.x, n.y)}`,
        );
      }
      /* Outward, checked by stepping off each edge's midpoint: a short step along the normal must leave the
       polygon and a short step against it must stay inside. The verdict does not care about the direction,
       but Section 5.4's push does, so it is pinned here rather than discovered there. */
      const wound = satCounterClockwise(poly);
      const woundNormals = satEdgeNormals(wound);
      for (let i = 0; i < wound.length; i += 1) {
        const p = wound[i];
        const q = wound[(i + 1) % wound.length];
        const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
        const n = woundNormals[i];
        assert(
          !satContains(wound, { x: mid.x + n.x * 0.02, y: mid.y + n.y * 0.02 }),
          "a step along the normal should leave the polygon",
        );
        assert(
          satContains(wound, { x: mid.x - n.x * 0.02, y: mid.y - n.y * 0.02 }),
          "and a step against it should stay inside",
        );
      }
      // Each normal really is its edge turned ninety degrees: perpendicular, so the dot product is zero.
      for (let i = 0; i < wound.length; i += 1) {
        const edge = displacement(wound[i], wound[(i + 1) % wound.length]);
        assert(
          Math.abs(dot(edge, woundNormals[i])) < 1e-9,
          "a normal has to be perpendicular to its own edge",
        );
      }
    }
  }
  /* Winding is normalized rather than assumed, so reversing a polygon gives the same outward normals.
     Checked on a **triangle**, because a square's normal set is closed under negation and would match its
     own inward normals - which is exactly how the first version of this assertion passed a sabotage that
     removed the normalization entirely. */
  {
    const backwards = [...SAT_MOVING].reverse();
    assert(
      windingOf(SAT_MOVING) !== windingOf(backwards),
      "reversing a polygon should reverse its winding",
    );
    const forwardNormals = satEdgeNormals(SAT_MOVING);
    const backwardNormals = satEdgeNormals(backwards);
    for (const n of backwardNormals) {
      assert(
        forwardNormals.some((m) => sameVector(n, m, 1e-12)),
        "reversing a polygon should still yield the same set of outward normals",
      );
    }
    // And the set really is not closed under negation, or the assertion above proves nothing.
    assert(
      !forwardNormals.some((n) =>
        forwardNormals.some((m) => sameVector({ x: -n.x, y: -n.y }, m, 1e-9)),
      ),
      "a triangle's normals must not include any opposite pair, or this test is vacuous",
    );
    assert(
      SQUARE.map(() => 0).length === 4 &&
        satEdgeNormals(SQUARE).some((n) =>
          satEdgeNormals(SQUARE).some((m) =>
            sameVector({ x: -n.x, y: -n.y }, m, 1e-9),
          ),
        ),
      "while a square's normals do come in opposite pairs, which is why it was the wrong shape to use",
    );
  }
  // The counts the Section quotes, including the duplicates a rectangle brings.
  assert(
    satCandidateAxes(SAT_FIXED, SAT_MOVING).length === 8,
    "a pentagon and a triangle offer eight axes",
  );
  assert(
    satDistinctAxes(SAT_FIXED, SAT_MOVING) === 8,
    "and here all eight point in different directions",
  );
  {
    const shifted = SQUARE.map((p) => ({ x: p.x + 3, y: p.y }));
    assert(
      satCandidateAxes(SQUARE, shifted).length === 8,
      "two squares also offer eight",
    );
    assert(
      satDistinctAxes(SQUARE, shifted) === 2,
      `but only two directions, not ${satDistinctAxes(SQUARE, shifted)}`,
    );
  }
  // A repeated corner gives a zero-length edge, which contributes no axis rather than a NaN one.
  {
    const doubled: Polygon = [
      { x: -1, y: -1 },
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 0, y: 1 },
    ];
    const normals = satEdgeNormals(doubled);
    assert(
      normals.length === 3,
      `a repeated corner should be skipped, leaving 3 axes, not ${normals.length}`,
    );
    assert(
      normals.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y)),
      "and certainly not a NaN axis, which would separate nothing",
    );
  }

  // ---- SAT against a brute-force overlap ----------------------------------------------------

  /* The reference knows nothing about axes: it asks whether any corner of either shape is inside the
     other, and then samples along the edges to catch the cross-shaped overlaps where no corner is. */
  const bruteOverlap = (p: Polygon, q: Polygon, samples = 140) => {
    for (const c of p) if (satContains(q, c)) return true;
    for (const c of q) if (satContains(p, c)) return true;
    for (let i = 0; i < p.length; i += 1) {
      const a1 = p[i];
      const a2 = p[(i + 1) % p.length];
      for (let k = 0; k <= samples; k += 1) {
        const probe = {
          x: a1.x + (k / samples) * (a2.x - a1.x),
          y: a1.y + (k / samples) * (a2.y - a1.y),
        };
        if (satContains(q, probe)) return true;
      }
    }
    return false;
  };

  let checked = 0;
  let hits = 0;
  let misses = 0;
  for (const fixedSpin of [0, 41]) {
    const a = satFixedAt(fixedSpin);
    for (let i = 0; i <= 32; i += 1) {
      for (let j = 0; j <= 20; j += 1) {
        for (const spin of [0, 37, -80]) {
          const p = {
            x: -SAT_BOUNDS.x + (i / 32) * 2 * SAT_BOUNDS.x,
            y: -SAT_BOUNDS.y + (j / 20) * 2 * SAT_BOUNDS.y,
          };
          const b = satMovingAt(p, spin);
          const overlap = satOverlap(a, b);
          if (overlap) hits += 1;
          else misses += 1;
          /* Skip near-tangency, where a sampled reference cannot decide either. Measured as the shallowest
             overlap when they touch and the widest gap when they do not. */
          const push = satSmallestOverlap(a, b);
          const margin = push
            ? push.depth
            : Math.abs(
                satCandidateAxes(a, b).reduce(
                  (worst, axis) =>
                    Math.min(worst, satOverlapOnAxis(a, b, axis)),
                  Infinity,
                ),
              );
          if (margin < 0.02) continue;
          checked += 1;
          assert(
            overlap === bruteOverlap(a, b),
            `SAT disagreed with a brute-force overlap at (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) spin ${spin}`,
          );
        }
      }
    }
  }
  assert(
    checked > 2000,
    `the sweep should cover thousands of configurations, covered ${checked}`,
  );
  assert(
    hits > 300 && misses > 300,
    `and see plenty of both outcomes, saw ${hits} and ${misses}`,
  );

  // A separating axis, when one is reported, really does separate. And when none is, none does.
  for (let i = 0; i <= 24; i += 1) {
    for (let j = 0; j <= 16; j += 1) {
      const p = {
        x: -SAT_BOUNDS.x + (i / 24) * 2 * SAT_BOUNDS.x,
        y: -SAT_BOUNDS.y + (j / 16) * 2 * SAT_BOUNDS.y,
      };
      const a = satFixedAt(0);
      const b = satMovingAt(p, 15);
      const proof = satSeparatingAxis(a, b);
      if (proof !== null) {
        assert(
          satOverlapOnAxis(a, b, proof) <= 0,
          "a reported separating axis has to actually show a gap",
        );
        assert(!satOverlap(a, b), "and the shapes must be reported apart");
      } else {
        // No axis separates, so every single one has to overlap.
        for (const axis of satCandidateAxes(a, b)) {
          assert(
            satOverlapOnAxis(a, b, axis) > 0,
            "with no separating axis, every axis must overlap",
          );
        }
        assert(satOverlap(a, b), "and the shapes must be reported overlapping");
      }
      // A shape always overlaps itself, at every position and rotation.
      assert(satOverlap(b, b), "a polygon overlaps itself");
    }
  }

  // ---- Normalized axes: same verdict, different push ---------------------------------------

  {
    let overlapping = 0;
    let differentAxis = 0;
    let worstAngle = 0;
    const a = satFixedAt(0);
    // Swept over position **and** spin, because the figure the page quotes is the worst case anywhere in
    // the scene's range, and a single spin gave a materially different answer.
    for (let i = 0; i <= 48; i += 1) {
      for (let j = 0; j <= 30; j += 1) {
        for (let spin = SAT_SPIN.min; spin < SAT_SPIN.max; spin += 6) {
          const p = {
            x: -SAT_BOUNDS.x + (i / 48) * 2 * SAT_BOUNDS.x,
            y: -SAT_BOUNDS.y + (j / 30) * 2 * SAT_BOUNDS.y,
          };
          const b = satMovingAt(p, spin);
          const good = satSmallestOverlap(a, b);
          const raw = satSmallestOverlapRaw(a, b);
          /* The verdict is unaffected, always. Scaling an axis scales both shadows by the same factor, so
             the sign of the overlap cannot change - which is why this bug survives every hit test. */
          assert(
            (good === null) === (raw === null),
            `normalizing changed the verdict at (${p.x.toFixed(2)}, ${p.y.toFixed(2)}), which it must never do`,
          );
          if (good === null || raw === null) continue;
          overlapping += 1;
          const rawUnit = normalize(raw.axis)!;
          const cosBetween = Math.min(1, Math.abs(dot(good.axis, rawUnit)));
          const angle = (Math.acos(cosBetween) * 180) / Math.PI;
          if (angle > 1e-6) {
            differentAxis += 1;
            worstAngle = Math.max(worstAngle, angle);
          }
        }
      }
    }
    assert(
      overlapping > 20000,
      `there should be plenty of overlapping configurations to compare, had ${overlapping}`,
    );
    /* Just under half, and quoted as measured rather than rounded up to "most". An earlier draft asserted
       "most of the time" from a single spin where it read 60%; sweeping the whole range gives 47.56%, and
       the honest sentence is the one that survives the wider sweep. */
    assert(
      near(differentAxis / overlapping, 0.4756, 0.005),
      `the unnormalized version should pick a different axis at 47.56% of configurations, did at ${((differentAxis / overlapping) * 100).toFixed(2)}%`,
    );
    assert(
      near(worstAngle, 81.41, 0.05),
      `and be out by up to 81.41 degrees, was ${worstAngle}`,
    );
    // The shallowest depth is genuinely the smallest across every axis, which is what makes it minimal.
    const b = satMovingAt({ x: -1.6, y: 0.3 }, 25);
    const push = satSmallestOverlap(a, b);
    assert(push !== null, "these two overlap, so there is a push to compute");
    for (const axis of satCandidateAxes(a, b)) {
      assert(
        satOverlapOnAxis(a, b, axis) >= push!.depth - 1e-12,
        `no axis may be shallower than the reported minimum, ${satOverlapOnAxis(a, b, axis)} was`,
      );
    }
    assert(
      near(Math.hypot(push!.axis.x, push!.axis.y), 1, 1e-12),
      "and the push direction has to be a unit vector, or its depth is in the wrong units",
    );
  }

  // ---- Convexity is a precondition, not a formality ----------------------------------------

  assert(satSuitable(SQUARE), "a square is fine");
  assert(
    satSuitable(SAT_FIXED) && satSuitable(SAT_MOVING),
    "so are the scene's two shapes",
  );
  assert(
    !satSuitable(SAT_CHEVRON),
    "and the chevron is not, which is the point of it",
  );
  assert(
    !satSuitable([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]),
    "two corners are not a polygon",
  );

  /* The cost of ignoring that, measured. Every position where SAT claims an overlap while no corner of
     either shape is inside the other and no edge crosses - which is a false positive rather than a
     boundary quibble. */
  {
    const area = satFalseArea(300);
    assert(
      near(area.fraction, 0.0319, 5e-4),
      `the chevron's false-positive area should be 3.19% of the region sampled, was ${(area.fraction * 100).toFixed(3)}%`,
    );
    assert(
      near(area.falseArea, 1.307, 5e-3),
      `which is 1.307 square units, not ${area.falseArea}`,
    );
    // Converged, so the figure is a property of the shape rather than of the sampling.
    assert(
      Math.abs(satFalseArea(200).falseArea - satFalseArea(500).falseArea) <
        2e-3,
      "and the measurement has to have converged before it is worth quoting",
    );
    // The scene's opening position has to be one of them, or the scene opens on SAT being right.
    assert(
      satIsWrong(SAT_PROBE_START),
      "the concave scene should open somewhere SAT is lying",
    );
    const probe = satProbeAt(SAT_PROBE_START);
    assert(satOverlap(SAT_CHEVRON, probe), "SAT reports an overlap there");
    assert(
      !probe.some((c) => satContains(SAT_CHEVRON, c)),
      "while no corner of the probe is inside the shape",
    );
    assert(
      !SAT_CHEVRON.some((c) => satContains(probe, c)),
      "and no corner of the shape is inside the probe",
    );
    assert(
      !bruteOverlap(SAT_CHEVRON, probe),
      "so an honest test says they are apart",
    );
    /* The false region has to be findable by dragging, not a sliver only a search can locate. Counted as
       the cells the scene shades. */
    const cells = satFalseCells();
    assert(
      cells.length > 60,
      `the shaded region should be substantial, had ${cells.length} cells`,
    );
  }
  /* And on a convex shape the same measurement finds nothing at all, which is what makes the previous
     number attributable to concavity rather than to the probe or the sampling. */
  {
    let wrong = 0;
    for (let i = 0; i <= 80; i += 1) {
      for (let j = 0; j <= 80; j += 1) {
        const centre = { x: -3.2 + (i / 80) * 6.4, y: -3.2 + (j / 80) * 6.4 };
        const probe = satProbeAt(centre);
        if (!satOverlap(SAT_HULL, probe)) continue;
        if (
          !probe.some((c) => satContains(SAT_HULL, c)) &&
          !SAT_HULL.some((c) => satContains(probe, c)) &&
          !bruteOverlap(SAT_HULL, probe)
        ) {
          wrong += 1;
        }
      }
    }
    assert(
      wrong === 0,
      `on the chevron's own convex hull SAT should never be wrong, was at ${wrong} positions`,
    );
  }
  // The hull is convex, contains every original corner, and is not the original shape.
  assert(
    satSuitable(SAT_HULL),
    "a convex hull is convex, which is the one thing it must be",
  );
  for (const corner of SAT_CHEVRON) {
    assert(
      satContains(SAT_HULL, corner) ||
        SAT_HULL.some((h) => Math.hypot(h.x - corner.x, h.y - corner.y) < 1e-9),
      "every corner of the shape has to be in or on its hull",
    );
  }
  assert(
    SAT_HULL.length < SAT_CHEVRON.length,
    "and the chevron's hull should drop the reflex corner",
  );

  // ---- The scenes' own arithmetic ----------------------------------------------------------

  for (const p of [
    SAT_START,
    SAT_PROBE_START,
    { x: 0, y: 0 },
    { x: SAT_BOUNDS.x, y: -SAT_BOUNDS.y },
  ]) {
    const screen = satScreenOf(p);
    assert(
      Math.hypot(
        satWorldOf(screen.x, screen.y).x - p.x,
        satWorldOf(screen.x, screen.y).y - p.y,
      ) < 1e-12,
      `the screen round trip failed for (${p.x}, ${p.y})`,
    );
  }
  assert(
    satScreenOf({ x: 0, y: 1 }).y < satScreenOf({ x: 0, y: 0 }).y,
    "a higher world point should be drawn nearer the top",
  );
  /* Every corner of the moving triangle, at every bound and every five degrees of spin. The first version
     of BOUNDS let a corner off the top of the canvas once the triangle was turned half a turn, which is
     exactly the sort of thing a sweep catches and a glance does not. */
  for (let i = 0; i <= 16; i += 1) {
    for (let j = 0; j <= 16; j += 1) {
      for (let spin = SAT_SPIN.min; spin <= SAT_SPIN.max; spin += 5) {
        const p = {
          x: -SAT_BOUNDS.x + (i / 16) * 2 * SAT_BOUNDS.x,
          y: -SAT_BOUNDS.y + (j / 16) * 2 * SAT_BOUNDS.y,
        };
        for (const corner of satMovingAt(p, spin)) {
          const q = satScreenOf(corner);
          assert(
            q.x >= 0 &&
              q.x <= SAT_VIEW.width &&
              q.y >= 0 &&
              q.y <= SAT_VIEW.height,
            `the triangle at (${p.x.toFixed(2)}, ${p.y.toFixed(2)}) spin ${spin} reaches (${q.x.toFixed(1)}, ${q.y.toFixed(1)})`,
          );
        }
      }
    }
  }
  for (let spin = SAT_SPIN.min; spin <= SAT_SPIN.max; spin += 5) {
    for (const corner of satFixedAt(spin)) {
      const q = satScreenOf(corner);
      assert(
        q.x >= 0 && q.x <= SAT_VIEW.width && q.y >= 0 && q.y <= SAT_VIEW.height,
        `the pentagon at spin ${spin} reaches (${q.x.toFixed(1)}, ${q.y.toFixed(1)})`,
      );
    }
  }
  // The chevron, its hull and the probe at every bound have to fit too.
  for (const poly of [SAT_CHEVRON, SAT_HULL]) {
    for (const corner of poly) {
      const q = satScreenOf(corner);
      assert(
        q.x >= 0 && q.x <= SAT_VIEW.width && q.y >= 0 && q.y <= SAT_VIEW.height,
        "the concave scene's shape has to be on the canvas",
      );
    }
  }
  for (const sx of [-SAT_BOUNDS.x, 0, SAT_BOUNDS.x]) {
    for (const sy of [-SAT_BOUNDS.y, 0, SAT_BOUNDS.y]) {
      for (const corner of satProbeAt({ x: sx, y: sy })) {
        const q = satScreenOf(corner);
        assert(
          q.x >= 0 &&
            q.x <= SAT_VIEW.width &&
            q.y >= 0 &&
            q.y <= SAT_VIEW.height,
          `the probe at (${sx}, ${sy}) reaches (${q.x.toFixed(1)}, ${q.y.toFixed(1)})`,
        );
      }
    }
  }
  assert(
    satClamp({ x: 40, y: -40 }).x === SAT_BOUNDS.x &&
      satClamp({ x: 40, y: -40 }).y === -SAT_BOUNDS.y,
    "and the clamp pulls a far drag back to the bounds",
  );

  // The opening configuration: apart, and settled by the very first axis tried.
  {
    const opening = satReportOf(satFixedAt(0), satMovingAt(SAT_START, 0));
    assert(!opening.hit, "the separating scene should open on a miss");
    assert(opening.proof !== null, "with an axis to point at");
    assert(
      opening.tried === 1,
      `and the first axis should already settle it, took ${opening.tried}`,
    );
    assert(
      satOverlapOnAxis(
        satFixedAt(0),
        satMovingAt(SAT_START, 0),
        opening.proof!,
      ) < 0,
      "and that axis has to show a real gap",
    );
  }
  /* Both outcomes have to be reachable by dragging, or a control is doing nothing - and there have to be
     positions where the unnormalized push differs, or the scene's note never fires. */
  {
    let hit = 0;
    let miss = 0;
    let pushDiffers = 0;
    for (let i = 0; i <= 40; i += 1) {
      for (let j = 0; j <= 24; j += 1) {
        const p = {
          x: -SAT_BOUNDS.x + (i / 40) * 2 * SAT_BOUNDS.x,
          y: -SAT_BOUNDS.y + (j / 24) * 2 * SAT_BOUNDS.y,
        };
        const report = satReportOf(satFixedAt(0), satMovingAt(p, 0));
        if (report.hit) hit += 1;
        else miss += 1;
        if (report.pushDisagrees) pushDiffers += 1;
        // The report's own fields have to stay consistent with each other.
        assert(
          report.hit === (report.proof === null),
          "a hit is exactly the absence of a separating axis",
        );
        assert(
          report.hit === (report.push !== null),
          "and a push exists exactly when they overlap",
        );
      }
    }
    assert(
      hit > 50 && miss > 50,
      `both outcomes should be easy to find, had ${hit} and ${miss}`,
    );
    assert(
      pushDiffers > 20,
      `and the unnormalized note should fire somewhere, fired at ${pushDiffers} positions`,
    );
  }
};

/**
 * Collision response: the split, the guards, and tunnelling priced in closed form against measurement.
 *
 * Two claims carry this Section and both are checked the same way - derived, then measured, then compared.
 *
 * **Tunnelling has a probability, not just a threshold.** Above the escape speed whether a wall is noticed
 * depends on where the frame boundaries fall, and the fraction of alignments that slip past is
 * $1 - v_{\text{escape}}/v$. My first attempt at measuring this reported "detected" at every speed I
 * happened to try, because the speeds I chose all landed a frame inside the wall - which is exactly how the
 * bug behaves in a real game, and exactly why the honest measure is a fraction.
 *
 * **A corner's residual decays at $\cos^2\phi$ per pass.** The first version of `convergenceRate` returned
 * $|\cos\phi|$, and every measured ratio was its square. Normals $90°$ or less apart settle exactly in one
 * pass; beyond that they only approach the answer.
 */
export const responseCheck2d: Demo = () => {
  const sameVector = (a: Vector, b: Vector, tol = 1e-9) =>
    Math.hypot(a.x - b.x, a.y - b.y) < tol;

  // ---- The split is a right-angle decomposition ---------------------------------------------

  for (let wall = WALL_RANGE.min; wall <= WALL_RANGE.max; wall += 4) {
    for (let vel = VELOCITY_RANGE.min; vel <= VELOCITY_RANGE.max; vel += 7) {
      const r = deflectReport(wall, vel, 0);
      // The normal really is unit length, which every formula here depends on.
      assert(
        near(Math.hypot(r.normal.x, r.normal.y), 1, 1e-12),
        `the wall normal must be unit length, was ${Math.hypot(r.normal.x, r.normal.y)}`,
      );
      assert(
        Math.abs(dot(r.normal, r.along)) < 1e-12,
        "and perpendicular to the wall it belongs to",
      );
      // The two parts add back to the whole, and they are perpendicular to each other.
      assert(
        sameVector(
          combine(r.normalComponent, r.tangentComponent),
          r.velocity,
          1e-12,
        ),
        "normal part plus tangent part has to be the velocity",
      );
      assert(
        Math.abs(dot(r.normalComponent, r.tangentComponent)) < 1e-12,
        "and the two parts have to be perpendicular",
      );
      // A slide is exactly the tangent part, and it has nothing left pointing at the wall.
      assert(
        sameVector(r.slid, r.tangentComponent, 1e-12),
        "a slide is the tangent part and nothing else",
      );
      assert(
        Math.abs(dot(r.slid, r.normal)) < 1e-12,
        "so a slid velocity has no component along the normal at all",
      );
      // A perfect bounce changes direction and not speed.
      assert(
        near(
          Math.hypot(r.bounced.x, r.bounced.y),
          Math.hypot(r.velocity.x, r.velocity.y),
          1e-12,
        ),
        "a perfect bounce must preserve speed exactly",
      );
      /* And it reverses only the normal part: the tangent part is untouched, which is what makes a bounce a
         reflection rather than a reversal. */
      assert(
        near(dot(r.bounced, r.along), dot(r.velocity, r.along), 1e-12),
        "a bounce leaves the along-the-wall part alone",
      );
      assert(
        near(dot(r.bounced, r.normal), -dot(r.velocity, r.normal), 1e-12),
        "and flips the into-the-wall part",
      );
      // The speed a slide keeps is the cosine of the angle from the wall, which the page tabulates.
      assert(
        near(
          Math.hypot(r.slid.x, r.slid.y) /
            Math.hypot(r.velocity.x, r.velocity.y),
          r.kept,
          1e-12,
        ),
        "the surviving speed fraction should be cos of the angle from the wall",
      );
    }
  }
  // The table the page prints, to four places.
  for (const [degrees, fraction] of [
    [0, 1],
    [30, 0.866],
    [45, 0.7071],
    [60, 0.5],
    [90, 0],
  ] as const) {
    assert(
      near(slideSpeedFraction(toRadians(degrees)), fraction, 5e-4),
      `a slide at ${degrees} degrees from the wall should keep ${fraction}, keeps ${slideSpeedFraction(toRadians(degrees))}`,
    );
  }
  // Restitution really does blend between the two, linearly in the normal component.
  {
    const r = deflectReport(0, -40, 0);
    for (const e of [0, 0.25, 0.5, 0.75, 1]) {
      const responded = respond(r.velocity, r.normal, e);
      assert(
        near(dot(responded, r.normal), -e * dot(r.velocity, r.normal), 1e-12),
        `restitution ${e} should scale the reversed normal part by exactly ${e}`,
      );
      assert(
        near(dot(responded, r.along), dot(r.velocity, r.along), 1e-12),
        "and never touch the along-the-wall part",
      );
    }
    assert(
      sameVector(
        respond(r.velocity, r.normal, 0),
        slide(r.velocity, r.normal),
        1e-12,
      ),
      "restitution 0 is a slide",
    );
    assert(
      sameVector(
        respond(r.velocity, r.normal, 1),
        reflect(r.velocity, r.normal),
        1e-12,
      ),
      "and restitution 1 is a reflection",
    );
  }

  // ---- The unit-normal assumption, priced ---------------------------------------------------

  /* Unlike Section 5.3's axes, where scaling changed nothing about the verdict, here it wrecks the answer:
     the correction is scaled by the square of the normal's length. A normal of length 2 removes four times
     too much and the result points the wrong way entirely. */
  {
    const v = { x: 1, y: -1 };
    const unit = { x: 0, y: 1 };
    assert(
      sameVector(slide(v, unit), { x: 1, y: 0 }, 1e-12),
      "with a unit normal the slide is clean",
    );
    for (const scale of [0.5, 2, 3]) {
      const stretched = { x: 0, y: scale };
      const wrong = slide(v, stretched);
      // The removal is scaled by the square, so the surviving normal component is 1 - scale squared.
      assert(
        near(wrong.y, -1 + scale * scale, 1e-12),
        `a normal of length ${scale} should leave ${-1 + scale * scale} on the normal axis, left ${wrong.y}`,
      );
      assert(
        !sameVector(wrong, slide(v, unit), 1e-9),
        "which is not the right answer",
      );
    }
    // At length 2 the result points *into* the wall harder than the input did.
    assert(
      slide(v, { x: 0, y: 2 }).y > 0 && v.y < 0,
      "at length 2 the sign flips, so the character is thrown out of the wall instead of sliding",
    );
  }

  // ---- The one-sided guard ------------------------------------------------------------------

  {
    const n = { x: 0, y: 1 };
    assert(
      movingInto({ x: 1, y: -1 }, n),
      "downward into an upward normal is moving in",
    );
    assert(!movingInto({ x: 1, y: 1 }, n), "upward is not");
    assert(
      !movingInto({ x: 1, y: 0 }, n),
      "and exactly along the wall is not either",
    );
    // The guard is the whole difference between sliding and sticking.
    assert(
      sameVector(resolveVelocity({ x: 1, y: 1 }, n), { x: 1, y: 1 }, 1e-15),
      "an outward velocity has to be left completely alone",
    );
    assert(
      sameVector(slide({ x: 1, y: 1 }, n), { x: 1, y: 0 }, 1e-15),
      "while an unguarded slide cancels its outward part, which is what sticking is",
    );
    // Swept: the guard never changes the answer for an inbound velocity, and always does for an outbound one.
    for (let deg = 0; deg < 360; deg += 3) {
      const v = {
        x: Math.cos(toRadians(deg)) * 2,
        y: Math.sin(toRadians(deg)) * 2,
      };
      if (movingInto(v, n)) {
        assert(
          sameVector(resolveVelocity(v, n), slide(v, n), 1e-12),
          "for an inbound velocity the guard changes nothing",
        );
      } else {
        assert(
          sameVector(resolveVelocity(v, n), v, 1e-15),
          "and for an outbound one it changes everything",
        );
      }
    }
  }

  // ---- Push-out and the skin ----------------------------------------------------------------

  {
    const contact = { normal: { x: 0, y: 1 }, depth: 0.25 };
    const p = { x: 0, y: -0.25 };
    assert(
      sameVector(pushOutExactly(p, contact), { x: 0, y: 0 }, 1e-15),
      "an exact push-out removes the overlap and no more",
    );
    assert(
      near(pushOut(p, contact).y, SKIN, 1e-15),
      `and with the skin it clears by exactly ${SKIN}`,
    );
    assert(
      SKIN > 0 && SKIN < 0.01,
      "the skin has to be positive and invisible",
    );
    // Whatever the depth and whatever the normal, the result is clear of the surface by the skin.
    for (let deg = 0; deg < 360; deg += 11) {
      const normal = {
        x: Math.cos(toRadians(deg)),
        y: Math.sin(toRadians(deg)),
      };
      for (const depth of [0.001, 0.25, 3]) {
        const from = { x: 1.5, y: -0.5 };
        const to = pushOut(from, { normal, depth });
        assert(
          near(dot(displacement(from, to), normal), depth + SKIN, 1e-12),
          "the push has to be exactly depth plus skin, along the normal",
        );
        assert(
          Math.abs(cross(displacement(from, to), normal)) < 1e-12,
          "and along the normal only, with no sideways drift",
        );
      }
    }
    // Several contacts push out along each in turn, and the order cannot matter for positions.
    const contacts = [
      { normal: { x: 1, y: 0 }, depth: 0.2 },
      { normal: { x: 0, y: 1 }, depth: 0.3 },
    ];
    assert(
      sameVector(
        pushOutAll({ x: 0, y: 0 }, contacts),
        pushOutAll({ x: 0, y: 0 }, [...contacts].reverse()),
        1e-15,
      ),
      "pushing out of several contacts is order-independent, because it is just addition",
    );
  }

  // ---- Corners: the residual, and how fast it decays ----------------------------------------

  /* The right-angled corner is exact in one pass, which is worth pinning because it is the case a tile-based
     game hits constantly and the expensive behaviour below never shows up there. */
  {
    const right = [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    assert(
      near(convergenceRate(right[0], right[1]), 0, 1e-15),
      "perpendicular normals have a decay rate of zero, meaning one pass is exact",
    );
    for (let deg = 0; deg < 360; deg += 1) {
      const v = {
        x: Math.cos(toRadians(deg)) * 2,
        y: Math.sin(toRadians(deg)) * 2,
      };
      const settled = settleVelocity(v, right, 0, 8, 1e-12);
      assert(
        settled.settled && settled.passes <= 1,
        `a right-angled corner should settle in one pass, took ${settled.passes} at ${deg} degrees`,
      );
    }
    const blocked = settleVelocity({ x: -1, y: -1 }, right, 0, 8, 1e-12);
    assert(
      sameVector(blocked.velocity, { x: 0, y: 0 }, 1e-15),
      "and a velocity into both walls has to come out exactly zero",
    );
  }

  /* Beyond a right angle the two projections fight, and the residual falls by cos squared of the angle
     between the normals - measured against the prediction, which is what caught the missing square. */
  for (const between of [120, 150, 170]) {
    const n1 = { x: 1, y: 0 };
    const n2 = {
      x: Math.cos(toRadians(between)),
      y: Math.sin(toRadians(between)),
    };
    const predicted = convergenceRate(n1, n2);
    // A velocity along the bisector of the blocked cone, so the true answer is zero and the decay is clean.
    const bisector = toRadians(between / 2) + Math.PI;
    const v = { x: Math.cos(bisector) * 2, y: Math.sin(bisector) * 2 };
    const residuals = Array.from(
      { length: 8 },
      (_, i) => settleVelocity(v, [n1, n2], 0, i + 1, 0).residual,
    );
    for (let i = 1; i < residuals.length; i += 1) {
      assert(
        near(residuals[i] / residuals[i - 1], predicted, 1e-6),
        `the residual should fall by cos squared = ${predicted} per pass at ${between} degrees, fell by ${residuals[i] / residuals[i - 1]}`,
      );
    }
    /* It converges, and **how many passes that takes is predictable from the rate** - which is a far
       stronger claim than "it settles eventually". An earlier version asserted it settled within 400
       passes and was simply wrong at 170 degrees, where the rate of 0.96985 needs about 866 of them.
       
       From a residual of $r_1$ after the first pass, reaching a tolerance $\tau$ takes
       $\ln(\tau/r_1)/\ln(\text{rate})$ further passes. */
    const tolerance = 1e-12;
    const predictedPasses =
      1 + Math.ceil(Math.log(tolerance / residuals[0]) / Math.log(predicted));
    assert(
      settleVelocity(v, [n1, n2], 0, predictedPasses + 1, tolerance).settled,
      `${between} degrees apart should settle in the predicted ${predictedPasses} passes`,
    );
    assert(
      !settleVelocity(v, [n1, n2], 0, predictedPasses - 2, tolerance).settled,
      `and not in ${predictedPasses - 2}, or the prediction is not tight`,
    );
    assert(
      predictedPasses > 1,
      "and it must take more than the single pass a right angle needs",
    );
  }
  // Normals a right angle or less apart never fight at all, which is the other half of the claim.
  for (const between of [15, 45, 60, 89, 90]) {
    const n1 = { x: 1, y: 0 };
    const n2 = {
      x: Math.cos(toRadians(between)),
      y: Math.sin(toRadians(between)),
    };
    for (let deg = 0; deg < 360; deg += 5) {
      const v = {
        x: Math.cos(toRadians(deg)) * 2,
        y: Math.sin(toRadians(deg)) * 2,
      };
      const settled = settleVelocity(v, [n1, n2], 0, 8, 1e-9);
      assert(
        settled.settled,
        `normals ${between} degrees apart should always settle, did not at ${deg} degrees`,
      );
      assert(
        settled.passes <= 1,
        `and in a single pass, took ${settled.passes} at ${between}/${deg}`,
      );
    }
  }

  // ---- Tunnelling: closed form against measurement ------------------------------------------

  assert(
    near(tunnellingSpeed(WALL_THICKNESS, FRAME), 15, 1e-9),
    `the scene's wall should have an escape speed of 15, has ${tunnellingSpeed(WALL_THICKNESS, FRAME)}`,
  );
  assert(
    near(tunnellingSpeed(0.1, 1 / 60), 6, 1e-9),
    "and a wall a tenth thick at 60 fps only 6",
  );
  assert(
    near(tunnellingSpeed(0.1, 1 / 30), 3, 1e-9),
    "which halves again at 30 fps",
  );
  // Below the escape speed no alignment can slip past, which is the one guarantee available.
  for (const speed of [2, 8, 14.9, 15]) {
    assert(
      tunnellingChance(speed, FRAME, WALL_THICKNESS) === 0,
      `nothing should tunnel at ${speed}, chance was ${tunnellingChance(speed, FRAME, WALL_THICKNESS)}`,
    );
    assert(
      measuredTunnelChance(speed, 1, 200) === 0,
      `and measuring should agree at ${speed}`,
    );
  }
  /* Above it, the closed form has to match a sweep over start offsets. Two unrelated computations - one an
     expression, one a count of simulated frames - so agreement means both are right. */
  for (const speed of [16, 20, 30, 45, 60]) {
    const predicted = tunnellingChance(speed, FRAME, WALL_THICKNESS);
    const measured = measuredTunnelChance(speed, 1, 2000);
    assert(
      near(measured, predicted, 2e-3),
      `at speed ${speed} the closed form says ${predicted} and the sweep found ${measured}`,
    );
  }
  // The headline pair: twice the escape speed tunnels half the time, four times it three quarters.
  assert(
    near(tunnellingChance(30, FRAME, WALL_THICKNESS), 0.5, 1e-12),
    "twice the escape speed should tunnel half the time",
  );
  assert(
    near(tunnellingChance(60, FRAME, WALL_THICKNESS), 0.75, 1e-12),
    "and four times it, three quarters",
  );

  /* And `substepsNeeded` has to be exactly enough - not approximately. At each speed, the recommended count
     drives the measured chance to zero and one fewer does not. That is the assertion that makes the fix
     trustworthy rather than plausible. */
  for (const speed of [20, 30, 45, 60]) {
    const needed = substepsNeeded(speed, FRAME, WALL_THICKNESS);
    assert(
      measuredTunnelChance(speed, needed, 400) === 0,
      `${needed} substeps should eliminate tunnelling at speed ${speed}`,
    );
    if (needed > 1) {
      assert(
        measuredTunnelChance(speed, needed - 1, 400) > 0,
        `and ${needed - 1} should not be enough at speed ${speed}, so the count is tight`,
      );
    }
    // Each substep is then shorter than the wall is thick, which is the reason it works.
    assert(
      stepDistance(speed, FRAME) / needed <= WALL_THICKNESS + 1e-12,
      "each substep has to be no longer than the wall is thick",
    );
  }
  // Capping the speed also works, and the cost is stated rather than hidden.
  {
    const v = { x: 40, y: 0 };
    const capped = cappedSpeed(v, FRAME, WALL_THICKNESS);
    assert(
      near(length(capped), tunnellingSpeed(WALL_THICKNESS, FRAME), 1e-12),
      "capping brings the speed down to exactly the escape speed",
    );
    assert(
      near(length(capped) / length(v), 0.375, 1e-12),
      `which for a speed of 40 is 37.5% of what was asked for, not ${length(capped) / length(v)}`,
    );
    assert(
      Math.abs(cross(capped, v)) < 1e-12,
      "and it keeps the direction, only shortening it",
    );
    // A velocity already slow enough is untouched.
    assert(
      sameVector(
        cappedSpeed({ x: 3, y: 0 }, FRAME, WALL_THICKNESS),
        { x: 3, y: 0 },
        1e-15,
      ),
      "a slow velocity passes through the cap unchanged",
    );
  }

  // ---- The scenes' own arithmetic ----------------------------------------------------------

  for (const p of [CONTACT, { x: 0, y: 0 }, { x: 3.2, y: -1.4 }]) {
    const screen = deflectScreenOf(p);
    assert(
      sameVector(deflectWorldOf(screen.x, screen.y), p, 1e-12),
      `the screen round trip failed for (${p.x}, ${p.y})`,
    );
  }
  assert(
    deflectScreenOf({ x: 0, y: 1 }).y < deflectScreenOf({ x: 0, y: 0 }).y,
    "a higher world point should be drawn nearer the top",
  );
  /* Every arrow the deflect scene draws, at every slider position. All five start at the contact point, so
     a tip off the canvas is the failure mode - and with a bounce the result arrow is the longest of them. */
  for (let wall = WALL_RANGE.min; wall <= WALL_RANGE.max; wall += 2) {
    for (let vel = VELOCITY_RANGE.min; vel <= VELOCITY_RANGE.max; vel += 3) {
      const r = deflectReport(wall, vel, 1);
      for (const v of [
        r.velocity,
        reversed(r.velocity),
        r.slid,
        r.bounced,
        r.responded,
        r.normalComponent,
        r.tangentComponent,
        r.normal,
      ]) {
        const q = deflectScreenOf(tipOf(v));
        assert(
          q.x >= 0 &&
            q.x <= DEFLECT_VIEW.width &&
            q.y >= 0 &&
            q.y <= DEFLECT_VIEW.height,
          `an arrow tip leaves the canvas at wall ${wall}, velocity ${vel}: (${q.x.toFixed(1)}, ${q.y.toFixed(1)})`,
        );
      }
    }
  }
  /* The wall is a **surface**, so both drawn ends have to be *outside* the canvas at every angle - otherwise
     it appears to stop short and reads as a segment. This is the inverse of every other fit assertion in
     this file, and getting it the usual way round would have accepted a horizontal wall ending 34 pixels
     shy of the right edge. */
  for (let wall = WALL_RANGE.min; wall <= WALL_RANGE.max; wall += 1) {
    const { along } = wallFrom(wall);
    for (const sign of [-1, 1]) {
      const q = deflectScreenOf({
        x: CONTACT.x + along.x * WALL_DRAW_LENGTH * sign,
        y: CONTACT.y + along.y * WALL_DRAW_LENGTH * sign,
      });
      assert(
        q.x < 0 ||
          q.x > DEFLECT_VIEW.width ||
          q.y < 0 ||
          q.y > DEFLECT_VIEW.height,
        `the wall at ${wall} degrees ends inside the canvas at (${q.x.toFixed(1)}, ${q.y.toFixed(1)}), so it looks like a stub`,
      );
    }
  }
  // The substep scene's wall, and its mover, at every slider combination the reader can reach.
  for (const corner of [THIN_WALL.min, THIN_WALL.max]) {
    const q = deflectScreenOf(corner);
    assert(
      q.x >= 0 &&
        q.x <= DEFLECT_VIEW.width &&
        q.y >= 0 &&
        q.y <= DEFLECT_VIEW.height,
      "the thin wall has to be on the canvas",
    );
  }
  for (let speed = MOVER_SPEED.min; speed <= MOVER_SPEED.max; speed += 2) {
    for (const phase of [0, 0.5, 1]) {
      const r = substepReport(speed, 4, phase);
      assert(
        r.frames.length > 2,
        `the mover should take several frames at speed ${speed}`,
      );
      assert(
        r.before.x < THIN_WALL.min.x,
        "the deciding frame has to begin short of the wall",
      );
      assert(
        r.substepsAt.length === 4,
        "and there should be one drawn position per substep",
      );
      assert(
        r.frames.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
        "with no non-finite positions anywhere",
      );
      // The scene claims a hit exactly when the sweep found one.
      assert(
        r.tunnelled === (r.hit === null),
        "tunnelled has to mean no substep landed inside",
      );
      if (r.hit !== null) {
        assert(
          insideWall(r.hit),
          "and a reported hit really is inside the wall",
        );
      }
    }
  }
  /* The scene has to be able to show both outcomes, and the phase slider has to be what changes it - or the
     control that carries the Section's point does nothing. */
  {
    let phasesThatTunnel = 0;
    let phasesThatCatch = 0;
    for (let i = 0; i <= 50; i += 1) {
      if (substepReport(30, 1, i / 50).tunnelled) phasesThatTunnel += 1;
      else phasesThatCatch += 1;
    }
    assert(
      phasesThatTunnel > 5 && phasesThatCatch > 5,
      `sliding the phase at speed 30 should show both outcomes, showed ${phasesThatTunnel} and ${phasesThatCatch}`,
    );
    // And at a safe speed no phase tunnels, so the slider correctly shows nothing to worry about.
    for (let i = 0; i <= 50; i += 1) {
      assert(
        !substepReport(10, 1, i / 50).tunnelled,
        "below the escape speed no phase should tunnel",
      );
    }
  }
  // The deflect scene's opening state: moving into the wall, so the response visibly does something.
  {
    const opening = deflectReport(-18, -125, 0);
    assert(
      opening.intoWall,
      "the deflect scene should open on a velocity heading into the wall",
    );
    assert(
      opening.kept > 0.1 && opening.kept < 0.95,
      `and at an angle where the slide neither keeps everything nor nothing, keeps ${opening.kept}`,
    );
  }
};

/**
 * Velocity, gravity and jump arcs: the integrator identity, and the jump that quietly comes out short.
 *
 * The load-bearing result is an **exact identity** rather than a tolerance, which is unusual for this file
 * and is what makes the Section worth writing. Explicit and semi-implicit Euler are wrong by
 * $\tfrac{1}{2}a\,\Delta t^2 n$ in opposite directions, so their average is the closed form exactly, and the
 * midpoint step *is* that average computed directly. All three claims are checked to floating-point dust
 * across several accelerations and step sizes.
 *
 * The consequence is the part that matters to a game: at 60 fps, a jump asked to be two units high comes out
 * $1.9167$ - four percent short - and the drift formula predicts that number before it is measured.
 */
export const physicsCheck2d: Demo = () => {
  const bodyAt = (vy: number): PhysicsBody => ({
    position: { x: 0, y: 0 },
    velocity: { x: 2, y: vy },
  });

  // ---- The midpoint step is exact, not merely better ----------------------------------------

  for (const a of [-25, -9.81, 3.5, 0]) {
    for (const dt of [1 / 10, 1 / 30, 1 / 60, 0.2]) {
      const start = bodyAt(7);
      let body = start;
      for (let i = 1; i <= 60; i += 1) {
        body = stepMidpoint(body, { x: 0, y: a }, dt);
        const truth = exactAt(start, { x: 0, y: a }, i * dt);
        assert(
          Math.abs(body.position.y - truth.y) < 1e-11 &&
            Math.abs(body.position.x - truth.x) < 1e-11,
          `the midpoint step should be exact, drifted ${body.position.y - truth.y} at a ${a}, dt ${dt}`,
        );
      }
    }
  }

  /* Both Euler forms are wrong, and **equally** wrong in opposite directions - so their average is the truth.
     This is the identity the Section is built on, so it is asserted three ways: the sum of the two errors is
     zero, the average matches the closed form, and the midpoint step matches the average. */
  for (const a of [-25, -9.81, 4]) {
    for (const dt of [1 / 10, 1 / 30, 1 / 60]) {
      const start = bodyAt(7);
      let explicitBody = start;
      let semiBody = start;
      let midBody = start;
      for (let i = 1; i <= 40; i += 1) {
        explicitBody = stepExplicit(explicitBody, { x: 0, y: a }, dt);
        semiBody = stepSemiImplicit(semiBody, { x: 0, y: a }, dt);
        midBody = stepMidpoint(midBody, { x: 0, y: a }, dt);
        const truth = exactAt(start, { x: 0, y: a }, i * dt).y;
        const explicitError = explicitBody.position.y - truth;
        const semiError = semiBody.position.y - truth;
        assert(
          Math.abs(explicitError + semiError) < 1e-11,
          `the two Euler errors should cancel, summed to ${explicitError + semiError}`,
        );
        assert(
          Math.abs(
            (explicitBody.position.y + semiBody.position.y) / 2 - truth,
          ) < 1e-11,
          "so their average should be the closed form exactly",
        );
        assert(
          Math.abs(
            midBody.position.y -
              (explicitBody.position.y + semiBody.position.y) / 2,
          ) < 1e-11,
          "and the midpoint step should be that average, computed directly",
        );
        // The bracket, in the direction gravity makes it: explicit high, semi-implicit low.
        if (a < 0 && i > 1) {
          assert(
            explicitBody.position.y > truth && truth > semiBody.position.y,
            `explicit should sit above the truth and semi-implicit below it at step ${i}`,
          );
        }
      }
    }
  }

  /* And the drift has a closed form of its own, which predicts each integrator's error exactly. Two useful
     things follow: the error grows linearly in time rather than quadratically, and halving the step halves
     it - both asserted below rather than left as remarks. */
  for (const a of [-25, -9.81, 4]) {
    for (const dt of [1 / 10, 1 / 30, 1 / 60]) {
      for (const which of INTEGRATORS) {
        const start = bodyAt(7);
        let body = start;
        for (let i = 1; i <= 30; i += 1) {
          body = physicsStep(body, { x: 0, y: a }, dt, which);
          const truth = exactAt(start, { x: 0, y: a }, i * dt).y;
          assert(
            Math.abs(body.position.y - truth - driftAfter(a, dt, i, which)) <
              1e-11,
            `the drift formula should predict ${which}'s error exactly, off by ${body.position.y - truth - driftAfter(a, dt, i, which)}`,
          );
        }
      }
    }
  }
  for (const which of ["explicit", "semi-implicit"] as const) {
    // Linear in the step count, at a fixed step size.
    assert(
      near(
        driftAfter(-25, 1 / 60, 20, which) / driftAfter(-25, 1 / 60, 10, which),
        2,
        1e-12,
      ),
      "twice as many steps should mean twice the drift",
    );
    // And proportional to the step size, over a fixed span of time.
    const overSameTime = (fps: number) =>
      Math.abs(driftAfter(-25, 1 / fps, Math.round(0.4 * fps), which));
    assert(
      near(overSameTime(10) / overSameTime(20), 2, 1e-12) &&
        near(overSameTime(20) / overSameTime(40), 2, 1e-12),
      "and halving the timestep should halve the drift over the same span",
    );
  }
  assert(
    driftAfter(-25, 1 / 60, 100, "midpoint") === 0,
    "while the midpoint form drifts by nothing at all",
  );

  // ---- Solving a jump backwards --------------------------------------------------------------

  for (const [h, t] of [
    [2, 0.4],
    [2.5, 0.5],
    [1, 0.25],
    [3.4, 0.7],
    [0.8, 0.2],
  ] as const) {
    const { launch, gravity } = jumpFromHeightAndTime(h, t);
    const back = apexOf(launch, gravity);
    assert(
      near(back.height, h, 1e-12) && near(back.timeToApex, t, 1e-12),
      `the jump round trip should be exact, gave height ${back.height} and time ${back.timeToApex}`,
    );
    assert(
      launch > 0 && gravity < 0,
      "a jump launches upward against downward gravity",
    );
    // And the closed form really does reach that height at that time.
    const peak = exactAt(
      { position: { x: 0, y: 0 }, velocity: { x: 0, y: launch } },
      { x: 0, y: gravity },
      t,
    );
    assert(
      near(peak.y, h, 1e-12),
      `the exact arc should peak at ${h}, peaked at ${peak.y}`,
    );
    // The apex is where the velocity crosses zero, which is the definition the algebra came from.
    assert(
      near(launch + gravity * t, 0, 1e-12),
      "and the vertical velocity should be exactly zero there",
    );
    // Airtime and time-to-apex are the same jump described twice.
    assert(
      near(jumpFromHeightAndAirtime(h, 2 * t).launch, launch, 1e-12),
      "airtime and time-to-apex should give the same jump",
    );
  }
  // The headline pair the page quotes.
  assert(
    near(jumpFromHeightAndTime(2, 0.4).launch, 10, 1e-12) &&
      near(jumpFromHeightAndTime(2, 0.4).gravity, -25, 1e-12),
    "two units in four tenths of a second is a launch of 10 against a gravity of -25",
  );

  // ---- The jump that comes out short --------------------------------------------------------

  /* The consequence of the drift, in the units a designer cares about. At 60 fps semi-implicit Euler reaches
     1.9167 of a requested 2 - and the drift formula predicted exactly that before the arc was stepped. */
  {
    const arc = leapArcFor(2, 0.4, 60, "semi-implicit");
    assert(
      near(arc.peak - LEAP_GROUND, 1.916667, 1e-5),
      `a 2-unit jump at 60 fps should reach 1.9167, reached ${arc.peak - LEAP_GROUND}`,
    );
    assert(
      near(arc.heightError, -0.083333, 1e-5),
      `so it is short by 0.0833, not ${arc.heightError}`,
    );
    assert(
      near((-arc.heightError / 2) * 100, 4.1667, 1e-3),
      "which is 4.17% of the jump",
    );
    assert(
      near(
        arc.heightError,
        leapPredictedDrift(2, 0.4, 60, "semi-implicit"),
        1e-9,
      ),
      "and the drift formula should have predicted it",
    );
    // Explicit Euler misses by the same amount the other way, and midpoint hits it.
    assert(
      near(leapArcFor(2, 0.4, 60, "explicit").heightError, 0.083333, 1e-5),
      "explicit Euler should overshoot by the same amount",
    );
    assert(
      Math.abs(leapArcFor(2, 0.4, 60, "midpoint").heightError) < 1e-12,
      "and the midpoint step should land on the requested height exactly",
    );
  }
  /* **Two separate effects, and separating them turned out to be the point of this Section.** An assertion
     that the midpoint step always reaches the requested height failed at ten frames a second on a 0.25 s
     rise - and the code was right. The apex falls halfway between frames 2 and 3, so nothing ever evaluates
     the position at the top. That is sampling, not drift; no integrator can fix it, and it is exactly
     $\tfrac{1}{2}|a|\delta^2$ where $\delta$ is the gap to the nearest frame.
     
     So the sweep asserts the two independently. Where the apex lands on a frame the midpoint step hits the
     height exactly; where it does not, it misses by the sampling deficit and by nothing else. */
  for (let h = LEAP_HEIGHT.min; h <= LEAP_HEIGHT.max + 1e-9; h += 0.2) {
    for (let t = LEAP_APEX.min; t <= LEAP_APEX.max + 1e-9; t += 0.05) {
      for (let fps = LEAP_FPS.min; fps <= LEAP_FPS.max; fps += 5) {
        const midpoint = leapArcFor(h, t, fps, "midpoint");
        if (leapApexOnFrame(t, fps)) {
          assert(
            Math.abs(midpoint.heightError) < 1e-9,
            `with the apex on a frame, midpoint should be exact at h ${h}, t ${t}, ${fps} fps, off by ${midpoint.heightError}`,
          );
          for (const which of ["explicit", "semi-implicit"] as const) {
            assert(
              near(
                leapArcFor(h, t, fps, which).heightError,
                leapPredictedDrift(h, t, fps, which),
                1e-9,
              ),
              `${which} should match its predicted drift at h ${h}, t ${t}, ${fps} fps`,
            );
          }
        } else {
          assert(
            near(midpoint.heightError, -leapSamplingDeficit(h, t, fps), 1e-9),
            `midpoint should miss only by the sampling deficit at h ${h}, t ${t}, ${fps} fps: ` +
              `${midpoint.heightError} against ${-leapSamplingDeficit(h, t, fps)}`,
          );
        }
        for (const which of INTEGRATORS) {
          const arc = leapArcFor(h, t, fps, which);
          assert(arc.peak > LEAP_GROUND, "an arc has to leave the ground");
          assert(arc.airtime > 0, "and land again within the step budget");
        }
      }
    }
  }
  /* The two have different signatures, which is how they are told apart in practice: drift is **linear** in
     the step size and sampling is **quadratic** in it. That is the checkable form of "these are different
     problems", so it is checked. */
  {
    const driftAt = (fps: number) =>
      Math.abs(leapPredictedDrift(2, 0.4, fps, "semi-implicit"));
    // 0.4 s lands on a frame at both rates, so this isolates drift.
    assert(
      leapApexOnFrame(0.4, 10) && leapApexOnFrame(0.4, 20),
      "0.4 s lands on a frame at both 10 and 20 fps, which is what isolates drift here",
    );
    assert(
      near(driftAt(10) / driftAt(20), 2, 1e-9),
      "drift halves when the step halves - linear",
    );
    // A 0.25 s rise misses the frame at 10 fps and lands on it at 20, which isolates sampling.
    assert(
      leapSamplingDeficit(2, 0.25, 10) > 0 &&
        leapSamplingDeficit(2, 0.25, 20) === 0,
      "a 0.25 s rise misses the frame at 10 fps and lands on it at 20",
    );
    /* Quadratic: three times the gap is nine times the deficit. Both rates have to actually miss the frame for
       this to say anything - my first attempt compared against 4 fps, where a 0.25 s rise lands exactly on a
       frame and the deficit is zero, so the ratio was a division by nothing. */
    assert(
      !leapApexOnFrame(0.25, 10) && !leapApexOnFrame(0.25, 30),
      "both rates have to miss the apex for the ratio to mean anything",
    );
    assert(
      near(
        leapSamplingDeficit(2, 0.25, 10) / leapSamplingDeficit(2, 0.25, 30),
        9,
        1e-9,
      ),
      `three times the gap should be nine times the deficit, was ${leapSamplingDeficit(2, 0.25, 10) / leapSamplingDeficit(2, 0.25, 30)}`,
    );
  }

  // ---- Terminal velocity is Section 4.1's decay -----------------------------------------------

  assert(
    near(terminalVelocity(-25, 4), -6.25, 1e-12),
    `gravity over drag should be -6.25, was ${terminalVelocity(-25, 4)}`,
  );
  assert(
    terminalVelocity(-25, 0) === -Infinity ||
      terminalVelocity(-25, 0) === Infinity,
    "and with no drag there is no terminal velocity",
  );
  /* The stepped version has to converge on the closed form, which is `decay` from Section 4.1 with different
     labels. Checked as a limit rather than at one instant, since that is the claim. */
  for (const [gravity, drag] of [
    [-25, 4],
    [-9.81, 1.5],
  ] as const) {
    const terminal = terminalVelocity(gravity, drag);
    for (const fps of [120, 480, 2000]) {
      const dt = 1 / fps;
      let v = 0;
      const steps = Math.round(1 / dt);
      for (let i = 0; i < steps; i += 1) v = stepWithDrag(v, gravity, drag, dt);
      // Finer steps converge on the exact answer, which is the whole point of naming both.
      assert(
        Math.abs(v - dragExactAt(0, gravity, drag, 1)) < 30 / fps,
        `the stepped fall should approach the closed form, off by ${Math.abs(v - dragExactAt(0, gravity, drag, 1))} at ${fps} fps`,
      );
    }
    // It approaches the terminal speed and never passes it.
    for (const t of [0.1, 0.5, 1, 5, 50]) {
      const exact = dragExactAt(0, gravity, drag, t);
      assert(
        Math.abs(exact) <= Math.abs(terminal) + 1e-12,
        `a falling body should never exceed terminal velocity, reached ${exact} against ${terminal}`,
      );
      assert(
        Math.abs(exact) > 0,
        "and should be falling at all after any positive time",
      );
    }
    assert(
      near(dragExactAt(0, gravity, drag, 1e6), terminal, 1e-9),
      "and it should converge on it given long enough",
    );
  }
  // The blunt alternative: a clamp, which never touches a rise.
  assert(clampFallSpeed(-40, 12) === -12, "a clamp limits the fall");
  assert(clampFallSpeed(-5, 12) === -5, "and leaves a slower fall alone");
  /* A rise **above** the limit, which is the case that distinguishes a fall clamp from a speed clamp. My first
     version tested a rise of 9 against a limit of 12 - under it either way - so a sabotage that clamped rises
     as well passed. The whole point of this function over `clampSpeed` is that a jump keeps its launch speed,
     so the test has to use a launch speed worth keeping. */
  assert(
    clampFallSpeed(20, 12) === 20,
    "and never touches a rise, however fast - which is exactly what drag would get wrong",
  );
  assert(
    near(clampSpeed({ x: 0, y: 20 }, 12).y, 12, 1e-12),
    "while a speed clamp does limit it, which is the other function and the other intent",
  );

  // ---- Cutting a jump short ------------------------------------------------------------------

  {
    const { launch, gravity } = jumpFromHeightAndTime(2.5, 0.5);
    assert(
      near(remainingHeight(launch, gravity), 2.5, 1e-12),
      "the full launch should have the full height left in it",
    );
    /* Height goes as the **square** of the velocity, so keeping half the speed keeps a quarter of the height.
       Worth pinning because it is the reason a released jump feels so much shorter than expected. */
    for (const keep of [0.5, 0.4, 0.25]) {
      const cut = cutJump(launch, keep);
      assert(near(cut, launch * keep, 1e-12), "cutting scales the velocity");
      assert(
        near(remainingHeight(cut, gravity), 2.5 * keep * keep, 1e-12),
        `keeping ${keep} of the speed should keep ${keep * keep} of the height, kept ${remainingHeight(cut, gravity) / 2.5}`,
      );
    }
    assert(
      near(remainingHeight(cutJump(launch, 0.5), gravity), 0.625, 1e-12),
      "so half the speed is a quarter of a 2.5 unit jump, which is 0.625",
    );
    // And the guard: cutting while already falling would slow the fall, which feels like snagging.
    assert(cutJump(-3, 0.5) === -3, "a falling velocity is left alone");
    assert(remainingHeight(-3, gravity) === 0, "and has no height left in it");
  }

  // ---- The asymmetric jump most platformers use ----------------------------------------------

  {
    const a = asymmetricJump(2.5, 0.4, 0.28);
    // Each half is its own parabola through the same apex, so each gets the same formula.
    assert(
      near(a.riseGravity, jumpFromHeightAndTime(2.5, 0.4).gravity, 1e-12),
      "the rise should match the symmetric formula at its own time",
    );
    assert(
      near(a.fallGravity, jumpFromHeightAndTime(2.5, 0.28).gravity, 1e-12),
      "and so should the fall",
    );
    assert(
      near(a.launch, jumpFromHeightAndTime(2.5, 0.4).launch, 1e-12),
      "with the launch speed coming from the rise, since that is the half it happens in",
    );
    /* The ratio of the two gravities is the inverse square of the ratio of the two times, which is the
       relationship worth knowing when tuning by feel. */
    assert(
      near(a.fallGravity / a.riseGravity, (0.4 / 0.28) ** 2, 1e-12),
      `the gravities should differ by the square of the times, ${a.fallGravity / a.riseGravity} against ${(0.4 / 0.28) ** 2}`,
    );
    assert(
      near(a.fallGravity / a.riseGravity, 2.040816, 1e-5),
      "which here is 2.0408",
    );
  }

  // ---- The scenes' own arithmetic ------------------------------------------------------------

  for (const p of [
    { x: 0, y: 0 },
    { x: LEAP_LAUNCH_X, y: LEAP_GROUND },
    { x: 3.1, y: 1.4 },
  ]) {
    const screen = leapScreenOf(p);
    assert(
      Math.hypot(
        leapWorldOf(screen.x, screen.y).x - p.x,
        leapWorldOf(screen.x, screen.y).y - p.y,
      ) < 1e-12,
      `the screen round trip failed for (${p.x}, ${p.y})`,
    );
  }
  assert(
    leapScreenOf({ x: 0, y: 1 }).y < leapScreenOf({ x: 0, y: 0 }).y,
    "a higher world point should be drawn nearer the top",
  );
  /* Every point of every arc the sliders can produce, for all three integrators. The first version let a tall
     jump's final step land a whole unit underground and off the bottom of the canvas, because a naive loop
     records where the step finished rather than where the ground is. */
  for (let h = LEAP_HEIGHT.min; h <= LEAP_HEIGHT.max + 1e-9; h += 0.1) {
    for (let t = LEAP_APEX.min; t <= LEAP_APEX.max + 1e-9; t += 0.02) {
      for (let fps = LEAP_FPS.min; fps <= LEAP_FPS.max; fps += 5) {
        for (const which of INTEGRATORS) {
          const arc = leapArcFor(h, t, fps, which);
          for (const p of arc.points) {
            const q = leapScreenOf(p);
            assert(
              q.x >= 0 &&
                q.x <= LEAP_VIEW.width &&
                q.y >= 0 &&
                q.y <= LEAP_VIEW.height,
              `an arc point leaves the canvas at h ${h.toFixed(1)}, t ${t.toFixed(2)}, ${fps} fps, ${which}: (${q.x.toFixed(1)}, ${q.y.toFixed(1)})`,
            );
          }
          // And no arc is ever drawn below the floor it landed on.
          assert(
            arc.points.every((p) => p.y >= LEAP_GROUND - 1e-12),
            "no part of an arc should be drawn under the ground",
          );
        }
      }
    }
  }
  for (let h = LEAP_HEIGHT.min; h <= LEAP_HEIGHT.max + 1e-9; h += 0.1) {
    for (let t = LEAP_APEX.min; t <= LEAP_APEX.max + 1e-9; t += 0.02) {
      for (const p of leapExactArc(h, t)) {
        const q = leapScreenOf(p);
        assert(
          q.x >= 0 &&
            q.x <= LEAP_VIEW.width &&
            q.y >= 0 &&
            q.y <= LEAP_VIEW.height,
          `the true parabola leaves the canvas at h ${h.toFixed(1)}, t ${t.toFixed(2)}`,
        );
      }
    }
  }
  /* The stepper scene's bracket, at every frame rate its slider offers. This is the assertion that keeps the
     scene's central claim true no matter where the reader drags it. */
  for (let fps = LEAP_FPS.min; fps <= LEAP_FPS.max; fps += 1) {
    const traces = leapAllTraces(fps);
    assert(traces.length === 3, "three integrators, three traces");
    assert(
      traces.every((t) => t.heights.length === traces[0].heights.length),
      "all sampled at the same instants, or the plot compares different times",
    );
    const apexStep = Math.min(
      traces[0].heights.length - 1,
      Math.max(1, Math.round(LEAP_THROW_TIME * fps)),
    );
    const b = leapBracketAt(fps, apexStep);
    assert(
      b.explicit > b.exact && b.exact > b.semi,
      `the truth should be bracketed at ${fps} fps, got ${b.explicit}, ${b.exact}, ${b.semi}`,
    );
    assert(
      Math.abs(b.averageError) < 1e-11,
      `and the average should land on it, off by ${b.averageError} at ${fps} fps`,
    );
    assert(
      Math.abs(b.midpoint - b.exact) < 1e-11,
      "as should the midpoint step",
    );
    // Nothing plotted is non-finite, at any frame rate.
    assert(
      traces.every(
        (t) =>
          t.heights.every(Number.isFinite) && t.exact.every(Number.isFinite),
      ),
      `a trace went non-finite at ${fps} fps`,
    );
  }
  // The leap scene's opening state: short, visibly so, and by the amount the page quotes.
  {
    const opening = leapArcFor(2, 0.4, 60, "semi-implicit");
    assert(
      opening.heightError < -0.05,
      "the leap scene should open on a jump that is visibly short",
    );
    assert(
      opening.peak - LEAP_GROUND > 1.8,
      "but not so short that the arc looks broken",
    );
  }
};

/**
 * The capstone: the assembled character, and the four bugs that assembling it exposed.
 *
 * This is the longest check in the file and the one that earned its length. Every individual piece was
 * already verified by the Section it came from; what this sweeps is the **composition** - the order of the
 * step, the interaction between two forgiveness windows, and the resolution of a move against a grid. Three
 * genuine bugs in this Module's own code were found by these assertions rather than by looking at a picture.
 */
export const platformerCheck2d: Demo = () => {
  // ---- The fixed timestep and its accumulator ------------------------------------------------

  {
    /* The invariant: whatever the frame times, the carry is always a fraction of one step. It is not true of
       the first version of `stepsFor`, which reported dropped time and then carried it anyway - so one slow
       frame left a backlog that capped every frame after it and the game crawled until the debt was paid. */
    let worst = 0;
    for (let i = 0; i < 40000; i += 1) {
      const carry = ((i * 7919) % 1000) * (CAP_FIXED_DT / 1000);
      const frameTime = (i % 197) * 0.001;
      const r = capStepsFor(carry, frameTime);
      assert(
        r.leftover >= 0 && r.leftover < CAP_FIXED_DT,
        `the carry left the step at frame time ${frameTime}: ${r.leftover}`,
      );
      assert(
        Number.isInteger(r.steps) && r.steps >= 0 && r.steps <= 8,
        `steps should be a whole number inside the cap, got ${r.steps}`,
      );
      // Nothing is invented and nothing vanishes unaccounted for.
      assert(
        near(
          carry + frameTime,
          r.steps * CAP_FIXED_DT + r.dropped + r.leftover,
          1e-12,
        ),
        "the frame time should be exactly spent, dropped, or carried",
      );
      const alpha = capRenderAlpha(r.leftover);
      assert(alpha >= 0 && alpha <= 1, `renderAlpha left 0..1: ${alpha}`);
      worst = Math.max(worst, r.leftover);
    }
    // And the sweep actually reached near the top of the range, or the bound above proves nothing.
    assert(
      worst > CAP_FIXED_DT * 0.9,
      `the carry never came close to a full step, so its bound is vacuous: worst was ${worst}`,
    );
  }
  {
    // The cap, and the spiral it prevents, in the one case the page quotes.
    const hitch = capStepsFor(0, 0.5);
    assert(
      hitch.steps === 8,
      `a half-second hitch should run 8 steps, ran ${hitch.steps}`,
    );
    assert(
      near(hitch.dropped, 0.5 - 8 * CAP_FIXED_DT, 1e-12),
      `and drop the rest, dropped ${hitch.dropped}`,
    );
    assert(
      hitch.leftover === 0,
      `carrying nothing forward, carried ${hitch.leftover}`,
    );
    const uncapped = capStepsFor(0, 0.5, CAP_FIXED_DT, Infinity);
    assert(
      uncapped.steps === 60 && uncapped.dropped === 0,
      "without a cap the same frame asks for sixty steps, which is the spiral",
    );
  }

  // ---- The two forgiveness windows, and the off switch that inverted -------------------------

  {
    assert(
      capCoyoteRemaining(0) === 1,
      "the coyote window is full at the instant of leaving",
    );
    assert(capCoyoteRemaining(CAP_COYOTE) === 0, "and empty when it expires");
    assert(
      near(capCoyoteRemaining(CAP_COYOTE / 2), 0.5, 1e-12),
      "and half full halfway, because it is a clamped inverseLerp and nothing more",
    );
    assert(
      capCoyoteRemaining(CAP_COYOTE * 2) === 0,
      "clamped past the end rather than going negative",
    );
    /* The zero-window guard. `inverseLerp` returns 0 for an empty range - correct there, and exactly wrong
       here, because 1 - 0 reads as "completely full". Without the branch, switching coyote time off by
       setting its window to zero switches it on permanently. */
    assert(
      capCoyoteRemaining(0.5, 0) === 0,
      "a zero window must be closed, not permanently open",
    );
    assert(
      capBufferRemaining(0.5, 0) === 0,
      "and the same for the buffer, which shares the trap",
    );
    assert(
      capCoyoteRemaining(0, 0) === 1 && capBufferRemaining(0, 0) === 1,
      "though a zero window still admits the very instant itself, or a grounded jump would be impossible",
    );
    // The two have to be considered together, which is the case both features exist to catch.
    assert(
      capCanJump(0.05, 0.05),
      "recently grounded and recently pressed is a jump",
    );
    assert(
      !capCanJump(0.5, 0.05),
      "long since grounded is not, however recent the press",
    );
    assert(
      !capCanJump(0.05, 0.5),
      "and a stale press is not, however recently grounded",
    );
    assert(
      !capCanJump(0.05, 0.05, 0, 0),
      "with both windows off, neither of those is a jump either",
    );
  }

  // ---- Resolving a move against the grid ------------------------------------------------------

  {
    /* The centrepiece, and the one that found three bugs. A character charging at a one-tile step must stop
       at its face - at every speed, and whatever shape it is.
     
       Version one snapped to each overlapping tile in turn, so the answer depended on `nearbyTiles`'
       iteration order and a tall character was teleported to the top of the wall beside it. Version two took
       the nearest face over the destination box, which left a fast mover placed *inside* a tile it had
       stepped over. Only sweeping the region between the two positions is correct, and it removes tunnelling
       at the same time. */
    const distance = capChargeFace - CAP_CHARGE_FROM;
    let arrived = 0;
    for (let v = 1; v <= 200; v += 1) {
      const charge = capChargeAtStep(v, true);
      // Never past the face, never above the floor, never out of the level - at any speed at all.
      assert(
        charge.end.position.x <= capChargeFace + 1e-9,
        `one axis at a time should never get past the step's face, but at ${v} units per second it reached x ${charge.end.position.x}`,
      );
      assert(
        !charge.climbed,
        `and never get above the floor it started on, but it did at ${v}`,
      );
      assert(!charge.escaped, `and never leave the level, but it did at ${v}`);
      /* And where it had time to arrive, it is *exactly* at the face. Below about 1.6 units per second the
         charge simply has not crossed the 1.8125 units to the step inside its window, so demanding contact
         would be asserting against the clock rather than the collision. */
      if (v * CAP_CHARGE_SECONDS > distance + 1) {
        assert(
          charge.stoppedAtFace,
          `and stop exactly at the face once it can reach it, but at ${v} it ended at x ${charge.end.position.x}`,
        );
        arrived += 1;
      }
    }
    assert(
      arrived > 190,
      `nearly every speed should have reached the step, only ${arrived} did`,
    );
    // The resting place is exact, not approximate: the face minus a half width, on a binary fraction.
    assert(
      capChargeFace === 14.8125,
      `the only correct resting x is 14.8125, not ${capChargeFace}`,
    );

    /* And the naive version really does fail, or the comparison the Section is built on is empty. This is the
       assertion that stops the page overclaiming: it is also correct at ordinary speeds, which is why it
       ships. */
    const summary = capChargeSummary();
    assert(
      summary.perAxisFailures === 0,
      `one axis at a time should never fail on the slider, failed ${summary.perAxisFailures} times`,
    );
    assert(
      summary.combinedFailures > 20,
      `both axes at once should fail across a wide band, failed only ${summary.combinedFailures} times`,
    );
    assert(
      summary.firstCombinedFailure !== null &&
        summary.firstCombinedFailure === 45,
      `and first fail at 45 units per second, not ${summary.firstCombinedFailure}`,
    );
    /* The failure is not tunnelling. One step at 45 units per second covers 0.375 units against a wall a
       whole unit thick, so nothing is being stepped over - the axis choice is simply wrong. Worth pinning,
       because attributing it to tunnelling would point a reader at the wrong fix. */
    assert(
      45 / 120 < summary.tunnelSpeed / 120,
      "the first failure is well inside the tunnelling limit",
    );
    assert(
      near(summary.tunnelSpeed, 120, 1e-12),
      `one step exceeds the wall's thickness above 120 units per second, not ${summary.tunnelSpeed}`,
    );
    assert(
      capChargeAtStep(6, false).stoppedAtFace,
      "at the character's own run speed the naive version is correct, which is why it survives review",
    );
  }
  {
    // The contact skin, and the float that made it necessary.
    assert(
      1.0 + 0.9 - 0.9 !== 1.0,
      "the premise of the contact skin: a foot at 0.9 on a floor at 1.0 does not land on 1.0",
    );
    assert(
      1.0 + 0.9 - 0.9 < 1.0,
      "and specifically it lands *below* the floor, which is the direction that causes the bug",
    );
    /* The skin has to beat the float noise and lose to one step's fall, or a resting character would either
       collide with the floor sideways or never notice it was on the ground. */
    const { gravity } = capDerived();
    const oneStepFall = Math.abs(gravity) * CAP_FIXED_DT * CAP_FIXED_DT;
    assert(
      CAP_CONTACT_SKIN > 1e-12,
      "the skin must be larger than double-precision noise",
    );
    assert(
      CAP_CONTACT_SKIN < oneStepFall / 100,
      `and much smaller than one step's fall of ${oneStepFall}, or landing would be missed`,
    );
  }

  // ---- The scripted run, which is what the scene draws ---------------------------------------

  {
    const frames = capRunScript();
    assert(
      frames.length === capRunSteps,
      `the run is ${capRunSteps} steps, got ${frames.length}`,
    );
    assert(
      frames.every(
        (f) =>
          Number.isFinite(f.state.character.position.x) &&
          Number.isFinite(f.state.character.position.y),
      ),
      "no step of the run may go non-finite",
    );
    // It stays inside the level for the whole run, under every combination of switches.
    for (const opts of [
      {},
      { coyote: 0 },
      { buffer: 0 },
      { coyote: 0, buffer: 0 },
      { perAxis: false },
    ]) {
      for (const f of capRunScript(opts)) {
        const p = f.state.character.position;
        assert(
          p.x > 0 && p.x < 24 && p.y > 0 && p.y < 8,
          `the character left the level at step ${f.step} with ${JSON.stringify(opts)}: (${p.x}, ${p.y})`,
        );
      }
    }

    /* The two jumps are the whole point of the run, and both are deliberately mistimed. Asserting *which*
       step each fires on is what keeps the scene's story true: the first press lands after the character has
       left the ledge, the second before it has landed. */
    assert(
      JSON.stringify(capJumpSteps()) === "[118,199]",
      `the run should jump on steps 118 and 199, jumped on ${JSON.stringify(capJumpSteps())}`,
    );
    const airborne = frames.findIndex((f) => !f.state.character.grounded);
    assert(
      airborne === 113,
      `it should walk off the ledge on step 113, did so on ${airborne}`,
    );
    assert(
      airborne < 118,
      "so the first jump is pressed after the ledge, which only coyote time allows",
    );
    /* The presses are located rather than hard-coded. Writing the step numbers in by hand went wrong
       immediately: `Math.floor(1.6 / (1 / 120))` is not the step a reader would guess, and an assertion that
       names the wrong index tests the wrong frame while looking authoritative. */
    const presses = frames
      .filter((f) => f.input.jumpPressed)
      .map((f) => f.step);
    assert(
      presses.length === 2,
      `the script presses jump twice, found ${presses.length} at ${JSON.stringify(presses)}`,
    );
    assert(
      !frames[presses[0]].state.character.grounded,
      "the first press happens in mid-air, after the ledge, which is coyote time's case",
    );
    assert(
      !frames[presses[1]].state.character.grounded,
      "and the second also happens in mid-air, before landing, which is the buffer's case",
    );
    assert(
      capJumpSteps()[0] === presses[0],
      "the first jump fires on the press itself, because the coyote window was still open",
    );
    assert(
      capJumpSteps()[1] > presses[1],
      "the second fires later than its press, because it had to wait for the ground",
    );
    assert(
      frames[capJumpSteps()[1]].state.jumped &&
        frames[capJumpSteps()[1] - 1].state.character.grounded,
      "and specifically on the first step after landing, which is what buffering means",
    );

    // Switching each window off breaks its own jump, and the build says how.
    assert(
      JSON.stringify(capJumpSteps({ coyote: 0 })) !==
        JSON.stringify(capJumpSteps()),
      "turning coyote time off must change the run",
    );
    const foot = (opts: Parameters<typeof capRunScript>[0]) =>
      Math.min(
        ...capRunScript(opts).map((f) => capBoxOf(f.state.character).min.y),
      );
    assert(
      foot({}) > 0.9,
      `with both windows on it never drops into the trench, but its foot reached ${foot({})}`,
    );
    assert(
      near(foot({ coyote: 0 }), 0.5, 1e-9),
      `with coyote time off it lands on the trench floor at 0.5, reached ${foot({ coyote: 0 })}`,
    );
    assert(
      capJumpSteps({ buffer: 0 }).length === 1,
      "with buffering off only the first jump happens",
    );
    assert(
      capEndedAt({ buffer: 0 }).x < capEndedAt({}).x - 5,
      `so it finishes more than five units short, finished at ${capEndedAt({ buffer: 0 }).x} against ${capEndedAt({}).x}`,
    );
    // It is stopped by the wall, exactly at the wall's face less its own half width.
    assert(
      near(
        Math.max(...frames.map((f) => f.state.character.position.x)),
        20.3125,
        1e-9,
      ),
      "the furthest it gets is the wall's face minus a half width",
    );

    /* **The scrub bar has to change the picture too.** Same lesson as the charge scene's slider, learned the
       same way. The run originally held the stick right until 2.95 s, so the character stood pressed against
       the wall through 33 consecutive notches with nothing moving, and then released and stood still for the
       last quarter second. Nothing numeric noticed, because the simulation was perfectly correct.
     
       Some repetition is legitimate - a notch of 0.01 s against a step of 1/120 s means two notches
       occasionally land on the same frame, and a character genuinely stuck against a wall genuinely does not
       move. The bound is on how *long* a stretch may draw the same thing. */
    for (const opts of [
      {},
      { coyote: 0 },
      { buffer: 0 },
      { coyote: 0, buffer: 0 },
    ]) {
      const notches: number[] = [];
      for (
        let t = CAP_TIME_RANGE.min;
        t <= CAP_TIME_RANGE.max + 1e-9;
        t += CAP_TIME_RANGE.step
      ) {
        notches.push(Number(t.toFixed(4)));
      }
      let longest = 1;
      let current = 1;
      let endedAtNotch = 0;
      let previous = capFrameSignature(notches[0], opts);
      for (let i = 1; i < notches.length; i += 1) {
        const signature = capFrameSignature(notches[i], opts);
        if (signature === previous) {
          current += 1;
          if (current > longest) {
            longest = current;
            endedAtNotch = notches[i];
          }
        } else current = 1;
        previous = signature;
      }
      assert(
        longest <= 16,
        `the scrub bar draws the same frame for ${longest} notches in a row up to t ${endedAtNotch} with ${JSON.stringify(opts)}, which reads as a broken control`,
      );
    }
    // And each switch has to visibly change the run, or its checkbox is decorative.
    for (const opts of [
      { coyote: 0 },
      { buffer: 0 },
      { coyote: 0, buffer: 0 },
    ]) {
      let differing = 0;
      for (
        let t = CAP_TIME_RANGE.min;
        t <= CAP_TIME_RANGE.max + 1e-9;
        t += CAP_TIME_RANGE.step
      ) {
        const at = Number(t.toFixed(4));
        if (capFrameSignature(at, {}) !== capFrameSignature(at, opts))
          differing += 1;
      }
      assert(
        differing > 60,
        `turning off ${JSON.stringify(opts)} changes the picture at only ${differing} notches, which is too few to notice`,
      );
    }

    /* At the character's own run speed the two resolutions agree completely, which is worth asserting rather
       than hiding: the naive version's bugs need speed, and a demo that pretended otherwise would be lying. */
    const gap = capDivergence();
    assert(
      gap.firstStep === null && gap.worstGap === 0,
      `the two resolutions should agree over this run, but parted at step ${gap.firstStep}`,
    );
  }

  // ---- The camera --------------------------------------------------------------------------

  {
    /* Four things you can round, and exactly one holds still. Measured in steady state, because a camera
       catching up legitimately closes the gap - an earlier version of this measurement counted that as
       jitter and declared the correct choice the worst one. */
    const neither = capJitterFor("neither");
    const cameraOnly = capJitterFor("camera only");
    const both = capJitterFor("both");
    const offset = capJitterFor("the offset");
    assert(
      neither.wobble < 1e-4,
      `rounding nothing cannot wobble, wobbled ${neither.wobble}`,
    );
    assert(
      !neither.wholePixels,
      "but it never lands on a whole pixel, which is what resamples a sprite",
    );
    assert(
      cameraOnly.wobble > 0.5 && cameraOnly.reversals > 10,
      `rounding the camera alone must visibly wobble, wobbled ${cameraOnly.wobble} over ${cameraOnly.reversals} reversals`,
    );
    assert(
      both.wobble > 0.5,
      `rounding both separately still wobbles - the surprise of this Section - but wobbled ${both.wobble}`,
    );
    assert(both.wholePixels, "even though it does land on whole pixels");
    assert(
      offset.wobble === 0 && offset.reversals === 0,
      `rounding the offset must hold perfectly still, wobbled ${offset.wobble}`,
    );
    assert(
      offset.wholePixels,
      "and land on whole pixels, which is why it is the answer",
    );
    /* The mechanism the jitter figure is really about: **a fractional advance being rounded.** At a whole
       number of art pixels per frame there is nothing to round and every choice is clean, which is worth
       pinning because it shows the wobble is not a camera problem at all. */
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const speed = (n * CAP_JITTER_FPS) / CAP_ART_PIXELS;
      assert(
        capAdvancesWholePixels(speed),
        `${speed} units per second should advance exactly ${n} pixels a frame`,
      );
      for (const snap of CAP_SNAPS) {
        assert(
          capJitterFor(snap, speed).wobble < 1e-4,
          `nothing should shimmer at a whole-pixel advance, but "${snap}" wobbled at ${speed}`,
        );
      }
    }
    // And at a fractional advance, three of the four do shimmer while the offset never does.
    for (const v of capJitterSpeeds()) {
      const offsetWobble = capJitterFor("the offset", v).wobble;
      assert(
        offsetWobble === 0,
        `rounding the offset must hold still at every speed, wobbled ${offsetWobble} at ${v}`,
      );
      if (capAdvancesWholePixels(v)) continue;
      assert(
        capJitterFor("camera only", v).wobble > 0.4,
        `rounding the camera alone should visibly slide at ${v}, wobbled ${capJitterFor("camera only", v).wobble}`,
      );
    }
    /* "neither" never wobbles either, so wobble alone does not separate it from the answer - it is separated
       by never landing on a whole pixel, which is what resamples a sprite. Both halves are needed. */
    assert(
      capJitterFor("neither").wobble < 1e-4 &&
        !capJitterFor("neither").wholePixels,
      "rounding nothing is steady but permanently between pixels",
    );
    /* And the jitter slider has to change its picture, for the third time in this file. The traces are the
       whole figure, so they are what gets compared. */
    {
      const speeds = capJitterSpeeds();
      const signatures = speeds.map((v) => capJitterSignature(v));
      for (let i = 1; i < signatures.length; i += 1) {
        assert(
          signatures[i] !== signatures[i - 1],
          `the jitter scene draws the same traces at ${speeds[i - 1]} and ${speeds[i]} units per second`,
        );
      }
      // The plotted traces have to stay inside the strip the scene reserves for them, which is one pixel either side.
      for (const v of speeds) {
        for (const snap of CAP_SNAPS) {
          const values = capJitterTrace(snap, v, CAP_JITTER_FRAMES);
          const mean = values.reduce((a, b) => a + b, 0) / values.length;
          for (const value of values) {
            assert(
              Math.abs(value - Math.round(mean)) <= 1.6,
              `a jitter trace leaves its strip at ${v} for "${snap}": ${value} against a baseline of ${Math.round(mean)}`,
            );
          }
        }
      }
    }

    // The camera is frame-rate independent, because it is Section 4.1's decay and nothing else.
    const halfLife = 0.14;
    assert(
      near(capFollowCamera(0, 1, halfLife, halfLife), 0.5, 1e-12),
      "one half-life closes exactly half the gap, whatever the frame rate",
    );
    for (const fps of [30, 60, 144, 240]) {
      let at = 0;
      for (let i = 0; i < fps; i += 1)
        at = capFollowCamera(at, 1, 1 / fps, halfLife);
      assert(
        near(at, 1 - Math.pow(0.5, 1 / halfLife), 1e-9),
        `a second of following should leave the same gap at every frame rate, ${fps} gave ${at}`,
      );
    }
  }

  // ---- The scenes' own arithmetic ------------------------------------------------------------

  {
    for (const cameraX of [7.75, 12, 16.25]) {
      for (const p of [
        { x: 4.5, y: 1.375 },
        { x: 10, y: 0.5 },
        { x: 20.3125, y: 3.5 },
      ]) {
        const s = capScreenOf(p, cameraX);
        const back = capWorldOf(s.x, s.y, cameraX);
        assert(
          Math.hypot(back.x - p.x, back.y - p.y) < 1e-12,
          `the run scene's round trip failed for (${p.x}, ${p.y}) at camera ${cameraX}`,
        );
      }
    }
    assert(
      capScreenOf({ x: 0, y: 1 }, 8).y < capScreenOf({ x: 0, y: 0 }, 8).y,
      "a higher world point is drawn nearer the top of the canvas",
    );
    // The camera clamp keeps the level's ends off the canvas edges, which is what it is for.
    assert(
      capClampCamera(0) === 7.75 && capClampCamera(100) === 16.25,
      "the camera stops at both ends of the level",
    );
    assert(
      near(capScreenOf({ x: 0, y: 0 }, capClampCamera(0)).x, 0, 1e-9),
      "and at the left stop the level's edge is exactly the canvas edge",
    );

    // Nothing the run scene draws leaves the canvas, under any combination of switches.
    for (const opts of [
      {},
      { coyote: 0 },
      { buffer: 0 },
      { coyote: 0, buffer: 0 },
      { perAxis: false },
    ]) {
      for (const f of capRunScript(opts)) {
        const r = capRectOf(
          capBoxOf(f.state.character),
          capClampCamera(f.state.cameraX),
        );
        assert(
          r.x >= 0 &&
            r.x + r.w <= CAP_VIEW.width &&
            r.y >= 0 &&
            r.y + r.h <= CAP_VIEW.height,
          `the character is drawn off the canvas at step ${f.step} with ${JSON.stringify(opts)}`,
        );
      }
    }
  }
  {
    // The charge scene's own mapping, and that its subject is actually inside its frame.
    for (const p of [
      { x: 13, y: 1.375 },
      { x: 15, y: 1.5 },
      { x: 20.5, y: 3.5 },
    ]) {
      const s = capChargeScreenOf(p);
      const back = capChargeWorldOf(s.x, s.y);
      assert(
        Math.hypot(back.x - p.x, back.y - p.y) < 1e-12,
        `the charge scene's round trip failed for (${p.x}, ${p.y})`,
      );
    }
    const resting = capChargeRectOf(capBoxOf(capChargeAtStep(6, true).end));
    assert(
      resting.x >= 0 &&
        resting.x + resting.w <= CAP_CHARGE_VIEW.width &&
        resting.y >= 0 &&
        resting.y + resting.h <= CAP_CHARGE_VIEW.height,
      "the resting character must be inside the charge scene's canvas",
    );
    // The step's face and the level's right edge both have to be visible, or the figure explains nothing.
    for (const x of [15, 24]) {
      const q = capChargeScreenOf({ x, y: 1.5 });
      assert(
        q.x > 20 && q.x < CAP_CHARGE_VIEW.width - 20,
        `the charge scene must show x = ${x}, but it lands at ${q.x}`,
      );
    }
    /* **The slider has to change the picture.** This is the assertion that was missing when the figure
       shipped pixel-identical at every speed from 4 to 44: both resolutions stop in the same place, so the
       only thing that differed was a number in the readout. Everything numeric passed and the control was
       dead. Comparing the drawn geometry between adjacent slider positions is the only test for that. */
    const speeds = capChargeSpeeds();
    const signatures = speeds.map((v) => capChargeSignature(v));
    for (let i = 1; i < signatures.length; i += 1) {
      assert(
        signatures[i] !== signatures[i - 1],
        `the charge scene draws the same thing at ${speeds[i - 1]} and ${speeds[i]} units per second, so its slider does nothing there`,
      );
    }
    assert(
      new Set(signatures).size === signatures.length,
      "and no two speeds anywhere on the slider may draw the same picture",
    );

    // Both paths have something on screen at every speed the slider offers.
    for (const v of capChargeSpeeds()) {
      for (const perAxis of [true, false]) {
        const visible = capChargeAtStep(v, perAxis).points.filter((p) => {
          const q = capChargeScreenOf(p);
          return (
            q.x >= 0 &&
            q.x <= CAP_CHARGE_VIEW.width &&
            q.y >= 0 &&
            q.y <= CAP_CHARGE_VIEW.height
          );
        });
        assert(
          visible.length > 2,
          `nothing to look at for ${perAxis ? "per-axis" : "combined"} at ${v} units per second`,
        );
      }
    }
  }
  {
    // The level itself, since every number above is measured against its geometry.
    // 48 of bedrock, 44 of floor either side of the trench, 6 for the step and the wall's foot, 8 of wall.
    assert(
      CAP_SOLID_CELLS.length === 48 + 44 + 6 + 8,
      `the level should have 106 solid cells, has ${CAP_SOLID_CELLS.length}`,
    );
    assert(
      CAP_LANDMARKS.step.top - CAP_LANDMARKS.floorTop === 0.5,
      "the step rises exactly one tile above the floor",
    );
    assert(
      CAP_LANDMARKS.wall.top - CAP_LANDMARKS.floorTop === 2.5,
      "and the wall is 2.5 units tall, which is above the jump's 2.4 and so cannot be cleared",
    );
    assert(
      CAP_LANDMARKS.wall.top - CAP_LANDMARKS.floorTop > CAP_TUNING.jumpHeight,
      "asserted against the tuning rather than the number, so retuning the jump cannot silently break it",
    );
    // Every coordinate the scenes assert against is a binary fraction, so nothing prints float dust.
    for (const v of [
      CAP_LANDMARKS.floorTop,
      CAP_LANDMARKS.trench.from,
      CAP_LANDMARKS.step.from,
      CAP_LANDMARKS.step.top,
      CAP_LANDMARKS.wall.from,
      capChargeFace,
    ]) {
      assert(
        Number.isInteger(v * 16),
        `${v} is not a sixteenth, so it will print as float dust somewhere`,
      );
    }
  }
};
