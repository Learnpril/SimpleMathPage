/**
 * Build-time checks for the scenes. Never shown to a reader.
 *
 * A scene cannot be tested - there is no GPU in a build step - but the arithmetic that
 * positions things in it can be, and that is where the mistakes have actually been. The
 * turret once aimed exactly backwards while every displayed number was correct, because
 * the bug was in the direction-to-angle mapping rather than in the maths being printed.
 *
 * So each scene's mapping lives in a pure `*-shared.ts` module, and the assertions below
 * exercise it. If one fails, `astro build` stops with a non-zero exit and the page never
 * ships. Sweeps over hundreds of inputs are cheap here and cost the reader nothing,
 * which is exactly why they belong in this file and not on the page.
 */
import { assert, type Demo } from "./runner.ts";
import { basisFromYaw, degToRad } from "../conventions.ts";
import { dot } from "../dot.ts";
import { cross, buildBasis } from "../cross.ts";
import { length, normalize } from "../vectors.ts";
import { wrapRad, yawToFace, forwardAtYaw } from "./turret-shared.ts";
import { rawInput, velocityFrom, length as len2 } from "./diagonal-shared.ts";
import {
  normalFor,
  edges,
  eyeFromAzimuth,
  frontFaces,
  CENTROID,
} from "./winding-shared.ts";
import { targetAt, anglesOf } from "./lookat-shared.ts";
import { PLAYER, displacement, travel } from "./displacement-shared.ts";
import {
  IDENTITY2,
  IDENTITY3,
  IDENTITY4,
  SEQUENCES,
  applyMat2,
  applyMat3,
  applyMat4,
  applyRow4,
  composeSequence,
  determinant2,
  determinant3,
  direction,
  matrixFor,
  multiplyMat2,
  multiplyMat4,
  point,
  rotation2,
  rotationY4,
  rotationX4,
  rotationZ4,
  rowsOf,
  scale2,
  scale4,
  shear2,
  translation4,
  transpose4,
  type Mat2,
  type Mat3,
  type Mat4,
  type TRS,
  type Vec3,
} from "../matrices.ts";
import {
  basisOf,
  inverse3,
  inverseAffine4,
  normalMatrix,
  toWorld,
  transformDirection,
  viewFrom,
} from "../spaces.ts";
import {
  sphereSamples,
  transformSample,
  degreesOff,
} from "./normals-shared.ts";
import {
  clamp,
  clamp01,
  damp,
  decayFactor,
  halfLifeFromRate,
  inverseLerp,
  lerp,
  rateFromHalfLife,
  remainingAfter,
  remap,
} from "../interpolation.ts";
import {
  EASINGS,
  easeInOutCubic,
  easeInQuad,
  easeOutBack,
  easeOutElastic,
  easeOutQuad,
  linear,
  smoothstep,
  smoothstep01,
  smootherstep01,
  springStep,
  type SpringState,
} from "../easings.ts";
import {
  SMOOTH_TIME,
  decayAt,
  springAt,
  springStepped,
} from "./spring-shared.ts";
import {
  bezierAt,
  cubicAt,
  cubicTangent,
  cubicWeights,
  deCasteljauLevels,
  jumpArc,
  meets,
  sameDirection,
  sameTangent,
  tangentFromLevels,
  type Cubic,
} from "../bezier.ts";
import {
  FIRST,
  JOINS,
  chainAt,
  seamSpeeds,
  secondFor,
  type Join,
} from "./join-shared.ts";
import type { Vec2 } from "../matrices.ts";
import {
  buildArcTable,
  catmullRomAt,
  catmullRomTangent,
  catmullTangent,
  distanceAtT,
  hermiteAt,
  hermiteBasis,
  hermiteTangent,
  hermiteToBezier,
  segmentCount,
  tAtFraction,
} from "../splines.ts";
import {
  TABLE,
  WAYPOINTS,
  byDistance,
  byParameter,
  hopSpread,
  pathAt,
} from "./spline-shared.ts";
import {
  cartesianToSpherical,
  depthResolution,
  fovXFromFovY,
  fovYFromFovX,
  frustumCorners,
  frustumPlanes,
  insideFrustum,
  ndcDepth,
  ndcOf,
  ndcToScreen,
  orthographic,
  perspective,
  projectToScreen,
  raySphere,
  rayThroughNdc,
  screenToNdc,
  sphericalToCartesian,
  unprojectAt,
} from "../projection.ts";
import {
  closestOnBox,
  closestOnLine,
  closestOnPlane,
  closestOnSegment,
  closestOnSphere,
  distanceToPlane,
  magnitude,
  planeThrough,
  pointAt,
  rayPlane,
  signedDistanceToBox,
  signedDistanceToSphere,
} from "../geometry.ts";
import {
  BOX_MAX,
  BOX_MIN,
  GROUND,
  SEG_A,
  SEG_B,
  SPHERE_C,
  SPHERE_R,
  nearestIndex,
  nearestPoints,
} from "./closest-shared.ts";
import {
  FLOOR,
  RAY_ORIGIN,
  hitAtPitch,
  rayAtPitch,
} from "./rayplane-shared.ts";
import {
  aabbAabb,
  aabbOfCapsule,
  aabbOfSphere,
  capsuleCapsule,
  closestBetweenSegments,
  obbInterval,
  obbSeparationAlong,
  pairCount,
  rayAabb,
  slabInterval,
  sphereAabb,
  sphereCapsule,
  sphereSphere,
  type Aabb,
  type Obb,
} from "../collision.ts";
import {
  KINDS,
  STATIC_BOX,
  STATIC_CAPSULE,
  STATIC_SPHERE,
  movingCapsuleAt,
  testAt,
} from "./overlap-shared.ts";
import {
  BOX as SLAB_BOX,
  RAY_ORIGIN as SLAB_ORIGIN,
  directionFor,
  resultFor,
} from "./slabs-shared.ts";
import {
  BOX_A,
  BOX_B,
  CROSS_AXES,
  FACE_AXES,
  insideObb,
  samplesInside,
  worstGap,
} from "./sat-shared.ts";
import {
  apexAfterBounces,
  axisOverlaps,
  boxContact,
  decompose,
  expandBox,
  isWalkable,
  pushOut,
  reflect,
  respond,
  slideAlong,
  slopeAngle,
  sweepSphereToBox,
} from "../response.ts";
import {
  MAX_SLOPE,
  analyse,
  surfaceDirection,
  surfaceNormal,
} from "./slide-shared.ts";
import {
  DT,
  GAP,
  RADIUS,
  WALL,
  discreteHit,
  framePositions,
  stepFor,
  sweptHit,
} from "./tunnel-shared.ts";
import {
  EARTH_GRAVITY,
  airTime,
  apexHeight,
  dragStep,
  gravityFor,
  heightAt,
  heightWithFallMultiplier,
  jumpFromHeightAndGravity,
  jumpFromHeightAndTime,
  launchSpeedFor,
  riseFromImpulse,
  riseFromSteadyForce,
  stepProjectile,
  terminalSpeed,
  timeToApex,
} from "../dynamics.ts";
import {
  FORWARD as JUMP_FORWARD,
  analyticArc,
  derived,
  steppedApex,
} from "./jump-shared.ts";
import {
  SPEED,
  peakDistanceFraction,
  peakTimeFraction,
  rangeOf,
} from "./drag-shared.ts";
import {
  alphaFrom,
  blend,
  constant,
  energy,
  exact,
  spring,
  stepExplicit,
  stepSemiImplicit,
  stepVerlet,
  stepsFor,
  type State,
} from "../integrators.ts";
import {
  GRAVITY as THROW_GRAVITY,
  START as THROW_START,
  METHODS as THROW_METHODS,
  apexOf,
  endsAt,
  exactPath,
  maxErrorOf,
  path as throwPath,
} from "./integrators-shared.ts";
import {
  PERIOD,
  STIFFNESS,
  amplitudeRatio,
  energyRatio,
  phasePath,
} from "./stability-shared.ts";
import {
  HEIGHT as BODY_HEIGHT,
  MAX_SLOPE as WALK_LIMIT,
  RADIUS as BODY_RADIUS,
  SPEED as WALK_SPEED,
  STEP_HEIGHT,
  capsuleFor,
  moveDirection,
  resolve,
  supportUnder,
  step as stepCharacter,
  tryStepUp,
  uprightCapsuleContact,
  type Character,
} from "../controller.ts";
import {
  ALL_ON,
  DURATION as RUN_SECONDS,
  LEVEL,
  START as RUN_START,
  TICK,
  drawnAt,
  inputAt,
  shotAt,
  SHOT,
  simulate,
  stepWith,
} from "./capstone-shared.ts";
import { lookTarget, orbitPosition } from "../controller.ts";
import { markerCounts } from "./marker-shared.ts";
import {
  START,
  TARGET,
  framesToClose,
  simulateDamped,
  simulateNaive,
} from "./framerate-shared.ts";
import {
  ORDERS,
  YAW_PITCH_ROLL,
  axisInWorld,
  axisSeparation,
  bump,
  forwardOf,
  fromEuler,
  toEulerYXZ,
  type Euler,
} from "../euler.ts";
import {
  IDENTITY_QUAT,
  angleBetweenQuats,
  conjugate,
  dotQuat,
  fromAxisAngle,
  lerpQuat,
  multiplyQuat,
  negateQuat,
  nlerpQuat,
  normalizeQuat,
  quatLength,
  quatToMat4,
  rotateVector,
  shortWayFrom,
  slerpQuat,
  toAxisAngle,
  type Quat,
} from "../quaternions.ts";
import { FORWARD, dirFromBearing, coneTest } from "./cone-shared.ts";

const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) < tol;

/** The cube's own axes stay a proper right-handed orthonormal set as it turns. */
export const basisCheck: Demo = () => {
  for (let deg = 0; deg < 360; deg += 1) {
    const b = basisFromYaw(degToRad(deg));
    assert(near(length(b.x), 1), `basis x not unit at ${deg}`);
    assert(near(length(b.z), 1), `basis z not unit at ${deg}`);
    assert(near(dot(b.x, b.z), 0), `basis axes not perpendicular at ${deg}`);
    // Forward is -Z, so at rest it must be exactly (0, 0, -1).
    if (deg === 0) assert(near(b.z[2], 1), "resting forward is not -Z");
  }
};

/** Swapping two corners negates the normal, and nothing else about the triangle moves. */
export const windingCheck: Demo = () => {
  const ccw = normalFor(false);
  const cw = normalFor(true);
  ccw.forEach((n, i) => assert(near(n, -cw[i]), "normals are not opposite"));

  const { e1, e2 } = edges(false);
  assert(near(dot(ccw, e1), 0), "normal not perpendicular to e1");
  assert(near(dot(ccw, e2), 0), "normal not perpendicular to e2");
  assert(near(length(cross(e1, e2)), 4), "parallelogram area is not 4");

  // The camera never goes below the triangle, so the front/back verdict must be constant.
  for (let deg = 0; deg < 360; deg += 1) {
    const eye = eyeFromAzimuth(deg);
    assert(
      frontFaces(ccw, eye, CENTROID),
      `ccw should face the camera at ${deg}`,
    );
    assert(
      !frontFaces(cw, eye, CENTROID),
      `cw should not face the camera at ${deg}`,
    );
  }
};

/** The cone's bearing-to-direction mapping round-trips, and the edge lands where it should. */
export const coneCheck: Demo = () => {
  for (let deg = 0; deg < 360; deg += 1) {
    const dir = dirFromBearing(deg);
    assert(near(length(dir), 1), `bearing ${deg} is not a unit direction`);
    const back =
      (Math.acos(Math.min(1, Math.max(-1, dot(FORWARD, dir)))) * 180) / Math.PI;
    assert(
      near(back, deg <= 180 ? deg : 360 - deg, 1e-6),
      `bearing ${deg} did not round-trip`,
    );
  }
  for (const fov of [60, 90, 140]) {
    assert(
      coneTest(fov / 2 - 1, fov).inside,
      `just inside ${fov} read as outside`,
    );
    assert(
      !coneTest(fov / 2 + 1, fov).inside,
      `just outside ${fov} read as inside`,
    );
    assert(
      !coneTest(180, fov).inside,
      `directly behind read as inside for ${fov}`,
    );
  }
};

/** Aim at a target, then measure where the barrel ended up pointing. */
export const turretCheck: Demo = () => {
  const targets = [
    [0, -3],
    [3, 0],
    [0, 3],
    [-3, 0],
    [2, -2],
  ];
  for (const [x, z] of targets) {
    const f = forwardAtYaw(yawToFace(x, z));
    const want = normalize([x, z]);
    assert(want !== null, "degenerate target");
    // Dot of 1 means aimed at it. The old atan2(x, z) scored -1 here on every case.
    assert(
      near(f.x * want![0] + f.z * want![1], 1, 1e-9),
      `turret misaimed at ${x},${z}`,
    );
  }
  // Wrapping never changes the heading, and never exceeds half a turn.
  for (let deg = -720; deg <= 720; deg += 1) {
    const w = wrapRad(degToRad(deg));
    assert(w >= -Math.PI && w < Math.PI, `wrap out of range at ${deg}`);
  }
};

/** Normalized input gives one speed in every direction; raw input traces a square. */
export const diagonalCheck: Demo = () => {
  let slowest = Infinity;
  let fastest = 0;
  for (let deg = 0; deg < 360; deg += 1) {
    const input = rawInput(deg);
    // The raw input always sits on the unit square: its larger axis is exactly 1.
    assert(
      near(Math.max(Math.abs(input.x), Math.abs(input.y)), 1),
      `raw input at ${deg} is not on the unit square`,
    );
    // Normalizing gives one speed everywhere, which is what the teal circle claims.
    assert(
      near(len2(velocityFrom(input, 6, true)), 6),
      `normalized speed drifted at ${deg}`,
    );
    const raw = len2(velocityFrom(input, 6, false));
    slowest = Math.min(slowest, raw);
    fastest = Math.max(fastest, raw);
  }
  // Straight along an axis is already correct; only the corners are too fast.
  assert(near(slowest, 6), "raw input should be right on the axes");
  assert(
    near(fastest, 6 * Math.SQRT2),
    "the diagonal corners should be sqrt(2) too fast",
  );
  // Releasing everything must not produce a NaN.
  assert(
    len2(velocityFrom({ x: 0, y: 0 }, 6, true)) === 0,
    "zero input did not stay zero",
  );
};

/**
 * A matrix's columns really are where the axes land, and the determinant really is the
 * area scale.
 *
 * The first claim is the one the scene rests on: it draws two arrows for the columns and
 * expects the reader to believe the shape follows from them. So check it directly - push
 * the x axis through the matrix and assert you get column one back.
 */
export const matrixCheck: Demo = () => {
  const cases: Mat2[] = [
    IDENTITY2,
    scale2(2, 3),
    rotation2(45),
    shear2(1),
    scale2(-1, 1),
  ];

  for (const m of cases) {
    // Transforming the x axis gives the first column. Same for y and the second.
    const fromX = applyMat2(m, { x: 1, y: 0 });
    const fromY = applyMat2(m, { x: 0, y: 1 });
    assert(
      near(fromX.x, m.i.x) && near(fromX.y, m.i.y),
      "x axis is not column one",
    );
    assert(
      near(fromY.x, m.j.x) && near(fromY.y, m.j.y),
      "y axis is not column two",
    );

    // The origin never moves. A 2x2 matrix cannot translate, which is why Section 2.2 exists.
    const o = applyMat2(m, { x: 0, y: 0 });
    assert(o.x === 0 && o.y === 0, "the origin moved");
  }

  // A rotation preserves area, so its determinant is 1 at every angle.
  for (let deg = 0; deg < 360; deg += 1) {
    assert(
      near(determinant2(rotation2(deg)), 1),
      `rotation by ${deg} changed area`,
    );
  }

  // Scaling multiplies area by the product of the two scales.
  assert(
    near(determinant2(scale2(2, 3)), 6),
    "2 by 3 scale should sextuple area",
  );
  // A shear slides the shape but does not change how much of it there is.
  assert(near(determinant2(shear2(1)), 1), "shear should preserve area");
  // Mirroring one axis flips the sign and nothing else.
  assert(near(determinant2(scale2(-1, 1)), -1), "mirror should give -1");
  // Two columns pointing the same way span nothing.
  assert(
    near(determinant2({ i: { x: 1, y: 2 }, j: { x: 2, y: 4 } }), 0),
    "parallel columns should collapse",
  );

  // Composing is multiplying, and the determinants multiply with it.
  const a = scale2(2, 2);
  const b = rotation2(30);
  assert(
    near(determinant2(multiplyMat2(a, b)), determinant2(a) * determinant2(b)),
    "determinants should multiply",
  );

  // In 3D the determinant is a volume, and the same three facts hold.
  assert(near(determinant3(IDENTITY3), 1), "identity volume should be 1");
  const doubled: Mat3 = {
    i: { x: 2, y: 0, z: 0 },
    j: { x: 0, y: 2, z: 0 },
    k: { x: 0, y: 0, z: 2 },
  };
  assert(near(determinant3(doubled), 8), "doubling every axis should give 8");
  const flattened: Mat3 = {
    i: { x: 1, y: 0, z: 0 },
    j: { x: 0, y: 0, z: 0 },
    k: { x: 0, y: 0, z: 1 },
  };
  assert(
    near(determinant3(flattened), 0),
    "a flattened cube should have no volume",
  );
};

/**
 * The fourth component does what the section claims: places translate, directions do not.
 *
 * This is the whole payoff of homogeneous coordinates, and it is a claim about two values
 * that hold the *same three numbers*. So check both against the same matrix and assert they
 * disagree in exactly the intended way.
 */
export const homogeneousCheck: Demo = () => {
  const T = translation4(3, -2, 5);

  for (const v of [
    [1, 2, 3],
    [0, 0, 0],
    [-4, 0.5, 2],
  ]) {
    const asPlace = applyMat4(T, point(v[0], v[1], v[2]));
    const asDir = applyMat4(T, direction(v[0], v[1], v[2]));

    // A place picks up the whole translation.
    assert(near(asPlace.x, v[0] + 3), "place did not translate on x");
    assert(near(asPlace.y, v[1] - 2), "place did not translate on y");
    assert(near(asPlace.z, v[2] + 5), "place did not translate on z");
    // A direction picks up none of it, and stays a direction.
    assert(near(asDir.x, v[0]), "direction moved on x");
    assert(near(asDir.y, v[1]), "direction moved on y");
    assert(near(asDir.z, v[2]), "direction moved on z");
    // w survives the trip, so the value is still the kind of thing it started as.
    assert(asPlace.w === 1, "a place stopped being a place");
    assert(asDir.w === 0, "a direction stopped being a direction");
  }

  // The translation column is literally where the origin lands.
  const originGoes = applyMat4(T, point(0, 0, 0));
  assert(
    near(originGoes.x, T.t.x) &&
      near(originGoes.y, T.t.y) &&
      near(originGoes.z, T.t.z),
    "the fourth column is not where the origin lands",
  );

  // Rotation still leaves the origin alone, so its translation column stays zero.
  for (let deg = 0; deg < 360; deg += 15) {
    const R = rotationY4(deg);
    assert(
      near(R.t.x, 0) && near(R.t.y, 0) && near(R.t.z, 0),
      `rotation by ${deg} should not translate`,
    );
    // And a rotation must not change how long a direction is.
    const d = applyMat4(R, direction(1, 0, 0));
    assert(
      near(Math.hypot(d.x, d.y, d.z), 1),
      `rotation by ${deg} changed a length`,
    );
  }

  // Order matters, and this is the pair that proves it - the subject of Section 2.3.
  const moveThenTurn = multiplyMat4(rotationY4(90), translation4(2, 0, 0));
  const turnThenMove = multiplyMat4(translation4(2, 0, 0), rotationY4(90));
  const a = applyMat4(moveThenTurn, point(0, 0, 0));
  const b = applyMat4(turnThenMove, point(0, 0, 0));
  assert(
    !(near(a.x, b.x) && near(a.z, b.z)),
    "the two orderings should not agree - if they do, the demo has stopped teaching",
  );

  // Undoing a translation gets you back exactly where you were.
  const there = applyMat4(translation4(4, 5, 6), point(1, 1, 1));
  const back = applyMat4(translation4(-4, -5, -6), there);
  assert(
    near(back.x, 1) && near(back.y, 1) && near(back.z, 1),
    "translating back did not return to the start",
  );
};

/** Point minus point gives a journey; adding it back gets you the other place exactly. */
export const displacementCheck: Demo = () => {
  for (let x = -4; x <= 4; x += 1) {
    for (let z = -4; z <= 4; z += 1) {
      const target = [x, 0, z];
      const d = displacement(PLAYER, target);
      const back = travel(PLAYER, d);
      back.forEach((c, i) =>
        assert(
          c === target[i],
          `travel did not land on the target at ${x},${z}`,
        ),
      );
      // The journey's length is the distance between the two places.
      assert(
        near(length(d), Math.hypot(x - PLAYER[0], z - PLAYER[2])),
        `wrong distance at ${x},${z}`,
      );
      // Reversing it reverses the journey but not its length.
      const backwards = displacement(target, PLAYER);
      d.forEach((c, i) =>
        assert(near(c, -backwards[i]), "reverse is not opposite"),
      );
    }
  }
};

/**
 * The camera really looks at the target, and the basis it uses is a proper orientation.
 *
 * Three separate claims, and only the first is obvious from the picture: the orientation
 * points at the target, the three axes are orthonormal, and the triple is right-handed.
 * That last one is the reason this file exists - a left-handed basis passes every
 * orthonormality test and renders every object mirrored.
 */
export const lookatCheck: Demo = () => {
  for (let bearing = -180; bearing <= 180; bearing += 5) {
    for (let elevation = -85; elevation <= 85; elevation += 5) {
      const p = targetAt(bearing, elevation);

      // The mapping round-trips: put a target somewhere, read its angles back.
      const got = anglesOf(p);
      const wantBearing = bearing === -180 ? 180 : bearing;
      assert(
        near(Math.abs(got.bearing - wantBearing) % 360, 0, 1e-6) ||
          near(Math.abs(got.bearing - wantBearing), 360, 1e-6),
        `bearing ${bearing} came back as ${got.bearing}`,
      );
      assert(
        near(got.elevation, elevation, 1e-6),
        `elevation ${elevation} came back as ${got.elevation}`,
      );

      const b = buildBasis(p);
      assert(b !== null, `no orientation at ${bearing}, ${elevation}`);

      // Forward actually points at the target, which is the whole job.
      const want = normalize(p)!;
      assert(
        near(dot(b!.forward, want), 1, 1e-12),
        `not looking at the target at ${bearing}, ${elevation}`,
      );

      // Right is perpendicular to world up, so it is always level. The scene says so.
      assert(near(b!.right[1], 0, 1e-12), "right is not horizontal");

      // Orthonormal: three unit lengths and three right angles.
      for (const v of [b!.right, b!.up, b!.forward]) {
        assert(near(length(v), 1, 1e-12), "axis is not unit length");
      }
      assert(
        near(dot(b!.right, b!.up), 0, 1e-12),
        "right and up not perpendicular",
      );
      assert(
        near(dot(b!.up, b!.forward), 0, 1e-12),
        "up and forward not perpendicular",
      );

      // And right-handed, which orthonormality alone cannot tell you. Swap the arguments
      // of the first cross product and everything above still passes while this flips to
      // -1, mirroring every object oriented by the basis.
      const backward = b!.forward.map((n) => -n);
      assert(
        near(dot(cross(b!.right, b!.up), backward), 1, 1e-12),
        "the basis is left-handed",
      );
    }
  }

  // Both poles have no answer, and the scene has to survive being dragged onto them.
  assert(
    buildBasis(targetAt(0, 90)) === null,
    "the top pole should have no answer",
  );
  assert(
    buildBasis(targetAt(0, -90)) === null,
    "the bottom pole should have no answer",
  );
  // One degree short of the pole still works, which is why engines clamp pitch there.
  assert(buildBasis(targetAt(0, 89)) !== null, "89 degrees should still work");
};

