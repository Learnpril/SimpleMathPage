/**
 * Four numbers that hold an orientation, with no poles and nothing to lock.
 *
 * The whole construction hangs off one decision: store **half** the angle. That is what makes
 * multiplication compose rotations, makes the conjugate an inverse, and makes the four numbers
 * cover every orientation exactly twice - the double cover, which is the one place quaternions
 * ask something of you in return.
 */
import { direction, point, type Mat4, type Vec3 } from "./matrices.ts";

/** `x, y, z` are the axis scaled by `sin(angle/2)`. `w` is `cos(angle/2)`. */
export type Quat = { x: number; y: number; z: number; w: number };

/** No rotation: a zero-length axis part and a full-size `w`. */
export const IDENTITY_QUAT: Quat = { x: 0, y: 0, z: 0, w: 1 };

const DEG = Math.PI / 180;

export function quatLength(q: Quat): number {
  return Math.hypot(q.x, q.y, q.z, q.w);
}

/** Scale back to unit length. Returns `null` for the one quaternion that has no direction. */
export function normalizeQuat(q: Quat): Quat | null {
  const len = quatLength(q);
  if (len < 1e-12) return null;
  return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
}

export function negateQuat(q: Quat): Quat {
  return { x: -q.x, y: -q.y, z: -q.z, w: -q.w };
}

export function dotQuat(a: Quat, b: Quat): number {
  return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}

/**
 * Build a rotation from an axis and an angle.
 *
 * Note the halves. Turning by 90 degrees stores `cos(45)` and `sin(45)`, and if you ever see
 * a quaternion whose `w` is `cos` of the angle you meant rather than half of it, this is the
 * line to look at.
 */
export function fromAxisAngle(axis: Vec3, degrees: number): Quat | null {
  const len = Math.hypot(axis.x, axis.y, axis.z);
  if (len < 1e-12) return null;
  const half = degrees * DEG * 0.5;
  const s = Math.sin(half) / len;
  return {
    x: axis.x * s,
    y: axis.y * s,
    z: axis.z * s,
    w: Math.cos(half),
  };
}

/** Read the axis and angle back out. The angle comes back doubled, for the same reason. */
export function toAxisAngle(q: Quat): { axis: Vec3; degrees: number } {
  const n = normalizeQuat(q) ?? IDENTITY_QUAT;
  const w = Math.min(1, Math.max(-1, n.w));
  const sinHalf = Math.sqrt(Math.max(0, 1 - w * w));
  // Below this the rotation is too small to have a meaningful axis, so name one.
  if (sinHalf < 1e-9) return { axis: { x: 0, y: 1, z: 0 }, degrees: 0 };
  return {
    axis: { x: n.x / sinHalf, y: n.y / sinHalf, z: n.z / sinHalf },
    degrees: (2 * Math.acos(w)) / DEG,
  };
}

/**
 * Compose two rotations: apply `second` after `first`.
 *
 * Same right-to-left reading as `multiplyMat4`, and for the same reason - so the two can be
 * swapped for each other without any code changing its meaning. Quaternion multiplication does
 * not commute either, which it had better not, since rotations do not.
 */
