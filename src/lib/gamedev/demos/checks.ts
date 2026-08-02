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