/** Compare two 4x4s entry by entry. */
const sameMat = (a: Mat4, b: Mat4, tol = 1e-9) => {
  const x = rowsOf(a).flat();
  const y = rowsOf(b).flat();
  return x.every((n, i) => Math.abs(n - y[i]) < tol);
};

/** Do the box's own edges still meet at right angles? Its edges are the first three columns. */
const square = (m: Mat4, tol = 1e-9) => {
  const d = (a: typeof m.i, b: typeof m.i) =>
    Math.abs(a.x * b.x + a.y * b.y + a.z * b.z);
  return d(m.i, m.j) < tol && d(m.j, m.k) < tol && d(m.i, m.k) < tol;
};

/**
 * The two rules that pick scale-rotate-translate out of the six orderings, checked rather
 * than asserted in prose.
 *
 * Both rules are the kind of claim that is easy to state and easy to get backwards, and the
 * second one only shows up under **non-uniform** scale - with equal scale factors, scaling
 * and rotating commute and five of the six orderings collapse into three. That is precisely
 * why the bug survives so long in real projects: it is invisible until an artist types
 * unequal numbers into a scale field.
 */
export const trsCheck: Demo = () => {
  const v: TRS = {
    scale: { x: 2.2, y: 1, z: 1 },
    degrees: 40,
    translate: { x: 2, y: 0, z: -1 },
  };
  const S = matrixFor(v, "scale");
  const R = matrixFor(v, "rotate");
  const T = matrixFor(v, "translate");
  const standard = composeSequence(v, ["scale", "rotate", "translate"]);

  // The sequence read left to right builds the product read right to left.
  assert(
    sameMat(standard, multiplyMat4(T, multiplyMat4(R, S))),
    "scale-rotate-translate is not the product T * R * S",
  );

  // All six really are different. If any two agree, the demo has stopped teaching.
  for (let a = 0; a < SEQUENCES.length; a += 1) {
    for (let b = a + 1; b < SEQUENCES.length; b += 1) {
      assert(
        !sameMat(
          composeSequence(v, SEQUENCES[a]),
          composeSequence(v, SEQUENCES[b]),
        ),
        `orderings ${SEQUENCES[a].join("-")} and ${SEQUENCES[b].join("-")} agree`,
      );
    }
  }

  // Rule one. Translating last, and only translating last, puts the object where you asked.
  for (const seq of SEQUENCES) {
    const where = applyMat4(composeSequence(v, seq), point(0, 0, 0));
    const landed =
      near(where.x, v.translate.x) &&
      near(where.y, v.translate.y) &&
      near(where.z, v.translate.z);
    assert(
      landed === (seq[2] === "translate"),
      `${seq.join("-")} ${landed ? "landed" : "missed"} unexpectedly`,
    );
  }

  // Rule two. Of the two that translate last, only scale-before-rotate keeps the box a box.
  assert(square(standard), "scale then rotate should leave the corners square");
  assert(
    !square(composeSequence(v, ["rotate", "scale", "translate"])),
    "rotate then uneven scale should shear the corners",
  );

  // And the reason the mistake hides: with equal scale factors those two are the same matrix.
  const uniform: TRS = { ...v, scale: { x: 1.5, y: 1.5, z: 1.5 } };
  assert(
    sameMat(
      composeSequence(uniform, ["scale", "rotate", "translate"]),
      composeSequence(uniform, ["rotate", "scale", "translate"]),
    ),
    "uniform scale should commute with rotation",
  );
  assert(
    !sameMat(
      composeSequence(v, ["scale", "rotate", "translate"]),
      composeSequence(v, ["rotate", "scale", "translate"]),
    ),
    "uneven scale should not commute with rotation",
  );

  // Row vectors: the same transform, transposed, with the product written backwards.
  const probe = point(1.5, -0.5, 2);
  const asColumn = applyMat4(standard, probe);
  const asRow = applyRow4(probe, transpose4(standard));
  assert(
    near(asRow.x, asColumn.x) &&
      near(asRow.y, asColumn.y) &&
      near(asRow.z, asColumn.z),
    "the row and column conventions disagree about the same transform",
  );
  assert(
    sameMat(
      multiplyMat4(transpose4(S), multiplyMat4(transpose4(R), transpose4(T))),
      transpose4(standard),
    ),
    "row-order S * R * T is not column-order T * R * S transposed",
  );

  // Transposing twice is a no-op, so nothing above smuggled in a layout error.
  assert(
    sameMat(transpose4(transpose4(standard)), standard),
    "transposing twice changed the matrix",
  );

  // Undoing a composition needs the inverse steps in the opposite order.
  const undo = composeSequence(
    {
      scale: { x: 1 / 2.2, y: 1, z: 1 },
      degrees: -40,
      translate: { x: -2, y: 0, z: 1 },
    },
    ["translate", "rotate", "scale"],
  );
  const roundTrip = applyMat4(undo, applyMat4(standard, probe));
  assert(
    near(roundTrip.x, probe.x, 1e-12) &&
      near(roundTrip.y, probe.y, 1e-12) &&
      near(roundTrip.z, probe.z, 1e-12),
    "undoing the transform in reverse order did not return to the start",
  );
};

/**
 * Bit-for-bit equality, for claims that are exact rather than merely close.
 *
 * Note this is not `sameMat` with a tolerance of zero - that would compare `< 0` and never
 * pass. Some claims really are exact and deserve saying so.
 */
const exactMat = (a: Mat4, b: Mat4) => {
  const x = rowsOf(a).flat();
  const y = rowsOf(b).flat();
  return x.every((n, i) => n === y[i]);
};

const dot3 = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;

const sameMat3 = (a: Mat3, b: Mat3, tol = 1e-9) =>
  (["i", "j", "k"] as const).every(
    (k) =>
      near(a[k].x, b[k].x, tol) &&
      near(a[k].y, b[k].y, tol) &&
      near(a[k].z, b[k].z, tol),
  );

/**
 * Getting back. Inverses, parent chains, and the view matrix being nothing special.
 */
export const spacesCheck: Demo = () => {
  const cases: Mat4[] = [
    IDENTITY4,
    translation4(3, -2, 5),
    rotationY4(37),
    scale4(2, 0.5, 1.5),
    multiplyMat4(
      translation4(1, 2, 3),
      multiplyMat4(rotationY4(120), scale4(2, 1, 0.4)),
    ),
  ];

  for (const m of cases) {
    const inv = inverseAffine4(m);
    assert(inv !== null, "an invertible transform reported no inverse");
    // Undo then redo has to be the identity, in both orders.
    assert(
      sameMat(multiplyMat4(inv!, m), IDENTITY4, 1e-9),
      "inverse * m is not identity",
    );
    assert(
      sameMat(multiplyMat4(m, inv!), IDENTITY4, 1e-9),
      "m * inverse is not identity",
    );

    // And the 3x3 on its own, since that is what normalMatrix leans on.
    const b3 = inverse3(basisOf(m));
    assert(b3 !== null, "an invertible basis reported no inverse");
    const back = applyMat3(
      b3!,
      applyMat3(basisOf(m), { x: 1.5, y: -2, z: 0.25 }),
    );
    assert(
      near(back.x, 1.5, 1e-9) &&
        near(back.y, -2, 1e-9) &&
        near(back.z, 0.25, 1e-9),
      "inverse3 did not undo the basis",
    );
  }

  // A flattened transform has no inverse, and must say so rather than returning Infinity.
  assert(
    inverse3({
      i: { x: 1, y: 0, z: 0 },
      j: { x: 2, y: 0, z: 0 },
      k: { x: 0, y: 0, z: 1 },
    }) === null,
    "a collapsed basis should have no inverse",
  );
  assert(
    inverseAffine4(scale4(1, 0, 1)) === null,
    "a zero scale should have no inverse",
  );

  // Parenting is one multiplication, and the child's world origin is the parent applied to
  // the child's local origin. This is the claim the scene rests on.
  const parent = multiplyMat4(translation4(1, 0, 0), rotationY4(90));
  const child = translation4(0, 0.6, 1.3);
  const world = toWorld([parent, child]);
  assert(
    sameMat(world, multiplyMat4(parent, child)),
    "toWorld is not parent * child",
  );
  const childOrigin = applyMat4(world, point(0, 0, 0));
  const byHand = applyMat4(parent, applyMat4(child, point(0, 0, 0)));
  assert(
    near(childOrigin.x, byHand.x) &&
      near(childOrigin.y, byHand.y) &&
      near(childOrigin.z, byHand.z),
    "the child's world origin is not its local origin sent through the parent",
  );
  // A quarter turn about y sends the child's local +z offset onto world +x.
  assert(
    near(childOrigin.x, 2.3) && near(childOrigin.z, 0),
    "the quarter turn went the wrong way",
  );

  // Deeper chains keep associating the same way, so nesting cannot drift.
  const grandchild = rotationY4(45);
  assert(
    sameMat(
      toWorld([parent, child, grandchild]),
      multiplyMat4(multiplyMat4(parent, child), grandchild),
    ),
    "a three-deep chain is not left-associative",
  );
  // An identity parent changes nothing, which is what "no parent" means.
  assert(
    sameMat(toWorld([IDENTITY4, child]), child),
    "an identity parent changed the child",
  );

  // The view matrix puts the camera at the origin. That is the whole definition.
  const cameraWorld = multiplyMat4(translation4(2, 3, 8), rotationY4(25));
  const view = viewFrom(cameraWorld);
  assert(view !== null, "the camera had no view matrix");
  const cam = applyMat4(view!, point(2, 3, 8));
  assert(
    near(cam.x, 0, 1e-9) && near(cam.y, 0, 1e-9) && near(cam.z, 0, 1e-9),
    "the camera is not at the origin of its own view space",
  );
  // A point placed straight in front of the camera lands on negative z, not positive.
  const inFront = applyMat4(cameraWorld, point(0, 0, -5));
  const seen = applyMat4(view!, inFront);
  assert(near(seen.z, -5, 1e-9), "forward is not -Z in view space");
};

/**
 * Normals need the inverse transpose, and the surface itself is the referee.
 *
 * The test does not compare against a hand-derived formula - that would only check that two
 * pieces of algebra agree. It transforms the two directions *along* the surface and asserts
 * the candidate normal is still perpendicular to both. A normal that fails that is wrong no
 * matter how it was computed.
 */
export const normalsCheck: Demo = () => {
  const samples = sphereSamples(8, 16);
  assert(samples.length === 112, "the sample grid changed size unexpectedly");

  // Every sample starts out consistent: the normal is square to both surface directions.
  for (const s of samples) {
    assert(
      near(dot3(s.n, s.t1), 0, 1e-12),
      "a sample's normal is not square to t1",
    );
    assert(
      near(dot3(s.n, s.t2), 0, 1e-12),
      "a sample's normal is not square to t2",
    );
  }

  const uneven: Mat4[] = [
    scale4(1, 0.35, 1),
    scale4(2.5, 1, 1),
    scale4(1, 1, 0.2),
    multiplyMat4(rotationY4(50), scale4(2, 0.5, 1)),
    multiplyMat4(
      translation4(4, -1, 2),
      multiplyMat4(rotationY4(115), scale4(0.4, 2, 1.7)),
    ),
  ];

  let worstNaive = 0;
  for (const m of uneven) {
    let worstHere = 0;
    for (const s of samples) {
      const t = transformSample(m, s);
      assert(
        t.correct !== null,
        "an invertible transform gave no normal matrix",
      );
      // The inverse transpose keeps the normal square to the surface. Everywhere.
      assert(
        degreesOff(t.correct!, t.tangents) < 1e-6,
        "the inverse-transpose normal left the surface",
      );
      worstHere = Math.max(worstHere, degreesOff(t.naive, t.tangents));
    }
    // And the tempting answer does not, by a margin nobody could call rounding error.
    assert(
      worstHere > 5,
      "the naive normal should be visibly wrong under uneven scale",
    );
    worstNaive = Math.max(worstNaive, worstHere);
  }
  assert(
    worstNaive > 30,
    "the worst naive error should be large enough to see",
  );

  // Translation is irrelevant to a normal, so adding one must change nothing at all.
  const bare = scale4(1, 0.35, 1);
  const moved = multiplyMat4(translation4(9, -4, 6), bare);
  for (const s of samples) {
    const a = transformSample(bare, s);
    const b = transformSample(moved, s);
    assert(
      near(a.correct!.x, b.correct!.x, 1e-12) &&
        near(a.correct!.y, b.correct!.y, 1e-12) &&
        near(a.correct!.z, b.correct!.z, 1e-12),
      "translating the object changed its normals",
    );
  }

  // And the reason the bug hides, exactly as in Section 2.3: with a rotation or a uniform
  // scale the two answers point the same way, so the naive version looks fine.
  for (const m of [
    rotationY4(70),
    scale4(1.8, 1.8, 1.8),
    multiplyMat4(rotationY4(20), scale4(2, 2, 2)),
  ]) {
    for (const s of samples) {
      const t = transformSample(m, s);
      assert(
        near(dot3(t.naive, t.correct!), 1, 1e-9),
        "under uniform scale the two normals should agree",
      );
    }
  }

  // A rotation is its own inverse transpose, which is why rigid transforms never hit this.
  const R = rotationY4(70);
  assert(
    sameMat3(normalMatrix(R)!, basisOf(R)),
    "the normal matrix of a rotation should be the rotation",
  );
};

/**
 * Euler angles: the order convention, and gimbal lock as a measurement.
 *
 * The interesting assertion is the last group. Gimbal lock is usually described rather than
 * quantified, which makes it hard to test and easy to hand-wave. Here it is a number - the
 * angle between the outer and inner rotation axes - and for yaw-pitch-roll that number turns
 * out to be exactly `90 - |pitch|`, which is a far stronger thing to check than "it goes
 * wrong near the poles".
 */
export const gimbalCheck: Demo = () => {
  const flat: Euler = { x: 0, y: 0, z: 0 };

  for (const order of ORDERS) {
    // Three zeros is the do-nothing rotation, whichever order you claim to use.
    assert(
      sameMat(fromEuler(flat, order), IDENTITY4),
      `${order} at zero is not the identity`,
    );
    // One non-zero angle must be that axis alone, because the other two are identities.
    assert(
      sameMat(fromEuler({ ...flat, x: 37 }, order), rotationX4(37)),
      `${order} mishandled a lone x angle`,
    );
    assert(
      sameMat(fromEuler({ ...flat, y: 37 }, order), rotationY4(37)),
      `${order} mishandled a lone y angle`,
    );
    assert(
      sameMat(fromEuler({ ...flat, z: 37 }, order), rotationZ4(37)),
      `${order} mishandled a lone z angle`,
    );
  }

  // Forward is -Z at rest. Everything on the page depends on this being true.
  const rest = forwardOf(IDENTITY4);
  assert(
    rest.x === 0 && rest.y === 0 && rest.z === -1,
    "forward at rest is not -Z",
  );

  // The order string names the product, left to right. This pins the convention down, and it
  // is the one Three.js uses - verified against three.js itself before it was written down.
  const e: Euler = { x: 30, y: 60, z: 45 };
  assert(
    sameMat(
      fromEuler(e, "XYZ"),
      multiplyMat4(
        rotationX4(30),
        multiplyMat4(rotationY4(60), rotationZ4(45)),
      ),
    ),
    "XYZ is not the product Rx * Ry * Rz",
  );
  assert(
    sameMat(
      fromEuler(e, "ZYX"),
      multiplyMat4(
        rotationZ4(45),
        multiplyMat4(rotationY4(60), rotationX4(30)),
      ),
    ),
    "ZYX is not the product Rz * Ry * Rx",
  );

  // Six orders, six different orientations. If any two agree the demo teaches nothing.
  for (let a = 0; a < ORDERS.length; a += 1) {
    for (let b = a + 1; b < ORDERS.length; b += 1) {
      assert(
        !sameMat(fromEuler(e, ORDERS[a]), fromEuler(e, ORDERS[b])),
        `orders ${ORDERS[a]} and ${ORDERS[b]} agree`,
      );
    }
  }

  // Whatever the order and whatever the angles, the result is a proper rotation: three unit
  // columns, three right angles, determinant +1 rather than -1.
  for (const order of ORDERS) {
    for (let x = -180; x <= 180; x += 37) {
      for (let y = -180; y <= 180; y += 41) {
        for (let z = -180; z <= 180; z += 43) {
          const b = basisOf(fromEuler({ x, y, z }, order));
          assert(
            near(determinant3(b), 1, 1e-12),
            `${order} at ${x},${y},${z} is not a proper rotation`,
          );
          for (const col of [b.i, b.j, b.k]) {
            assert(
              near(Math.hypot(col.x, col.y, col.z), 1, 1e-12),
              `${order} produced a non-unit axis`,
            );
          }
          assert(near(dot3(b.i, b.j), 0, 1e-12), "axes not perpendicular");
          assert(near(dot3(b.j, b.k), 0, 1e-12), "axes not perpendicular");
          assert(near(dot3(b.i, b.k), 0, 1e-12), "axes not perpendicular");
        }
      }
    }
  }

  // The outer axis is a world axis and never moves, however the other two are set.
  for (let x = -180; x <= 180; x += 30) {
    for (let z = -180; z <= 180; z += 30) {
      const outer = axisInWorld({ x, y: 137, z }, YAW_PITCH_ROLL, 0);
      assert(
        near(outer.x, 0, 1e-12) &&
          near(outer.y, 1, 1e-12) &&
          near(outer.z, 0, 1e-12),
        "the outer axis of YXZ should be world Y and should not move",
      );
    }
  }

  // Gimbal lock, quantified: for yaw-pitch-roll the outer and inner axes are exactly
  // 90 - |pitch| degrees apart, no matter what the yaw and the roll are doing.
  for (let p = -90; p <= 90; p += 5) {
    for (let y = -180; y <= 180; y += 45) {
      for (let z = -180; z <= 180; z += 45) {
        assert(
          near(
            axisSeparation({ x: p, y, z }, YAW_PITCH_ROLL),
            90 - Math.abs(p),
            1e-9,
          ),
          `separation at pitch ${p} is not 90 - |pitch|`,
        );
      }
    }
  }

  // And the degeneracy itself. At pitch +90 the yaw and roll axes are exactly anti-parallel,
  // so adding the same amount to both changes the orientation not at all - three numbers, two
  // degrees of freedom. This is the claim the scene is making, checked directly.
  const noseUp: Euler = { x: 90, y: 25, z: 15 };
  assert(
    sameMat(
      fromEuler(noseUp, YAW_PITCH_ROLL),
      fromEuler(bump(bump(noseUp, "Y", 10), "Z", 10), YAW_PITCH_ROLL),
    ),
    "at pitch +90 yaw and roll should cancel each other",
  );
  // At pitch -90 they are parallel instead, so the cancelling move is the opposite one.
  const noseDown: Euler = { x: -90, y: 25, z: 15 };
  assert(
    sameMat(
      fromEuler(noseDown, YAW_PITCH_ROLL),
      fromEuler(bump(bump(noseDown, "Y", 10), "Z", -10), YAW_PITCH_ROLL),
    ),
    "at pitch -90 yaw and roll should cancel with opposite signs",
  );
  // Away from the pole neither trick does anything, which is what "not locked" means.
  const level: Euler = { x: 20, y: 25, z: 15 };
  for (const d of [10, -10]) {
    assert(
      !sameMat(
        fromEuler(level, YAW_PITCH_ROLL),
        fromEuler(bump(bump(level, "Y", 10), "Z", d), YAW_PITCH_ROLL),
      ),
      "away from the pole yaw and roll should not cancel",
    );
  }
};

const sameQuat = (a: Quat, b: Quat, tol = 1e-12) =>
  near(a.x, b.x, tol) &&
  near(a.y, b.y, tol) &&
  near(a.z, b.z, tol) &&
  near(a.w, b.w, tol);

/**
 * Quaternions: the half angle, the bridge to Part 2's matrices, and the double cover.
 *
 * Two of these groups matter more than the rest. The first is that a quaternion built about
 * X, Y or Z reproduces `rotationX4`, `rotationY4` and `rotationZ4` **exactly** - which means
 * quaternions are not a separate theory bolted on, they are the same rotations reached another
 * way, and either representation can be swapped for the other.
 *
 * The second is the double cover. `q` and `-q` differ in all four numbers and produce a
 * bit-for-bit identical matrix, so no measurement of the object can tell them apart. That is
 * the whole reason `shortWayFrom` has to exist.
 */
