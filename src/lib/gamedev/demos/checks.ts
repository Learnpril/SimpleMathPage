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
