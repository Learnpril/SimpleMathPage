/** Where precision actually goes when you convert between the three representations. */
import { YAW_PITCH_ROLL, fromEuler, toEulerYXZ, type Euler } from "../euler.ts";
import {
  fromAxisAngle,
  multiplyQuat,
  quatLength,
  quatToMat4,
} from "../quaternions.ts";
import { basisOf } from "../spaces.ts";
import { rowsOf, type Mat4 } from "../matrices.ts";
import type { Demo } from "./runner.ts";

const worstEntry = (a: Mat4, b: Mat4) => {
  const x = rowsOf(a).flat();
  const y = rowsOf(b).flat();
  return Math.max(...x.map((n, i) => Math.abs(n - y[i])));
};

/** Angles out and back, and how far the three numbers moved. */
function angleTrip(pitch: number) {
  const start: Euler = { x: pitch, y: 40, z: 25 };
  const m = fromEuler(start, YAW_PITCH_ROLL);
  const back = toEulerYXZ(m);
  return {
    angles: Math.max(
      Math.abs(back.x - start.x),
      Math.abs(back.y - start.y),
      Math.abs(back.z - start.z),
    ),
    matrix: worstEntry(m, fromEuler(back, YAW_PITCH_ROLL)),
  };
}

const demo: Demo = (log) => {
  const mid = angleTrip(30);
  const near = angleTrip(89.999);
  const pole = angleTrip(90);

  log(
    "angles to matrix and back, pitch 30",
    `${mid.angles.toExponential(1)}\u00B0`,
  );
  log("the same at pitch 89.999", `${near.angles.toExponential(1)}\u00B0`);
  log(
    "the same at pitch 90",
    `${pole.angles.toFixed(1)}\u00B0`,
    "roll folded into yaw",
  );
  log(
    "but the orientation at pitch 90",
    pole.matrix.toExponential(1),
    "intact - only the three numbers were lost",
  );

  // Drift under repeated composition, the other place precision goes.
  const step = fromAxisAngle({ x: 0.2, y: 0.9, z: 0.35 }, 0.7)!;
  let q = fromAxisAngle({ x: 0, y: 1, z: 0 }, 0)!;
  let m = quatToMat4(q);
  const stepM = quatToMat4(step);
  const mul = (A: Mat4, B: Mat4): Mat4 => {
    const ra = rowsOf(A);
    const rb = rowsOf(B);
    const g = (r: number, c: number) =>
      ra[r][0] * rb[0][c] +
      ra[r][1] * rb[1][c] +
      ra[r][2] * rb[2][c] +
      ra[r][3] * rb[3][c];
    return {
      i: { x: g(0, 0), y: g(1, 0), z: g(2, 0), w: g(3, 0) },
      j: { x: g(0, 1), y: g(1, 1), z: g(2, 1), w: g(3, 1) },
      k: { x: g(0, 2), y: g(1, 2), z: g(2, 2), w: g(3, 2) },
      t: { x: g(0, 3), y: g(1, 3), z: g(2, 3), w: g(3, 3) },
    };
  };
  for (let i = 0; i < 10000; i += 1) {
    q = multiplyQuat(step, q);
    m = mul(stepM, m);
  }

  const b = basisOf(m);
  const dot = (p: typeof b.i, r: typeof b.i) =>
    p.x * r.x + p.y * r.y + p.z * r.z;

  log(
    "10000 quaternion products, length off by",
    Math.abs(quatLength(q) - 1).toExponential(1),
    "one number to fix",
  );
  log(
    "10000 matrix products, axes off square by",
    Math.max(
      Math.abs(dot(b.i, b.j)),
      Math.abs(dot(b.j, b.k)),
      Math.abs(dot(b.i, b.k)),
    ).toExponential(1),
    "nine numbers to fix",
  );
};

export default demo;