export const quatCheck: Demo = () => {
  const axes: Vec3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0.4, y: -0.7, z: 0.3 },
    { x: -1, y: 2, z: 0.5 },
  ];

  // Doing nothing is doing nothing, and a zero axis has no rotation to describe.
  assert(
    sameMat(quatToMat4(IDENTITY_QUAT), IDENTITY4),
    "the identity quaternion rotates",
  );
  assert(
    fromAxisAngle({ x: 0, y: 0, z: 0 }, 90) === null,
    "a zero axis should have no answer",
  );

  for (const axis of axes) {
    for (let d = -350; d <= 350; d += 7) {
      const q = fromAxisAngle(axis, d)!;
      assert(q !== null, "a real axis gave no quaternion");

      // Unit length, always. Everything else assumes it.
      assert(near(quatLength(q), 1, 1e-12), `not unit at ${d}`);

      // The half angle, which is the one design decision the whole type rests on.
      const half = (d * Math.PI) / 360;
      assert(
        near(q.w, Math.cos(half), 1e-12),
        `w is not cos of the half angle at ${d}`,
      );
      assert(
        near(Math.hypot(q.x, q.y, q.z), Math.abs(Math.sin(half)), 1e-12),
        `the axis part is not sin of the half angle at ${d}`,
      );

      // Rotating a vector directly and rotating it through the matrix must agree. Two
      // independent routes to the same place, so a mistake in either one shows up here.
      for (const v of [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 0, z: -1 },
        { x: 0.3, y: -2, z: 1.4 },
      ]) {
        const direct = rotateVector(q, v);
        const viaMatrix = transformDirection(quatToMat4(q), v);
        assert(
          near(direct.x, viaMatrix.x, 1e-12) &&
            near(direct.y, viaMatrix.y, 1e-12) &&
            near(direct.z, viaMatrix.z, 1e-12),
          `rotateVector disagreed with the matrix at ${d}`,
        );
        // A rotation cannot change a length.
        assert(
          near(
            Math.hypot(direct.x, direct.y, direct.z),
            Math.hypot(v.x, v.y, v.z),
            1e-12,
          ),
          "a rotation changed a length",
        );
      }

      // The conjugate undoes it, so the sandwich is genuinely invertible.
      const back = rotateVector(
        conjugate(q),
        rotateVector(q, { x: 0.3, y: -2, z: 1.4 }),
      );
      assert(
        near(back.x, 0.3, 1e-12) &&
          near(back.y, -2, 1e-12) &&
          near(back.z, 1.4, 1e-12),
        `the conjugate did not undo the rotation at ${d}`,
      );

      // Double cover: the far twin is bit-for-bit the same rotation, and zero degrees away.
      const twin = negateQuat(q);
      assert(
        !sameQuat(q, twin, 1e-9) || d === 0,
        "the twin should differ in its numbers",
      );
      assert(
        exactMat(quatToMat4(twin), quatToMat4(q)),
        `q and -q gave different matrices at ${d}`,
      );
      /* Loose on purpose. The matrices above are exactly equal, but recovering the angle goes
         through `acos` of a dot product sitting at 1, where acos is ill-conditioned: a 1e-16
         wobble in the input becomes about 1e-8 in the output. Same family of problem as the
         acos clamping in Part 1, and a reason not to measure tiny angles this way. */
      assert(
        near(angleBetweenQuats(q, twin), 0, 1e-4),
        "q and -q should be zero degrees apart",
      );
    }
  }

  // A quaternion about X, Y or Z is exactly Part 2's matrix for that axis. This is the bridge.
  for (let d = -180; d <= 180; d += 3) {
    assert(
      sameMat(
        quatToMat4(fromAxisAngle({ x: 1, y: 0, z: 0 }, d)!),
        rotationX4(d),
        1e-12,
      ),
      `the x quaternion does not match rotationX4 at ${d}`,
    );
    assert(
      sameMat(
        quatToMat4(fromAxisAngle({ x: 0, y: 1, z: 0 }, d)!),
        rotationY4(d),
        1e-12,
      ),
      `the y quaternion does not match rotationY4 at ${d}`,
    );
    assert(
      sameMat(
        quatToMat4(fromAxisAngle({ x: 0, y: 0, z: 1 }, d)!),
        rotationZ4(d),
        1e-12,
      ),
      `the z quaternion does not match rotationZ4 at ${d}`,
    );
  }

  // Multiplying composes, in the same order matrices do, and does not commute.
  const a = fromAxisAngle({ x: 0.2, y: 1, z: 0.4 }, 63)!;
  const b = fromAxisAngle({ x: -1, y: 0.3, z: 0.9 }, 128)!;
  assert(
    sameMat(
      quatToMat4(multiplyQuat(a, b)),
      multiplyMat4(quatToMat4(a), quatToMat4(b)),
      1e-12,
    ),
    "quaternion composition does not match matrix composition",
  );
  assert(
    !sameMat(
      quatToMat4(multiplyQuat(a, b)),
      quatToMat4(multiplyQuat(b, a)),
      1e-9,
    ),
    "quaternion multiplication should not commute",
  );
  // The conjugate is the inverse, as a product rather than via a rotated vector.
  assert(
    sameQuat(multiplyQuat(a, conjugate(a)), IDENTITY_QUAT, 1e-12),
    "q times its conjugate is not the identity",
  );

  // Axis and angle survive the round trip.
  for (const axis of axes) {
    for (let d = 5; d <= 175; d += 5) {
      const q = fromAxisAngle(axis, d)!;
      const read = toAxisAngle(q);
      assert(near(read.degrees, d, 1e-9), `the angle came back wrong at ${d}`);
      assert(
        sameQuat(fromAxisAngle(read.axis, read.degrees)!, q, 1e-12),
        `the axis-angle round trip drifted at ${d}`,
      );
    }
  }
  // And the one case with no axis to report is handled rather than dividing by zero.
  assert(
    toAxisAngle(IDENTITY_QUAT).degrees === 0,
    "the identity should report no rotation",
  );

  // The short-way fix. These two headings are 40 degrees apart, yet their dot is negative.
  const from = fromAxisAngle({ x: 0, y: 1, z: 0 }, 20)!;
  const to = fromAxisAngle({ x: 0, y: 1, z: 0 }, 340)!;
  assert(dotQuat(from, to) < 0, "this pair was chosen for its negative dot");
  assert(
    near(angleBetweenQuats(from, to), 40, 1e-9),
    "the pair should be 40 degrees apart",
  );

  const swept = (target: Quat) => {
    let total = 0;
    let prev = from;
    for (let i = 1; i <= 400; i += 1) {
      const q = nlerpQuat(from, target, i / 400)!;
      total += angleBetweenQuats(prev, q);
      prev = q;
    }
    return total;
  };
  // Without the flip the object travels 320 degrees to end up 40 degrees away. With it, 40.
  assert(near(swept(to), 320, 0.5), "the naive blend should sweep 320 degrees");
  assert(
    near(swept(shortWayFrom(from, to)), 40, 0.5),
    "the fixed blend should sweep 40",
  );
  assert(
    dotQuat(from, shortWayFrom(from, to)) >= 0,
    "the flip did not fix the sign",
  );
  // Flipping must not change which orientation you arrive at.
  assert(
    exactMat(quatToMat4(shortWayFrom(from, to)), quatToMat4(to)),
    "the flip changed the destination",
  );
  // And when the dot is already positive it must leave the value alone.
  assert(
    shortWayFrom(from, from) === from,
    "an already-short pair should be returned untouched",
  );

  // The payoff against Section 3.1: no poles. Blend straight up to straight down and every
  // step stays a unit quaternion, finite, and monotonically further from the start.
  const up = fromAxisAngle({ x: 1, y: 0, z: 0 }, -90)!;
  const down = fromAxisAngle({ x: 1, y: 0, z: 0 }, 90)!;
  let previous = -1;
  for (let i = 0; i <= 200; i += 1) {
    const q = nlerpQuat(up, shortWayFrom(up, down), i / 200);
    assert(q !== null, `the blend collapsed at t = ${i / 200}`);
    assert(Number.isFinite(q!.w), `a NaN appeared at t = ${i / 200}`);
    assert(
      near(quatLength(q!), 1, 1e-12),
      `the blend left the unit sphere at ${i / 200}`,
    );
    const ahead = angleBetweenQuats(up, q!);
    assert(
      ahead >= previous - 1e-9,
      `the blend went backwards at t = ${i / 200}`,
    );
    previous = ahead;
  }
  assert(near(previous, 180, 1e-6), "pole to pole should be 180 degrees");
};

/**
 * Interpolating rotations: what slerp actually fixes, and what it does not.
 *
 * The claim worth checking hardest is the one that corrects the usual telling. slerp and nlerp
 * do **not** take different paths - normalizing a straight line between two points on a sphere
 * lands you on the great circle through them, so both trace the identical arc. The assertions
 * below prove that by showing every sample from both methods lies in the two-dimensional plane
 * spanned by the endpoints. What differs is only the *rate*, and that is measured separately.
 */
export const slerpCheck: Demo = () => {
  const axis: Vec3 = { x: 0.3, y: 1, z: -0.4 };
  const from = fromAxisAngle(axis, 0)!;

  /** How far a quaternion sticks out of the plane spanned by `from` and `to`. */
  const outOfPlane = (to: Quat, q: Quat) => {
    const d = dotQuat(from, to);
    const perp = {
      x: to.x - d * from.x,
      y: to.y - d * from.y,
      z: to.z - d * from.z,
      w: to.w - d * from.w,
    };
    const len = Math.sqrt(dotQuat(perp, perp));
    if (len < 1e-12) return 0;
    const u = {
      x: perp.x / len,
      y: perp.y / len,
      z: perp.z / len,
      w: perp.w / len,
    };
    const ca = dotQuat(q, from);
    const cu = dotQuat(q, u);
    const rest = {
      x: q.x - ca * from.x - cu * u.x,
      y: q.y - ca * from.y - cu * u.y,
      z: q.z - ca * from.z - cu * u.z,
      w: q.w - ca * from.w - cu * u.w,
    };
    return Math.sqrt(dotQuat(rest, rest));
  };

  // Endpoints are exact for both, which is the one thing every method must agree on.
  for (const total of [20, 60, 120, 170]) {
    const to = fromAxisAngle(axis, total)!;
    for (const blend of [nlerpQuat, slerpQuat]) {
      assert(
        near(angleBetweenQuats(from, blend(from, to, 0)!), 0, 1e-4),
        "t=0 is not the start",
      );
      assert(
        near(angleBetweenQuats(to, blend(from, to, 1)!), 0, 1e-4),
        "t=1 is not the end",
      );
    }
  }

  // slerp advances at exactly t times the total. That is the whole reason it exists.
  for (const total of [20, 60, 120, 170]) {
    const to = fromAxisAngle(axis, total)!;
    for (let i = 0; i <= 200; i += 1) {
      const t = i / 200;
      const q = slerpQuat(from, to, t)!;
      assert(
        near(quatLength(q), 1, 1e-12),
        `slerp left the unit sphere at t=${t}`,
      );
      assert(
        near(angleBetweenQuats(from, q), t * total, 1e-6),
        `slerp is not constant speed at t=${t} over ${total} degrees`,
      );
      // Both methods stay on the same arc: no component outside the endpoints' plane.
      assert(
        outOfPlane(to, q) < 1e-12,
        "slerp left the plane of its endpoints",
      );
      assert(
        outOfPlane(to, nlerpQuat(from, to, t)!) < 1e-12,
        "nlerp left the plane of its endpoints",
      );
    }
  }

  // The two agree exactly at the ends and at the midpoint, and nowhere else.
  const to150 = fromAxisAngle(axis, 150)!;
  for (const t of [0, 0.5, 1]) {
    assert(
      near(
        angleBetweenQuats(
          slerpQuat(from, to150, t)!,
          nlerpQuat(from, to150, t)!,
        ),
        0,
        1e-4,
      ),
      `slerp and nlerp should agree at t=${t}`,
    );
  }

  // nlerp's error grows with the size of the turn: negligible for small ones, visible for big.
  const worstNlerp = (total: number) => {
    const to = fromAxisAngle(axis, total)!;
    let worst = 0;
    for (let i = 0; i <= 400; i += 1) {
      const t = i / 400;
      worst = Math.max(
        worst,
        Math.abs(angleBetweenQuats(from, nlerpQuat(from, to, t)!) - t * total),
      );
    }
    return worst;
  };
  assert(worstNlerp(20) < 0.02, "nlerp should be nearly exact over 20 degrees");
  assert(
    worstNlerp(60) > 0.2 && worstNlerp(60) < 0.4,
    "nlerp over 60 should be a fraction of a degree",
  );
  assert(
    worstNlerp(120) > 2 && worstNlerp(120) < 2.5,
    "nlerp over 120 should be about 2 degrees",
  );
  assert(worstNlerp(170) > 6, "nlerp over 170 should be several degrees out");
  // Monotonic in the size of the turn, so "cheap is fine for small angles" is a real rule.
  assert(
    worstNlerp(20) < worstNlerp(60) &&
      worstNlerp(60) < worstNlerp(120) &&
      worstNlerp(120) < worstNlerp(170),
    "nlerp's error should grow with the angle",
  );

  // The small-angle guard. Without it these weights are 0/0.
  const close = fromAxisAngle(axis, 10.0001)!;
  const nearly = fromAxisAngle(axis, 10)!;
  assert(
    dotQuat(nearly, close) > 0.9995,
    "this pair was chosen to trip the guard",
  );
  const guarded = slerpQuat(nearly, close, 0.5);
  assert(
    guarded !== null && Number.isFinite(guarded.w),
    "the slerp guard produced a NaN",
  );
  assert(
    near(quatLength(guarded!), 1, 1e-12),
    "the slerp guard produced a non-unit result",
  );

  // Raw lerp leaves the sphere, dipping furthest at the midpoint, and the sandwich then scales
  // the object by the square of the length - which is the shrinking model, quantified.
  let shortest = 1;
  let shortestAt = 0;
  for (let i = 0; i <= 1000; i += 1) {
    const t = i / 1000;
    const len = quatLength(lerpQuat(from, to150, t));
    if (len < shortest) {
      shortest = len;
      shortestAt = t;
    }
  }
  assert(
    near(shortestAt, 0.5, 1e-9),
    "raw lerp should dip furthest at the midpoint",
  );
  assert(
    near(shortest, 0.7934, 1e-4),
    "raw lerp over 150 degrees should reach 0.7934",
  );
  const midRaw = lerpQuat(from, to150, 0.5);
  const scaled = rotateVector(midRaw, { x: 1, y: 0, z: 0 });
  assert(
    near(
      Math.hypot(scaled.x, scaled.y, scaled.z),
      quatLength(midRaw) ** 2,
      1e-12,
    ),
    "the sandwich should scale by the square of the length",
  );

  // Conversions. Away from the poles the angles survive; at the pole they do not, but the
  // orientation does. This is precisely the distinction Section 3.1 set up.
  for (const pitch of [0, 30, 60, 89]) {
    const start: Euler = { x: pitch, y: 40, z: 25 };
    const m = fromEuler(start, YAW_PITCH_ROLL);
    const back = toEulerYXZ(m);
    assert(near(back.x, start.x, 1e-9), `pitch drifted at ${pitch}`);
    assert(near(back.y, start.y, 1e-9), `yaw drifted at ${pitch}`);
    assert(near(back.z, start.z, 1e-9), `roll drifted at ${pitch}`);
    assert(
      sameMat(m, fromEuler(back, YAW_PITCH_ROLL), 1e-12),
      `the matrix drifted at ${pitch}`,
    );
  }
  // At the pole the function has to choose, and it gives everything to yaw.
  const atPole: Euler = { x: 90, y: 40, z: 25 };
  const poleMatrix = fromEuler(atPole, YAW_PITCH_ROLL);
  const poleAngles = toEulerYXZ(poleMatrix);
  assert(poleAngles.z === 0, "at the pole roll should be set to zero");
  assert(
    !near(poleAngles.y, atPole.y, 1),
    "at the pole yaw should have absorbed the roll rather than matching",
  );
  // And yet the orientation is bit-identical, which is the point worth making.
  assert(
    sameMat(poleMatrix, fromEuler(poleAngles, YAW_PITCH_ROLL), 1e-12),
    "the orientation should survive the pole even though the angles do not",
  );

  // Drift under repeated composition. Both representations wander at a similar rate; what
  // differs is the repair - one length against nine entries and three right angles.
  const step = fromAxisAngle({ x: 0.2, y: 0.9, z: 0.35 }, 0.7)!;
  let q = fromAxisAngle({ x: 0, y: 1, z: 0 }, 0)!;
  for (let i = 0; i < 10000; i += 1) q = multiplyQuat(step, q);
  const off = Math.abs(quatLength(q) - 1);
  assert(off > 0, "10000 products should drift at least a little");
  assert(off < 1e-9, "10000 products should not drift far");
  // Renormalizing is the entire fix, and it works.
  assert(
    near(quatLength(normalizeQuat(q)!), 1, 1e-15),
    "renormalizing did not restore unit length",
  );
};

/**
 * Frame-rate independence, which is a property rather than an opinion and so can be asserted.
 *
 * The central claim is that exponential decay gives the **same answer for the same elapsed
 * time however that time was chopped into frames**. That is checked across eight frame rates
 * from 24 to 240 and forty durations, and the spread has to stay near floating point noise.
 * The companion assertion matters just as much: the naive version must fail the same test
 * badly, or the section is arguing against nothing.
 */
export const dtCheck: Demo = () => {
  // The pieces first.
  assert(lerp(2, 10, 0) === 2, "lerp at 0 is not the start");
  assert(lerp(2, 10, 1) === 10, "lerp at 1 is not the end");
  assert(lerp(2, 10, 0.5) === 6, "lerp at a half is not the midpoint");
  assert(lerp(2, 10, 2) === 18, "lerp should extrapolate past the end");
  assert(
    clamp(5, 0, 3) === 3 && clamp(-5, 0, 3) === 0 && clamp(1, 0, 3) === 1,
    "clamp is wrong",
  );
  assert(clamp01(1.4) === 1 && clamp01(-0.2) === 0, "clamp01 is wrong");

  // A decay factor is a blend factor, so it has to stay in range - and it saturates rather
  // than overshooting, which is what makes a huge frame safe instead of catastrophic.
  const rate = rateFromHalfLife(0.15);
  assert(decayFactor(rate, 0) === 0, "no time should mean no movement");
  let previous = -1;
  for (let dt = 0; dt < 20; dt += 0.01) {
    const f = decayFactor(rate, dt);
    assert(f >= 0 && f <= 1, `decay factor left [0, 1] at dt=${dt}`);
    assert(f >= previous - 1e-15, `decay factor went backwards at dt=${dt}`);
    previous = f;
  }
  assert(
    near(decayFactor(rate, 100), 1, 1e-12),
    "a huge frame should close the whole gap",
  );

  // One half-life closes exactly half. That is the definition, and it is worth pinning.
  for (const halfLife of [0.05, 0.15, 0.4, 1.2]) {
    assert(
      near(decayFactor(rateFromHalfLife(halfLife), halfLife), 0.5, 1e-15),
      `one half-life did not close half at ${halfLife}`,
    );
    assert(
      near(halfLifeFromRate(rateFromHalfLife(halfLife)), halfLife, 1e-15),
      `the half-life round trip drifted at ${halfLife}`,
    );
  }

  // `damp` moves towards the target and never past it, at any timestep at all.
  for (let dt = 0.0001; dt < 5; dt *= 1.2) {
    const x = damp(START, TARGET, rate, dt);
    assert(x >= START && x <= TARGET, `damp overshot at dt=${dt}`);
    assert(x > START, `damp did not move at dt=${dt}`);
  }

  // The headline number: a fixed factor needs a fixed number of *frames*, so its settling
  // time is inversely proportional to the frame rate.
  const frames = framesToClose(0.1, 0.9);
  assert(
    near(frames, 21.854, 1e-3),
    "frames to close 90% should be about 21.854",
  );
  assert(
    near(frames / 30 / (frames / 144), 4.8, 1e-12),
    "30 fps should settle exactly 4.8 times slower than 144 fps",
  );

  // The property. Same elapsed time, wildly different frame rates, same answer.
  const rates = [24, 30, 50, 60, 90, 120, 144, 240];
  let worstSpread = 0;
  for (let seconds = 0.05; seconds <= 2.0001; seconds += 0.05) {
    const values = rates.map((fps) => simulateDamped(fps, seconds, 0.15));
    worstSpread = Math.max(
      worstSpread,
      Math.max(...values) - Math.min(...values),
    );
  }
  assert(
    worstSpread < 1e-12,
    `decay should be frame-rate independent, spread was ${worstSpread}`,
  );

  // And the closed form agrees with stepping it, which means the exponent really does add up.
  for (const halfLife of [0.1, 0.25, 0.5]) {
    for (const fps of [1, 30, 144]) {
      const x = simulateDamped(fps, 1, halfLife);
      const left = (TARGET - x) / (TARGET - START);
      assert(
        near(left, remainingAfter(halfLife, 1), 1e-12),
        `stepping disagreed with the closed form at ${fps} fps, half-life ${halfLife}`,
      );
    }
  }
  // The tidy case the page quotes: four half-lives leaves exactly a sixteenth.
  assert(
    near(remainingAfter(0.25, 1), 0.0625, 1e-15),
    "four half-lives should leave 1/16",
  );

  // The naive version must fail all of that, and fail it visibly. On a track six units wide
  // the two frame rates end up more than three units apart at some point.
  let worstNaiveGap = 0;
  for (let seconds = 0.05; seconds <= 2.0001; seconds += 0.05) {
    worstNaiveGap = Math.max(
      worstNaiveGap,
      Math.abs(
        simulateNaive(30, seconds, 0.1) - simulateNaive(144, seconds, 0.1),
      ),
    );
  }
  assert(
    worstNaiveGap > 3,
    `a fixed factor should diverge badly, but the worst gap was only ${worstNaiveGap}`,
  );
};

/**
 * Easing curves and the critically damped spring.
 *
 * Two claims here are worth more than the rest. The first is that **smoothstep has zero slope but
 * non-zero curvature at its ends, and smootherstep has both at zero** - which is the entire reason
 * the second one exists, and it is checkable by finite differences rather than by assertion. The
 * second is that the spring is frame-rate independent *and* never overshoots, which together are
 * why it is the right default for anything a player watches.
 */
