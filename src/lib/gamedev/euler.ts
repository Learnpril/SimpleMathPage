/**
 * Three angles, one per axis - and the two things that go wrong with them.
 *
 * The first is that three numbers do not describe an orientation until you also say what
 * order to apply them in, and there are six sensible choices. The second is gimbal lock,
 * which `axisSeparation` below turns from an assertion into a measurement.
 */
import {
  IDENTITY4,
  multiplyMat4,
  rotationX4,
  rotationY4,
  rotationZ4,
  type Mat4,
  type Vec3,
} from "./matrices.ts";
import { transformDirection } from "./spaces.ts";

export type Axis = "X" | "Y" | "Z";

/** Per-axis angles in degrees. For something facing -Z: x is pitch, y is yaw, z is roll. */
export type Euler = { x: number; y: number; z: number };

/**
 * Which order the three rotations combine in.
 *
 * The string names the **product**, left to right: `"YXZ"` means `Ry * Rx * Rz`. By Section
 * 2.3's rule that puts `Rz` nearest the vector, so **the last letter is applied first**. This
 * is the convention Three.js, Godot and Unity all use, and it is worth saying out loud
 * because it reads backwards.
 */
export type Order = "XYZ" | "XZY" | "YXZ" | "YZX" | "ZXY" | "ZYX";

export const ORDERS: readonly Order[] = [
  "XYZ",
  "XZY",
  "YXZ",
  "YZX",
  "ZXY",
  "ZYX",
];

/** Yaw-pitch-roll for a Y-up world, and what nearly every camera and character uses. */
export const YAW_PITCH_ROLL: Order = "YXZ";

export const axesOf = (order: Order): [Axis, Axis, Axis] =>
  order.split("") as [Axis, Axis, Axis];

/** The rotation matrix for one axis on its own. */
export function axisMatrix(axis: Axis, degrees: number): Mat4 {
  if (axis === "X") return rotationX4(degrees);
  if (axis === "Y") return rotationY4(degrees);
  return rotationZ4(degrees);
}

/** The angle this Euler triple assigns to one axis. */
export function angleOn(e: Euler, axis: Axis): number {
  return axis === "X" ? e.x : axis === "Y" ? e.y : e.z;
}

/** The same triple with one axis moved by `delta`. */
export function bump(e: Euler, axis: Axis, delta: number): Euler {
  if (axis === "X") return { ...e, x: e.x + delta };
  if (axis === "Y") return { ...e, y: e.y + delta };
  return { ...e, z: e.z + delta };
}

/** Build one rotation matrix from three angles and an order. */
export function fromEuler(e: Euler, order: Order): Mat4 {
  const [outer, middle, inner] = axesOf(order);
  return multiplyMat4(
    axisMatrix(outer, angleOn(e, outer)),
    multiplyMat4(
      axisMatrix(middle, angleOn(e, middle)),
      axisMatrix(inner, angleOn(e, inner)),
    ),
  );
}

/** Where the object ends up facing. Forward is -Z, as everywhere in this Module. */
export function forwardOf(m: Mat4): Vec3 {
  return transformDirection(m, { x: 0, y: 0, z: -1 });
}

/** Where its up ends up. Needed as well as forward, or a roll would be invisible. */
export function upOf(m: Mat4): Vec3 {
  return transformDirection(m, { x: 0, y: 1, z: 0 });
}

const unit = (axis: Axis): Vec3 => ({
  x: axis === "X" ? 1 : 0,
  y: axis === "Y" ? 1 : 0,
  z: axis === "Z" ? 1 : 0,
});

/**
 * Where one of the three rotation axes actually points, in world space.
 *
 * The outer rotation happens last, so its axis is a fixed world axis and never moves. The
 * inner one happens first and then gets carried around by the two outside it. That is
 * precisely what the rings of a physical gimbal do, which is where the name comes from.
 */
export function axisInWorld(e: Euler, order: Order, which: 0 | 1 | 2): Vec3 {
  const axes = axesOf(order);
  let carrier = IDENTITY4;
  for (let i = 0; i < which; i += 1) {
    carrier = multiplyMat4(carrier, axisMatrix(axes[i], angleOn(e, axes[i])));
  }
  return transformDirection(carrier, unit(axes[which]));
}

/** The angle between two directions, in degrees. */
export function degreesBetween(a: Vec3, b: Vec3): number {
  const la = Math.hypot(a.x, a.y, a.z);
  const lb = Math.hypot(b.x, b.y, b.z);
  if (la < 1e-12 || lb < 1e-12) return 0;
  const c = (a.x * b.x + a.y * b.y + a.z * b.z) / (la * lb);
  return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI;
}

/**
 * How much independent control is left, in degrees, from 90 down to 0.
 *
 * This is the angle between the outer rotation axis and the inner one. **90 means the two
 * angles turn the object about genuinely different axes. 0 means they turn it about the same
 * axis**, so one of your three numbers has stopped buying you anything - which is gimbal lock,
 * as a measurement rather than a warning.
 *
 * Anti-parallel counts as locked, hence the absolute value: two controls that spin the object
 * in exactly opposite directions are still only one control.
 */
export function axisSeparation(e: Euler, order: Order): number {
  const a = axisInWorld(e, order, 0);
  const b = axisInWorld(e, order, 2);
  const d = Math.abs(a.x * b.x + a.y * b.y + a.z * b.z);
  return (Math.acos(Math.min(1, d)) * 180) / Math.PI;
}

/**
 * Read yaw, pitch and roll back out of a rotation matrix, for the `"YXZ"` order.
 *
 * Only one order, deliberately - the other five are the same shape with the indices moved, and
 * one worked example makes the structure clearer than six near-identical branches would.
 *
 * The `if` is the whole point of Section 3.1. Away from the poles, pitch comes from a single
 * entry and the other two angles come from `atan2` pairs. **At** the poles those pairs are both
 * zero, so `atan2(0, 0)` is being asked which way to point when every direction is equally
 * true. The answer has to be chosen rather than computed, and the usual choice is to hand the
 * whole rotation to yaw and set roll to zero.
 */
export function toEulerYXZ(m: Mat4): Euler {
  // Row-major entries, so the names match how the matrix is written down.
  const m01 = m.j.x;
  const m00 = m.i.x;
  const m10 = m.i.y;
  const m11 = m.j.y;
  const m12 = m.k.y;
  const m02 = m.k.x;
  const m22 = m.k.z;

  const sinPitch = Math.min(1, Math.max(-1, -m12));
  const pitch = Math.asin(sinPitch);
  const cosPitch = Math.cos(pitch);

  // Below this, the yaw and roll terms have both collapsed to zero and cannot be separated.
  if (Math.abs(cosPitch) < 1e-7) {
    return {
      x: (pitch * 180) / Math.PI,
      y:
        ((sinPitch > 0 ? Math.atan2(m01, m00) : Math.atan2(-m01, m00)) * 180) /
        Math.PI,
      z: 0,
    };
  }

  return {
    x: (pitch * 180) / Math.PI,
    y: (Math.atan2(m02, m22) * 180) / Math.PI,
    z: (Math.atan2(m10, m11) * 180) / Math.PI,
  };
}