export function multiplyQuat(second: Quat, first: Quat): Quat {
  const a = second;
  const b = first;
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

/**
 * Flip the axis part. For a unit quaternion this **is** the inverse - same axis, opposite
 * angle - which is a division replaced by three sign changes.
 */
export function conjugate(q: Quat): Quat {
  return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
}

/**
 * Rotate a vector, by sandwiching it between the quaternion and its conjugate.
 *
 * Written out longhand because the sandwich is the thing worth seeing. Production code uses an
 * algebraically identical shortcut with fewer multiplies.
 *
 * If `q` is **not** unit length the sandwich also scales the vector, by exactly `|q|` squared.
 * That is the mechanism behind the classic "I forgot to normalize and my model shrank".
 */
export function rotateVector(q: Quat, v: Vec3): Vec3 {
  const asQuat: Quat = { x: v.x, y: v.y, z: v.z, w: 0 };
  const out = multiplyQuat(multiplyQuat(q, asQuat), conjugate(q));
  return { x: out.x, y: out.y, z: out.z };
}

/** The same rotation as a 4x4, so it drops straight into Part 2's machinery. */
export function quatToMat4(q: Quat): Mat4 {
  const n = normalizeQuat(q) ?? IDENTITY_QUAT;
  const { x, y, z, w } = n;
  return {
    i: direction(
      1 - 2 * (y * y + z * z),
      2 * (x * y + z * w),
      2 * (x * z - y * w),
    ),
    j: direction(
      2 * (x * y - z * w),
      1 - 2 * (x * x + z * z),
      2 * (y * z + x * w),
    ),
    k: direction(
      2 * (x * z + y * w),
      2 * (y * z - x * w),
      1 - 2 * (x * x + y * y),
    ),
    t: point(0, 0, 0),
  };
}

/** How far apart two orientations are, in degrees. The absolute value handles double cover. */
export function angleBetweenQuats(a: Quat, b: Quat): number {
  const na = normalizeQuat(a);
  const nb = normalizeQuat(b);
  if (na === null || nb === null) return 0;
  const d = Math.min(1, Math.abs(dotQuat(na, nb)));
  return (2 * Math.acos(d)) / DEG;
}

/**
 * The double cover fix, and the single most load-bearing `if` in rotation code.
 *
 * Every orientation has **two** quaternions: `q` and `-q`. They produce the identical matrix,
 * so nothing you can observe about the object tells them apart. But interpolation is arithmetic
 * on the four numbers, and those differ - so blending towards the wrong one of the pair sends
 * the object the long way round, up to 360 degrees when 0 would have done.
 *
 * A negative dot product is exactly the signal that you have the far one. Flip it.
 */
export function shortWayFrom(from: Quat, to: Quat): Quat {
  return dotQuat(from, to) < 0 ? negateQuat(to) : to;
}

/**
 * Blend two orientations the cheap way: interpolate all four numbers, then renormalize.
 *
 * Deliberately does **not** call `shortWayFrom` itself, so a demo can show what happens
 * without it. Section 3.3 compares this against slerp; the short-way fix is needed either way
 * and is not what distinguishes them.
 */
export function nlerpQuat(from: Quat, to: Quat, t: number): Quat | null {
  return normalizeQuat({
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t,
    w: from.w + (to.w - from.w) * t,
  });
}

/**
 * Straight linear interpolation of the four numbers, with **no** renormalizing.
 *
 * Included because it is what people write first, and because the result is not a unit
 * quaternion - so anything using it either renormalizes later or quietly scales the object.
 */
export function lerpQuat(from: Quat, to: Quat, t: number): Quat {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t,
    w: from.w + (to.w - from.w) * t,
  };
}

/**
 * Spherical interpolation: travel the arc between two orientations at a **constant rate**.
 *
 * `nlerpQuat` already follows the right arc - normalizing a straight line between two points on
 * a sphere lands you on the great circle through them. What it gets wrong is the *speed*, and
 * that is the only thing slerp fixes.
 *
 * Like `nlerpQuat`, this does not apply the double-cover flip. Call `shortWayFrom` first, or
 * you will slerp smoothly along the 320-degree route from Section 3.2.
 */
export function slerpQuat(from: Quat, to: Quat, t: number): Quat | null {
  const a = normalizeQuat(from);
  const b = normalizeQuat(to);
  if (a === null || b === null) return null;

  const cos = Math.min(1, Math.max(-1, dotQuat(a, b)));

  /* When the two are nearly the same orientation, `sin(omega)` heads for zero and the weights
     below turn into 0/0. A straight blend is indistinguishable from the arc at that scale, so
     hand off rather than divide. This guard is not optional. */
  if (Math.abs(cos) > 0.9995) return nlerpQuat(a, b, t);

  const omega = Math.acos(cos);
  const sin = Math.sin(omega);
  const wa = Math.sin((1 - t) * omega) / sin;
  const wb = Math.sin(t * omega) / sin;

  return {
    x: a.x * wa + b.x * wb,
    y: a.y * wa + b.y * wb,
    z: a.z * wa + b.z * wb,
    w: a.w * wa + b.w * wb,
  };
}