export const easingCheck: Demo = () => {
  // Every curve in the gallery has to pin both ends, or a move would jump when it started.
  for (const e of EASINGS) {
    assert(near(e.fn(0), 0, 1e-12), `${e.name} does not start at 0`);
    assert(near(e.fn(1), 1, 1e-12), `${e.name} does not end at 1`);
    for (let i = 0; i <= 200; i += 1) {
      assert(
        Number.isFinite(e.fn(i / 200)),
        `${e.name} produced a non-finite value`,
      );
    }
    assert(e.says.length > 0, `${e.name} has nothing to say for itself`);
  }

  const slope = (f: (t: number) => number, at: number, h = 1e-6) =>
    (f(at + h) - f(at - h)) / (2 * h);

  // The S curves are flat at both ends. That is what makes them look like easing rather than a
  // ramp, and linear is included as the control that fails the same test.
  for (const fn of [smoothstep01, smootherstep01, easeInOutCubic]) {
    assert(
      Math.abs(slope(fn, 1e-6)) < 1e-4,
      "an S curve should be flat at the start",
    );
    assert(
      Math.abs(slope(fn, 1 - 1e-6)) < 1e-4,
      "an S curve should be flat at the end",
    );
  }
  assert(
    near(slope(linear, 0.5), 1, 1e-9),
    "linear should have slope 1 everywhere",
  );
  assert(
    near(slope(easeInQuad, 1e-6), 0, 1e-4),
    "easeInQuad should start from rest",
  );
  assert(
    near(slope(easeOutQuad, 1e-6), 2, 1e-4),
    "easeOutQuad should start at full speed",
  );

  // The reason smootherstep exists. Second derivative at the ends: 6 for smoothstep, 0 for
  // smootherstep. A jump in curvature is visible as a crease in anything that gets differentiated.
  const curvature = (f: (t: number) => number, at: number, h = 1e-3) =>
    (f(at + h) - 2 * f(at) + f(at - h)) / (h * h);
  assert(
    near(curvature(smoothstep01, 1e-3), 6, 0.05),
    "smoothstep should have curvature 6 at the start",
  );
  assert(
    Math.abs(curvature(smootherstep01, 1e-3)) < 0.1,
    "smootherstep should have no curvature at the start",
  );

  // The overshooting curves must actually overshoot, by a known amount, or they teach nothing.
  let backPeak = 0;
  let elasticPeak = 0;
  for (let i = 0; i <= 2000; i += 1) {
    backPeak = Math.max(backPeak, easeOutBack(i / 2000));
    elasticPeak = Math.max(elasticPeak, easeOutElastic(i / 2000));
  }
  assert(near(backPeak, 1.1, 1e-3), "easeOutBack should peak at about 1.1");
  assert(
    near(elasticPeak, 1.3731, 1e-3),
    "easeOutElastic should peak at about 1.373",
  );
  // And the non-overshooting ones must stay inside, so the two groups are genuinely different.
  for (const fn of [
    linear,
    easeInQuad,
    easeOutQuad,
    easeInOutCubic,
    smoothstep01,
    smootherstep01,
  ]) {
    for (let i = 0; i <= 500; i += 1) {
      const v = fn(i / 500);
      assert(
        v >= -1e-12 && v <= 1 + 1e-12,
        "this curve should not leave [0, 1]",
      );
    }
  }

  // smoothstep clamps outside its edges, and maps a real range rather than only [0, 1].
  assert(smoothstep(0, 1, -0.5) === 0, "smoothstep should clamp below");
  assert(smoothstep(0, 1, 1.5) === 1, "smoothstep should clamp above");
  assert(
    near(smoothstep(10, 20, 15), 0.5, 1e-12),
    "smoothstep should map a range",
  );

  // Range helpers, including the guard that stops a zero-width range producing a NaN.
  assert(near(inverseLerp(10, 20, 15), 0.5, 1e-12), "inverseLerp is wrong");
  assert(
    near(inverseLerp(10, 20, 25), 1.5, 1e-12),
    "inverseLerp should not clamp",
  );
  assert(
    inverseLerp(5, 5, 5) === 0,
    "a zero-width range should not divide by zero",
  );
  assert(
    !Number.isNaN(inverseLerp(5, 5, 9)),
    "a zero-width range should not produce NaN",
  );
  assert(near(remap(15, 10, 20, 0, 100), 50, 1e-12), "remap is wrong");
  // lerp and inverseLerp undo each other.
  for (let i = 0; i <= 20; i += 1) {
    const t = i / 20;
    assert(
      near(inverseLerp(3, 11, lerp(3, 11, t)), t, 1e-12),
      "lerp and inverseLerp disagree",
    );
  }

  // The spring is the exact solution, so stepping it frame by frame must equal one big step.
  let worstSpread = 0;
  for (let t = 0.05; t <= 2.0001; t += 0.05) {
    const oneStep = springAt(t);
    for (const fps of [15, 24, 30, 60, 90, 144, 240]) {
      worstSpread = Math.max(
        worstSpread,
        Math.abs(springStepped(t, fps).value - oneStep),
      );
    }
  }
  assert(
    worstSpread < 1e-12,
    `the spring should be frame-rate independent, spread was ${worstSpread}`,
  );

  // Critically damped means it approaches as fast as possible **without overshooting**. Ever.
  let state: SpringState = { value: 0, velocity: 0 };
  let peak = 0;
  for (let i = 0; i < 3000; i += 1) {
    state = springStep(state, 1, SMOOTH_TIME, 1 / 240);
    peak = Math.max(peak, state.value);
    assert(
      state.value >= -1e-12,
      "the spring should not go backwards past the start",
    );
  }
  assert(
    peak <= 1 + 1e-12,
    `a critically damped spring must not overshoot, peaked at ${peak}`,
  );
  assert(near(state.value, 1, 1e-9), "the spring should settle on the target");
  assert(near(state.velocity, 0, 1e-6), "the spring should come to rest");

  // Both start at the target-less state and end on the target, so the comparison is fair.
  assert(near(decayAt(0), 0, 1e-12), "decay should start at the start");
  assert(near(springAt(0), 0, 1e-12), "the spring should start at the start");

  // The difference worth showing: decay leaves at full speed, the spring has to accelerate.
  // At a hundredth of a second the decay has already moved an order of magnitude further.
  const early = 0.01;
  assert(
    decayAt(early) > 10 * springAt(early),
    "decay should lurch away much faster than the spring at the very start",
  );
  assert(
    Math.abs(slope(springAt, 1e-5)) < 1e-3,
    "the spring should leave rest with no velocity",
  );
  assert(slope(decayAt, 1e-5) > 1, "decay should leave rest at full speed");
};

/**
 * Bezier curves: two routes to the same point, the tangent that falls out for free, and the
 * three grades of joint.
 *
 * The assertion doing the most work is the tangent one. `tangentFromLevels` reads the direction
 * straight off de Casteljau's last segment, `cubicTangent` differentiates the polynomial, and a
 * finite difference approximates it numerically. Three independent routes, all required to agree,
 * which is a much stronger statement than any one of them checked alone.
 */
export const bezierCheck: Demo = () => {
  const P: Cubic = [
    { x: -2, y: -1 },
    { x: -1.2, y: 1.6 },
    { x: 1.1, y: -1.4 },
    { x: 2, y: 0.9 },
  ];

  // The curve starts on the first control point and ends on the last. Nothing else is pinned.
  for (const [t, want] of [
    [0, P[0]],
    [1, P[3]],
  ] as [number, Vec2][]) {
    const got = bezierAt(P, t);
    assert(
      near(got.x, want.x, 1e-12) && near(got.y, want.y, 1e-12),
      `the curve does not touch its end control point at t=${t}`,
    );
  }

  for (let i = 0; i <= 400; i += 1) {
    const t = i / 400;

    // Repeated lerps and the expanded polynomial must be the same curve.
    const viaLerps = bezierAt(P, t);
    const viaWeights = cubicAt(P, t);
    assert(
      near(viaLerps.x, viaWeights.x, 1e-12) &&
        near(viaLerps.y, viaWeights.y, 1e-12),
      `de Casteljau and the Bernstein form disagree at t=${t}`,
    );

    // The weights are a weighted average: they sum to 1 and never go negative, which is why the
    // curve cannot escape the region its control points span.
    const w = cubicWeights(t);
    assert(
      near(w[0] + w[1] + w[2] + w[3], 1, 1e-12),
      `weights do not sum to 1 at t=${t}`,
    );
    for (const v of w) assert(v >= 0, `a weight went negative at t=${t}`);

    // The tangent, three ways.
    const fromLevels = tangentFromLevels(deCasteljauLevels(P, t));
    const fromDerivative = cubicTangent(P, t);
    assert(
      near(fromLevels.x, fromDerivative.x, 1e-11) &&
        near(fromLevels.y, fromDerivative.y, 1e-11),
      `de Casteljau's last segment is not the tangent at t=${t}`,
    );
    if (i > 0 && i < 400) {
      const h = 1e-6;
      const a = bezierAt(P, t - h);
      const b = bezierAt(P, t + h);
      assert(
        near((b.x - a.x) / (2 * h), fromDerivative.x, 1e-6) &&
          near((b.y - a.y) / (2 * h), fromDerivative.y, 1e-6),
        `the analytic tangent disagrees with a numerical one at t=${t}`,
      );
    }
  }

  // The curve stays inside the box its control points span. This is the convex hull property, and
  // it is why a Bezier is safe to use for a camera path: it cannot wander somewhere unplanned.
  const xs = P.map((p) => p.x);
  const ys = P.map((p) => p.y);
  for (let i = 0; i <= 1000; i += 1) {
    const p = bezierAt(P, i / 1000);
    assert(
      p.x >= Math.min(...xs) - 1e-12 && p.x <= Math.max(...xs) + 1e-12,
      "the curve left its control points' box horizontally",
    );
    assert(
      p.y >= Math.min(...ys) - 1e-12 && p.y <= Math.max(...ys) + 1e-12,
      "the curve left its control points' box vertically",
    );
  }

  // At the ends the tangent runs along the first and last control leg, which is what makes those
  // handles feel like handles in an editor.
  const start = cubicTangent(P, 0);
  assert(
    near(start.x, 3 * (P[1].x - P[0].x), 1e-12) &&
      near(start.y, 3 * (P[1].y - P[0].y), 1e-12),
    "the tangent at t=0 should run along the first control leg",
  );

  // The three joints must be genuinely different, and the predicates must separate them.
  const first = FIRST;
  const grades: Record<Join, [boolean, boolean, boolean]> = {
    broken: [true, false, false],
    g1: [true, true, false],
    c1: [true, true, true],
  };
  for (const j of JOINS) {
    const second = secondFor(j);
    const want = grades[j];
    assert(meets(first, second, 1e-12) === want[0], `${j} got C0 wrong`);
    assert(sameDirection(first, second, 1e-9) === want[1], `${j} got G1 wrong`);
    assert(sameTangent(first, second, 1e-12) === want[2], `${j} got C1 wrong`);

    // All three touch, so the chain never has a gap in position.
    const before = chainAt(j, 0.5);
    const after = bezierAt(second, 0);
    assert(
      near(before.x, after.x, 1e-12) && near(before.y, after.y, 1e-12),
      `${j} has a gap at the seam`,
    );
  }

  // The point of the G1 case: it looks smooth and still changes speed at the seam. Here by a
  // factor of more than three, which is plenty to read as a stumble.
  const g1Speeds = seamSpeeds("g1");
  assert(
    g1Speeds.leaving / g1Speeds.entering > 3,
    "the G1 join should drop speed sharply at the seam",
  );
  const c1Speeds = seamSpeeds("c1");
  assert(
    near(c1Speeds.leaving, c1Speeds.entering, 1e-12),
    "the C1 join should not change speed at all",
  );

  // A jump arc reaches exactly the height it was asked for, at exactly the midpoint, because the
  // control point is placed at twice that height.
  for (const [distance, height] of [
    [6, 2],
    [4, 1.5],
    [10, 3],
  ]) {
    const arc = jumpArc(distance, height);
    assert(
      near(arc[1].y, 2 * height, 1e-12),
      "the control point should be twice the height",
    );
    assert(
      near(bezierAt(arc, 0.5).y, height, 1e-12),
      "the midpoint should be the asked height",
    );
    assert(
      near(bezierAt(arc, 1).x, distance, 1e-12),
      "the arc should land where asked",
    );

    let peak = -Infinity;
    let peakAt = 0;
    for (let i = 0; i <= 2000; i += 1) {
      const p = bezierAt(arc, i / 2000);
      if (p.y > peak) {
        peak = p.y;
        peakAt = i / 2000;
      }
    }
    assert(
      near(peak, height, 1e-9),
      "the highest point should be the asked height",
    );
    assert(near(peakAt, 0.5, 1e-3), "the apex should be at the midpoint");
  }
};

/**
 * Hermite and Catmull-Rom, and the arc-length table.
 *
 * The two assertions that carry the section are that **Catmull-Rom passes exactly through every
 * waypoint** - which is the entire reason to prefer it over a Bezier for a path - and that
 * stepping `t` evenly gives wildly uneven speed while stepping distance evenly does not. Both are
 * measured rather than described, and the second one needs the naive version to fail badly or the
 * lookup table is solving nothing.
 */
export const splineCheck: Demo = () => {
  const p0: Vec2 = { x: -1.5, y: -0.6 };
  const p1: Vec2 = { x: 1.2, y: 0.9 };
  const m0: Vec2 = { x: 2.4, y: 3.1 };
  const m1: Vec2 = { x: 1.1, y: -2.2 };

  // Hermite's contract: both endpoints and both tangents come out exactly as handed in.
  const start = hermiteAt(p0, m0, p1, m1, 0);
  const end = hermiteAt(p0, m0, p1, m1, 1);
  assert(
    start.x === p0.x && start.y === p0.y,
    "hermite does not start on its first point",
  );
  assert(
    end.x === p1.x && end.y === p1.y,
    "hermite does not end on its second point",
  );
  const vStart = hermiteTangent(p0, m0, p1, m1, 0);
  const vEnd = hermiteTangent(p0, m0, p1, m1, 1);
  assert(
    near(vStart.x, m0.x, 1e-12) && near(vStart.y, m0.y, 1e-12),
    "the tangent at t=0 is not the one asked for",
  );
  assert(
    near(vEnd.x, m1.x, 1e-12) && near(vEnd.y, m1.y, 1e-12),
    "the tangent at t=1 is not the one asked for",
  );

  // The two point weights are a weighted average, and the tangent weights vanish at both ends.
  for (let i = 0; i <= 200; i += 1) {
    const b = hermiteBasis(i / 200);
    assert(near(b[0] + b[2], 1, 1e-12), "the point weights should sum to 1");
  }
  const at0 = hermiteBasis(0);
  const at1 = hermiteBasis(1);
  assert(at0[1] === 0 && at0[3] === 0, "tangent weights should vanish at t=0");
  assert(at1[1] === 0 && at1[3] === 0, "tangent weights should vanish at t=1");

  // A Hermite segment is a cubic Bezier with the handles a third of the way along the tangents.
  const asBezier = hermiteToBezier(p0, m0, p1, m1);
  for (let i = 0; i <= 400; i += 1) {
    const t = i / 400;
    const h = hermiteAt(p0, m0, p1, m1, t);
    const b = bezierAt(asBezier, t);
    assert(
      near(h.x, b.x, 1e-12) && near(h.y, b.y, 1e-12),
      `the Hermite and its Bezier form disagree at t=${t}`,
    );
  }

  // Catmull-Rom goes **through** every waypoint. This is the whole point of it.
  const segs = segmentCount(WAYPOINTS);
  for (let i = 0; i < WAYPOINTS.length; i += 1) {
    const got = catmullRomAt(WAYPOINTS, i / segs);
    assert(
      near(got.x, WAYPOINTS[i].x, 1e-12) && near(got.y, WAYPOINTS[i].y, 1e-12),
      `the path missed waypoint ${i}`,
    );
  }

  // C1 across the interior joints: the velocity is the same arriving and leaving.
  for (let i = 1; i < WAYPOINTS.length - 1; i += 1) {
    const t = i / segs;
    const h = 1e-7;
    const before = catmullRomTangent(WAYPOINTS, t - h);
    const after = catmullRomTangent(WAYPOINTS, t + h);
    assert(
      near(before.x, after.x, 1e-4) && near(before.y, after.y, 1e-4),
      `the path is not C1 at joint ${i}`,
    );
  }

  // Zero tension flattens every tangent, which turns the path into straight lines.
  for (let i = 0; i < WAYPOINTS.length; i += 1) {
    const flat = catmullTangent(WAYPOINTS, i, 0);
    assert(
      flat.x === 0 && flat.y === 0,
      "zero tension should give zero tangents",
    );
  }

  // The headline. Stepping t evenly varies the speed by a large factor; stepping distance evenly
  // very nearly removes it. The residual is chord-versus-arc, not a fault in the table.
  const byT = hopSpread(byParameter, 200);
  const byS = hopSpread(byDistance, 200);
  assert(
    byT.ratio > 5,
    `uniform t should be badly uneven, but the ratio was ${byT.ratio}`,
  );
  assert(
    byS.ratio < 1.15,
    `uniform distance should be nearly even, but was ${byS.ratio}`,
  );
  assert(
    byT.ratio / byS.ratio > 5,
    "reparametrizing should be a large improvement, or the section is pointless",
  );

  // The table's own behaviour: monotonic, pinned at both ends, and inverse to distanceAtT.
  assert(tAtFraction(TABLE, 0) === 0, "no distance should mean t = 0");
  assert(
    near(tAtFraction(TABLE, 1), 1, 1e-12),
    "the full distance should mean t = 1",
  );
  let previous = -1;
  for (let i = 0; i <= 400; i += 1) {
    const t = tAtFraction(TABLE, i / 400);
    assert(t >= previous - 1e-12, `the table went backwards at u=${i / 400}`);
    previous = t;
  }
  for (let i = 0; i <= 100; i += 1) {
    const u = i / 100;
    const t = tAtFraction(TABLE, u);
    const backAgain = distanceAtT(TABLE, t) / TABLE.total;
    assert(
      near(backAgain, u, 1e-9),
      `distance and t should invert each other, off at u=${u}`,
    );
  }

  // A coarse table underestimates the length, because a chord is shorter than the arc it cuts.
  // So the totals must increase with sample count, and converge.
  const coarse = buildArcTable(pathAt, 32).total;
  const medium = buildArcTable(pathAt, 128).total;
  const fine = buildArcTable(pathAt, 1024).total;
  assert(
    coarse < medium && medium < fine,
    "denser tables should report more length, not less",
  );
  assert(
    (fine - medium) / fine < 0.001,
    "the length should have all but converged by 128 samples",
  );
};

/**
 * Projection: the frustum, its six planes, and where depth precision goes.
 *
 * The assertion earning its keep is the cross-check between the two ways of asking "is this
 * visible". One divides by `w` and tests the NDC box; the other tests six planes read off the
 * matrix rows. They are different arithmetic on the same question, so agreement across twenty
 * thousand points is real evidence rather than a restatement.
 */
export const projectionCheck: Demo = () => {
  const aspect = 16 / 9;
  const proj = perspective(60, aspect, 0.1, 100);

  // The near and far planes are exactly the ends of the NDC depth range. Everything else in this
  // Section is measured against that, so it had better be exact.
  assert(
    near(ndcDepth(proj, 0.1), -1, 1e-12),
    "the near plane should map to -1",
  );
  assert(near(ndcDepth(proj, 100), 1, 1e-12), "the far plane should map to +1");

  // Every corner of the frustum lands on a corner of the NDC box.
  for (const c of frustumCorners(60, aspect, 0.1, 100)) {
    const n = ndcOf(proj, c);
    assert(n !== null, "a frustum corner had no projection");
    assert(
      near(Math.abs(n!.x), 1, 1e-9),
      "a corner is not on the left or right edge",
    );
    assert(
      near(Math.abs(n!.y), 1, 1e-9),
      "a corner is not on the top or bottom edge",
    );
    assert(
      near(Math.abs(n!.z), 1, 1e-9),
      "a corner is not on the near or far plane",
    );
  }

  // Field of view conversions round trip, and horizontal really is the wider one on a wide screen.
  for (const fovY of [30, 55, 60, 90, 110]) {
    const fovX = fovXFromFovY(fovY, aspect);
    assert(
      fovX > fovY,
      "horizontal FOV should exceed vertical on a wide aspect",
    );
    assert(
      near(fovYFromFovX(fovX, aspect), fovY, 1e-9),
      `the FOV round trip drifted at ${fovY}`,
    );
    // A square viewport makes them identical, which is the sanity case.
    assert(
      near(fovXFromFovY(fovY, 1), fovY, 1e-9),
      "at 1:1 the two fields of view should agree",
    );
  }

  // The plane normals come out unit length, so the signed distances are real distances.
  const planes = frustumPlanes(proj);
  assert(planes.length === 6, "a frustum should have six planes");
  for (const p of planes) {
    assert(
      near(Math.hypot(p.x, p.y, p.z), 1, 1e-12),
      "a plane normal is not unit length",
    );
  }

  // Two independent tests for the same question, over a deterministic spread of points.
  let disagreements = 0;
  let inside = 0;
  for (let i = 0; i < 20000; i += 1) {
    const a = (i * 0.6180339887) % 1;
    const b = (i * 0.4142135624) % 1;
    const c = (i * 0.2360679775) % 1;
    const p: Vec3 = {
      x: (a - 0.5) * 160,
      y: (b - 0.5) * 90,
      z: -(c * 130 + 0.001),
    };
    const ndc = ndcOf(proj, p);
    const byNdc =
      ndc !== null &&
      Math.abs(ndc.x) <= 1 + 1e-9 &&
      Math.abs(ndc.y) <= 1 + 1e-9 &&
      Math.abs(ndc.z) <= 1 + 1e-9;
    if (byNdc) inside += 1;
    if (byNdc !== insideFrustum(planes, p, 0)) disagreements += 1;
  }
  assert(
    disagreements === 0,
    `the plane test disagreed with the NDC test ${disagreements} times`,
  );
  // And the spread has to actually straddle the boundary, or agreement proves nothing.
  assert(
    inside > 200 && inside < 19800,
    "the test points should fall on both sides",
  );

  // Depth precision falls off with the square of distance, and the numeric result matches the
  // closed form quantum * (f - n) * d^2 / (2 f n).
  const n0 = 0.1;
  const f0 = 1000;
  const wide = perspective(60, aspect, n0, f0);
  const quantum = 2 / Math.pow(2, 24);
  for (const d of [0.5, 1, 5, 25, 100, 500, 999]) {
    const numeric = depthResolution(wide, d, 24);
    const analytic = (quantum * (f0 - n0) * d * d) / (2 * f0 * n0);
    assert(
      Math.abs(numeric - analytic) / analytic < 1e-5,
      `depth resolution disagreed with the closed form at ${d} m`,
    );
  }

  // The headline pair. Ten times the near plane is ten times the precision; ten times the far
  // plane is worth essentially nothing. This is the whole engineering point of the Section.
  const nearTight = depthResolution(
    perspective(60, aspect, 0.01, 1000),
    100,
    24,
  );
  const nearLoose = depthResolution(
    perspective(60, aspect, 0.1, 1000),
    100,
    24,
  );
  assert(
    near(nearTight / nearLoose, 10, 0.01),
    `a ten times larger near plane should be ten times better, got ${nearTight / nearLoose}`,
  );
  const farNear = depthResolution(perspective(60, aspect, 0.1, 100), 50, 24);
  const farFar = depthResolution(perspective(60, aspect, 0.1, 1000), 50, 24);
  assert(
    farFar / farNear < 1.01,
    `a ten times larger far plane should barely matter, got ${farFar / farNear}`,
  );

  // Orthographic: depth is linear, so precision is the same everywhere, and nothing converges.
  const ortho = orthographic(5, aspect, 0.1, 100);
  assert(near(ndcDepth(ortho, 0.1), -1, 1e-12), "ortho near should map to -1");
  assert(near(ndcDepth(ortho, 100), 1, 1e-12), "ortho far should map to +1");
  const first = depthResolution(ortho, 1, 24);
  for (const d of [10, 50, 99]) {
    assert(
      near(depthResolution(ortho, d, 24), first, 1e-12),
      "orthographic depth precision should not depend on distance",
    );
  }
  const nearX = ndcOf(ortho, { x: 2, y: 0, z: -5 })!;
  const farX = ndcOf(ortho, { x: 2, y: 0, z: -50 })!;
  assert(
    near(nearX.x, farX.x, 1e-12),
    "orthographic should not converge with distance",
  );

  // Perspective does converge, and by exactly the ratio of the distances.
  const pNear = ndcOf(proj, { x: 2, y: 0, z: -5 })!;
  const pFar = ndcOf(proj, { x: 2, y: 0, z: -50 })!;
  assert(
    near(pFar.x / pNear.x, 0.1, 1e-9),
    "ten times further should be ten times narrower on screen",
  );

  // The one place projection has no answer is the camera's own position.
  assert(
    ndcOf(proj, { x: 0, y: 0, z: 0 }) === null,
    "the camera origin should have no projection",
  );
};

/**
 * Screen space: pixels, rays back out of the camera, and spherical coordinates.
 *
 * The assertion worth the most is the round trip. `unprojectAt` derives a point from the
 * frustum's geometry without ever inverting a matrix, and `ndcOf` puts it back through the
 * projection matrix. Those two share no code, so agreeing to within `1e-15` across a grid of
 * cursor positions and four depths means the shortcut really is the matrix inverse.
 */
export const screenCheck: Demo = () => {
  const W = 800;
  const H = 450;
  const aspect = W / H;
  const fov = 55;
  const proj = perspective(fov, aspect, 0.1, 100);

  // Pixels to NDC and back, including the Y flip that catches everybody once.
  const topLeft = screenToNdc(0, 0, W, H);
  assert(
    topLeft.x === -1 && topLeft.y === 1,
    "the top-left pixel should be NDC (-1, 1)",
  );
  const bottomRight = screenToNdc(W, H, W, H);
  assert(
    bottomRight.x === 1 && bottomRight.y === -1,
    "the bottom-right pixel should be NDC (1, -1)",
  );
  const middle = screenToNdc(W / 2, H / 2, W, H);
  assert(
    middle.x === 0 && middle.y === 0,
    "the centre pixel should be NDC (0, 0)",
  );
  for (let i = 0; i <= 20; i += 1) {
    for (let j = 0; j <= 20; j += 1) {
      const x = (i / 20) * W;
      const y = (j / 20) * H;
      const back = ndcToScreen(screenToNdc(x, y, W, H), W, H);
      assert(
        near(back.x, x, 1e-9) && near(back.y, y, 1e-9),
        `the pixel round trip drifted at ${x},${y}`,
      );
    }
  }

  // Unprojecting from the frustum's geometry is exactly inverting the projection matrix.
  for (let i = 0; i <= 12; i += 1) {
    for (let j = 0; j <= 12; j += 1) {
      const ndc = { x: (i / 12) * 2 - 1, y: (j / 12) * 2 - 1 };
      for (const distance of [0.5, 2, 9, 40]) {
        const p = unprojectAt(fov, aspect, ndc, distance);
        assert(
          near(p.z, -distance, 1e-12),
          "the unprojected point is at the wrong depth",
        );
        const back = ndcOf(proj, p);
        assert(back !== null, "an unprojected point had no projection");
        assert(
          near(back!.x, ndc.x, 1e-12) && near(back!.y, ndc.y, 1e-12),
          `unproject and project disagree at ${ndc.x},${ndc.y} depth ${distance}`,
        );
      }
    }
  }

  // Rays are unit length and go forwards, and the centre of the screen is straight ahead.
  const centre = rayThroughNdc(fov, aspect, { x: 0, y: 0 });
  assert(
    near(centre.direction.x, 0, 1e-15) &&
      near(centre.direction.y, 0, 1e-15) &&
      near(centre.direction.z, -1, 1e-15),
    "the centre of the screen should look straight down -Z",
  );
  for (let i = 0; i <= 12; i += 1) {
    for (let j = 0; j <= 12; j += 1) {
      const ray = rayThroughNdc(fov, aspect, {
        x: (i / 12) * 2 - 1,
        y: (j / 12) * 2 - 1,
      });
      const d = ray.direction;
      assert(
        near(Math.hypot(d.x, d.y, d.z), 1, 1e-12),
        "a ray is not unit length",
      );
      assert(d.z < 0, "a ray through the screen should point forwards");
    }
  }

  // Picking: the centre ray meets a sphere straight ahead at its near face, and misses when
  // aimed into a corner.
  const target = { x: 0, y: 0, z: -10 };
  const hit = raySphere(centre.origin, centre.direction, target, 1);
  assert(
    hit !== null && near(hit, 9, 1e-12),
    "the centre ray should hit the near face at 9",
  );
  const corner = rayThroughNdc(fov, aspect, { x: 0.9, y: 0.9 });
  assert(
    raySphere(corner.origin, corner.direction, target, 1) === null,
    "a corner ray should miss a sphere dead ahead",
  );
  // A ray starting inside a sphere still reports a hit, at zero or beyond.
  const inside = raySphere({ x: 0, y: 0, z: -10 }, centre.direction, target, 1);
  assert(
    inside !== null && inside >= 0,
    "a ray starting inside should still hit",
  );

  // The behind-the-camera trap. These two points land on the *same pixel*, and only the
  // `inFront` flag distinguishes them - which is why forgetting it draws markers for things
  // that are behind you.
  const ahead = projectToScreen(proj, { x: 0, y: 0, z: -5 }, W, H);
  const behind = projectToScreen(proj, { x: 0, y: 0, z: 5 }, W, H);
  assert(ahead.inFront && ahead.onScreen, "a point ahead should be on screen");
  assert(
    !behind.inFront,
    "a point behind the camera should not be marked in front",
  );
  assert(
    !behind.onScreen,
    "a point behind the camera should never count as on screen",
  );
  assert(
    near(ahead.x, behind.x, 1e-9) && near(ahead.y, behind.y, 1e-9),
    "the trap only bites because both project to the same pixel - if they differ, rewrite the prose",
  );
  assert(
    near(ahead.x, W / 2, 1e-9) && near(ahead.y, H / 2, 1e-9),
    "dead ahead is the centre pixel",
  );

  // And the careless version really does draw more markers than the correct one somewhere.
  let sawExtra = false;
  for (let yaw = -180; yaw <= 180; yaw += 5) {
    const counts = markerCounts(yaw);
    assert(
      counts.careless >= counts.correct,
      "skipping a check cannot draw fewer markers",
    );
    if (counts.careless > counts.correct) sawExtra = true;
  }
  assert(
    sawExtra,
    "the careless marker path should visibly over-draw at some angle",
  );

  // Spherical coordinates round trip away from the poles.
  for (let az = -175; az <= 180; az += 5) {
    for (let el = -85; el <= 85; el += 5) {
      const back = cartesianToSpherical(sphericalToCartesian(12, az, el));
      assert(near(back.radius, 12, 1e-12), "the radius drifted");
      assert(near(back.elevation, el, 1e-9), `the elevation drifted at ${el}`);
      assert(near(back.azimuth, az, 1e-9), `the azimuth drifted at ${az}`);
    }
  }
  // At the poles the azimuth is genuinely gone, which is why orbit cameras clamp short of them.
  for (const el of [90, -90]) {
    const pole = cartesianToSpherical(sphericalToCartesian(10, 137, el));
    assert(
      pole.azimuth === 0,
      "the azimuth at a pole should be reported as 0, not as noise",
    );
    assert(
      near(Math.abs(pole.elevation), 90, 1e-9),
      "a pole should still report its elevation",
    );
  }
  // One degree short and it is fine again - the same clamp Section 3.1 argued for.
  const nearPole = cartesianToSpherical(sphericalToCartesian(10, 137, 89));
  assert(
    near(nearPole.azimuth, 137, 1e-9),
    "89 degrees should still recover the azimuth",
  );
};

/**
 * Rays, planes, closest points, and signed distance.
 *
 * Two assertions here carry most of the weight. Ray-plane distances are checked against
 * `height / sine`, which is a different route to the same number - the implementation solves
 * a general plane equation and knows nothing about the ray starting 3 m up. And every
 * closest-point answer is checked by **brute force**: sample hundreds of points on the
 * primitive and confirm none of them is nearer. A closest-point function that returns a
 * point on the right shape but in the wrong place passes every unit-length and residual
 * test, so sampling is the only way to catch it.
 */
export const geometryCheck: Demo = () => {
  const sub = (a: Vec3, b: Vec3): Vec3 => ({
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  });
  const gap = (a: Vec3, b: Vec3) => magnitude(sub(a, b));
  const mix = (a: Vec3, b: Vec3, u: number): Vec3 => ({
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
    z: a.z + (b.z - a.z) * u,
  });

  // A plane's normal must be unit length, or `n · p + d` is a scaled number rather than a
  // distance and every signed-distance claim in the Section is off by that scale.
  const slanted = planeThrough({ x: 1, y: 2, z: -3 }, { x: 2, y: -4, z: 4 });
  assert(
    near(Math.hypot(slanted.x, slanted.y, slanted.z), 1, 1e-15),
    "planeThrough should normalize the normal it is handed",
  );
  assert(
    near(distanceToPlane(slanted, { x: 1, y: 2, z: -3 }), 0, 1e-15),
    "the point a plane was built through should be on it",
  );

  // The sign convention: positive on the side the normal points to.
  assert(
    distanceToPlane(FLOOR, { x: 5, y: 2, z: -7 }) === 2,
    "two meters above the floor should be +2",
  );
  assert(
    distanceToPlane(FLOOR, { x: 5, y: -2, z: -7 }) === -2,
    "two meters below the floor should be -2",
  );
  assert(
    distanceToPlane(FLOOR, { x: 5, y: 0, z: -7 }) === 0,
    "a point on the floor should be exactly zero",
  );

  // ---- Ray against plane -----------------------------------------------------------

  // The parallel case, which is the one that returns Infinity or NaN if the guard is gone.
  assert(
    hitAtPitch(0).t === null,
    "a level ray never meets the floor, so there is no distance to report",
  );
  const lyingIn = {
    origin: { x: 0, y: 0, z: 4 },
    direction: { x: 0, y: 0, z: -1 },
  };
  assert(
    rayPlane(lyingIn, FLOOR) === null,
    "a ray lying in the plane meets it everywhere, which is not a distance either",
  );

  // Distances, cross-checked against the geometry rather than against the same algebra.
  assert(
    RAY_ORIGIN.y === 3,
    "the height-over-sine cross-check below assumes the ray starts 3 m up",
  );
  for (let p = -60; p <= -0.5; p += 0.5) {
    const { t, point } = hitAtPitch(p);
    assert(
      t !== null && t > 0,
      `a downward ray should hit ahead of itself at ${p}`,
    );
    const bySine = 3 / Math.sin((Math.abs(p) * Math.PI) / 180);
    assert(
      near(t!, bySine, 1e-9),
      `t at pitch ${p} should be the height over the vertical component`,
    );
    assert(
      near(distanceToPlane(FLOOR, point!), 0, 1e-9),
      `the hit point at pitch ${p} is not on the plane`,
    );
  }
  assert(
    near(hitAtPitch(-30).t!, 6, 1e-12),
    "a 30 degree dive from 3 m up should hit at 6 m",
  );
  assert(
    near(hitAtPitch(-60).t!, 2 * Math.sqrt(3), 1e-12),
    "a 60 degree dive should hit at two root three",
  );

  // The blow-up the scene is there to show: ten times shallower is ten times further.
  assert(
    hitAtPitch(-0.1).t! > 1700,
    "a nearly level ray should hit absurdly far away",
  );
  assert(
    near(hitAtPitch(-0.1).t! / hitAtPitch(-1).t!, 10, 0.01),
    "ten times shallower should be about ten times further",
  );
  let previous = 0;
  for (let p = -60; p <= -0.5; p += 0.5) {
    const t = hitAtPitch(p).t!;
    assert(
      t > previous,
      `the hit distance should grow as the ray flattens, at ${p}`,
    );
    previous = t;
  }

  // A negative t is a real solution to the line and a miss for the ray.
  const upward = rayAtPitch(30);
  const behind = rayPlane(upward, FLOOR);
  assert(
    behind !== null && behind < 0,
    "an upward ray should report a negative distance, not no intersection",
  );
  assert(
    near(distanceToPlane(FLOOR, pointAt(upward, behind!)), 0, 1e-12),
    "a negative t still lands on the plane - it is just behind where the ray started",
  );
  for (const p of [5, 30, 60]) {
    assert(
      near(hitAtPitch(p).t!, -hitAtPitch(-p).t!, 1e-12),
      `aiming up and down by ${p} should give mirrored distances`,
    );
  }

  // ---- Closest point on a line, and the one clamp that makes it a segment ----------

  const A: Vec3 = { x: -2, y: 0, z: 0 };
  const B: Vec3 = { x: 2, y: 0, z: 0 };
  const past: Vec3 = { x: 5, y: 1, z: 0 };
  assert(
    near(closestOnLine(A, B, past).x, 5, 1e-15),
    "an infinite line's closest point should sit level with the query point",
  );
  assert(
    near(closestOnSegment(A, B, past).x, 2, 1e-15),
    "a segment should clamp to its endpoint instead of running off the end",
  );
  for (let x = -2; x <= 2; x += 0.25) {
    const p = { x, y: 1.3, z: -0.4 };
    const onLine = closestOnLine(A, B, p);
    const onSeg = closestOnSegment(A, B, p);
    assert(
      gap(onLine, onSeg) < 1e-15,
      "between the endpoints the clamp should do nothing at all",
    );
  }

  // ---- Signed distance to a box ----------------------------------------------------

  const one: Vec3 = { x: -1, y: -1, z: -1 };
  const two: Vec3 = { x: 1, y: 1, z: 1 };
  assert(
    signedDistanceToBox(one, two, { x: 0, y: 0, z: 0 }) === -1,
    "the centre of a two meter box is one meter from every face",
  );
  assert(
    signedDistanceToBox(one, two, { x: 0.5, y: 0.5, z: 0.5 }) === -0.5,
    "a point inside a box should report a negative distance",
  );
  assert(
    signedDistanceToBox(one, two, { x: 1, y: 0, z: 0 }) === 0,
    "a point on a face should be exactly zero",
  );
  assert(
    signedDistanceToBox(one, two, { x: 1.5, y: 0, z: 0 }) === 0.5,
    "a point outside a box should report a positive distance",
  );
  assert(
    near(
      signedDistanceToBox(one, two, { x: 2, y: 2, z: 0 }),
      Math.SQRT2,
      1e-15,
    ),
    "past two faces at once, the corner decides the distance",
  );
  assert(
    near(
      signedDistanceToBox(one, two, { x: 3, y: 4, z: 0 }),
      Math.hypot(2, 3),
      1e-15,
    ),
    "further out it should keep behaving like a distance",
  );

  // Outside the box, the two ways of asking agree: step to the closest point and measure,
  // or evaluate the signed distance formula. They share no code, so this is the strong one.
  let worstAgreement = 0;
  let outsideSeen = 0;
  let insideSeen = 0;
  for (let i = 0; i <= 15; i += 1) {
    for (let j = 0; j <= 15; j += 1) {
      for (let k = 0; k <= 15; k += 1) {
        const p: Vec3 = {
          x: -4 + (i / 15) * 8,
          y: -4 + (j / 15) * 8,
          z: -4 + (k / 15) * 8,
        };
        const signed = signedDistanceToBox(BOX_MIN, BOX_MAX, p);
        if (signed <= 0) {
          insideSeen += 1;
          // Inside, the clamp returns the query point itself, so the distance is zero.
          assert(
            gap(closestOnBox(BOX_MIN, BOX_MAX, p), p) === 0,
            "inside a box, the closest point should be the point itself",
          );
          continue;
        }
        outsideSeen += 1;
        const c = closestOnBox(BOX_MIN, BOX_MAX, p);
        worstAgreement = Math.max(worstAgreement, Math.abs(gap(p, c) - signed));
      }
    }
  }
  assert(
    outsideSeen > 3000 && insideSeen > 20,
    "the sample should straddle the box, not sit entirely on one side of it",
  );
  assert(
    worstAgreement < 1e-12,
    `closest point and signed distance disagree by ${worstAgreement}`,
  );

  // ---- Closest point on a plane, and the sphere's one degenerate input -------------

  for (let i = 0; i <= 12; i += 1) {
    for (let j = 0; j <= 12; j += 1) {
      const p: Vec3 = { x: -6 + i, y: -3 + j * 0.7, z: 2 };
      const c = closestOnPlane(GROUND, p);
      assert(
        near(distanceToPlane(GROUND, c), 0, 1e-12),
        "the closest point on a plane should be on the plane",
      );
      assert(
        near(gap(p, c), Math.abs(distanceToPlane(GROUND, p)), 1e-12),
        "the step onto a plane should be exactly the signed distance",
      );
    }
  }

  const atCentre = closestOnSphere(SPHERE_C, SPHERE_R, SPHERE_C);
  assert(
    Number.isFinite(atCentre.x) &&
      near(gap(atCentre, SPHERE_C), SPHERE_R, 1e-15),
    "at a sphere's centre there is no nearest point, so it should name one rather than divide by zero",
  );
  assert(
    near(
      signedDistanceToSphere(SPHERE_C, SPHERE_R, SPHERE_C),
      -SPHERE_R,
      1e-15,
    ),
    "the centre of a sphere is one radius inside it",
  );

  // ---- The scene's four primitives, brute-forced -----------------------------------

  const queries: Vec3[] = [
    { x: 2.2, y: 2.6, z: 2.2 },
    { x: -5, y: 3, z: -2 },
    { x: 6, y: -1, z: 1 },
    { x: 0, y: 0, z: 0 },
    { x: -8, y: -3, z: 5 },
    { x: 4.6, y: 0.4, z: 0.2 },
  ];
  for (const p of queries) {
    const all = nearestPoints(p);
    all.forEach((n) =>
      assert(
        near(gap(p, n.point), n.distance, 1e-12),
        `the reported distance to the ${n.name} does not match its point`,
      ),
    );

    let argmin = 0;
    all.forEach((n, i) => {
      if (n.distance < all[argmin].distance) argmin = i;
    });
    assert(
      nearestIndex(p) === argmin,
      "nearestIndex should agree with the smallest reported distance",
    );

    // Sample the segment densely. Nothing on it may be nearer than the answer.
    let bestOnSegment = Infinity;
    for (let s = 0; s <= 400; s += 1) {
      bestOnSegment = Math.min(
        bestOnSegment,
        gap(p, mix(SEG_A, SEG_B, s / 400)),
      );
    }
    assert(
      all[0].distance <= bestOnSegment + 1e-12,
      `sampling the segment found a closer point than closestOnSegment did`,
    );

    // Same for the box, sampled through its whole volume so faces, edges and corners
    // are all represented.
    let bestOnBox = Infinity;
    for (let i = 0; i <= 12; i += 1) {
      for (let j = 0; j <= 12; j += 1) {
        for (let k = 0; k <= 12; k += 1) {
          bestOnBox = Math.min(
            bestOnBox,
            gap(p, {
              x: BOX_MIN.x + ((BOX_MAX.x - BOX_MIN.x) * i) / 12,
              y: BOX_MIN.y + ((BOX_MAX.y - BOX_MIN.y) * j) / 12,
              z: BOX_MIN.z + ((BOX_MAX.z - BOX_MIN.z) * k) / 12,
            }),
          );
        }
      }
    }
    assert(
      all[1].distance <= bestOnBox + 1e-12,
      `sampling the box found a closer point than closestOnBox did`,
    );

    // And the sphere, sampled over its surface.
    let bestOnSphere = Infinity;
    for (let i = 0; i <= 60; i += 1) {
      for (let j = 0; j <= 30; j += 1) {
        const az = (i / 60) * Math.PI * 2;
        const el = (j / 30) * Math.PI - Math.PI / 2;
        bestOnSphere = Math.min(
          bestOnSphere,
          gap(p, {
            x: SPHERE_C.x + SPHERE_R * Math.cos(el) * Math.sin(az),
            y: SPHERE_C.y + SPHERE_R * Math.sin(el),
            z: SPHERE_C.z + SPHERE_R * Math.cos(el) * Math.cos(az),
          }),
        );
      }
    }
    assert(
      all[2].distance <= bestOnSphere + 1e-9,
      `sampling the sphere found a closer point than closestOnSphere did`,
    );
  }
};

/**
 * Bounding volumes and the tests between them.
 *
 * Three cross-checks carry this one, all of them reaching the answer by a route the
 * implementation does not use. Sphere-versus-box is compared against Section 6.1's
 * `signedDistanceToBox` minus the radius. The segment-to-segment routine is compared against
 * a dense sample of both segments, which is the only way to catch the classic bug of
 * clamping one parameter and forgetting to re-solve the other. And ray-versus-box is compared
 * against walking along the ray and asking whether any step of it is inside the box.
 *
 * The oriented-box case is checked by brute force too, because the page makes a specific
 * claim - that two boxes can overlap on all six face axes and still be apart - and a claim
 * like that has to be pinned or it will quietly stop being true.
 */
export const collisionCheck: Demo = () => {
  const V = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
  const gap3 = (a: Vec3, b: Vec3) =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const unit = { min: V(-1, -1, -1), max: V(1, 1, 1) };

  // ---- Spheres ---------------------------------------------------------------------

  const ball = { centre: V(0, 0, 0), radius: 1.5 };
  for (const d of [0, 1, 2, 3, 5]) {
    const other = { centre: V(d, 0, 0), radius: 1 };
    assert(
      near(sphereSphere(ball, other), d - 2.5, 1e-12),
      `two spheres ${d} apart should separate by ${d - 2.5}`,
    );
    assert(
      near(sphereSphere(ball, other), sphereSphere(other, ball), 1e-15),
      "a separation cannot depend on which shape you name first",
    );
  }
  assert(
    near(sphereSphere(ball, { centre: V(2.5, 0, 0), radius: 1 }), 0, 1e-15),
    "spheres exactly touching should report zero, not a tiny negative",
  );

  // ---- Sphere against a box, cross-checked against Section 6.1 ----------------------

  assert(
    near(sphereAabb({ centre: V(2, 0, 0), radius: 1 }, unit), 0, 1e-15),
    "a sphere resting on a face should report zero",
  );
  assert(
    near(
      sphereAabb({ centre: V(2, 2, 0), radius: 1 }, unit),
      Math.SQRT2 - 1,
      1e-15,
    ),
    "off a corner, the corner sets the distance",
  );
  let worstSphereBox = 0;
  for (let i = 0; i <= 14; i += 1) {
    for (let j = 0; j <= 14; j += 1) {
      for (let k = 0; k <= 14; k += 1) {
        const p = V(-4 + (i / 14) * 8, -4 + (j / 14) * 8, -4 + (k / 14) * 8);
        const signed = signedDistanceToBox(unit.min, unit.max, p);
        if (signed <= 0) continue;
        worstSphereBox = Math.max(
          worstSphereBox,
          Math.abs(
            sphereAabb({ centre: p, radius: 0.7 }, unit) - (signed - 0.7),
          ),
        );
      }
    }
  }
  assert(
    worstSphereBox < 1e-12,
    `sphere-box should be the signed distance minus the radius, off by ${worstSphereBox}`,
  );

  // ---- Box against box, and the axis that separated them ---------------------------

  const wide: Aabb = { min: V(-1, -1, -1), max: V(1, 1, 1) };
  const shift = (o: Vec3): Aabb => ({
    min: V(o.x - 1, o.y - 1, o.z - 1),
    max: V(o.x + 1, o.y + 1, o.z + 1),
  });
  assert(
    aabbAabb(wide, shift(V(0, 0, 0))).separation === -2,
    "coincident boxes overlap by 2",
  );
  assert(
    aabbAabb(wide, shift(V(3, 0, 0))).separation === 1,
    "boxes 3 apart leave a 1 m gap",
  );
  assert(
    aabbAabb(wide, shift(V(3, 0, 0))).axis === "x",
    "that gap is on the x axis",
  );
  const diagonal = aabbAabb(wide, shift(V(1.5, 2.5, 0)));
  assert(
    diagonal.separation === 0.5 && diagonal.axis === "y",
    "the widest gap wins, and here it is y",
  );
  // Any positive gap on any axis has to mean no overlap, checked against a direct test.
  for (let i = 0; i <= 12; i += 1) {
    for (let j = 0; j <= 12; j += 1) {
      const b = shift(V(-3 + (i / 12) * 6, -3 + (j / 12) * 6, 0.4));
      const overlapsEveryAxis = (["x", "y", "z"] as const).every(
        (k) => wide.min[k] < b.max[k] && b.min[k] < wide.max[k],
      );
      assert(
        aabbAabb(wide, b).separation < 0 === overlapsEveryAxis,
        "a negative separation must mean all three axes overlap",
      );
    }
  }

  // ---- Two segments, against a dense sample of both --------------------------------

  const segmentCases: Array<[Vec3, Vec3, Vec3, Vec3, string]> = [
    [V(-2, 0, 0), V(2, 0, 0), V(0, 1, -2), V(0, 1, 2), "crossing"],
    [V(-2, 0, 0), V(2, 0, 0), V(-2, 1, 0), V(2, 1, 0), "parallel"],
    [V(-2, 0, 0), V(2, 0, 0), V(5, 1, 0), V(9, 1, 0), "collinear and apart"],
    [V(0, 0, 0), V(0, 3, 0), V(2, 4, 0), V(4, 6, 1), "both ends clamped"],
    [V(-3, -1, 2), V(1, 2, -1), V(-1, 3, 3), V(2, -2, 0), "skew"],
    [V(1, 1, 1), V(1, 1, 1), V(-2, 0, 0), V(2, 0, 0), "one is a point"],
  ];
  for (const [p1, q1, p2, q2, label] of segmentCases) {
    const { c1, c2 } = closestBetweenSegments(p1, q1, p2, q2);
    const answer = gap3(c1, c2);

    // Both points have to be on their own segments, or the answer is about other lines.
    assert(
      near(gap3(p1, c1) + gap3(c1, q1), gap3(p1, q1), 1e-9),
      `${label}: the first point left its segment`,
    );
    assert(
      near(gap3(p2, c2) + gap3(c2, q2), gap3(p2, q2), 1e-9),
      `${label}: the second point left its segment`,
    );

    const mixAt = (a: Vec3, b: Vec3, u: number) =>
      V(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);
    let brute = Infinity;
    for (let i = 0; i <= 260; i += 1) {
      for (let j = 0; j <= 260; j += 1) {
        brute = Math.min(
          brute,
          gap3(mixAt(p1, q1, i / 260), mixAt(p2, q2, j / 260)),
        );
      }
    }
    assert(
      answer <= brute + 1e-9,
      `${label}: sampling found a closer pair than closestBetweenSegments, ${brute} vs ${answer}`,
    );
  }

  // ---- Capsules ---------------------------------------------------------------------

  const rod = { a: V(-2, 0, 0), b: V(2, 0, 0), radius: 0.5 };
  assert(
    near(capsuleCapsule(rod, rod), -1, 1e-15),
    "a capsule against itself overlaps by both radii",
  );
  for (const h of [1, 1.1, 2]) {
    const crossing = { a: V(0, h, -2), b: V(0, h, 2), radius: 0.6 };
    assert(
      near(capsuleCapsule(rod, crossing), h - 1.1, 1e-12),
      `capsules ${h} apart should separate by ${h - 1.1}`,
    );
  }
  // A capsule whose ends coincide is a sphere, and both tests must agree that it is.
  for (const p of [V(0, 2, 0), V(3, 0, 1), V(-5, 1, -2)]) {
    const asSphere = { centre: p, radius: 0.6 };
    const asCapsule = { a: p, b: p, radius: 0.6 };
    assert(
      near(
        sphereCapsule({ centre: V(0, 0, 0), radius: 1.2 }, asCapsule),
        sphereSphere({ centre: V(0, 0, 0), radius: 1.2 }, asSphere),
        1e-12,
      ),
      "a zero-length capsule is a sphere and should measure like one",
    );
  }

  // ---- Slabs, and the ray against a box --------------------------------------------

  assert(
    JSON.stringify(slabInterval(-5, 1, -1, 1)) ===
      JSON.stringify({ enter: 4, exit: 6 }),
    "entering a slab from -5 at unit speed should run 4 to 6",
  );
  const backwards = slabInterval(-5, -1, -1, 1)!;
  assert(
    backwards.enter === -6 && backwards.exit === -4,
    "a reversed direction swaps which face is the entry",
  );
  const parallelInside = slabInterval(0, 0, -1, 1)!;
  assert(
    parallelInside.enter === -Infinity && parallelInside.exit === Infinity,
    "parallel and between the planes means the whole ray, not a division by zero",
  );
  assert(
    slabInterval(5, 0, -1, 1) === null,
    "parallel and outside the planes means no stretch at all",
  );

  const straight = rayAabb(V(-5, 0, 0), V(1, 0, 0), unit)!;
  assert(
    straight.enter === 4 && straight.exit === 6 && !straight.startedInside,
    "a ray straight at a unit box from -5 enters at 4 and leaves at 6",
  );
  const within = rayAabb(V(0, 0, 0), V(1, 0, 0), unit)!;
  assert(
    within.startedInside && within.enter === -1 && within.exit === 1,
    "a ray starting inside should say so rather than report a hit behind itself",
  );
  assert(
    rayAabb(V(5, 0, 0), V(1, 0, 0), unit) === null,
    "a box entirely behind the ray is a miss",
  );

  // Walking the ray and asking whether any step lands inside must agree with the slabs.
  const insideBox = (p: Vec3, box: Aabb) =>
    p.x >= box.min.x &&
    p.x <= box.max.x &&
    p.y >= box.min.y &&
    p.y <= box.max.y &&
    p.z >= box.min.z &&
    p.z <= box.max.z;
  let rayDisagreements = 0;
  let raysHit = 0;
  for (let i = 0; i <= 26; i += 1) {
    for (let j = 0; j <= 26; j += 1) {
      const yaw = -25 + (i / 26) * 50;
      const pitch = -25 + (j / 26) * 50;
      const d = directionFor(yaw, pitch);
      const found = rayAabb(SLAB_ORIGIN, d, SLAB_BOX);
      let walked = false;
      for (let k = 0; k <= 3000; k += 1) {
        const t = (k / 3000) * 20;
        if (
          insideBox(
            V(
              SLAB_ORIGIN.x + d.x * t,
              SLAB_ORIGIN.y + d.y * t,
              SLAB_ORIGIN.z + d.z * t,
            ),
            SLAB_BOX,
          )
        ) {
          walked = true;
          break;
        }
      }
      if (walked) raysHit += 1;
      if (walked !== (found !== null)) rayDisagreements += 1;
      // Where there is a hit, both ends of it sit on the box's surface.
      if (found && found.enter > 0) {
        const at = V(
          SLAB_ORIGIN.x + d.x * found.enter,
          SLAB_ORIGIN.y + d.y * found.enter,
          SLAB_ORIGIN.z + d.z * found.enter,
        );
        assert(
          near(signedDistanceToBox(SLAB_BOX.min, SLAB_BOX.max, at), 0, 1e-9),
          "the entry point should be exactly on the box",
        );
      }
    }
  }
  assert(
    rayDisagreements === 0,
    `walking the ray disagreed with the slab test ${rayDisagreements} times`,
  );
  assert(
    raysHit > 100 && raysHit < 729,
    "the ray sweep should contain both hits and misses, or it proves nothing",
  );

  // Every miss in the scene names a culprit, and every hit names none.
  for (let yaw = -25; yaw <= 25; yaw += 2.5) {
    for (let pitch = -25; pitch <= 25; pitch += 2.5) {
      const r = resultFor(yaw, pitch);
      assert(
        (r.hit === null) === (r.blame !== null),
        `a miss must explain itself and a hit must not, at ${yaw},${pitch}`,
      );
    }
  }

  // ---- Oriented boxes --------------------------------------------------------------

  const square: Obb = {
    centre: V(0, 0, 0),
    axes: [V(1, 0, 0), V(0, 1, 0), V(0, 0, 1)],
    half: V(1, 1, 1),
  };
  const flat = obbInterval(square, V(1, 0, 0));
  assert(
    flat.lo === -1 && flat.hi === 1,
    "an axis-aligned unit box casts a shadow of -1 to 1",
  );
  const c45 = Math.cos(Math.PI / 4);
  const turned: Obb = {
    centre: V(0, 0, 0),
    axes: [V(c45, 0, -c45), V(0, 1, 0), V(c45, 0, c45)],
    half: V(1, 1, 1),
  };
  const wideShadow = obbInterval(turned, V(1, 0, 0));
  assert(
    near(wideShadow.hi, Math.SQRT2, 1e-12),
    "a box turned 45 degrees reaches root two along x, not one",
  );

  // The claim the page makes: all six face axes overlap, one cross axis separates.
  const face = worstGap(FACE_AXES);
  const cross = worstGap(CROSS_AXES);
  assert(
    face.gap < 0,
    `every face axis should overlap for this pair, widest gap was ${face.gap}`,
  );
  assert(
    cross.gap > 0,
    `a cross-product axis should separate this pair, widest gap was ${cross.gap}`,
  );
  // And they really are apart, by a route that knows nothing about axes.
  let shared = 0;
  for (const p of samplesInside(BOX_A, 20))
    if (insideObb(BOX_B, p)) shared += 1;
  for (const p of samplesInside(BOX_B, 20))
    if (insideObb(BOX_A, p)) shared += 1;
  assert(
    shared === 0,
    `the two boxes are supposed to be apart, but ${shared} sampled points are in both`,
  );

  // ---- The scene's four pairings, and broad-phase bounds ---------------------------

  for (const kind of KINDS) {
    // Far away is clear, and the origin is inside everything, whichever pairing it is.
    assert(
      testAt(kind, V(14, 9, 11)).separation > 0,
      `${kind} should be clear at a distance`,
    );
    assert(
      testAt(kind, V(0, 0, 0)).separation < 0,
      `${kind} should overlap at the origin`,
    );
  }
  const sphereBounds = aabbOfSphere(STATIC_SPHERE);
  assert(
    near(
      sphereBounds.max.x - sphereBounds.min.x,
      STATIC_SPHERE.radius * 2,
      1e-15,
    ),
    "a sphere's bounding box is two radii across",
  );
  const capBounds = aabbOfCapsule(movingCapsuleAt(V(0, 0, 0)));
  assert(
    near(capBounds.max.y - capBounds.min.y, 2 * (1.1 + 0.5), 1e-15),
    "a capsule's bounding box covers its ends plus a radius each way",
  );
  // A bounding box has to contain what it bounds, or the broad phase drops real contacts.
  for (const c of [STATIC_CAPSULE, movingCapsuleAt(V(2, -1, 0.5))]) {
    const b = aabbOfCapsule(c);
    for (const end of [c.a, c.b]) {
      assert(
        end.x - c.radius >= b.min.x - 1e-12 &&
          end.x + c.radius <= b.max.x + 1e-12,
        "a capsule end escaped its own bounding box",
      );
    }
  }
  assert(pairCount(200) === 19900, "200 objects make 19,900 pairs");
  assert(pairCount(1) === 0, "one object has nothing to test against");
  assert(
    pairCount(2000) / pairCount(1000) > 3.9,
    "doubling the object count should roughly quadruple the pairs",
  );
  assert(
    near(
      Math.hypot(
        STATIC_BOX.max.x - STATIC_BOX.min.x,
        STATIC_BOX.max.y - STATIC_BOX.min.y,
        STATIC_BOX.max.z - STATIC_BOX.min.z,
      ),
      Math.hypot(2.8, 2, 1.8),
      1e-12,
    ),
    "the scene's box is deliberately not a cube, so an axis mix-up cannot hide",
  );
};

/**
 * Collision response: the split, sliding, bouncing, push-out, and tunneling.
 *
 * The assertion worth the most is the last group. The page claims that a test done only at frame
 * positions misses a fast enough object, and - the part that makes the bug so unpleasant - that
 * whether it misses depends on nothing but where the frames happened to land. So the check sweeps
 * forty start offsets at one fixed speed and requires **both** outcomes to appear. If a change
 * ever made the discrete test reliable, that assertion fails and the prose gets rewritten rather
 * than quietly becoming false.
 *
 * Everything else leans on one identity: sliding is bouncing with no bounce. If `slideAlong` and
 * `reflect(..., 0)` ever disagree, one of them is wrong.
 */
export const responseCheck: Demo = () => {
  const V = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
  const size = (v: Vec3) => Math.hypot(v.x, v.y, v.z);
  const dot3 = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
  const same = (a: Vec3, b: Vec3, tol = 1e-12) =>
    near(a.x, b.x, tol) && near(a.y, b.y, tol) && near(a.z, b.z, tol);

  // ---- The split ------------------------------------------------------------------

  for (let deg = 0; deg <= 90; deg += 5) {
    const n = surfaceNormal(deg);
    assert(
      near(size(n), 1, 1e-15),
      `the surface normal at ${deg} is not unit length`,
    );
    assert(
      near(dot3(n, surfaceDirection(deg)), 0, 1e-15),
      `the surface and its normal are not perpendicular at ${deg}`,
    );
    assert(
      near(slopeAngle(n), deg, 1e-9),
      `a surface tilted ${deg} should report a ${deg} degree slope`,
    );

    // The two parts must add back up to the velocity, and be perpendicular to each other.
    const v = V(4, -1.5, 0);
    const { amount, normalPart, tangentPart } = decompose(v, n);
    assert(
      same(
        {
          x: normalPart.x + tangentPart.x,
          y: normalPart.y + tangentPart.y,
          z: normalPart.z + tangentPart.z,
        },
        v,
      ),
      `the two parts do not add back up to the velocity at ${deg}`,
    );
    assert(
      near(dot3(normalPart, tangentPart), 0, 1e-12),
      `the two parts are not perpendicular at ${deg}`,
    );
    assert(
      near(dot3(tangentPart, n), 0, 1e-12),
      `the sliding part still has something heading into the surface at ${deg}`,
    );
    assert(
      near(amount, dot3(v, n), 1e-15),
      "the amount should be the dot product",
    );
    // Splitting cannot invent speed.
    assert(
      size(tangentPart) <= size(v) + 1e-12,
      "sliding must not be faster than arriving",
    );
  }

  // A flat floor blocks nothing horizontal, and a vertical wall blocks all of it.
  const flatSplit = decompose(V(4, 0, 0), surfaceNormal(0));
  assert(
    near(flatSplit.amount, 0, 1e-15),
    "running along a flat floor is not blocked",
  );
  const wallSplit = decompose(V(4, 0, 0), surfaceNormal(90));
  assert(
    near(size(wallSplit.tangentPart), 0, 1e-12),
    "a vertical wall blocks all of it",
  );
  assert(near(wallSplit.amount, -4, 1e-12), "and it blocks it head on");

  // ---- Sliding is bouncing with no bounce -----------------------------------------

  for (let deg = 0; deg <= 90; deg += 3) {
    const n = surfaceNormal(deg);
    for (const v of [V(5, -2, 0), V(-1, -6, 0), V(3, 4, 0), V(0, -1, 2)]) {
      assert(
        same(slideAlong(v, n), reflect(v, n, 0)),
        `slideAlong and reflect with no restitution disagree at ${deg}`,
      );
      assert(
        same(slideAlong(v, n), respond(v, n, 0, 0)) || dot3(v, n) > 0,
        `respond with no restitution and no friction should just slide, at ${deg}`,
      );
      // A perfect bounce keeps the speed exactly.
      assert(
        near(size(reflect(v, n, 1)), size(v), 1e-12),
        `a perfect bounce changed the speed at ${deg}`,
      );
      // And it really is a reflection: the normal part flips, the rest does not.
      const before = decompose(v, n);
      const after = decompose(reflect(v, n, 1), n);
      assert(
        near(after.amount, -before.amount, 1e-12),
        "a perfect bounce should flip the normal part",
      );
      assert(
        same(after.tangentPart, before.tangentPart),
        "a bounce should leave the sliding part alone",
      );
    }
  }

  // Friction only ever removes, and full friction stops dead.
  const floor = V(0, 1, 0);
  const landing = V(5, -1, 0);
  assert(
    near(size(respond(landing, floor, 0, 1)), 0, 1e-15),
    "full friction with no bounce should stop the object",
  );
  let previousSpeed = Infinity;
  for (const friction of [0, 0.25, 0.5, 0.75, 1]) {
    const speed = size(respond(landing, floor, 0, friction));
    assert(
      speed <= previousSpeed + 1e-12,
      "more friction cannot leave more speed",
    );
    previousSpeed = speed;
  }
  // Something already leaving the surface must be left alone, or it sticks to walls.
  const leaving = V(-1, 3, 0);
  assert(
    same(respond(leaving, surfaceNormal(45), 0.5, 0.3), leaving),
    "a velocity already pointing away from the surface should pass through untouched",
  );

  // ---- Walkable, and where the threshold sits ------------------------------------

  assert(isWalkable(surfaceNormal(0), MAX_SLOPE), "a flat floor is walkable");
  assert(
    isWalkable(surfaceNormal(MAX_SLOPE), MAX_SLOPE),
    "the limit itself is walkable",
  );
  assert(
    !isWalkable(surfaceNormal(MAX_SLOPE + 1), MAX_SLOPE),
    "one degree past the limit is not",
  );
  assert(
    !isWalkable(surfaceNormal(90), MAX_SLOPE),
    "a vertical wall is not walkable",
  );
  // The scene's readout has to agree with the same threshold.
  for (let deg = 0; deg <= 90; deg += 1) {
    assert(
      analyse(deg, -10).walkable === deg <= MAX_SLOPE,
      `the scene disagrees about whether ${deg} degrees is walkable`,
    );
  }

  // ---- Penetration, and the shortest way out -------------------------------------

  const ground: Aabb = { min: V(-5, -1, -5), max: V(5, 0, 5) };
  const feet: Aabb = { min: V(-0.4, -0.3, -0.4), max: V(0.4, 1.5, 0.4) };
  const overlaps = axisOverlaps(ground, feet);
  assert(
    overlaps.every((o) => o.overlap > 0),
    "a real overlap should be positive on every axis",
  );
  const shallowest = overlaps.reduce((best, o) =>
    o.overlap < best.overlap ? o : best,
  );
  assert(
    shallowest.axis === "y" && near(shallowest.overlap, 0.3, 1e-12),
    "the shallowest way out of this overlap is 30 cm straight up",
  );
  const contact = boxContact(ground, feet);
  assert(
    contact !== null,
    "these boxes do overlap, so there should be a contact",
  );
  assert(
    same(contact!.normal, V(0, 1, 0)) &&
      near(contact!.depth, shallowest.overlap, 1e-12),
    "the contact should be the minimum translation vector, not just any way out",
  );

  // Pushing out has to actually separate them, and land clear of the boundary.
  const shifted: Aabb = {
    min: pushOut(feet.min, contact!),
    max: pushOut(feet.max, contact!),
  };
  assert(
    boxContact(ground, shifted) === null,
    "after pushing out along the MTV the boxes should be clear",
  );
  assert(
    shifted.min.y > ground.max.y,
    "and clear by a margin, not resting exactly on the boundary",
  );
  // The normal points away from the box being pushed out of, whichever side it is on.
  const above = boxContact(ground, {
    min: V(-0.4, -0.2, -0.4),
    max: V(0.4, 2, 0.4),
  })!;
  const below = boxContact(ground, {
    min: V(-0.4, -2, -0.4),
    max: V(0.4, -0.8, 0.4),
  })!;
  assert(above.normal.y === 1, "something on top should be pushed up");
  assert(below.normal.y === -1, "something underneath should be pushed down");
  assert(
    boxContact(ground, { min: V(20, 20, 20), max: V(21, 21, 21) }) === null,
    "distant boxes have no contact",
  );

  // ---- Sweeping, and the tunneling the page describes ----------------------------

  const grown = expandBox(WALL, RADIUS);
  assert(
    near(grown.max.x - grown.min.x, GAP, 1e-15),
    "the grown box should be the wall plus a radius each side",
  );
  assert(
    sweepSphereToBox(V(-4, 0, 0), V(0, 0, 0), RADIUS, WALL, DT) === null,
    "something standing still cannot sweep into anything",
  );
  assert(
    sweepSphereToBox(V(-4, 0, 0), V(-300, 0, 0), RADIUS, WALL, 100) === null,
    "moving away should not report a contact",
  );
  assert(
    sweepSphereToBox(V(0, 0, 0), V(300, 0, 0), RADIUS, WALL, DT) === 0,
    "starting already inside should report contact now, not later",
  );
  assert(
    sweepSphereToBox(V(-4, 0, 0), V(10, 0, 0), RADIUS, WALL, DT) === null,
    "a contact beyond this frame's movement is not this frame's problem",
  );
  // The contact really is where the surfaces touch: exactly one radius from the wall.
  for (const speed of [45, 90, 180, 360, 900]) {
    const found = sweptHit(speed, 0);
    assert(found !== null, `the swept test should catch ${speed} m/s`);
    assert(
      near(Math.abs(found!.x - WALL.min.x), RADIUS, 1e-9),
      `the swept contact at ${speed} m/s is not resting against the wall`,
    );
  }

  // Slow enough and both tests agree.
  for (const speed of [30, 45, 60]) {
    if (stepFor(speed) < GAP) {
      assert(
        discreteHit(speed, 0) !== null,
        `a step smaller than the gap should always be caught, at ${speed} m/s`,
      );
    }
  }

  // Fast enough and the discrete test depends on nothing but luck. Both outcomes must occur.
  let caught = 0;
  let missed = 0;
  for (let i = 0; i < 40; i += 1) {
    if (discreteHit(60, i / 40) === null) missed += 1;
    else caught += 1;
  }
  assert(
    caught > 0 && missed > 0,
    `at 60 m/s the frame test should be a lottery, but it ${missed === 0 ? "always caught it" : "never caught it"}`,
  );
  // And the swept test is not a lottery, at any speed or offset.
  for (const speed of [60, 120, 150, 240, 600, 2000]) {
    for (let i = 0; i < 20; i += 1) {
      assert(
        sweptHit(speed, i / 20) !== null,
        `the swept test missed at ${speed} m/s with offset ${i / 20}`,
      );
    }
  }
  // The frame positions the scene draws must really straddle the wall when it tunnels.
  const tunnelling = framePositions(300, 0);
  assert(
    tunnelling.every((p) => Math.abs(p.x) > GAP / 2),
    "if the scene says it tunnelled, no drawn frame may be touching the wall",
  );

  // ---- Restitution -----------------------------------------------------------------

  assert(
    near(apexAfterBounces(2, 1, 9), 2, 1e-12),
    "a perfect bounce never loses height",
  );
  assert(
    near(apexAfterBounces(2, 0, 1), 0, 1e-15),
    "no bounce means no second apex",
  );
  assert(
    near(apexAfterBounces(2, 0.5, 1), 0.5, 1e-12),
    "half the speed is a quarter of the height",
  );
  for (const e of [0.3, 0.5, 0.8, 0.95]) {
    for (let n = 1; n <= 4; n += 1) {
      assert(
        near(
          apexAfterBounces(2, e, n),
          apexAfterBounces(2, e, n - 1) * e * e,
          1e-12,
        ),
        `each bounce should keep e squared of the height, at e=${e}`,
      );
      assert(
        apexAfterBounces(2, e, n) < apexAfterBounces(2, e, n - 1),
        "a bounce with restitution under one must lose height",
      );
    }
  }
};

/**
 * Velocity, acceleration and forces, and the backwards solve for a jump.
 *
 * The backwards solve is checked by **round trip**: derive a gravity and a launch speed from a
 * height and a time, then run the ordinary forwards formulas on them and require the height and
 * the time back. Those two directions share no code, so agreeing to `1e-12` means the algebra is
 * right rather than merely self-consistent.
 *
 * The other assertion worth its place is the shortfall. A jump solved exactly and then *stepped*
 * at a real frame rate does not reach the height it was solved for, and the page claims the error
 * is `dt / t_apex`. That is checked against measurement at three frame rates, which is also what
 * makes Section 7.2 necessary rather than merely interesting.
 */
export const dynamicsCheck: Demo = () => {
  const V = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

  // ---- The forwards formulas agree with each other -------------------------------

  for (const launch of [3, 6, 9.6, 13.33]) {
    for (const g of [3.75, 9.81, 15, 38.4]) {
      const t = timeToApex(launch, g);
      const h = apexHeight(launch, g);
      assert(
        near(heightAt(t, launch, g), h, 1e-12),
        "the parabola at the apex time should be the apex height",
      );
      // The apex really is the top: a moment either side is lower.
      assert(
        heightAt(t - 0.01, launch, g) < h && heightAt(t + 0.01, launch, g) < h,
        "the apex should be higher than either side of it",
      );
      // And it comes back to the ground after twice as long.
      assert(
        near(heightAt(2 * t, launch, g), 0, 1e-12),
        "the arc is symmetric without a multiplier",
      );
    }
  }

  // ---- The backwards solve, round-tripped ---------------------------------------

  for (const height of [0.4, 1.2, 2, 3]) {
    for (const time of [0.15, 0.25, 0.4, 0.6, 0.9]) {
      const { gravity, launchSpeed } = jumpFromHeightAndTime(height, time);
      assert(
        near(apexHeight(launchSpeed, gravity), height, 1e-12),
        `solving for ${height} m in ${time} s did not give back ${height} m`,
      );
      assert(
        near(timeToApex(launchSpeed, gravity), time, 1e-12),
        `solving for ${height} m in ${time} s did not give back ${time} s`,
      );
      // The other pairing has to land in the same place.
      const other = jumpFromHeightAndGravity(height, gravity);
      assert(
        near(other.launchSpeed, launchSpeed, 1e-9) &&
          near(other.timeToApex, time, 1e-9),
        "the two ways of specifying a jump should agree",
      );
    }
  }

  // Gravity goes as one over the time squared, which is the thing that surprises people.
  assert(
    near(gravityFor(1.2, 0.2) / gravityFor(1.2, 0.4), 4, 1e-12),
    "halving the time to apex should quadruple the gravity",
  );
  assert(
    near(launchSpeedFor(1.2, 0.2) / launchSpeedFor(1.2, 0.4), 2, 1e-12),
    "halving the time to apex only doubles the launch speed",
  );
  // Earth is floaty at human scale: nearly half a second just to reach 1.2 m.
  const earth = jumpFromHeightAndGravity(1.2, EARTH_GRAVITY);
  assert(
    earth.timeToApex > 0.45,
    "the claim that Earth gravity feels floaty rests on this taking a while",
  );

  // ---- Falling faster than you rose --------------------------------------------

  for (const multiplier of [1, 1.5, 2, 3]) {
    const a = airTime(1.2, 0.4, multiplier);
    assert(near(a.up, 0.4, 1e-15), "the rise is whatever was asked for");
    assert(
      near(heightWithFallMultiplier(a.total, 1.2, 0.4, multiplier), 0, 1e-12),
      `a jump with multiplier ${multiplier} should land exactly at the end of its air time`,
    );
    assert(
      near(heightWithFallMultiplier(0.4, 1.2, 0.4, multiplier), 1.2, 1e-12),
      "the multiplier must not change the height reached",
    );
    assert(
      a.down <= a.up + 1e-12,
      "a heavier fall cannot take longer than the rise",
    );
  }
  assert(
    near(airTime(1.2, 0.4, 4).down * 2, airTime(1.2, 0.4, 1).down, 1e-12),
    "four times the gravity should halve the fall time exactly",
  );

  // ---- Impulse against a steady force -----------------------------------------

  const { gravity: jumpG, launchSpeed: jumpV } = jumpFromHeightAndTime(
    1.2,
    0.4,
  );
  const push = 0.1;
  for (const t of [0.02, 0.05, 0.1]) {
    assert(
      riseFromImpulse(t, jumpV, jumpG) > riseFromSteadyForce(t, jumpV, push),
      `an impulse should be ahead of a spread-out force at ${t} s`,
    );
  }
  // A force delivered over no time at all is an impulse, so the two must converge.
  let previousGap = Infinity;
  for (const duration of [0.2, 0.1, 0.05, 0.01, 0.001]) {
    const gap =
      riseFromImpulse(duration, jumpV, jumpG) -
      riseFromSteadyForce(duration, jumpV, duration);
    assert(gap > 0, "the impulse is always the one in front");
    assert(
      gap < previousGap,
      "a shorter push should look more like an impulse",
    );
    previousGap = gap;
  }

  // ---- Drag -------------------------------------------------------------------

  // Frame-rate independence, which is the whole reason it is written as an exponential.
  for (const k of [0.5, 2, 6]) {
    const speeds = [1, 30, 60, 144, 1000].map((fps) => {
      let v = V(10, 0, 0);
      for (let i = 0; i < fps; i += 1) v = dragStep(v, k, 1 / fps);
      return v.x;
    });
    const spread = Math.max(...speeds) - Math.min(...speeds);
    assert(
      spread < 1e-12,
      `one second of drag at k=${k} should not depend on the frame rate, spread was ${spread}`,
    );
    assert(
      near(speeds[0], 10 * Math.exp(-k), 1e-12),
      "and it should be exactly the exponential",
    );
  }
  assert(
    dragStep(V(10, 0, 0), 0, 1 / 60).x === 10,
    "no drag should remove nothing",
  );

  /* A long fall settles, and it settles a little *faster* than the continuous terminal speed,
     because a stepped drag removes slightly less than a continuous one does. The stepped version
     has its own exact fixed point, and the gap from the continuous answer is about k*dt/2 - worth
     pinning rather than papering over with a loose tolerance. */
  const fallStep = 1 / 60;
  for (const k of [1, 2, 4]) {
    let body = { position: V(0, 0, 0), velocity: V(0, 0, 0) };
    for (let i = 0; i < 60 * 30; i += 1) {
      body = stepProjectile(body, EARTH_GRAVITY, k, fallStep);
    }
    const fixedPoint =
      -(EARTH_GRAVITY * fallStep) / (1 - Math.exp(-k * fallStep));
    assert(
      near(body.velocity.y, fixedPoint, 1e-9),
      `a fall with k=${k} settled at ${body.velocity.y}, not at its own fixed point ${fixedPoint}`,
    );
    const analytic = terminalSpeed(EARTH_GRAVITY, k);
    const excess = (Math.abs(body.velocity.y) - analytic) / analytic;
    assert(
      excess > 0,
      "a stepped fall should overshoot the continuous terminal speed",
    );
    assert(
      near(excess, (k * fallStep) / 2, (k * fallStep) / 40),
      `the overshoot at k=${k} was ${excess}, not about ${(k * fallStep) / 2}`,
    );
  }
  assert(
    terminalSpeed(EARTH_GRAVITY, 0) === Infinity,
    "no drag means no terminal speed",
  );

  /* Drag shortens the range and makes the arc lopsided - but the two ways of measuring "where the
     peak is" move in *opposite* directions, and reporting only one of them next to a picture of the
     arc reads as a bug, because the eye measures distance and the clock does not. In vacuum both
     are exactly one half. */
  for (const angle of [15, 30, 45, 60, 75]) {
    assert(
      near(peakTimeFraction(angle, 0), 0.5, 0.01),
      `without drag the peak should sit halfway through the flight, at ${angle} degrees`,
    );
    assert(
      near(peakDistanceFraction(angle, 0), 0.5, 0.01),
      `without drag the peak should sit halfway along it too, at ${angle} degrees`,
    );
    let previousRange = rangeOf(angle, 0);
    for (const k of [0.2, 0.4, 0.8, 1.5]) {
      const range = rangeOf(angle, k);
      assert(
        range < previousRange,
        `more drag must not carry further, at ${angle} degrees`,
      );
      previousRange = range;
      assert(
        peakTimeFraction(angle, k) < 0.5,
        `with drag the peak should come early in the flight time, at ${angle} degrees`,
      );
      assert(
        peakDistanceFraction(angle, k) > 0.5,
        `with drag the peak should sit late along the distance, at ${angle} degrees`,
      );
    }
    // Heavier drag pushes both further from halfway, each in its own direction.
    assert(
      peakTimeFraction(angle, 1.5) < peakTimeFraction(angle, 0.2),
      "more drag should give the fall a larger share of the flight time",
    );
    assert(
      peakDistanceFraction(angle, 1.5) > peakDistanceFraction(angle, 0.2),
      "more drag should leave the descent covering less ground",
    );
  }
  /* Horizontal motion under linear drag is pure decay, so the reach can never exceed vx0/k however
     the shot is aimed. That ceiling is what makes a high-drag projectile look like it stops in
     mid-air, and it is a hard bound rather than a tendency. */
  for (const angle of [20, 45, 70]) {
    for (const k of [0.4, 1.5]) {
      const ceiling = (Math.cos((angle * Math.PI) / 180) * SPEED) / k;
      assert(
        rangeOf(angle, k) < ceiling,
        `at ${angle} degrees with k=${k} the range should stay under vx0/k = ${ceiling}`,
      );
    }
  }
  // Without drag, 45 degrees is the farthest. With drag it is not, which is why artillery aims low.
  const vacuumBest = [30, 40, 45, 50, 60].reduce((best, a) =>
    rangeOf(a, 0) > rangeOf(best, 0) ? a : best,
  );
  assert(vacuumBest === 45, "in vacuum the best launch angle is 45 degrees");

  // ---- The stepped jump falls short, by dt over the time to apex --------------

  for (const [height, time] of [
    [1.2, 0.4],
    [0.8, 0.3],
    [2, 0.6],
    [3, 0.45],
  ] as const) {
    for (const fps of [30, 60, 100]) {
      const reached = steppedApex(height, time, 1, 1 / fps);
      assert(
        reached < height,
        `a stepped jump should undershoot at ${fps} fps`,
      );
      const measured = (height - reached) / height;
      const predicted = 1 / fps / time;
      /* The law is exact when the apex lands on a step boundary. When it does not, the highest
         step sits just short of the true apex and the shortfall comes out a little smaller, so
         only a close agreement can be claimed. */
      const steps = time * fps;
      const onABoundary = Math.abs(steps - Math.round(steps)) < 1e-9;
      assert(
        onABoundary
          ? near(measured, predicted, 1e-9)
          : Math.abs(measured - predicted) < predicted * 0.05,
        `the shortfall for ${height} m in ${time} s at ${fps} fps was ${measured}, not ${predicted}`,
      );
    }
    // Finer steps must close the gap, or the story about timesteps is wrong.
    let previous = 0;
    for (const fps of [30, 60, 144, 1000]) {
      const reached = steppedApex(height, time, 1, 1 / fps);
      assert(
        reached > previous,
        "a finer timestep should get closer to the exact height",
      );
      previous = reached;
    }
    assert(
      steppedApex(height, time, 1, 1 / 20000) > height * 0.999,
      "and in the limit it should essentially arrive",
    );
  }
  // The scene's shortfall claim at 60 fps for its default jump, which the readout prints.
  assert(
    near(steppedApex(1.2, 0.4, 1, 1 / 60), 1.15, 1e-12),
    "the default jump should reach 1.15 m rather than 1.20 m",
  );

  // ---- The drawn arc is the arc the numbers describe ---------------------------

  const shape = derived(1.2, 0.4, 2);
  const path = analyticArc(1.2, 0.4, 2);
  assert(
    path[0].x === 0 && path[0].y === 0,
    "the arc should start on the ground",
  );
  assert(
    near(path[path.length - 1].y, 0, 1e-9),
    "and it should finish back on the ground",
  );
  assert(
    near(path[path.length - 1].x, shape.total * JUMP_FORWARD, 1e-9),
    "its length should be the air time times the forward speed",
  );
  const drawnPeak = path.reduce((best, p) => Math.max(best, p.y), 0);
  assert(
    drawnPeak <= 1.2 + 1e-12 && drawnPeak > 1.19,
    "the drawn arc should touch the height asked for and not exceed it",
  );
};

/**
 * Integrators, and the fixed timestep loop around them.
 *
 * This is the one Section where the exact answer is available, so the checks compare against it
 * rather than against another approximation. Three claims carry the page and all three are pinned
 * here.
 *
 * Velocity Verlet is **exact** for a constant acceleration at any timestep, which is asserted down
 * to `1e-12` at rates as coarse as 5 Hz. Explicit Euler **overshoots** and semi-implicit
 * **undershoots** by the same amount, so their average is the truth. And on an undamped spring,
 * explicit Euler **gains** energy without bound while semi-implicit stays bounded - which is the
 * actual reason games use it, and it is a claim about a limit rather than about accuracy, so it is
 * checked over many cycles rather than one.
 */
export const integratorCheck: Demo = () => {
  const gravity = constant(THROW_GRAVITY);

  // ---- Constant acceleration: velocity is easy, position is not ------------------

  for (const fps of [5, 10, 30, 60, 144]) {
    const dt = 1 / fps;
    const ticks = Math.round(0.8 * fps);
    let e = THROW_START;
    let s = THROW_START;
    let v = THROW_START;
    for (let i = 0; i < ticks; i += 1) {
      e = stepExplicit(e, gravity, dt);
      s = stepSemiImplicit(s, gravity, dt);
      v = stepVerlet(v, gravity, dt);
    }
    const truth = exact(THROW_START, THROW_GRAVITY, ticks * dt);

    /* All three get the velocity exactly right, because velocity under a constant acceleration is
       a straight line and every one of these adds `a*dt` once per step. The disagreement is
       entirely about position, which is worth knowing before blaming an integrator for the wrong
       thing. */
    for (const [name, got] of [
      ["explicit", e],
      ["semi-implicit", s],
      ["Verlet", v],
    ] as const) {
      assert(
        near(got.velocity, truth.velocity, 1e-12),
        `${name} should get the velocity exactly right at ${fps} Hz`,
      );
    }

    // Verlet is exact in position too, at any timestep at all.
    assert(
      near(v.position, truth.position, 1e-12),
      `Verlet should be exact under constant acceleration, off by ${Math.abs(v.position - truth.position)} at ${fps} Hz`,
    );

    // Explicit is long, semi-implicit is short, and by the same amount.
    assert(
      e.position > truth.position - 1e-12,
      `explicit should not fall short at ${fps} Hz`,
    );
    assert(
      s.position < truth.position + 1e-12,
      `semi-implicit should not overshoot at ${fps} Hz`,
    );
    assert(
      near((e.position + s.position) / 2, truth.position, 1e-12),
      `the two Eulers should straddle the truth evenly at ${fps} Hz`,
    );
  }

  /* Every sample Verlet produces sits on the exact curve, which is the claim the scene makes and
     the one worth checking. Note that is *not* the same as its sampled apex being 1.2 m: at a tick
     rate where nothing lands at 0.4 s the highest sample is legitimately lower, because the top of
     the arc happens between two ticks. Conflating the two makes a correct integrator look broken,
     which is why the scene reports the error from the curve rather than the apex. */
  for (const fps of [5, 12, 30, 60, 90]) {
    const dt = 1 / fps;
    const ticks = Math.max(1, Math.round(0.8 * fps));
    assert(
      maxErrorOf("Verlet", fps) < 1e-12,
      `Verlet should never leave the exact curve, worst was ${maxErrorOf("Verlet", fps)} at ${fps} Hz`,
    );
    assert(
      maxErrorOf("explicit", fps) > 1e-6 &&
        maxErrorOf("semi-implicit", fps) > 1e-6,
      `both Eulers should be measurably off the curve at ${fps} Hz`,
    );
    assert(
      near(maxErrorOf("explicit", fps), maxErrorOf("semi-implicit", fps), 1e-9),
      `the two Eulers should be wrong by the same amount at ${fps} Hz`,
    );
    // Verlet's last sample is on the curve too, wherever the curve happens to be by then.
    assert(
      near(
        endsAt("Verlet", fps),
        exact(THROW_START, THROW_GRAVITY, ticks * dt).position,
        1e-12,
      ),
      `Verlet should end exactly on the curve at ${fps} Hz`,
    );
  }
  // A coarser rate is worse for the Eulers, and still perfect for Verlet.
  for (const fps of [12, 30, 60, 90]) {
    assert(
      maxErrorOf("explicit", fps) < maxErrorOf("explicit", 5),
      `a finer rate than 5 Hz should be more accurate, at ${fps} Hz`,
    );
  }

  // Where a tick does land on the apex, Verlet reaches it exactly and the Eulers straddle it.
  for (const fps of [30, 60, 90]) {
    assert(
      Number.isInteger(0.4 * fps),
      `this part assumes a tick lands at 0.4 s, which ${fps} Hz does`,
    );
    assert(
      near(apexOf("Verlet", fps), 1.2, 1e-12),
      `Verlet should reach the full 1.2 m at ${fps} Hz`,
    );
    assert(
      apexOf("explicit", fps) > 1.2,
      `explicit should overshoot the apex at ${fps} Hz`,
    );
    assert(
      apexOf("semi-implicit", fps) < 1.2,
      `semi-implicit should undershoot it at ${fps} Hz`,
    );
    assert(
      near(
        (apexOf("explicit", fps) + apexOf("semi-implicit", fps)) / 2,
        1.2,
        1e-9,
      ),
      `the two apexes should average to the exact one at ${fps} Hz`,
    );
  }
  // A finer tick rate closes the Euler gap; it does not need to close Verlet's, which is zero.
  let previousGap = Infinity;
  for (const fps of [12, 30, 60, 240]) {
    const gap = apexOf("explicit", fps) - apexOf("semi-implicit", fps);
    assert(
      gap < previousGap,
      "a finer timestep should narrow the gap between the two Eulers",
    );
    previousGap = gap;
  }

  // The drawn parabola is the parabola.
  const truthPath = exactPath();
  assert(truthPath[0].y === 0, "the exact path should start on the ground");
  assert(
    near(truthPath[truthPath.length - 1].y, 0, 1e-12),
    "and finish on the ground",
  );
  assert(
    near(
      truthPath.reduce((b, p) => Math.max(b, p.y), 0),
      1.2,
      1e-3,
    ),
    "and peak at 1.2 m",
  );
  for (const method of THROW_METHODS) {
    assert(
      throwPath(method, 30).length > 20,
      `the ${method} path should have a point per tick`,
    );
    assert(throwPath(method, 30)[0].y === 0, "every path starts on the ground");
  }

  // ---- An undamped spring: the real argument for semi-implicit -------------------

  const start: State = { position: 1, velocity: 0 };
  const startEnergy = energy(start, STIFFNESS);
  assert(startEnergy > 0, "the spring should start with some energy in it");
  assert(
    near(PERIOD, (2 * Math.PI) / Math.sqrt(STIFFNESS), 1e-15),
    "the period should be the standard spring period",
  );

  for (const fps of [30, 60, 120]) {
    // Explicit Euler grows without bound, and faster the longer it runs.
    let previous = 1;
    for (const cycles of [1, 2, 5, 10]) {
      const grown = energyRatio("explicit", fps, cycles);
      assert(
        grown > previous,
        `explicit Euler should keep gaining energy at ${fps} Hz, ${cycles} cycles`,
      );
      previous = grown;
    }
    assert(
      energyRatio("explicit", fps, 20) > 10,
      `explicit Euler should be far out of control after twenty cycles at ${fps} Hz`,
    );

    // Semi-implicit does not conserve energy exactly, but it stays put.
    for (const cycles of [1, 5, 10, 20, 40]) {
      const ratio = energyRatio("semi-implicit", fps, cycles);
      assert(
        ratio > 0.5 && ratio < 2,
        `semi-implicit should stay bounded at ${fps} Hz, ${cycles} cycles, got ${ratio}`,
      );
    }
    // Verlet is tighter still, which is why cloth uses it.
    assert(
      Math.abs(energyRatio("Verlet", fps, 20) - 1) <
        Math.abs(energyRatio("semi-implicit", fps, 20) - 1),
      `Verlet should hold energy more closely than semi-implicit at ${fps} Hz`,
    );
  }

  // The phase-space picture: a spiral outward against something that stays on the circle.
  assert(
    amplitudeRatio("explicit", 60, 4) > 1.5,
    "explicit Euler should visibly spiral outward within four oscillations",
  );
  assert(
    Math.abs(amplitudeRatio("semi-implicit", 60, 4) - 1) < 0.05,
    "semi-implicit should still be near the circle after four oscillations",
  );
  const spiral = phasePath("explicit", 60, 4);
  assert(
    Math.hypot(spiral[spiral.length - 1].x, spiral[spiral.length - 1].y) >
      Math.hypot(spiral[0].x, spiral[0].y),
    "the explicit path should end further from the origin than it began",
  );
  // The path stays finite, so the scene has something to draw rather than a NaN.
  assert(
    phasePath("explicit", 20, 12).every(
      (p) => Number.isFinite(p.x) && Number.isFinite(p.y),
    ),
    "a runaway path should be cut off rather than handed to the renderer as NaN",
  );

  // A spring is the case where the two orderings genuinely differ, unlike constant gravity.
  const oneStepExplicit = stepExplicit(start, spring(STIFFNESS), 1 / 60);
  const oneStepSemi = stepSemiImplicit(start, spring(STIFFNESS), 1 / 60);
  assert(
    !near(oneStepExplicit.position, oneStepSemi.position, 1e-12),
    "the two orderings should already disagree after a single step",
  );

  // ---- The accumulator ----------------------------------------------------------

  const fixed = 1 / 60;
  assert(
    stepsFor(0, fixed, fixed).steps === 1,
    "a frame of exactly one step runs one step",
  );
  assert(
    stepsFor(0, fixed / 2, fixed).steps === 0,
    "half a step runs nothing yet",
  );
  assert(
    near(stepsFor(0, fixed / 2, fixed).leftover, fixed / 2, 1e-15),
    "and keeps the half for next time",
  );
  assert(
    stepsFor(0, 2 * fixed, fixed).steps === 2,
    "a doubled frame runs two steps",
  );

  /* Over a long run the number of ticks has to track real time, whatever the display rate does.
     That is the entire promise of a fixed timestep, so it is worth checking directly rather than
     inferring it from the per-frame counts. */
  for (const displayHz of [30, 50, 60, 75, 144, 240]) {
    let leftover = 0;
    let ticks = 0;
    const frames = displayHz * 10;
    for (let i = 0; i < frames; i += 1) {
      const r = stepsFor(leftover, 1 / displayHz, fixed, 1000);
      leftover = r.leftover;
      ticks += r.steps;
      assert(!r.dropped, "a normal frame should never hit the clamp");
      assert(
        leftover < fixed,
        "the accumulator should never hold a whole step",
      );
      assert(leftover >= 0, "the accumulator should never go negative");
    }
    const expected = 10 / fixed;
    assert(
      Math.abs(ticks - expected) <= 1,
      `${displayHz} Hz over ten seconds ran ${ticks} ticks, expected about ${expected}`,
    );
  }

  // At 144 Hz against 60 Hz physics, some frames genuinely get no tick at all. That is the
  // reason interpolation exists, so the page should not be able to stop being right about it.
  let sawIdleFrame = false;
  let sawBusyFrame = false;
  let idleLeftover = 0;
  for (let i = 0; i < 60; i += 1) {
    const r = stepsFor(idleLeftover, 1 / 144, fixed);
    idleLeftover = r.leftover;
    if (r.steps === 0) sawIdleFrame = true;
    if (r.steps >= 1) sawBusyFrame = true;
  }
  assert(
    sawIdleFrame && sawBusyFrame,
    "at 144 Hz against 60 Hz physics some frames should get a tick and some should not",
  );

  // The clamp, and the spiral of death it prevents.
  const stalled = stepsFor(0, 1, fixed);
  assert(stalled.dropped, "a one second frame should trip the clamp");
  assert(stalled.steps === 5, "and run only the five steps it is allowed");
  assert(
    stalled.leftover > 0.9,
    "leaving most of that second unsimulated, on purpose",
  );

  // ---- Interpolating between ticks ---------------------------------------------

  assert(alphaFrom(0, fixed) === 0, "no leftover means draw the current tick");
  assert(
    near(alphaFrom(fixed / 2, fixed), 0.5, 1e-15),
    "half a step means draw halfway",
  );
  assert(
    alphaFrom(fixed * 3, fixed) === 1,
    "alpha is clamped rather than allowed past one",
  );
  assert(alphaFrom(-1, fixed) === 0, "and clamped at the bottom too");

  const before: State = { position: 0, velocity: 1 };
  const after: State = { position: 2, velocity: 3 };
  assert(
    blend(before, after, 0).position === 0,
    "alpha zero is the previous tick",
  );
  assert(
    blend(before, after, 1).position === 2,
    "alpha one is the current tick",
  );
  assert(blend(before, after, 0.5).position === 1, "and halfway is halfway");
  assert(
    blend(before, after, 0.25).velocity === 1.5,
    "velocity blends the same way",
  );
  // Blending must never leave the interval between the two ticks.
  for (let i = 0; i <= 20; i += 1) {
    const drawn = blend(before, after, i / 20);
    assert(
      drawn.position >= before.position && drawn.position <= after.position,
      "a blended state should sit between the two ticks it came from",
    );
  }
};

/**
 * The capstone: the whole controller, and the claims the page makes about it.
 *
 * The strongest assertion here is a brute-force one. `uprightCapsuleContact` is the only piece of
 * genuinely new arithmetic in the capstone, and it is checked against a dense sample of the
 * capsule's own axis rather than against an alternative formula - 8,125 placements around a box,
 * requiring the same contact-or-clear verdict and the same depth every time.
 *
 * After that it is behaviour. The scripted run must never end up inside geometry at any tick rate,
 * every switch must actually break the thing it claims to, and the determinism claim has to be the
 * *correct* one: a fixed timestep makes one tick rate reproducible, and does **not** make two
 * different tick rates agree.
 */
export const capstoneCheck: Demo = () => {
  const V = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
  const flat = (v: Vec3) => Math.hypot(v.x, v.z);

  // ---- The one new piece of arithmetic, against brute force ----------------------

  const box: Aabb = { min: V(-1, 0, -1), max: V(1, 2, 1) };
  /** The true separation, by walking the capsule's axis and measuring to the box. */
  const bySampling = (feet: Vec3) => {
    const c = capsuleFor(feet);
    let best = Infinity;
    for (let i = 0; i <= 700; i += 1) {
      const p = V(c.a.x, c.a.y + ((c.b.y - c.a.y) * i) / 700, c.a.z);
      const q = closestOnBox(box.min, box.max, p);
      best = Math.min(best, Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z));
    }
    return best - c.radius;
  };

  let contacts = 0;
  let clear = 0;
  let worstDepth = 0;
  for (let i = 0; i <= 24; i += 1) {
    for (let j = 0; j <= 24; j += 1) {
      for (let k = 0; k <= 12; k += 1) {
        const feet = V(-3 + (i / 24) * 6, -1 + (k / 12) * 4, -3 + (j / 24) * 6);
        const contact = uprightCapsuleContact(capsuleFor(feet), box);
        const truth = bySampling(feet);
        if (contact === null) {
          clear += 1;
          assert(
            truth > -1e-6,
            `said clear at ${feet.x},${feet.y},${feet.z} but sampling disagrees`,
          );
        } else {
          contacts += 1;
          assert(
            truth < 1e-6,
            `said contact at ${feet.x},${feet.y},${feet.z} but sampling disagrees`,
          );
          assert(
            Math.abs(contact.normal.x) +
              Math.abs(contact.normal.y) +
              Math.abs(contact.normal.z) >
              0,
            "a contact must name a direction to push",
          );
          assert(
            near(
              Math.hypot(contact.normal.x, contact.normal.y, contact.normal.z),
              1,
              1e-12,
            ),
            "a contact normal must be unit length",
          );
          assert(contact.depth > 0, "a contact must have a positive depth");
          // Where the axis is outside the box, the depth is exactly radius minus the gap.
          if (truth > -BODY_RADIUS + 1e-6) {
            worstDepth = Math.max(worstDepth, Math.abs(contact.depth + truth));
          }
        }
      }
    }
  }
  assert(
    contacts > 500 && clear > 500,
    "the sweep should find both contacts and clearances",
  );
  assert(worstDepth < 1e-12, `the reported depth is off by ${worstDepth}`);

  // Pushing out of any overlap has to actually clear it.
  for (let i = 0; i <= 14; i += 1) {
    for (let j = 0; j <= 14; j += 1) {
      for (let k = 0; k <= 8; k += 1) {
        const feet = V(
          -2.5 + (i / 14) * 5,
          -0.8 + (k / 8) * 3,
          -2.5 + (j / 14) * 5,
        );
        if (uprightCapsuleContact(capsuleFor(feet), box) === null) continue;
        const settled = resolve(feet, V(0, 0, 0), [box]);
        assert(
          uprightCapsuleContact(capsuleFor(settled.position), box) === null,
          `pushing out from ${feet.x},${feet.y},${feet.z} left it still overlapping`,
        );
      }
    }
  }

  // ---- Input mapping -------------------------------------------------------------

  // Every combination of stick input gives a unit direction, which is the diagonal-speed fix.
  for (const forward of [-1, -0.5, 0, 0.5, 1]) {
    for (const strafe of [-1, -0.5, 0, 0.5, 1]) {
      for (const yaw of [0, 0.7, Math.PI / 2, 3, -2.2]) {
        const d = moveDirection({ forward, strafe, jump: false }, yaw);
        const length = Math.hypot(d.x, d.y, d.z);
        if (forward === 0 && strafe === 0) {
          assert(
            length === 0,
            "no input should give no direction, not a unit one",
          );
        } else {
          assert(
            near(length, 1, 1e-12),
            `input ${forward},${strafe} at yaw ${yaw} was not unit length`,
          );
        }
        assert(
          d.y === 0,
          "movement input must not push the character up or down",
        );
      }
    }
  }
  // Forward means away from the camera, whichever way the camera faces.
  assert(
    near(moveDirection({ forward: 1, strafe: 0, jump: false }, 0).z, -1, 1e-12),
    "with the camera at yaw zero, forward should be -Z",
  );
  assert(
    near(
      moveDirection({ forward: 1, strafe: 0, jump: false }, Math.PI / 2).x,
      -1,
      1e-12,
    ),
    "turn the camera a quarter turn and forward should follow it",
  );
  assert(
    near(moveDirection({ forward: 0, strafe: 1, jump: false }, 0).x, 1, 1e-12),
    "strafe right should be +X at yaw zero",
  );

  // ---- Step climbing -------------------------------------------------------------

  const ledged: Aabb[] = [
    { min: V(-9, -1, -9), max: V(9, 0, 9) },
    { min: V(0, 0, -4), max: V(6, 0.3, 4) },
  ];
  const stepped = tryStepUp(V(-0.4, 0.001, 0), V(-0.3, 0.001, 0), ledged);
  assert(
    stepped !== null,
    "a 0.3 m ledge is under the step height and should be climbable",
  );
  assert(
    near(stepped!.y, 0.3 + 0.001, 1e-12),
    "and it should end up standing on top of it",
  );
  // Too tall, and it must refuse rather than teleport.
  const tall: Aabb[] = [
    { min: V(-9, -1, -9), max: V(9, 0, 9) },
    { min: V(0, 0, -4), max: V(6, STEP_HEIGHT + 0.3, 4) },
  ];
  assert(
    tryStepUp(V(-0.4, 0.001, 0), V(-0.3, 0.001, 0), tall) === null,
    "a ledge taller than the step height must not be climbed",
  );
  assert(
    supportUnder(V(3, 1, 0), ledged, 1) === 0.3,
    "the support under a point over the ledge is the ledge top",
  );
  assert(
    supportUnder(V(3, 1, 0), ledged, 0.2) === 0,
    "with a lower ceiling it should find the floor instead",
  );
  assert(
    supportUnder(V(30, 1, 0), ledged, 5) === null,
    "nothing is under a point off the level",
  );

  // Walking at a climbable ledge really does end up on top of it.
  let walker: Character = {
    position: V(-2, 0, 0),
    velocity: V(0, 0, 0),
    yaw: 0,
    grounded: true,
  };
  for (let i = 0; i < 60; i += 1) {
    walker = stepCharacter(
      walker,
      { forward: 0, strafe: 1, jump: false },
      0,
      ledged,
      TICK,
    );
  }
  assert(
    walker.position.y > 0.29,
    `walking at a 0.3 m ledge should climb it, ended at ${walker.position.y}`,
  );
  // And at an unclimbable one, it stops without entering it.
  let blocked: Character = {
    position: V(-2, 0, 0),
    velocity: V(0, 0, 0),
    yaw: 0,
    grounded: true,
  };
  for (let i = 0; i < 60; i += 1) {
    blocked = stepCharacter(
      blocked,
      { forward: 0, strafe: 1, jump: false },
      0,
      tall,
      TICK,
    );
  }
  assert(blocked.position.y < 0.01, "a tall ledge should not be climbed");
  assert(
    blocked.position.x < 0 - BODY_RADIUS + 0.01,
    `and the character should stay outside it, ended at x ${blocked.position.x}`,
  );

  // ---- The scripted run ----------------------------------------------------------

  const run = simulate(ALL_ON);
  assert(
    run.length === Math.round(RUN_SECONDS / TICK) + 1,
    "the run should cover its stated duration",
  );
  assert(run[0] === RUN_START, "and start where it says it starts");

  let deepest = 0;
  let peak = 0;
  let fastest = 0;
  let airborne = 0;
  const touchTicks = LEVEL.map(() => 0);
  for (const c of run) {
    for (let j = 0; j < LEVEL.length; j += 1) {
      const contact = uprightCapsuleContact(capsuleFor(c.position), LEVEL[j]);
      if (contact) deepest = Math.max(deepest, contact.depth);
      const grazing = uprightCapsuleContact(
        { ...capsuleFor(c.position), radius: BODY_RADIUS + 0.02 },
        LEVEL[j],
      );
      if (grazing) touchTicks[j] += 1;
    }
    peak = Math.max(peak, c.position.y);
    fastest = Math.max(fastest, flat(c.velocity));
    if (!c.grounded) airborne += 1;
    // Never off the edge of the floor, and never below it.
    assert(
      Math.abs(c.position.x) < 8.6 &&
        Math.abs(c.position.z) < 8.6 &&
        c.position.y > -0.05,
      `the run left the level at ${c.position.x},${c.position.y},${c.position.z}`,
    );
    // The stored yaw stays canonical.
    assert(
      Math.abs(c.yaw) <= Math.PI + 1e-9,
      `yaw wound up out of range at ${c.yaw}`,
    );
  }

  assert(deepest < 1e-9, `the character sank ${deepest} m into the level`);
  assert(airborne > 30, "the run should include a real jump, not a hop");
  assert(peak > 1.2, "and the jump should clear a meter");
  /* Horizontal speed can exceed the walk speed, because sliding off a ledge redirects part of the
     fall sideways - which is correct, so the bound allows for it rather than pretending otherwise. */
  assert(
    fastest > WALK_SPEED - 1e-9 && fastest < WALK_SPEED * 1.1,
    `fastest horizontal was ${fastest}, expected about the walk speed`,
  );
  // Every box in the level is actually used by the route, or it is scenery pretending to teach.
  touchTicks.forEach((ticks, j) =>
    assert(
      ticks > 20,
      `box ${j} is only touched on ${ticks} ticks, so the route does not use it`,
    ),
  );
  // It really does end up standing on the ledge rather than beside it.
  assert(
    run.some((c) => c.position.y > 0.3 && c.position.y < 0.4 && c.grounded),
    "the run should spend time standing on top of the ledge",
  );

  // ---- Every switch has to bite ---------------------------------------------------

  const stuckTicks = (path: Character[]) =>
    path.filter((c) => flat(c.velocity) < 0.01).length;
  const noSlide = simulate({ ...ALL_ON, slide: false });
  assert(
    stuckTicks(noSlide) > stuckTicks(run) + 20,
    "switching sliding off should leave the character stationary far more often",
  );
  assert(
    flat({
      x: noSlide.at(-1)!.position.x - run.at(-1)!.position.x,
      y: 0,
      z: noSlide.at(-1)!.position.z - run.at(-1)!.position.z,
    }) > 1,
    "and it should end up somewhere clearly different",
  );

  const unnormalized = simulate({ ...ALL_ON, normalize: false });
  const fastestRaw = unnormalized.reduce(
    (best, c) => Math.max(best, flat(c.velocity)),
    0,
  );
  assert(
    fastestRaw > WALK_SPEED * 1.2,
    `without the normalize the character should outrun its own speed limit, got ${fastestRaw}`,
  );

  const longWay = simulate({ ...ALL_ON, shortestTurn: false });
  let worstTurn = 0;
  for (let i = 0; i < run.length; i += 1) {
    worstTurn = Math.max(
      worstTurn,
      Math.abs(wrapRad(longWay[i].yaw - run[i].yaw)),
    );
  }
  assert(
    (worstTurn * 180) / Math.PI > 90,
    `turning the long way should end up facing somewhere very different, got ${(worstTurn * 180) / Math.PI} degrees`,
  );

  // ---- Determinism, stated correctly ---------------------------------------------

  // The promise that holds: the same rate, run twice, matches exactly.
  for (const fps of [30, 60, 144]) {
    const a = simulate(ALL_ON, 1 / fps);
    const b = simulate(ALL_ON, 1 / fps);
    for (let i = 0; i < a.length; i += 1) {
      assert(
        a[i].position.x === b[i].position.x &&
          a[i].position.y === b[i].position.y &&
          a[i].position.z === b[i].position.z &&
          a[i].yaw === b[i].yaw,
        `re-running at ${fps} Hz diverged at tick ${i}`,
      );
    }
  }

  /* The promise that does *not* hold, and which the page is careful about: different tick rates do
     not agree. They see different instants for every discrete decision - which tick first notices a
     wall, which tick a landing happens on - so they end up about one tick of travel apart. */
  const ends = [30, 60, 120, 144].map(
    (fps) => simulate(ALL_ON, 1 / fps).at(-1)!.position,
  );
  const xs = ends.map((p) => p.x);
  const zs = ends.map((p) => p.z);
  const gap = Math.hypot(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...zs) - Math.min(...zs),
  );
  const oneTick = WALK_SPEED / 30;
  assert(
    gap > oneTick * 0.3,
    "if the rates agreed exactly, the page's caution would be wrong",
  );
  assert(
    gap < oneTick * 2,
    `the rates should differ by about a tick of travel, got ${gap} m against ${oneTick} m`,
  );
  // And none of them ends up inside the level, whatever rate they ran at.
  for (const fps of [30, 60, 120, 144, 240]) {
    for (const c of simulate(ALL_ON, 1 / fps)) {
      for (const b of LEVEL) {
        const contact = uprightCapsuleContact(capsuleFor(c.position), b);
        assert(
          contact === null || contact.depth < 1e-9,
          `at ${fps} Hz the character sank into the level by ${contact?.depth}`,
        );
      }
    }
  }

  // ---- Drawing between ticks -----------------------------------------------------

  // Sampled at 144 Hz against a 60 Hz tick, most frames repeat a position without interpolation.
  let repeated = 0;
  let moved = 0;
  let previousRaw: Vec3 | null = null;
  let previousSmooth: Vec3 | null = null;
  for (let i = 0; i < 144; i += 1) {
    const t = 0.4 + i / 144;
    const raw = drawnAt(run, t, false).position;
    const smooth = drawnAt(run, t, true).position;
    if (
      previousRaw &&
      flat({ x: raw.x - previousRaw.x, y: 0, z: raw.z - previousRaw.z }) < 1e-12
    ) {
      repeated += 1;
    }
    if (
      previousSmooth &&
      flat({
        x: smooth.x - previousSmooth.x,
        y: 0,
        z: smooth.z - previousSmooth.z,
      }) > 1e-12
    ) {
      moved += 1;
    }
    previousRaw = raw;
    previousSmooth = smooth;
  }
  assert(
    repeated > 40,
    `without interpolation many frames should repeat, only ${repeated} did`,
  );
  assert(
    moved > 140,
    `with interpolation nearly every frame should move, only ${moved} did`,
  );
  // A blended position always sits between the two ticks it came from.
  for (let i = 0; i < 200; i += 1) {
    const t = (i / 200) * RUN_SECONDS;
    const index = Math.min(Math.floor(t / TICK), run.length - 1);
    const next = Math.min(index + 1, run.length - 1);
    const drawn = drawnAt(run, t, true).position;
    const lo = Math.min(run[index].position.x, run[next].position.x) - 1e-9;
    const hi = Math.max(run[index].position.x, run[next].position.x) + 1e-9;
    assert(
      drawn.x >= lo && drawn.x <= hi,
      "a drawn position left the pair of ticks it came from",
    );
  }

  // ---- The scripted camera shot --------------------------------------------------

  for (let i = 0; i < SHOT.length; i += 1) {
    const u = i / (SHOT.length - 1);
    const p = shotAt(u);
    assert(
      near(p.x, SHOT[i].x, 1e-9) &&
        near(p.y, SHOT[i].y, 1e-9) &&
        near(p.z, SHOT[i].z, 1e-9),
      `the camera shot misses waypoint ${i}`,
    );
  }
  assert(
    shotAt(-1).x === SHOT[0].x && shotAt(2).x === SHOT[SHOT.length - 1].x,
    "the shot should clamp outside its range rather than extrapolate",
  );
  /* Even steps in the parameter are not even steps in distance, which is Section 4.4's point and the
     reason a camera moving at a constant rate needs the arc-length table rather than raw t. */
  let longest = 0;
  let shortest = Infinity;
  let previous = shotAt(0);
  for (let i = 1; i <= 200; i += 1) {
    const p = shotAt(i / 200);
    const hop = Math.hypot(
      p.x - previous.x,
      p.y - previous.y,
      p.z - previous.z,
    );
    longest = Math.max(longest, hop);
    shortest = Math.min(shortest, hop);
    previous = p;
  }
  assert(
    longest / shortest > 1.2,
    "the shot should be visibly uneven in raw parameter steps",
  );

  // ---- The mirrored step function must not drift from the real one ---------------

  /* `stepWith` hands over to `controller.step` when nothing is switched off. If that ever stops
     being true the demo starts teaching a copy instead of the code on the page - which already
     happened once, when step climbing was added to one and not the other. */
  let mirrored: Character = RUN_START;
  let real: Character = RUN_START;
  for (let i = 0; i < 200; i += 1) {
    const input = inputAt(i * TICK);
    mirrored = stepWith(mirrored, input, 0, TICK, ALL_ON);
    real = stepCharacter(real, input, 0, LEVEL, TICK);
    assert(
      mirrored.position.x === real.position.x &&
        mirrored.position.y === real.position.y &&
        mirrored.position.z === real.position.z &&
        mirrored.yaw === real.yaw,
      `the demo's step diverged from the shipped step at tick ${i}`,
    );
  }

  // ---- The camera helpers --------------------------------------------------------

  const target = V(0, 1, 0);
  for (const azimuth of [-170, -90, 0, 45, 179]) {
    for (const elevation of [-70, 0, 22, 70]) {
      const eye = orbitPosition(target, azimuth, elevation, 8);
      assert(
        near(
          Math.hypot(eye.x - target.x, eye.y - target.y, eye.z - target.z),
          8,
          1e-9,
        ),
        "an orbit position should sit at the requested distance",
      );
    }
  }
  // The elevation is clamped short of the pole, where the azimuth stops meaning anything.
  const overhead = orbitPosition(target, 30, 200, 8);
  assert(
    Math.hypot(overhead.x - target.x, overhead.z - target.z) > 0.5,
    "the elevation must be clamped, or the azimuth becomes meaningless",
  );
  assert(
    lookTarget(V(1, 2, 3)).y > 2 + BODY_HEIGHT * 0.5,
    "the camera should aim at the chest, not the feet",
  );
  assert(
    WALK_LIMIT > 0 && WALK_LIMIT < 90,
    "the slope limit should be a real slope",
  );
};
